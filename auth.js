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
body.auth-open{overflow:hidden}
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
const modeSwitch = overlay.querySelector(".auth-mode-switch");
const userEmail = overlay.querySelector(".auth-user-email");
const configNote = overlay.querySelector(".auth-config-note");
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
  nameField.hidden = !signup;
  passwordField.hidden = loggedIn || next === "forgot";
  confirmField.hidden = !recovery;
  forgotButton.hidden = signup || recovery || next === "forgot";
  modeSwitch.hidden = recovery || next === "forgot" || loggedIn;
  configNote.hidden = configured;
  title.textContent = loggedIn ? "Your account" : recovery ? "Choose a new password" : next === "forgot" ? "Reset your password" : signup ? "Create your account" : "Welcome back";
  intro.textContent = loggedIn ? "You’re signed in to Divy Library." : recovery ? "Choose a new password for your account." : next === "forgot" ? "We’ll email you a secure password reset link." : signup ? "Save your reading shelves and pick up where you left off." : "Log in to your Divy Library account.";
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
  if (currentUser) userEmail.textContent = currentUser.email || "Signed in";
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
  currentUser = session?.user || null;
  trigger.textContent = currentUser ? "Account" : "Log in";
  trigger.setAttribute("aria-label", currentUser ? `Account for ${currentUser.email || "signed-in user"}` : "Log in or create an account");
  if (currentUser && !overlay.hidden) {
    setMode("account");
    userEmail.textContent = currentUser.email || "Signed in";
  } else if (!currentUser && mode === "account") setMode("login");
}

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
      if (!result.error) setMessage(result.data.session ? "Your account is ready. You’re signed in." : "Check your email for a confirmation link to finish creating your account.");
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
