import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const config = window.DIVY_AUTH_CONFIG || {};
const configured = Boolean(config.url && config.anonKey);
const supabase = configured ? createClient(config.url, config.anonKey) : null;

const css = `
.tools .account-trigger{border:1px solid #cfc8bb;border-radius:24px;background:var(--white);color:var(--green);padding:9px 14px;font-size:12px;font-weight:800;white-space:nowrap}
.account-trigger:hover{border-color:var(--green);background:#edf1e9}.account-trigger:focus-visible,.auth-close:focus-visible,.auth-submit:focus-visible,.auth-switch:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.auth-overlay{position:fixed;z-index:40;inset:0;display:grid;place-items:center;padding:18px;background:#17241a91;backdrop-filter:blur(4px)}.auth-overlay[hidden]{display:none}
.auth-card{position:relative;width:min(440px,100%);max-height:min(92vh,760px);overflow:auto;padding:34px;border:1px solid #e5dfd4;border-radius:18px;background:var(--white);box-shadow:0 24px 90px #101c1680;animation:auth-in .2s ease-out both}.auth-card [hidden]{display:none!important}
@keyframes auth-in{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}
.auth-close{position:absolute;right:15px;top:12px;width:36px;height:36px;border:0;border-radius:50%;background:#f0ece2;color:#34483b;font-size:23px;line-height:1}
.auth-mark{display:grid;place-items:center;width:42px;height:42px;margin-bottom:17px;border-radius:50% 50% 50% 12px;background:var(--green);color:white;font:700 28px Georgia}
.auth-card h2{margin:0 42px 7px 0;color:var(--ink);font:600 32px/1.1 'Playfair Display',Georgia}.auth-intro{margin:0 0 22px;color:#69756b;font-size:13px;line-height:1.5}
.auth-form{display:grid;gap:13px}.auth-field{display:grid;gap:6px;color:#39493e;font-size:12px;font-weight:750}.auth-field input{width:100%;height:45px;border:1px solid #d8d2c7;border-radius:7px;background:#fffefb;padding:0 12px;color:var(--ink);font:14px 'DM Sans',Arial,sans-serif}.auth-field input:focus{outline:2px solid #b5c5b5;border-color:#617b68}.auth-field input::placeholder{color:#99998f}
.auth-row{display:flex;align-items:center;justify-content:flex-end}.auth-switch{border:0;padding:2px 0;background:none;color:#35614a;text-decoration:underline;text-underline-offset:3px;font-size:12px;font-weight:700}
.auth-submit{min-height:46px;margin-top:3px;border:0;border-radius:7px;background:var(--green);color:white;font-size:14px;font-weight:800}.auth-submit:hover{background:#173b2e}.auth-submit:disabled{opacity:.65;cursor:wait}
.auth-message{min-height:18px;margin:1px 0 0;color:#376344;font-size:12px;line-height:1.5}.auth-message.error{color:#a33f32}.auth-config-note{margin:18px 0 0;padding:10px 12px;border-radius:7px;background:#f4efe2;color:#726244;font-size:11px;line-height:1.45}.auth-user-email{display:block;overflow-wrap:anywhere;margin:14px 0 20px;color:#69756b;font-size:13px}
.auth-card:has(.member-dashboard:not([hidden])){width:min(760px,100%)}.member-dashboard{display:grid;gap:18px}.member-overview{display:grid;grid-template-columns:1fr auto;align-items:center;gap:16px;padding:17px;border:1px solid #e5dfd4;border-radius:12px;background:#f8f5ed}.member-identity{display:flex;align-items:center;gap:12px;min-width:0}.member-avatar{display:grid;place-items:center;flex:none;width:44px;height:44px;border-radius:50% 50% 50% 12px;background:var(--green);color:white;font:700 23px Georgia}.member-identity strong,.member-identity span{display:block;overflow-wrap:anywhere}.member-identity strong{font-size:14px;color:var(--ink)}.member-identity span{margin-top:4px;color:#73796f;font-size:11px}.member-stats{display:flex;gap:10px}.member-stat{min-width:76px;padding:9px 11px;border-radius:9px;background:white;text-align:center}.member-stat strong{display:block;color:var(--green);font:700 21px 'Playfair Display',Georgia}.member-stat span{color:#747a71;font-size:10px}.member-section{min-width:0}.member-section-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:9px}.member-section h3{margin:0;color:var(--ink);font:600 20px 'Playfair Display',Georgia}.member-section-head span{color:#73796f;font-size:11px}.member-pack-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.member-pack{display:grid;grid-template-columns:58px minmax(0,1fr);align-items:center;gap:11px;min-width:0;padding:9px;border:1px solid #e5dfd4;border-radius:10px;background:#fffefb}.member-pack img{width:58px;height:68px;object-fit:cover;border-radius:5px;background:#e7e1d6}.member-pack-copy{min-width:0}.member-pack-copy strong{display:block;overflow:hidden;color:var(--ink);font:600 14px 'Playfair Display',Georgia;text-overflow:ellipsis;white-space:nowrap}.member-pack-copy span{display:block;margin-top:4px;color:#777d73;font-size:10px}.member-pack-actions{display:flex;gap:10px;margin-top:8px}.member-pack-actions button,.member-browse{border:0;background:none;color:#315e47;padding:0;font-size:10px;font-weight:800;text-decoration:underline;text-underline-offset:2px}.member-pack-actions button.remove{color:#a44d42}.member-empty,.member-loading,.member-error{margin:0;padding:13px;border-radius:9px;background:#f8f5ed;color:#71786f;font-size:12px;line-height:1.5}.member-error{background:#fbefec;color:#a33f32}.member-loading[hidden],.member-error[hidden],.member-empty[hidden]{display:none!important}.member-browse{margin-top:8px}.member-logout{width:100%;margin-top:1px!important}.member-access-list,.member-test-list{display:grid;gap:8px}.member-access-item,.member-test-item{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 13px;border:1px solid #e5dfd4;border-radius:9px;background:#fffefb;font-size:12px}.member-access-item strong,.member-test-item strong{color:var(--green)}.member-access-item span,.member-test-item span{color:#73796f}.member-admin{padding:14px;border:1px solid #decf9f;border-radius:11px;background:#fff9e7}.member-admin h3{margin:0 0 10px;font:600 20px 'Playfair Display',Georgia}.member-admin-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:9px}.member-admin-controls input,.member-admin-controls select{min-width:0;height:36px;border:1px solid #d8d2c7;border-radius:6px;background:#fff;padding:0 7px;font-size:11px}.member-admin button{border:1px solid #d8d2c7;border-radius:6px;background:#fff;padding:7px 9px;color:#315e47;font-size:11px;font-weight:750}.member-admin-stats{color:#566459;font-size:11px;line-height:1.6}.member-admin-output{max-height:230px;overflow:auto;margin-top:8px;font-size:10px;white-space:pre-wrap;overflow-wrap:anywhere}.auth-card .member-dashboard[hidden],.member-admin[hidden]{display:none!important}
body.auth-open{overflow:hidden}
@media(max-width:600px){.member-overview{grid-template-columns:1fr}.member-stats{width:100%}.member-stat{flex:1}.member-pack-list{grid-template-columns:1fr}}
@media(max-width:700px){.tools{gap:7px}.tools .account-trigger{padding:8px 10px;font-size:11px}.auth-card{padding:28px 22px}.auth-card h2{font-size:29px}}
`;
const style = document.createElement("style");
style.textContent = css;
document.head.append(style);

