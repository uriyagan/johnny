/**
 * Branded email shell — shared by the live sender AND the admin live preview.
 * Pure (no server-only / env) so it can run on the client for previews.
 */
const ACCENT = "#10b981";

export function wrapEmailShell(bodyHtml: string): string {
  return `<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
  <body style="margin:0;background:#f4f6f8;padding:24px 12px;font-family:Heebo,Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e6e9ee;border-radius:16px;overflow:hidden">
        <tr><td dir="rtl" style="padding:28px 28px 24px;color:#1f2733;font-size:15px;line-height:1.7">
          <style>
            .jb h1,.jb h2,.jb h3{color:#0f172a;margin:0 0 12px;font-weight:700;line-height:1.3}
            .jb h1{font-size:24px}.jb h2{font-size:20px}.jb h3{font-size:17px}
            .jb p{margin:0 0 14px}
            .jb a{color:${ACCENT}}
            .jb a.cta,.jb .cta{display:inline-block;background:${ACCENT};color:#ffffff !important;text-decoration:none;font-weight:700;padding:12px 26px;border-radius:10px;font-size:15px;margin:8px 0}
            .jb blockquote{background:#f3f4f6;border-inline-start:3px solid ${ACCENT};padding:14px;border-radius:8px;margin:16px 0;white-space:pre-wrap}
            .jb ul,.jb ol{margin:0 0 14px;padding-inline-start:24px}
            .jb li{margin:4px 0}
            .jb img{max-width:100%;height:auto;border-radius:8px}
          </style>
          <div class="jb">${bodyHtml}</div>
        </td></tr>
        <tr><td align="center" style="padding:16px 24px 22px;border-top:1px solid #eef1f4;color:#9aa7b4;font-size:12px">
          נשלח על ידי Johnny · ניהול קמפיינים אוטומטי
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}
