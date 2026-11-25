import { getTestCredentials, hmacHex, json, options, requireUser, razorpayRequest, safeEqualHex, sanitizedError, serviceClient } from "../_shared/razorpay.ts";

Deno.serve(async (req) => {
  const preflight = options(req); if (preflight) return preflight;
  if (req.method !== "POST") return json(req,{error:"Method not allowed."},405);
  try {
    const { user, error: authError } = await requireUser(req);
    if (authError) return json(req,{error:authError},401);
    const body = await req.json().catch(() => ({}));
    const orderId = String(body.razorpay_order_id || "");
    const paymentId = String(body.razorpay_payment_id || "");
    const signature = String(body.razorpay_signature || "");
    if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId) || !/^[a-f0-9]{64}$/i.test(signature)) {
      return json(req,{error:"Razorpay returned an incomplete payment confirmation."},400);
    }
    const db = serviceClient();
    const { data: order, error: orderError } = await db.from("divy_sandbox_orders").select("id,user_id,package_id,amount_paise,currency,razorpay_order_id,status,environment")
      .eq("razorpay_order_id",orderId).maybeSingle();
    if (orderError || !order) return json(req,{error:"This payment order could not be found."},404);
    if (order.user_id !== user.id) return json(req,{error:"This order belongs to a different account."},403);
    if (order.environment !== "test") return json(req,{error:"Only sandbox orders can be verified here."},400);

    const { keySecret } = getTestCredentials();
    const expected = await hmacHex(keySecret,`${orderId}|${paymentId}`);
    if (!safeEqualHex(expected,signature)) return json(req,{error:"Razorpay payment signature did not verify."},400);

    let payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
    if (payment.order_id !== orderId || Number(payment.amount) !== order.amount_paise || payment.currency !== order.currency) {
      return json(req,{error:"Payment order, amount, or currency does not match."},400);
    }
    if (payment.status === "authorized" && !payment.captured) {
      try {
        await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}/capture`,{
          method:"POST",body:JSON.stringify({amount:order.amount_paise,currency:order.currency}),
        });
        payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
      } catch {
        payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
      }
    }
    const normalized = payment.status === "captured" || payment.captured === true ? "captured" : payment.status === "failed" ? "failed" : payment.status === "authorized" ? "authorized" : null;
    if (!normalized) return json(req,{verified:false,status:payment.status || "processing",message:"Razorpay is still processing this payment. Your collection stays locked until capture is confirmed."},202);
    const { data: recorded, error: recordError } = await db.rpc("divy_record_sandbox_payment",{
      p_user_id:user.id,p_razorpay_order_id:orderId,p_razorpay_payment_id:paymentId,p_status:normalized,
      p_amount_paise:Number(payment.amount),p_currency:payment.currency,p_method:payment.method || null,
      p_error_code:payment.error_code || null,p_error_description:payment.error_description || null,
      p_created_at:payment.created_at ? new Date(Number(payment.created_at)*1000).toISOString() : new Date().toISOString(),
    });
    if (recordError) throw recordError;
    const verified = normalized === "captured";
    return json(req,{verified,status:normalized,package_id:order.package_id,payment_id:payment.id,order_id:orderId,
      amount_paise:Number(payment.amount),currency:payment.currency,method:payment.method || null,
      captured_at:payment.created_at ? new Date(Number(payment.created_at)*1000).toISOString() : null,
      collections:recorded?.collections || []},verified?200:202);
  } catch (error) {
    return json(req,{error:sanitizedError(error)},500);
  }
});
