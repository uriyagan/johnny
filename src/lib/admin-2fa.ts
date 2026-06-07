import "server-only";
import { createHash, createHmac, randomInt, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { wrapEmailShell } from "@/lib/email/shell";

const COOKIE = "admin_2fa";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h
const CODE_TTL_MS = 10 * 60 * 1000; // 10m

function signingKey(): string {
  const env = serverEnv();
  return env.META_TOKEN_ENC_KEY || env.CRON_SECRET || "johnny-2fa-fallback";
}

function sign(userId: string, exp: number): string {
  return createHmac("sha256", signingKey())
    .update(`${userId}.${exp}`)
    .digest("hex");
}

/** Issues a signed admin-2FA session cookie (12h). */
export function setAdmin2FACookie(userId: string): void {
  const exp = Date.now() + SESSION_TTL_MS;
  const value = `${exp}.${sign(userId, exp)}`;
  cookies().set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

/** True if the current cookie proves a valid 2FA session for this user. */
export function hasValidAdmin2FA(userId: string): boolean {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return false;
  const [expStr, sig] = raw.split(".");
  const exp = Number(expStr);
  if (!exp || exp < Date.now() || !sig) return false;
  const expected = sign(userId, exp);
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

const hashCode = (code: string) => createHash("sha256").update(code).digest("hex");

/** Whether an unexpired code already exists for the user. */
export async function hasPendingCode(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_2fa_codes")
    .select("expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data && new Date(data.expires_at).getTime() > Date.now();
}

/** Generates + emails a fresh 6-digit code (10-min expiry). */
export async function sendAdmin2FACode(
  userId: string,
  email: string,
): Promise<void> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const admin = createAdminClient();
  await admin.from("admin_2fa_codes").upsert({
    user_id: userId,
    code_hash: hashCode(code),
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });

  const { RESEND_API_KEY, EMAIL_FROM } = serverEnv();
  if (!RESEND_API_KEY) return;
  const html = wrapEmailShell(
    `<h2>קוד כניסה לאזור הניהול</h2><p>הקוד שלך:</p>` +
      `<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>` +
      `<p>הקוד תקף ל‑10 דקות. אם לא ביקשת קוד, התעלם מהמייל.</p>`,
  );
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: email,
      subject: "קוד כניסה לאזור הניהול של Johnny",
      html,
    }),
  });
}

/** Verifies a submitted code; on success clears it and sets the session cookie. */
export async function verifyAdmin2FACode(
  userId: string,
  code: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_2fa_codes")
    .select("code_hash, expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return false;
  if (new Date(data.expires_at).getTime() < Date.now()) return false;
  if (data.code_hash !== hashCode(code.trim())) return false;

  await admin.from("admin_2fa_codes").delete().eq("user_id", userId);
  setAdmin2FACookie(userId);
  return true;
}
