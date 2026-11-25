import { createClient, type User } from "npm:@supabase/supabase-js@2";

export const PACKAGES = {
  history:{title:"History & Indian Heritage",amount:1900,currency:"INR",collections:["history"]},
  mind:{title:"Psychology & Self-Mastery",amount:1700,currency:"INR",collections:["mind"]},
  money:{title:"Money & Business",amount:1900,currency:"INR",collections:["money"]},
  marketing:{title:"Marketing & Digital Growth",amount:1900,currency:"INR",collections:["marketing"]},
  spirituality:{title:"Spiritual Wisdom",amount:1500,currency:"INR",collections:["spirituality"]},
  wellness:{title:"Holistic Health",amount:1500,currency:"INR",collections:["wellness"]},
  hindi:{title:"Hindi Reading Vault",amount:1500,currency:"INR",collections:["hindi"]},
  english:{title:"English Reading Room",amount:1500,currency:"INR",collections:["english"]},
  food:{title:"Recipe & Food Library",amount:1200,currency:"INR",collections:["food"]},
  kids:{title:"Kids Learning & Creativity",amount:1200,currency:"INR",collections:["kids"]},
  relationships:{title:"Relationships & Human Nature",amount:1200,currency:"INR",collections:["relationships"]},
  career:{title:"Career & Curiosity",amount:1500,currency:"INR",collections:["career"]},
  complete_library:{title:"Complete Library – 12 Collections",amount:7900,currency:"INR",collections:["history","mind","money","marketing","spirituality","wellness","hindi","english","food","kids","relationships","career"]},
} as const;

export type PackageId = keyof typeof PACKAGES;
export const COLLECTION_IDS = PACKAGES.complete_library.collections;

// Google Drive folder IDs are kept server-side. The payment-history function
// only returns a matching folder link for collections granted to that user.
export const DRIVE_FOLDER_IDS: Record<string, string> = {
  history: "1KmZM01oldJGqhC8UjM2-aizMRyi9vQI9",
  mind: "1GSlpDY4YOkP_hd31O-DaKwSKH_rAUuKv",
  money: "1d1xtyHNHhHvdAx83ktYbXF6ikL_atI_j",
  marketing: "1FSYRwpLEJQsBMVSnIb2snK4BVeq8H8Pt",
  spirituality: "1KftXNfSkraSZd04C7-S6EW5TBsSiRR_2",
  wellness: "1hQA5ztfaJM-noJw9By9luoBqF5luywQo",
  hindi: "1wnkkwvG7w7gqJGayzWO_kvvf8rca7zjs",
  english: "13yT6b-iqCEgkFG-vSfsA8gNvpcmXVrK8",
  food: "12y-Jg0OIe3qcB_c4WFlSilhbBCTc5Ytl",
  kids: "17jmBPteGU6VvWD3tw4MS-1DYhU-ngQ5r",
  relationships: "1kToh1IOh1Fn_ejaxhiEO-EU66sKgC3W3",
  career: "1Re6gF0VMf4uGikd6Za4G-9TPMZwPCuRg",
};

const LOCAL_ORIGINS = new Set([
  "http://localhost", "http://localhost:80", "http://127.0.0.1", "http://127.0.0.1:80",
  "https://divylibrary.in", "https://www.divylibrary.in",
]);

export function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin") || "";
  const configured = (Deno.env.get("PAYMENT_ALLOWED_ORIGINS") || "").split(",").map(v => v.trim()).filter(Boolean);
  const allowed = configured.length ? configured.includes(origin) : LOCAL_ORIGINS.has(origin);
  return {
    ...(allowed ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : {}),
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(req) });
}

export function options(req: Request): Response | null {
  // Fetch forbids a response body on 204; use null so browser preflight never throws.
  return req.method === "OPTIONS" ? new Response(null, { status: 204, headers: corsHeaders(req) }) : null;
}

export function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Payment backend is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function requireUser(req: Request): Promise<{ user: User; error?: string }> {
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return { user: null as unknown as User, error: "Sign in to continue." };
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return { user: null as unknown as User, error: "Payment backend is not configured." };
  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: auth } } });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { user: null as unknown as User, error: "Your sign-in expired. Please log in again." };
  return { user: data.user };
}

export function getTestCredentials() {
  if ((Deno.env.get("PAYMENT_MODE") || "test").toLowerCase() !== "test" || Deno.env.get("ENABLE_LIVE_PAYMENTS") === "true") {
    throw new Error("Only Razorpay Test Mode is enabled in this build.");
  }
  const keyId = Deno.env.get("RAZORPAY_TEST_KEY_ID") || "";
  const keySecret = Deno.env.get("RAZORPAY_TEST_KEY_SECRET") || "";
  if (!keyId || !keySecret) throw new Error("Razorpay Test Mode keys are missing. Configure the Supabase Edge Function secrets.");
  if (!keyId.startsWith("rzp_test_")) throw new Error("Sandbox mode rejects non-test Razorpay key IDs.");
  return { keyId, keySecret };
}

export function getWebhookSecret() {
  const secret = Deno.env.get("RAZORPAY_TEST_WEBHOOK_SECRET") || "";
  if (!secret) throw new Error("Razorpay Test Mode webhook secret is missing.");
  return secret;
}

export async function hmacHex(secret: string, message: string | Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const data = typeof message === "string" ? new TextEncoder().encode(message) : message;
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
  return [...signature].map(v => v.toString(16).padStart(2,"0")).join("");
}

export function safeEqualHex(a: string, b: string): boolean {
  if (!/^[a-f0-9]+$/i.test(a) || !/^[a-f0-9]+$/i.test(b) || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function razorpayRequest(path: string, init: RequestInit = {}) {
  const { keyId, keySecret } = getTestCredentials();
  const auth = btoa(`${keyId}:${keySecret}`);
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Basic ${auth}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`https://api.razorpay.com/v1${path}`, { ...init, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const description = data?.error?.description || "Razorpay Test Mode request failed.";
    throw new Error(String(description).slice(0,300));
  }
  return data;
}

export function isPackageId(value: unknown): value is PackageId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(PACKAGES, value);
}

export function sanitizedError(error: unknown): string {
  return error instanceof Error ? error.message.slice(0,300) : "Payment operation failed.";
}

export function isAdmin(user: User): boolean {
  return user.app_metadata?.role === "admin" || (Array.isArray(user.app_metadata?.roles) && user.app_metadata.roles.includes("admin"));
}
