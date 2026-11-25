const config = window.DIVY_AUTH_CONFIG || {};
const packageCatalog = {
  history:{title:"History & Indian Heritage",amount:19,description:"Indian classics and cultural reading."},
  mind:{title:"Psychology & Self-Mastery",amount:17,description:"Personal growth, habits and focus."},
  money:{title:"Money & Business",amount:19,description:"Finance, investing and business ideas."},
  marketing:{title:"Marketing & Digital Growth",amount:19,description:"Digital marketing and creator business."},
  spirituality:{title:"Spiritual Wisdom",amount:15,description:"Spiritual reading and astrology."},
  wellness:{title:"Holistic Health",amount:15,description:"Yoga, Ayurveda and wellbeing."},
  hindi:{title:"Hindi Reading Vault",amount:15,description:"Hindi bundles and mixed reading."},
  english:{title:"English Reading Room",amount:15,description:"Stories, novels and self-help."},
  food:{title:"Recipe & Food Library",amount:12,description:"Recipes and cooking collections."},
  kids:{title:"Kids Learning & Creativity",amount:12,description:"Learning, coloring and comics."},
  relationships:{title:"Relationships & Human Nature",amount:12,description:"Connection and communication."},
  career:{title:"Career & Curiosity",amount:15,description:"Career, skills and special topics."},
  complete_library:{title:"Complete Library – 12 Collections",amount:79,description:"One-time access across all 12 curated shelves."},
};
const dialog = document.getElementById("pack-payment-overlay");
if (!dialog) throw new Error("Pack payment dialog is missing.");
const title = dialog.querySelector("#pack-payment-title");
const description = dialog.querySelector("#pack-payment-description");
const count = dialog.querySelector("#pack-payment-count");
const price = dialog.querySelector("#pack-payment-price");
const payButton = dialog.querySelector("#pack-payment-buy");
const status = dialog.querySelector("#pack-payment-status");
const actions = dialog.querySelector("#pack-payment-actions");
let selectedId = null;
let busy = false;
let lastReceipt = null;