const overlay = document.createElement("div");
overlay.className = "auth-overlay";
overlay.hidden = true;
overlay.innerHTML = `<section class="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title" aria-describedby="auth-intro">
  <button class="auth-close" type="button" aria-label="Close">×</button>
  <div class="auth-mark" aria-hidden="true">D</div>
  <h2 id="auth-title">Welcome back</h2>
  <p class="auth-intro" id="auth-intro">Log in to your Divy Library account.</p>
  <form class="auth-form" novalidate>
    <label class="auth-field auth-name" hidden>Your name<input name="name" autocomplete="name" maxlength="80" placeholder="How should we address you?"></label>
    <label class="auth-field">Email address<input name="email" type="email" autocomplete="email" required maxlength="254" placeholder="you@example.com"></label>
    <label class="auth-field auth-password">Password<input name="password" type="password" autocomplete="current-password" required minlength="8" maxlength="128" placeholder="At least 8 characters"></label>
    <label class="auth-field auth-confirm" hidden>New password<input name="confirm" type="password" autocomplete="new-password" minlength="8" maxlength="128" placeholder="Choose a new password"></label>
    <div class="auth-row"><button class="auth-switch" type="button">Forgot password?</button></div>
    <button class="auth-submit" type="submit">Log in</button>
    <p class="auth-message" role="status" aria-live="polite"></p>
  </form>
  <p class="auth-user-email" hidden></p>
  <div class="member-dashboard" hidden aria-live="polite">
    <div class="member-overview">
      <div class="member-identity"><span class="member-avatar">D</span><div><strong class="member-name">Your library</strong><span class="member-status">Account details</span></div></div>
      <div class="member-stats"><div class="member-stat"><strong class="member-saved-count">0</strong><span>Saved packs</span></div><div class="member-stat"><strong class="member-purchase-count">0</strong><span>Purchases</span></div></div>
    </div>
    <p class="member-loading" hidden>Loading your library…</p>
    <p class="member-error" hidden></p>
    <section class="member-section"><div class="member-section-head"><h3>Saved packs</h3><span class="member-saved-label">Synced to this account</span></div><div class="member-pack-list member-saved-list"></div><p class="member-empty member-saved-empty" hidden>You haven’t saved any packs yet.</p><button class="member-browse member-browse-saved" type="button">Browse the library</button></section>
    <section class="member-section"><div class="member-section-head"><h3>My purchases</h3><span>Confirmed payments</span></div><div class="member-pack-list member-purchase-list"></div><p class="member-empty member-purchase-empty" hidden>No purchases yet. Confirmed pack purchases will appear here.</p></section><section class="member-section"><div class="member-section-head"><h3>Sandbox access</h3><span>Razorpay test purchases</span></div><div class="member-access-list"></div><p class="member-empty member-access-empty">No test collections unlocked yet.</p></section><section class="member-section"><div class="member-section-head"><h3>Test payment history</h3><span>No real money charged</span></div><div class="member-test-list"></div><p class="member-empty member-test-empty">Your verified test payments will appear here.</p></section><section class="member-admin" hidden><h3>Sandbox admin</h3><div class="member-admin-controls"><input type="date" aria-label="From date"><input type="date" aria-label="To date"><input type="search" placeholder="Customer email or user ID" aria-label="Customer"><select aria-label="Payment status"><option value="">All statuses</option><option>paid</option><option>failed</option><option>attempted</option><option>cancelled</option><option>refunded</option></select><select aria-label="Package"><option value="">All packages</option><option value="history">History</option><option value="mind">Mind</option><option value="money">Money</option><option value="marketing">Marketing</option><option value="spirituality">Spirituality</option><option value="wellness">Wellness</option><option value="hindi">Hindi</option><option value="english">English</option><option value="food">Food</option><option value="kids">Kids</option><option value="relationships">Relationships</option><option value="career">Career</option><option value="complete_library">Complete Library</option></select><select aria-label="Collection"><option value="">Any collection</option><option value="history">History</option><option value="mind">Mind</option><option value="money">Money</option><option value="marketing">Marketing</option><option value="spirituality">Spirituality</option><option value="wellness">Wellness</option><option value="hindi">Hindi</option><option value="english">English</option><option value="food">Food</option><option value="kids">Kids</option><option value="relationships">Relationships</option><option value="career">Career</option></select></div><button type="button" class="member-admin-refresh">Load dashboard</button><button type="button" class="member-admin-reset">Reset sandbox records</button><p class="member-admin-stats" aria-live="polite"></p><div class="member-admin-output"></div></section>
  </div>
  <p class="auth-config-note" hidden>Account sign-in is ready to connect. Add your Supabase project URL and public anon key in <code>auth-config.js</code> to activate accounts.</p>
  <button class="auth-switch auth-mode-switch" type="button">Create an account</button>
</section>`;
document.body.append(overlay);

