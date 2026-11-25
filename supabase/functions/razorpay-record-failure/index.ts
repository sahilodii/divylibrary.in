import { json, options, requireUser, razorpayRequest, sanitizedError, serviceClient } from "../_shared/razorpay.ts";

Deno.serve(async (req) => {
  const preflight=options(req);if(preflight)return preflight;
  if(req.method!=="POST")return json(req,{error:"Method not allowed."},405);
  try{
    const {user,error:authError}=await requireUser(req);if(authError)return json(req,{error:authError},401);
    const body=await req.json().catch(()=>({}));
    const orderId=String(body.razorpay_order_id||"");const paymentId=String(body.razorpay_payment_id||"");
    if(!/^order_[A-Za-z0-9]+$/.test(orderId)||!/^pay_[A-Za-z0-9]+$/.test(paymentId))return json(req,{error:"Razorpay did not provide a valid payment attempt."},400);
    const db=serviceClient();
    const {data:order,error}=await db.from("divy_sandbox_orders").select("id,user_id,amount_paise,currency,environment")
      .eq("razorpay_order_id",orderId).maybeSingle();
    if(error||!order)return json(req,{error:"Order not found."},404);
    if(order.user_id!==user.id)return json(req,{error:"Order belongs to a different account."},403);
    if(order.environment!=="test")return json(req,{error:"Only sandbox orders are accepted."},400);
    const payment=await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
    if(payment.order_id!==orderId||Number(payment.amount)!==order.amount_paise||payment.currency!==order.currency)return json(req,{error:"Payment attempt does not match this order."},400);
    if(payment.status!=="failed")return json(req,{error:"Razorpay has not confirmed a failed payment attempt."},409);
    const {data:recorded,error:recordError}=await db.rpc("divy_record_sandbox_payment",{
      p_user_id:user.id,p_razorpay_order_id:orderId,p_razorpay_payment_id:paymentId,p_status:"failed",
      p_amount_paise:Number(payment.amount),p_currency:payment.currency,p_method:payment.method||null,
      p_error_code:payment.error_code||null,p_error_description:payment.error_description||null,
      p_created_at:payment.created_at?new Date(Number(payment.created_at)*1000).toISOString():new Date().toISOString(),
    });
    if(recordError)throw recordError;
    return json(req,{recorded:true,status:recorded?.status||"failed",reason:payment.error_description||payment.error_reason||"Payment was declined."});
  }catch(error){return json(req,{error:sanitizedError(error)},500);}
});
