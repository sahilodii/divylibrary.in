import { getTestCredentials, isAdmin, json, PACKAGES, options, razorpayRequest, requireUser, sanitizedError, serviceClient } from "../_shared/razorpay.ts";

const packageCollections:Record<string,string[]> = Object.fromEntries(Object.entries(PACKAGES).map(([id,pkg])=>[id,[...pkg.collections]]));

Deno.serve(async(req)=>{
  const preflight=options(req);if(preflight)return preflight;
  if(req.method!=="POST")return json(req,{error:"Method not allowed."},405);
  try{
    const {user,error}=await requireUser(req);if(error)return json(req,{error},401);
    if(!isAdmin(user))return json(req,{error:"Administrator access is required."},403);
    const body=await req.json().catch(()=>({}));
    const db=serviceClient();
    if(body.action==="dashboard"){
      let query=db.from("divy_sandbox_orders").select("id,user_id,customer_email,package_id,amount_paise,currency,razorpay_order_id,status,created_at,updated_at").order("created_at",{ascending:false}).limit(1000);
      if(body.from){const from=Date.parse(String(body.from));if(!Number.isFinite(from))return json(req,{error:"Invalid start date."},400);query=query.gte("created_at",new Date(from).toISOString());}
      if(body.to){const to=Date.parse(String(body.to));if(!Number.isFinite(to))return json(req,{error:"Invalid end date."},400);query=query.lte("created_at",new Date(to).toISOString());}
      if(body.status)query=query.eq("status",String(body.status));
      if(body.customer){const customer=String(body.customer).trim().slice(0,254);if(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(customer))query=query.eq("user_id",customer);else if(/^[^\s@,()]+@[^\s@,()]+\.[^\s@,()]+$/.test(customer))query=query.ilike("customer_email",customer);else return json(req,{error:"Enter a valid customer email or account ID."},400);}
      if(body.package_id&&Object.hasOwn(packageCollections,String(body.package_id)))query=query.eq("package_id",String(body.package_id));
      if(body.collection_id){
        const matches=Object.entries(packageCollections).filter(([,ids])=>ids.includes(String(body.collection_id))).map(([id])=>id);
        if(!matches.length)return json(req,{error:"Unknown collection filter."},400);
        query=query.in("package_id",matches);
      }
      const {data:orders,error:ordersError}=await query;if(ordersError)throw ordersError;
      const orderIds=(orders||[]).map(o=>o.id);
      const paymentIds: string[]=[];
      let transactions:any[]=[];
      if(orderIds.length){
        const result=await db.from("divy_sandbox_transactions").select("razorpay_payment_id,order_id,user_id,status,amount_paise,currency,method,error_code,error_description,amount_refunded_paise,created_at,captured_at").in("order_id",orderIds).order("created_at",{ascending:false}).limit(1500);
        if(result.error)throw result.error;transactions=result.data||[];paymentIds.push(...transactions.map(p=>p.razorpay_payment_id));
      }
      const [refundResult,webhookResult]=await Promise.all([
        paymentIds.length?db.from("divy_sandbox_refunds").select("razorpay_refund_id,razorpay_payment_id,amount_paise,status,receipt,created_at,processed_at").in("razorpay_payment_id",paymentIds).order("created_at",{ascending:false}).limit(1000):Promise.resolve({data:[],error:null}),
        db.from("divy_sandbox_webhook_events").select("event_id,event_type,payload_summary,processing_status,error_code,received_at,processed_at").order("received_at",{ascending:false}).limit(300),
      ]);
      if(refundResult.error)throw refundResult.error;if(webhookResult.error)throw webhookResult.error;
      const successful=transactions.filter(p=>p.status==="captured"||p.status==="refunded");
      const gross=successful.reduce((s,p)=>s+Number(p.amount_paise||0),0);
      const refunded=successful.reduce((s,p)=>s+Number(p.amount_refunded_paise||0),0);
      const counts={total_orders:orders?.length||0,total_transactions:transactions.length,successful:successful.length,failed:transactions.filter(p=>p.status==="failed").length,pending:transactions.filter(p=>p.status==="authorized").length,cancelled:(orders||[]).filter(o=>o.status==="cancelled").length,refunded:transactions.filter(p=>p.status==="refunded").length,gross_test_paise:gross,refunds_paise:refunded,net_test_paise:gross-refunded};
      return json(req,{environment:"test",counts,orders,transactions,refunds:refundResult.data||[],webhook_events:webhookResult.data||[]});
    }
    if(body.action==="refund"){
      const paymentId=String(body.payment_id||"");
      if(!/^pay_[A-Za-z0-9]+$/.test(paymentId))return json(req,{error:"Select a valid Razorpay test payment."},400);
      const {data:payment,error:paymentError}=await db.from("divy_sandbox_transactions").select("razorpay_payment_id,status,amount_paise,currency,amount_refunded_paise,user_id,order_id").eq("razorpay_payment_id",paymentId).maybeSingle();
      if(paymentError||!payment)return json(req,{error:"Sandbox payment not found."},404);
      if(!["captured","refunded"].includes(payment.status))return json(req,{error:"Only a captured Razorpay test payment can be refunded."},409);
      const remotePayment=await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
      if(remotePayment.status!=="captured"||Number(remotePayment.amount)!==payment.amount_paise)return json(req,{error:"Razorpay no longer reports this test payment as captured."},409);
      const {data:pending,error:pendingError}=await db.from("divy_sandbox_refunds").select("amount_paise").eq("razorpay_payment_id",paymentId).eq("status","pending");
      if(pendingError)throw pendingError;
      const pendingAmount=(pending||[]).reduce((s,r)=>s+Number(r.amount_paise),0);
      const maximum=payment.amount_paise-Number(payment.amount_refunded_paise||0)-pendingAmount;
      const amount=body.amount_paise==null?maximum:Number(body.amount_paise);
      if(!Number.isInteger(amount)||amount<100||amount>maximum)return json(req,{error:"Refund must be between ₹1 and the remaining refundable amount."},400);
      const receipt=`divy_rf_${crypto.randomUUID().replaceAll("-","")}`;
      const key=`divy-${crypto.randomUUID()}`;
      const refund=await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}/refund`,{
        method:"POST",headers:{"X-Refund-Idempotency":key},
        body:JSON.stringify({amount,receipt,speed:"normal",notes:{environment:"test",requested_by:user.id}}),
      });
      const {data:recorded,error:recordError}=await db.rpc("divy_record_sandbox_refund",{
        p_razorpay_payment_id:paymentId,p_razorpay_refund_id:refund.id,p_amount_paise:Number(refund.amount),
        p_status:refund.status||"pending",p_receipt:refund.receipt||receipt,p_initiated_by:user.id,
        p_processed_at:refund.status==="processed"&&refund.created_at?new Date(Number(refund.created_at)*1000).toISOString():null,
      });
      if(recordError)throw recordError;
      return json(req,{environment:"test",refund_id:refund.id,payment_id:paymentId,amount_paise:Number(refund.amount),status:refund.status,receipt:refund.receipt||receipt,full_refund:recorded?.fully_refunded===true});
    }
    if(body.action==="reset"){
      if(body.confirmation!=="RESET_TEST_DATA")return json(req,{error:"Reset confirmation is required."},400);
      const {error:resetError}=await db.rpc("divy_reset_sandbox_data",{p_actor:user.id});
      if(resetError)throw resetError;
      return json(req,{reset:true,scope:"local sandbox records only",razorpay_records_deleted:false,customers_or_books_deleted:false});
    }
    return json(req,{error:"Unknown admin action."},400);
  }catch(error){return json(req,{error:sanitizedError(error)},500);}
});