function announce(message, tone="info") { status.textContent=message;status.dataset.tone=tone;status.hidden=!message; }
function bookCount(id) {
  const values=window.DIVY_LIBRARY?.getPackBookCounts?.()||{};
  return id==="complete_library"?Object.values(values).reduce((sum,value)=>sum+(Number(value)||0),0):Number(values[id])||0;
}
function openPack(id) {
  const item=packageCatalog[id];if(!item)return;
  selectedId=id;lastReceipt=null;actions.hidden=true;actions.querySelector("#pack-payment-receipt").hidden=true;actions.querySelector("#pack-payment-library").hidden=true;actions.querySelector("#pack-payment-retry").hidden=true;status.hidden=true;
  title.textContent=item.title;description.textContent=item.description;
  count.textContent=`${bookCount(id).toLocaleString()} books in this access`;
  price.textContent=`₹${item.amount} · one time`;
  payButton.textContent=`Pay ₹${item.amount} with Razorpay`;
  dialog.hidden=false;document.body.classList.add("payment-dialog-open");
  dialog.querySelector(".pack-payment-close").focus();
}
function closeDialog() { dialog.hidden=true;document.body.classList.remove("payment-dialog-open"); }
function downloadReceipt(data) {
  const safe=value=>String(value??"—").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const item=packageCatalog[data.package_id]||{title:"Divy Library package"};
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Divy Library test receipt</title><style>body{font:16px Arial;color:#20372b;margin:40px}.box{max-width:620px;border:1px solid #ddd;padding:28px;border-radius:14px}.flag{color:#805d23;font-weight:bold}.row{display:flex;justify-content:space-between;gap:20px;padding:12px 0;border-bottom:1px solid #eee}</style></head><body><main class="box"><h1>Divy Library</h1><p class="flag">RAZORPAY SANDBOX · NO REAL MONEY</p><h2>Test payment captured</h2><div class="row"><span>Package</span><b>${safe(item.title)}</b></div><div class="row"><span>Test amount</span><b>₹${(Number(data.amount_paise||0)/100).toFixed(2)}</b></div><div class="row"><span>Payment method</span><b>${safe(data.method||"Razorpay Test Mode")}</b></div><div class="row"><span>Payment ID</span><b>${safe(data.payment_id)}</b></div><div class="row"><span>Order ID</span><b>${safe(data.order_id)}</b></div><div class="row"><span>Time</span><b>${safe(data.captured_at?new Date(data.captured_at).toLocaleString():new Date().toLocaleString())}</b></div><p>This test receipt is not a real-money receipt or tax invoice.</p></main></body></html>`;
  const url=URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=`divy-test-receipt-${String(data.payment_id||"payment").replace(/[^a-z0-9_-]/gi,"_")}.html`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
window.DIVY_PAYMENTS={openPack,downloadReceipt};

async function getSession(){return await window.DIVY_AUTH?.getSession?.()||null;}
async function callFunction(name,payload,session){
  if(!config.url||!config.anonKey)throw new Error("Supabase payment functions are not configured.");
  const response=await fetch(`${config.url.replace(/\/$/,"")}/functions/v1/${name}`,{method:"POST",headers:{"Content-Type":"application/json",apikey:config.anonKey,Authorization:`Bearer ${session.access_token}`},body:JSON.stringify(payload)});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`Payment service returned ${response.status}.`);return data;
}
async function startCheckout(){
  if(busy||!selectedId)return;
  const item=packageCatalog[selectedId];const session=await getSession();
  if(!session?.access_token){announce("Log in to your Divy Library account to purchase this test pack.","error");window.DIVY_AUTH?.open?.();return;}
  if(typeof window.Razorpay!=="function"){announce("Razorpay Checkout did not load. Check your connection and reload.","error");return;}
  busy=true;payButton.disabled=true;payButton.textContent="Preparing secure checkout…";announce("Creating a secure Razorpay Test Mode order…");
  const storageKey=`divySandboxOrderKey:${session.user.id}:${selectedId}`;let idempotencyKey=sessionStorage.getItem(storageKey);if(!idempotencyKey){idempotencyKey=crypto.randomUUID();sessionStorage.setItem(storageKey,idempotencyKey)}
  let order;
  try{
    order=await callFunction("razorpay-create-order",{package_id:selectedId,idempotency_key:idempotencyKey},session);
    if(order.already_owned){
      busy=false;payButton.disabled=false;payButton.textContent=`Pay ₹${item.amount} with Razorpay`;
      await window.DIVY_AUTH?.refreshMemberData?.();
      announce("This collection is already in your library. Your existing access is saved to your account.","success");
      return;
    }
    if(!order.order_id||!order.key_id?.startsWith("rzp_test_")||Number(order.amount)!==item.amount*100||order.currency!=="INR"||order.package_id!==selectedId)throw new Error("The test payment service returned an unexpected order. Checkout was not opened.");
  }catch(error){busy=false;payButton.disabled=false;payButton.textContent=`Pay ₹${item.amount} with Razorpay`;announce(error.message||"Could not create test order.","error");return;}
  busy=false;payButton.disabled=false;payButton.textContent=`Pay ₹${item.amount} with Razorpay`;
  const checkout=new window.Razorpay({key:order.key_id,amount:order.amount,currency:order.currency,name:"Divy Library",description:item.title,order_id:order.order_id,image:`${location.origin}/favicon.ico`,prefill:{name:session.user?.user_metadata?.display_name||"",email:session.user?.email||""},notes:{package_id:selectedId,payment_mode:"test"},theme:{color:"#214a39"},modal:{ondismiss:async()=>{announce("Checkout closed. Checking the test order status…");try{const current=await getSession();await callFunction("razorpay-cancel-checkout",{razorpay_order_id:order.order_id},current);announce("Checkout closed. Verify My Library before retrying if you attempted a payment.");}catch{announce("Checkout closed. Payment status is not confirmed yet; check My Library before retrying.","error");}}},handler:async response=>{
    payButton.disabled=true;announce("Verifying payment signature and capture with the server…");
    try{
      const current=await getSession();const verified=await callFunction("razorpay-verify-payment",response,current);
      if(!verified.verified||verified.status!=="captured"){announce(verified.message||"Payment is still processing. The collection stays locked until capture is confirmed.","error");return;}
      lastReceipt={...verified,package_id:selectedId};sessionStorage.removeItem(storageKey);actions.hidden=false;actions.querySelector("#pack-payment-receipt").hidden=false;actions.querySelector("#pack-payment-library").hidden=false;actions.querySelector("#pack-payment-retry").hidden=true;
      announce("Payment captured in Razorpay Test Mode. No real money was charged.","success");await window.DIVY_AUTH?.refreshMemberData?.();
    }catch(error){announce(error.message||"Payment could not be verified. No access was granted.","error");}
    finally{payButton.disabled=false;}
  }});
  checkout.on("payment.failed",async event=>{
    const failure=event?.error||{};const paymentId=failure.metadata?.payment_id||failure.payment_id;const orderId=failure.metadata?.order_id||failure.order_id||order.order_id;
    if(paymentId){try{const current=await getSession();await callFunction("razorpay-record-failure",{razorpay_order_id:orderId,razorpay_payment_id:paymentId},current);}catch{}}
    actions.hidden=false;actions.querySelector("#pack-payment-receipt").hidden=true;actions.querySelector("#pack-payment-library").hidden=true;actions.querySelector("#pack-payment-retry").hidden=false;announce(failure.description||failure.reason||"Payment failed. No collection access was granted. Retry when ready.","error");
  });
  announce("Razorpay Test Mode order is ready. Complete the mock checkout to unlock this test collection.");checkout.open();
}

document.addEventListener("click",event=>{const button=event.target.closest("[data-view-pack]");if(button){event.preventDefault();openPack(button.dataset.viewPack);}});
dialog.querySelector(".pack-payment-close").addEventListener("click",closeDialog);
dialog.addEventListener("click",event=>{if(event.target===dialog)closeDialog();});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!dialog.hidden)closeDialog();});
payButton.addEventListener("click",startCheckout);
dialog.querySelector("#pack-payment-retry").addEventListener("click",()=>{actions.hidden=true;startCheckout()});
dialog.querySelector("#pack-payment-receipt").addEventListener("click",()=>lastReceipt&&downloadReceipt(lastReceipt));
dialog.querySelector("#pack-payment-library").addEventListener("click",async()=>{await window.DIVY_AUTH?.refreshMemberData?.();closeDialog();window.DIVY_AUTH?.open?.()});
document.getElementById("buy")?.addEventListener("click",event=>{event.preventDefault();openPack("complete_library")});
