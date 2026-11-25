import { json, options, PACKAGES, getTestCredentials, isPackageId, requireUser, sanitizedError, serviceClient, razorpayRequest } from "../_shared/razorpay.ts";

Deno.serve(async (req) => {
  const preflight = options(req); if (preflight) return preflight;
  if (req.method !== "POST") return json(req,{error:"Method not allowed."},405);
  try {
    const { user, error: authError } = await requireUser(req);
    if (authError) return json(req,{error:authError},401);
    const body = await req.json().catch(() => ({}));
    if (!isPackageId(body.package_id)) return json(req,{error:"Choose one of the available sandbox packages."},400);
    const idempotencyKey = String(body.idempotency_key || "");
    if (!/^[a-f0-9-]{36}$/i.test(idempotencyKey)) return json(req,{error:"A valid checkout request key is required."},400);
    const pkg = PACKAGES[body.package_id];
    const db = serviceClient();
    const { data: existingAccess, error: accessError } = await db.from("divy_sandbox_access")
      .select("collection_id").eq("user_id",user.id).is("revoked_at",null);
    if (accessError) throw accessError;
    const owned = new Set((existingAccess || []).map(row => row.collection_id));
    if (pkg.collections.every(collectionId => owned.has(collectionId))) {
      return json(req,{already_owned:true,package_id:body.package_id,collections:pkg.collections});
    }
    const { data: previous } = await db.from("divy_sandbox_orders").select("razorpay_order_id,amount_paise,currency,package_id,status,receipt")
      .eq("user_id",user.id).eq("idempotency_key",idempotencyKey).maybeSingle();
    const { keyId } = getTestCredentials();
    if (previous) return json(req,{key_id:keyId,order_id:previous.razorpay_order_id,amount:previous.amount_paise,currency:previous.currency,package_id:previous.package_id,status:previous.status,receipt:previous.receipt});

    const receipt = `divy_${idempotencyKey.replaceAll("-","")}`;
    const remote = await razorpayRequest("/orders",{
      method:"POST",
      body:JSON.stringify({amount:pkg.amount,currency:pkg.currency,receipt,notes:{user_id:user.id,package_id:body.package_id,payment_mode:"test"}}),
    });
    const { error: insertError } = await db.from("divy_sandbox_orders").insert({
      user_id:user.id,environment:"test",package_id:body.package_id,amount_paise:pkg.amount,currency:pkg.currency,
      razorpay_order_id:remote.id,receipt,idempotency_key:idempotencyKey,status:"created",customer_email:user.email || null,
    });
    if (insertError) throw new Error("The test order was created by Razorpay but could not be recorded. Do not retry with a new order key; contact support with the receipt.");
    return json(req,{key_id:keyId,order_id:remote.id,amount:remote.amount,currency:remote.currency,package_id:body.package_id,receipt,status:remote.status});
  } catch (error) {
    return json(req,{error:sanitizedError(error)},500);
  }
});