const trigger = document.getElementById("account-trigger");
const card = overlay.querySelector(".auth-card");
const form = overlay.querySelector("form");
const title = overlay.querySelector("h2");
const intro = overlay.querySelector(".auth-intro");
const message = overlay.querySelector(".auth-message");
const nameField = overlay.querySelector(".auth-name");
const passwordField = overlay.querySelector(".auth-password");
const confirmField = overlay.querySelector(".auth-confirm");
const forgotButton = overlay.querySelector(".auth-row .auth-switch");
const submit = overlay.querySelector(".auth-submit");
const pwInput = passwordField.querySelector("input");
const showBtn = document.createElement("button"); showBtn.type = "button"; showBtn.className = "auth-switch"; showBtn.textContent = "Show password";
showBtn.onclick = () => { const s = pwInput.type === "password"; pwInput.type = s ? "text" : "password"; showBtn.textContent = s ? "Hide password" : "Show password"; };
const strength = document.createElement("small"); strength.className = "auth-strength";
passwordField.append(showBtn, strength);
pwInput.addEventListener("input", () => { const v = pwInput.value; let s = 0; if (v.length >= 8) s++; if (v.length >= 12) s++; if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++; strength.textContent = v ? "Strength: " + ["very weak","weak","fair","good","strong","strong"][s] : ""; });
const resend = document.createElement("button"); resend.type = "button"; resend.className = "auth-switch"; resend.hidden = true; resend.textContent = "Resend confirmation email"; message.after(resend);
resend.onclick = async () => { const email = String(new FormData(form).get("email") || "").trim(); if (!email) return; resend.disabled = true; try { const r = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: location.href.split("#")[0] } }); setMessage(r.error ? r.error.message : "Confirmation email sent again.", !!r.error); } catch { setMessage("Couldn’t resend right now. Try again shortly.", true); } resend.disabled = false; };
const modeSwitch = overlay.querySelector(".auth-mode-switch");
const userEmail = overlay.querySelector(".auth-user-email");
const configNote = overlay.querySelector(".auth-config-note");
const memberDashboard = overlay.querySelector(".member-dashboard");
const memberLoading = overlay.querySelector(".member-loading");
const memberError = overlay.querySelector(".member-error");
const memberSavedList = overlay.querySelector(".member-saved-list");
const memberPurchaseList = overlay.querySelector(".member-purchase-list");
const memberSavedEmpty = overlay.querySelector(".member-saved-empty");
const memberPurchaseEmpty = overlay.querySelector(".member-purchase-empty");
const memberAccessList = overlay.querySelector('.member-access-list');
const memberAccessEmpty = overlay.querySelector('.member-access-empty');
const memberTestList = overlay.querySelector('.member-test-list');
const memberTestEmpty = overlay.querySelector('.member-test-empty');
const memberAdmin = overlay.querySelector('.member-admin');
let memberData = { userId: null, saved: [], purchases: [], sandboxAccess: [], sandboxTransactions: [], sandboxOrders: [], loading: false, error: "" };
let memberLoadPromise = null;
let memberLoadUserId = null;
let memberLoadToken = 0;
let mode = "login";
let busy = false;
let currentUser = null;

