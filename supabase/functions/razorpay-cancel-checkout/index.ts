import { json, options, razorpayRequest, requireUser, sanitizedError, serviceClient } from "../_shared/razorpay.ts";
Deno.serve(async(req)=>{
  const preflight=options(req);if(preflight)return preflight;
  if(req.method!=="POST")return json(req,{error:"Method not allowed."},405);
  try{
    const {user,error}=await requireUser(req);if(error)return json(req,{error},401);
    const {razorpay_order_id}=await req.json().catch(()=>({}));
    if(typeof razorpay_order_id!=="string"||!/^order_[A-Za-z0-9]+$/.test(razorpay_order_id))return json(req,{error:"Invalid order."},400);
    const db=serviceClient();
    const {data,error:loadError}=await db.from("divy_sandbox_orders").select("id,status,user_id").eq("razorpay_order_id",razorpay_order_id).maybeSingle();
    if(loadError||!data)return json(req,{error:"Order not found."},404);
    if(data.user_id!==user.id)return json(req,{error:"Order belongs to a different account."},403);
    if(data.status==="paid"||data.status==="refunded")return json(req,{status:data.status,changed:false});
    const remote=await razorpayRequest(`/orders/${encodeURIComponent(razorpay_order_id)}`);
    const nextStatus=Number(remote.attempts||0)===0?"cancelled":"attempted";
    const {error:updateError}=await db.from("divy_sandbox_orders").update({status:nextStatus,updated_at:new Date().toISOString()}).eq("id",data.id).neq("status","paid");
    if(updateError)throw updateError;
    await db.from("divy_sandbox_audit_logs").insert({actor_user_id:user.id,action:"checkout_dismissed",entity_type:"order",entity_id:razorpay_order_id,details:{provider_payment_state_not_asserted:true}});
    return json(req,{status:nextStatus,changed:true,message:nextStatus==="cancelled"?"Checkout was dismissed before a payment attempt. No payment was recorded.":"Checkout was dismissed after a payment attempt. Payment status remains subject to Razorpay confirmation."});
  }catch(error){return json(req,{error:sanitizedError(error)},500);}
});
