import "server-only";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTrigger } from "./registry";
import { wrapEmailShell } from "./shell";

/** Replaces {{tag}} with HTML-escaped context values (missing → empty). */
export function renderTemplate(
  template: string,
  ctx: Record<string, string>,
): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => {
    const v = ctx[key];
    if (v === undefined) return "";
    return v
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  });
}

const shell = wrapEmailShell;

/** Loads the effective template for a trigger (DB override or registry default). */
async function loadTemplate(triggerKey: string) {
  const trigger = getTrigger(triggerKey);
  if (!trigger) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("email_automations")
    .select("enabled, subject, body_html")
    .eq("trigger_key", triggerKey)
    .maybeSingle();
  return {
    enabled: data?.enabled ?? true,
    subject: data?.subject ?? trigger.defaultSubject,
    bodyHtml: data?.body_html ?? trigger.defaultBodyHtml,
  };
}

async function logSend(
  triggerKey: string,
  recipient: string,
  status: string,
  error?: string,
) {
  try {
    const admin = createAdminClient();
    await admin
      .from("email_send_log")
      .insert({ trigger_key: triggerKey, recipient, status, error: error ?? null });
  } catch {
    /* ignore */
  }
}

/** Low-level send via Resend. */
async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { RESEND_API_KEY, EMAIL_FROM } = serverEnv();
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY not set" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });
  if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${await res.text()}` };
  return { ok: true };
}

/** Sends an automation email (respects the enabled flag). */
export async function sendAutomation(
  triggerKey: string,
  to: string,
  ctx: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  const tpl = await loadTemplate(triggerKey);
  if (!tpl) return { ok: false, error: "unknown trigger" };
  if (!tpl.enabled) return { ok: false, error: "disabled" };

  const subject = renderTemplate(tpl.subject, ctx);
  const html = shell(renderTemplate(tpl.bodyHtml, ctx));
  const res = await sendEmail({ to, subject, html });
  await logSend(triggerKey, to, res.ok ? "sent" : "failed", res.error);
  return res;
}

/** Sends a test email using the registry sample context. */
export async function sendTest(
  triggerKey: string,
  to: string,
): Promise<{ ok: boolean; error?: string }> {
  const trigger = getTrigger(triggerKey);
  const tpl = await loadTemplate(triggerKey);
  if (!trigger || !tpl) return { ok: false, error: "unknown trigger" };

  const { sampleContext } = await import("./registry");
  const ctx = sampleContext(trigger);
  const subject = `[בדיקה] ${renderTemplate(tpl.subject, ctx)}`;
  const html = shell(renderTemplate(tpl.bodyHtml, ctx));
  const res = await sendEmail({ to, subject, html });
  await logSend(triggerKey, to, res.ok ? "test" : "failed", res.error);
  return res;
}
