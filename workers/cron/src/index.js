/**
 * Johnny scheduler worker.
 * Cloudflare cron triggers fire `scheduled()`; we forward to the app's
 * cron HTTP endpoints with the shared secret.
 *  - every 15 min  -> budget guard (Pillar 1)
 *  - daily 09:00   -> CRM lead-quality check-ins (Pillar 5)
 */
export default {
  async scheduled(event, env, ctx) {
    const path =
      event.cron === "0 9 * * *"
        ? "/api/cron/crm-checkin"
        : "/api/cron/budget-guard";

    ctx.waitUntil(
      fetch(`${env.APP_URL}${path}`, {
        method: "POST",
        headers: { "x-cron-secret": env.CRON_SECRET },
      }),
    );
  },
};
