import { getWebhookSecret, hmacHex, json, options, safeEqualHex, sanitizedError, serviceClient } from "../_shared/razorpay.ts";

function summary(event: any) {
  const payment=event?.payload?.payment?.entity;
  const order=event?.payload?.order?.entity;
  const refund=event?.payload?.refund?.entity;
  return {
    order_id:payment?.order_id||order?.id||refund?.notes?.order_id||null,
    payment_id:payment?.id||refund?.payment_id||null,
    refund_id:refund?.id||null,
    status:payment?.status||order?.status||refund?.status||null,
    amount_paise:payment?.amount??refund?.amount??order?.amount??null,
    currency:payment?.currency||refund?.currency||order?.currency||null,
    method:payment?.method||null,
    created_at:payment?.created_at||refund?.created_at||event?.created_at||null,
    error_code:payment?.error_code||null,
    error_reason:payment?.error_reason||null,
  };
}

Deno.serve(async(req)=>{
  const preflight=options(req);if(preflight)return preflight;
  if(req.method!=="POST")return json(req,{error:"Method not allowed."},405);
  const raw=await req.text();
  const signature=req.headers.get("x-razorpay-signature")||"";
  const eventId=req.headers.get("x-razorpay-event-id")||"";
  try{
    if(!eventId||!/^[a-f0-9]{64}$/i.test(signature))return json(req,{error:"Missing webhook signature or event ID."},400);
    const expected=await hmacHex(getWebhookSecret(),raw);
    if(!safeEqualHex(expected,signature))return json(req,{error:"Invalid webhook signature."},401);
    let event:any;
    try{event=JSON.parse(raw)}catch{return json(req,{error:"Invalid webhook JSON."},400)}
    const eventType=String(event?.event||"");
    if(!eventType)return json(req,{error:"Webhook event type is missing."},400);
    const db=serviceClient();
    const eventRow={event_id:eventId,event_type:eventType,environment:"test",payload_summary:summary(event),processing_status:"received"};
    const {error:insertError}=await db.from("divy_sandbox_webhook_events").insert(eventRow);
    if(insertError?.code==="23505"){
      const {data:existing,error:loadError}=await db.from("divy_sandbox_webhook_events").select("processing_status").eq("event_id",eventId).maybeSingle();
      if(loadError)throw loadError;
      if(existing?.processing_status==="processed"||existing?.processing_status==="ignored")return json(req,{ok:true,duplicate:true});
      const {error:retryError}=await db.from("divy_sandbox_webhook_events").update({processing_status:"received",error_code:null,processed_at:null}).eq("event_id",eventId);
      if(retryError)throw retryError;
    }
    if(insertError&&insertError.code!=="23505")throw insertError;
    try{
      const info=summary(event);
      if(["payment.authorized","payment.captured","payment.failed","order.paid"].includes(eventType)){
        const payment=event?.payload?.payment?.entity;
        const orderId=String(payment?.order_id||event?.payload?.order?.entity?.id||"");
        const paymentId=String(payment?.id||"");
        if(!orderId||!paymentId)throw new Error("Payment event omitted its order or payment identifier.");
        const {data:order,error:orderError}=await db.from("divy_sandbox_orders").select("user_id,package_id,amount_paise,currency,environment").eq("razorpay_order_id",orderId).maybeSingle();
        if(orderError||!order)throw new Error("Sandbox order not found for webhook.");
        if(order.environment!=="test"||Number(payment.amount)!==order.amount_paise||payment.currency!==order.currency)throw new Error("Webhook amount or currency does not match the test order.");
        const status=eventType==="order.paid"||eventType==="payment.captured"?"captured":eventType==="payment.failed"?"failed":"authorized";
        const {error}=await db.rpc("divy_record_sandbox_payment",{
          p_user_id:order.user_id,p_razorpay_order_id:orderId,p_razorpay_payment_id:paymentId,p_status:status,
          p_amount_paise:Number(payment.amount),p_currency:payment.currency,p_method:payment.method||null,
          p_error_code:payment.error_code||null,p_error_description:payment.error_description||null,
          p_created_at:payment.created_at?new Date(Number(payment.created_at)*1000).toISOString():new Date().toISOString(),
        });
        if(error)throw error;
      }else if(["refund.created","refund.processed","refund.failed"].includes(eventType)){
        const refund=event?.payload?.refund?.entity;
        const paymentId=String(refund?.payment_id||"");
        const refundId=String(refund?.id||"");
        if(!paymentId||!refundId||!Number.isInteger(Number(refund.amount)))throw new Error("Refund event is missing required identifiers.");
        const status=eventType==="refund.processed"?"processed":eventType==="refund.failed"?"failed":"pending";
        const {data,error}=await db.rpc("divy_record_sandbox_refund",{
          p_razorpay_payment_id:paymentId,p_razorpay_refund_id:refundId,p_amount_paise:Number(refund.amount),
          p_status:status,p_receipt:refund.receipt||null,p_initiated_by:null,
          p_processed_at:status==="processed"&&refund.created_at?new Date(Number(refund.created_at)*1000).toISOString():null,
        });
        if(error)throw error;
        info.refund_total_paise=data?.amount_refunded_paise??null;
      }
      const {error:updateError}=await db.from("divy_sandbox_webhook_events").update({processing_status:["payment.authorized","payment.captured","payment.failed","order.paid","refund.created","refund.processed","refund.failed"].includes(eventType)?"processed":"ignored",processed_at:new Date().toISOString()}).eq("event_id",eventId);
      if(updateError)throw updateError;
      return json(req,{ok:true,event_id:eventId,processed:true});
    }catch(error){
      await db.from("divy_sandbox_webhook_events").update({processing_status:"failed",error_code:sanitizedError(error).slice(0,120)}).eq("event_id",eventId);
      throw error;
    }
  }catch(error){
    return json(req,{error:sanitizedError(error)},500);
  }
});
