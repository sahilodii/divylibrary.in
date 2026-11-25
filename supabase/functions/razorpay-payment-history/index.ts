import { DRIVE_FOLDER_IDS, json, options, requireUser, sanitizedError, serviceClient } from "../_shared/razorpay.ts";

Deno.serve(async(req)=>{
  const preflight=options(req);if(preflight)return preflight;
  if(req.method!=="POST")return json(req,{error:"Method not allowed."},405);
  try{
    const {user,error}=await requireUser(req);if(error)return json(req,{error},401);
    const db=serviceClient();
    const [orders,transactions,access]=await Promise.all([
      db.from("divy_sandbox_orders").select("id,package_id,amount_paise,currency,razorpay_order_id,status,created_at,updated_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100),
      db.from("divy_sandbox_transactions").select("razorpay_payment_id,order_id,status,amount_paise,currency,method,error_code,error_description,amount_refunded_paise,created_at,captured_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(200),
      db.from("divy_sandbox_access").select("collection_id,package_id,source_payment_id,granted_at").eq("user_id",user.id).is("revoked_at",null),
    ]);
    for(const result of [orders,transactions,access])if(result.error)throw result.error;
    const paymentIds=(transactions.data||[]).map(tx=>tx.razorpay_payment_id);
    const refunds=paymentIds.length?await db.from("divy_sandbox_refunds").select("razorpay_refund_id,razorpay_payment_id,amount_paise,status,created_at,processed_at").in("razorpay_payment_id",paymentIds).order("created_at",{ascending:false}).limit(100):{data:[],error:null};
    if(refunds.error)throw refunds.error;
    const byInternalId=new Map((orders.data||[]).map(order=>[order.id,{razorpay_order_id:order.razorpay_order_id,package_id:order.package_id}]));
    const enriched=(transactions.data||[]).map(tx=>{
      const order=byInternalId.get(tx.order_id);
      return {...tx,order_id:order?.razorpay_order_id||tx.order_id,package_id:order?.package_id||"sandbox"};
    });
    const entitledAccess=(access.data||[]).map(row=>{
      const folderId=DRIVE_FOLDER_IDS[row.collection_id];
      return {...row,drive_url:folderId?`https://drive.google.com/drive/folders/${folderId}`:null};
    });
    return json(req,{environment:"test",orders:orders.data||[],transactions:enriched,access:entitledAccess,refunds:refunds.data||[]});
  }catch(error){return json(req,{error:sanitizedError(error)},500);}
});