function setMessage(text = "", isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}
function setMode(next) {
  mode = next;
  const recovery = next === "recovery";
  const signup = next === "signup";
  const loggedIn = next === "account";
  form.hidden = loggedIn;
  userEmail.hidden = !loggedIn;
  memberDashboard.hidden = !loggedIn;
  nameField.hidden = !signup;
  passwordField.hidden = loggedIn || next === "forgot";
  confirmField.hidden = !recovery;
  forgotButton.hidden = signup || recovery || next === "forgot";
  modeSwitch.hidden = recovery || next === "forgot" || loggedIn;
  configNote.hidden = configured;
  title.textContent = loggedIn ? "Your library" : recovery ? "Choose a new password" : next === "forgot" ? "Reset your password" : signup ? "Create your account" : "Welcome back";
  intro.textContent = loggedIn ? "Your saved shelves and confirmed purchases, kept with your account." : recovery ? "Choose a new password for your account." : next === "forgot" ? "We’ll email you a secure password reset link." : signup ? "Save your reading shelves and pick up where you left off." : "Log in to your Divy Library account.";
  submit.textContent = recovery ? "Update password" : next === "forgot" ? "Send reset link" : signup ? "Create account" : "Log in";
  modeSwitch.textContent = signup ? "Already have an account? Log in" : "Create an account";
  form.elements.password.required = !loggedIn && !recovery && next !== "forgot";
  form.elements.confirm.required = recovery;
  form.elements.name.required = signup;
  form.elements.password.autocomplete = signup || recovery ? "new-password" : "current-password";
  passwordField.firstChild.textContent = recovery ? "New password" : "Password";
  setMessage("");
}
function open() {
  overlay.hidden = false;
  document.body.classList.add("auth-open");
  setMode(currentUser ? "account" : "login");
  if (currentUser) {
    userEmail.textContent = currentUser.email || "Signed in";
    renderMemberData();
  }
  requestAnimationFrame(() => card.querySelector("input:not([type=hidden]):not(:disabled)")?.focus() || card.querySelector(".auth-close").focus());
}
function close() {
  overlay.hidden = true;
  document.body.classList.remove("auth-open");
  trigger.focus();
}
trigger.addEventListener("click", open);
overlay.querySelector(".auth-close").addEventListener("click", close);
overlay.addEventListener("click", (event) => { if (event.target === overlay) close(); });
document.addEventListener("keydown", (event) => {
  if (overlay.hidden) return;
  if (event.key === "Escape") close();
  if (event.key === "Tab") {
    const items = [...card.querySelectorAll("button:not([hidden]),input:not([type=hidden]):not(:disabled)")].filter(el => el.offsetParent !== null);
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
forgotButton.addEventListener("click", () => setMode("forgot"));
modeSwitch.addEventListener("click", () => setMode(mode === "signup" ? "login" : "signup"));

async function syncSession(session) {
  const oldUserId = currentUser?.id || null;
  currentUser = session?.user || null;
  trigger.textContent = currentUser ? "Account" : "Log in";
  trigger.setAttribute("aria-label", currentUser ? `Account for ${currentUser.email || "signed-in user"}` : "Log in or create an account");
  if (oldUserId !== (currentUser?.id || null)) {
    memberLoadToken += 1;
    memberLoadPromise = null;
    memberLoadUserId = null;
    if (currentUser) {
      memberData = { userId: currentUser.id, saved: [], purchases: [], sandboxAccess: [], sandboxTransactions: [], sandboxOrders: [], loading: true, error: "" };
      window.DIVY_LIBRARY?.setAccountSavedPacks(currentUser.id, []);
      renderMemberData();
      memberLoadUserId = currentUser.id;
      memberLoadPromise = loadMemberData(currentUser, memberLoadToken);
    } else {
      memberData = { userId: null, saved: [], purchases: [], sandboxAccess: [], sandboxTransactions: [], sandboxOrders: [], loading: false, error: "" };
      window.DIVY_LIBRARY?.clearAccountSavedPacks();
      renderMemberData();
    }
  }
  if (currentUser && !overlay.hidden) {
    setMode("account");
    userEmail.textContent = currentUser.email || "Signed in";
  } else if (!currentUser && mode === "account") setMode("login");
  if (currentUser && memberLoadPromise) await memberLoadPromise;
}

function packInfo(packId) {
  const card = [...document.querySelectorAll(".pack[data-cat]")].find(item => item.dataset.cat === packId);
  if (!card) return { id: packId, title: packId, image: "", detail: "Divy Library pack" };
  return { id: packId, title: card.querySelector("h3")?.textContent || packId, image: card.querySelector(".art img")?.src || "", detail: card.querySelector(".topics")?.textContent || "Divy Library pack" };
}

function makeMemberPack(item, purchased = false) {
  const info = packInfo(item.pack_id);
  const article = document.createElement("article");
  article.className = "member-pack";
  const image = document.createElement("img");
  image.src = info.image;
  image.alt = `${info.title} cover`;
  image.loading = "lazy";
  const copy = document.createElement("div");
  copy.className = "member-pack-copy";
  const heading = document.createElement("strong");
  heading.textContent = item.pack_id === "all_access" ? "All Access" : info.title;
  const detail = document.createElement("span");
  detail.textContent = purchased && item.purchased_at ? `Purchased ${new Date(item.purchased_at).toLocaleDateString()}` : info.detail;
  const actions = document.createElement("div");
  actions.className = "member-pack-actions";
  const browse = document.createElement("button");
  browse.type = "button";
  browse.textContent = purchased ? "Browse pack" : "Open pack";
  browse.addEventListener("click", () => {
    close();
    window.dispatchEvent(new CustomEvent("divy:open-pack", { detail: { packId: item.pack_id } }));
  });
  actions.append(browse);
  if (!purchased) {
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => window.DIVY_LIBRARY?.toggleFavorite(item.pack_id));
    actions.append(remove);
  }
  copy.append(heading, detail, actions);
  article.append(image, copy);
  return article;
}

function renderMemberData() {
  const loggedIn = Boolean(currentUser);
  memberDashboard.hidden = !loggedIn;
  if (!loggedIn) { window.DIVY_LIBRARY?.clearOwnedPacks?.(); return; }
  window.DIVY_LIBRARY?.setOwnedPacks?.([...memberData.purchases.map(item => item.pack_id), ...memberData.sandboxAccess.map(item => item.collection_id)]);
  const metadataName = currentUser.user_metadata?.display_name?.trim();
  overlay.querySelector(".member-name").textContent = metadataName || currentUser.email || "Your library";
  overlay.querySelector(".member-avatar").textContent = (metadataName || currentUser.email || "D").trim().charAt(0).toUpperCase();
  overlay.querySelector(".member-status").textContent = currentUser.email_confirmed_at ? `Email verified · Member since ${new Date(currentUser.created_at).toLocaleDateString()}` : "Email confirmation pending";
  overlay.querySelector(".member-saved-count").textContent = String(memberData.saved.length);
  overlay.querySelector(".member-purchase-count").textContent = String(memberData.purchases.length);
  memberLoading.hidden = !memberData.loading;
  memberError.hidden = !memberData.error;
  memberError.textContent = memberData.error;
  memberSavedList.replaceChildren(...memberData.saved.map(pack_id => makeMemberPack({ pack_id })));
  memberPurchaseList.replaceChildren(...memberData.purchases.map(item => makeMemberPack(item, true)));
  memberSavedEmpty.hidden = memberData.loading || Boolean(memberData.error) || memberData.saved.length > 0;
  memberPurchaseEmpty.hidden = memberData.loading || Boolean(memberData.error) || memberData.purchases.length > 0;
  const collectionNames = {history:"History & heritage",mind:"Mind & psychology",money:"Money & business",marketing:"Marketing & growth",spirituality:"Spiritual wisdom",wellness:"Holistic health",hindi:"Hindi reading",english:"English reading",food:"Food & recipes",kids:"Kids & creativity",relationships:"Relationships",career:"Career & curiosity"};
  memberAccessList.replaceChildren(...memberData.sandboxAccess.map(row => { const item=document.createElement("div");item.className="member-access-item";const copy=document.createElement("div");const name=document.createElement("strong");name.textContent=collectionNames[row.collection_id]||row.collection_id;const source=document.createElement("span");source.textContent=`Verified test access · ${new Date(row.granted_at).toLocaleDateString()}`;copy.append(name,document.createElement("br"),source);item.append(copy);if(typeof row.drive_url==="string"&&/^https:\/\/drive\.google\.com\/drive\/folders\/[A-Za-z0-9_-]+$/.test(row.drive_url)){const link=document.createElement("a");link.href=row.drive_url;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Open collection";link.style.cssText="flex:none;border-radius:6px;background:var(--green);color:#fff;padding:8px 10px;font-size:11px;font-weight:750;text-decoration:none";link.setAttribute("aria-label",`Open ${collectionNames[row.collection_id]||row.collection_id} collection folder in Google Drive`);item.append(link)}return item; }));
  memberAccessEmpty.hidden = memberData.loading || memberData.sandboxAccess.length > 0;
  memberTestList.replaceChildren(...memberData.sandboxTransactions.map(row => {const item=document.createElement("div");item.className="member-test-item";const copy=document.createElement("div");const name=document.createElement("strong");name.textContent=`${row.package_id.replaceAll("_"," ")} · ₹${(Number(row.amount_paise)/100).toFixed(2)}`;const detail=document.createElement("span");detail.textContent=`${row.status} · ${new Date(row.captured_at||row.created_at).toLocaleString()}${row.amount_refunded_paise?` · Refunded ₹${(row.amount_refunded_paise/100).toFixed(2)}`:""}`;copy.append(name,document.createElement("br"),detail);item.append(copy);if(row.status==="captured"){const receipt=document.createElement("button");receipt.type="button";receipt.textContent="Receipt";receipt.addEventListener("click",()=>window.DIVY_PAYMENTS?.downloadReceipt({package_id:row.package_id,amount_paise:row.amount_paise,payment_id:row.razorpay_payment_id,order_id:row.order_id,method:row.method,captured_at:row.captured_at}));item.append(receipt)}return item;}));
  memberTestEmpty.hidden = memberData.loading || memberData.sandboxTransactions.length > 0;
  memberAdmin.hidden = currentUser.app_metadata?.role !== "admin";
}

function readGuestSavedPacks() {
  try {
    const saved = JSON.parse(localStorage.getItem("divyLibrarySavedV1") || "{}");
    const allowed = new Set([...document.querySelectorAll(".pack[data-cat]")].map(card => card.dataset.cat));
    return Array.isArray(saved.packs) ? [...new Set(saved.packs.filter(id => allowed.has(id)))] : [];
  } catch { return []; }
}

async function loadMemberData(user, token) {
  memberData.loading = true;
  renderMemberData();
  try {
    const { data: currentSaved, error: savedError } = await supabase.from("user_saved_packs").select("pack_id").eq("user_id", user.id);
    if (savedError) throw savedError;
    const savedIds = new Set((currentSaved || []).map(row => row.pack_id));
    const guestIds = readGuestSavedPacks().filter(id => !savedIds.has(id));
    if (guestIds.length) {
      const { error } = await supabase.from("user_saved_packs").insert(guestIds.map(pack_id => ({ user_id: user.id, pack_id })));
      if (error) throw error;
    }
    const [savedResult, purchaseResult] = await Promise.all([
      supabase.from("user_saved_packs").select("pack_id").eq("user_id", user.id).order("saved_at", { ascending: false }),
      supabase.from("user_pack_purchases").select("id, pack_id, amount_inr, purchased_at").eq("user_id", user.id).eq("status", "paid").order("purchased_at", { ascending: false })
    ]);
    if (savedResult.error) throw savedResult.error;
    if (purchaseResult.error) throw purchaseResult.error;
    if (token !== memberLoadToken || currentUser?.id !== user.id) return;
    localStorage.removeItem("divyLibrarySavedV1");
    let sandbox = { access: [], transactions: [], orders: [] };
    try {
      const response = await fetch(`${config.url.replace(/\/$/, "")}/functions/v1/razorpay-payment-history`, { method:"POST", headers:{apikey:config.anonKey,Authorization:`Bearer ${(await supabase.auth.getSession()).data.session?.access_token||""}`,"Content-Type":"application/json"}, body:"{}" });
      if (response.ok) sandbox = await response.json();
    } catch { /* Test history stays optional until sandbox functions are deployed. */ }
    if (token !== memberLoadToken || currentUser?.id !== user.id) return;
    memberData = { userId: user.id, saved: (savedResult.data || []).map(row => row.pack_id), purchases: purchaseResult.data || [], sandboxAccess:sandbox.access||[], sandboxTransactions:(sandbox.transactions||[]).map(tx=>({...tx,order_id:(sandbox.orders||[]).find(order=>order.razorpay_order_id===tx.order_id)?.razorpay_order_id||tx.order_id,package_id:(sandbox.orders||[]).find(order=>order.razorpay_order_id===tx.order_id)?.package_id||"sandbox"})), sandboxOrders:sandbox.orders||[], loading: false, error: "" };
    window.DIVY_LIBRARY?.setAccountSavedPacks(user.id, memberData.saved);
  } catch (error) {
    if (token !== memberLoadToken || currentUser?.id !== user.id) return;
    memberData = { ...memberData, loading: false, error: "Your account is signed in, but its library data could not load. Check that the member-library database migration has been applied." };
  }
  renderMemberData();
}

window.addEventListener("divy:favorite-toggle", async event => {
  const { packId, saved } = event.detail || {};
  if (!currentUser || !packId) return;
  const query = saved
    ? supabase.from("user_saved_packs").insert({ user_id: currentUser.id, pack_id: packId })
    : supabase.from("user_saved_packs").delete().eq("user_id", currentUser.id).eq("pack_id", packId);
  const { error } = await query;
  if (error && error.code !== "23505") {
    const { data } = await supabase.from("user_saved_packs").select("pack_id").eq("user_id", currentUser.id).order("saved_at", { ascending: false });
    if (data) {
      memberData.saved = data.map(row => row.pack_id);
      window.DIVY_LIBRARY?.setAccountSavedPacks(currentUser.id, memberData.saved);
    }
    memberData.error = "A saved-pack change could not sync. Please try again when you’re back online.";
    renderMemberData();
    return;
  }
  memberData.saved = window.DIVY_LIBRARY?.getSavedPackIds() || memberData.saved;
  renderMemberData();
});

overlay.querySelector(".member-browse-saved").addEventListener("click", () => {
  close();
  document.getElementById("library")?.scrollIntoView({ behavior: "smooth" });
});

if (!configured) {
  configNote.hidden = false;
} else {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) setMessage("Could not check your session. Please try again.", true);
    syncSession(data?.session);
  });
  supabase.auth.onAuthStateChange((event, session) => {
    syncSession(session);
    if (event === "PASSWORD_RECOVERY") {
      if (overlay.hidden) open();
      setMode("recovery");
      setMessage("Enter and confirm your new password.");
    }
  });
}

window.DIVY_AUTH = {
  async getSession() {
    if (!configured) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },
  getUser() { return currentUser; },
  open,
  async refreshMemberData() {
    if (!configured || !currentUser) return;
    memberLoadToken += 1;
    memberLoadUserId = currentUser.id;
    memberLoadPromise = loadMemberData(currentUser, memberLoadToken);
    await memberLoadPromise;
  },
};

const adminOutput = overlay.querySelector(".member-admin-output");
const adminStats = overlay.querySelector(".member-admin-stats");
const adminControls = [...overlay.querySelectorAll(".member-admin-controls > *")];
async function adminCall(payload) {
  const session = await window.DIVY_AUTH.getSession();
  const response = await fetch(`${config.url.replace(/\/$/, "")}/functions/v1/razorpay-admin`, { method:"POST", headers:{apikey:config.anonKey,Authorization:`Bearer ${session?.access_token||""}`,"Content-Type":"application/json"}, body:JSON.stringify(payload) });
  const result = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(result.error || "Sandbox admin request failed.");
  return result;
}
overlay.querySelector(".member-admin-refresh").addEventListener("click",async()=>{
  const [from,to,customer,status,packageId,collectionId]=adminControls;
  adminStats.textContent="Loading test transactions…";
  try {
    const data=await adminCall({action:"dashboard",from:from.value?new Date(`${from.value}T00:00:00`).toISOString():undefined,to:to.value?new Date(`${to.value}T23:59:59`).toISOString():undefined,customer:customer.value.trim()||undefined,status:status.value||undefined,package_id:packageId.value||undefined,collection_id:collectionId.value||undefined});
    const c=data.counts||{};adminStats.textContent=`${c.total_orders||0} orders · ${c.successful||0} captured · ${c.failed||0} failed · gross test ₹${((c.gross_test_paise||0)/100).toFixed(2)} · refunds ₹${((c.refunds_paise||0)/100).toFixed(2)} · net test ₹${((c.net_test_paise||0)/100).toFixed(2)}`;
    adminOutput.replaceChildren();
    for(const order of (data.orders||[]).slice(0,100)) {
      const line=document.createElement("div");line.className="member-test-item";
      const info=document.createElement("span");info.textContent=`${new Date(order.created_at).toLocaleString()} · ${order.customer_email||order.user_id} · ${order.package_id} · ₹${(order.amount_paise/100).toFixed(2)} · ${order.status} · ${order.razorpay_order_id}`;line.append(info);
      const tx=(data.transactions||[]).find(item=>item.order_id===order.id&&item.status==="captured");
      if(tx){const refund=document.createElement("button");refund.type="button";refund.textContent="Refund test payment";refund.addEventListener("click",async()=>{const remaining=Number(tx.amount_paise)-Number(tx.amount_refunded_paise||0);if(remaining<100)return window.alert("No refundable amount remains.");const entry=window.prompt(`Enter refund amount in rupees (blank = full remaining amount, up to ₹${(remaining/100).toFixed(2)}):`);if(entry===null)return;const amount=entry.trim()?Math.round(Number(entry)*100):undefined;if(amount!==undefined&&(!Number.isFinite(amount)||amount<100||amount>remaining))return window.alert("Enter a valid amount within the remaining refundable balance.");if(!window.confirm("Submit this refund to Razorpay Test Mode?"))return;try{const result=await adminCall({action:"refund",payment_id:tx.razorpay_payment_id,amount_paise:amount});window.alert(`Test refund ${result.status}: ₹${(result.amount_paise/100).toFixed(2)}. No real money is involved.`);overlay.querySelector(".member-admin-refresh").click();await window.DIVY_AUTH.refreshMemberData()}catch(error){window.alert(error.message)}});line.append(refund)}
      adminOutput.append(line);
    }
    const webhook=document.createElement("p");webhook.textContent=`Recent webhook events: ${(data.webhook_events||[]).length}`;adminOutput.append(webhook);
  } catch(error) { adminStats.textContent=error.message; }
});
overlay.querySelector(".member-admin-reset").addEventListener("click",async()=>{
  if (!window.confirm("Reset all local Razorpay sandbox records? This removes test history and sandbox access records, but does not delete Razorpay-side test records or accounts.")) return;
  if (window.prompt('Type RESET_TEST_DATA to confirm the sandbox reset:') !== "RESET_TEST_DATA") return;
  try { await adminCall({action:"reset",confirmation:"RESET_TEST_DATA"});adminStats.textContent="Sandbox records reset. Razorpay-side records are unchanged.";adminOutput.textContent="";await window.DIVY_AUTH.refreshMemberData(); }
  catch(error) { adminStats.textContent=error.message; }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  if (!configured) {
    setMessage("Connect the Supabase project settings in auth-config.js to enable accounts.", true);
    return;
  }
  const data = new FormData(form);
  const email = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "");
  const confirm = String(data.get("confirm") || "");
  if (!email || !form.elements.email.validity.valid) return setMessage("Enter a valid email address.", true);
  if ((mode === "login" || mode === "signup") && password.length < 8) return setMessage("Use a password with at least 8 characters.", true);
  if (mode === "recovery" && (confirm.length < 8 || password !== confirm)) return setMessage(password !== confirm ? "Those passwords don’t match." : "Use at least 8 characters for your new password.", true);

  busy = true;
  submit.disabled = true;
  const oldLabel = submit.textContent;
  submit.textContent = "Please wait…";
  setMessage("");
  try {
    let result;
    if (mode === "signup") {
      result = await supabase.auth.signUp({ email, password, options: { data: { display_name: String(data.get("name") || "").trim() }, emailRedirectTo: location.href.split("#")[0] } });
      if (!result.error) setMessage(result.data.session ? "Your account is ready. You’re signed in." : "Check your email for a confirmation link to finish creating your account."); if (!result.error && !result.data.session) resend.hidden = false;
    } else if (mode === "login") {
      result = await supabase.auth.signInWithPassword({ email, password });
      if (!result.error) { setMessage("You’re signed in."); await syncSession(result.data.session); }
    } else if (mode === "forgot") {
      result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.href.split("#")[0] });
      if (!result.error) setMessage("If an account uses that email, a password reset link is on its way.");
    } else if (mode === "recovery") {
      result = await supabase.auth.updateUser({ password });
      if (!result.error) { setMessage("Password updated. You’re signed in."); await syncSession((await supabase.auth.getSession()).data.session); }
    }
    if (result?.error) setMessage(result.error.message || "That didn’t work. Please try again.", true);
  } catch {
    setMessage("We couldn’t reach the sign-in service. Check your connection and try again.", true);
  } finally {
    busy = false;
    submit.disabled = false;
    submit.textContent = oldLabel;
  }
});

const signOut = document.createElement("button");
signOut.type = "button";
signOut.className = "auth-submit";
signOut.textContent = "Log out";
signOut.hidden = true;
signOut.style.marginTop = "0";
card.append(signOut);
modeSwitch.after(signOut);
signOut.addEventListener("click", async () => {
  if (!configured) return;
  signOut.disabled = true;
  const { error } = await supabase.auth.signOut();
  signOut.disabled = false;
  if (error) setMessage("Could not log out. Please try again.", true);
  else { setMode("login"); setMessage("You’re logged out."); }
});
const originalSetMode = setMode;
setMode = function(next) {
  originalSetMode(next);
  signOut.hidden = next !== "account";
};
