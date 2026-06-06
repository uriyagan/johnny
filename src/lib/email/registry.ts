export interface MergeTag {
  key: string;
  sample: string;
}

export interface EmailTrigger {
  key: string;
  name: string;
  description: string;
  mergeTags: MergeTag[];
  defaultSubject: string;
  defaultBodyHtml: string;
}

/** Tags available to every template. */
const COMMON: MergeTag[] = [
  { key: "user.first_name", sample: "דנה" },
  { key: "business.name", sample: "חנות הפרחים של דנה" },
  { key: "system.app_name", sample: "Johnny" },
];

export const EMAIL_TRIGGERS: EmailTrigger[] = [
  {
    key: "welcome",
    name: "ברוך הבא",
    description: "נשלח מיד אחרי הרשמה.",
    mergeTags: [...COMMON],
    defaultSubject: "ברוכים הבאים ל‑{{system.app_name}} 🎉",
    defaultBodyHtml:
      "<p>שלום {{user.first_name}},</p><p>שמחים שהצטרפת! אני ג׳וני, ואעזור לך לנהל את הפרסום של {{business.name}} בקלות.</p><p>מתחילים?</p>",
  },
  {
    key: "budget_warning",
    name: "התראת תקציב",
    description: "כשמתקרבים לתקרת התקציב החודשית.",
    mergeTags: [...COMMON, { key: "budget.spent", sample: "₪900" }, { key: "budget.cap", sample: "₪1,000" }],
    defaultSubject: "מתקרבים לתקרת התקציב",
    defaultBodyHtml:
      "<p>שלום {{user.first_name}},</p><p>ניצלת {{budget.spent}} מתוך {{budget.cap}} החודש. שווה לשים לב 🙂</p>",
  },
  {
    key: "budget_paused",
    name: "השהיית קמפיינים",
    description: "כשהגעת לתקרה והקמפיינים הושהו.",
    mergeTags: [...COMMON, { key: "budget.cap", sample: "₪1,000" }],
    defaultSubject: "השהינו את הקמפיינים שלך",
    defaultBodyHtml:
      "<p>שלום {{user.first_name}},</p><p>הגעת לתקרת התקציב ({{budget.cap}}), אז השהינו את הקמפיינים כדי להגן עליך מהוצאה מיותרת.</p>",
  },
  {
    key: "policy_rejected",
    name: "מודעה נדחתה",
    description: "כשמודעה נדחתה ע״י Meta.",
    mergeTags: [...COMMON, { key: "campaign.name", sample: "מבצע קיץ" }, { key: "rejection.reason", sample: "תוכן רגיש" }],
    defaultSubject: "מודעה נדחתה — ויש פתרון",
    defaultBodyHtml:
      "<p>שלום {{user.first_name}},</p><p>המודעה בקמפיין \"{{campaign.name}}\" נדחתה. הסיבה: {{rejection.reason}}. הכנו לך נוסח חלופי — היכנס לראות.</p>",
  },
  {
    key: "ticket_answered",
    name: "תשובה לפנייה",
    description: "כשנציג עונה לטיקט שלך.",
    mergeTags: [...COMMON, { key: "ticket.subject", sample: "שאלה על חיוב" }],
    defaultSubject: "ענינו לפנייה שלך: {{ticket.subject}}",
    defaultBodyHtml:
      "<p>שלום {{user.first_name}},</p><p>ענינו לפנייה שלך \"{{ticket.subject}}\". היכנס לאפליקציה כדי לראות את התשובה.</p>",
  },
  {
    key: "crm_checkin",
    name: "בדיקת איכות לידים",
    description: "תזכורת תקופתית לשתף משוב.",
    mergeTags: [...COMMON],
    defaultSubject: "איך הלידים שלך לאחרונה?",
    defaultBodyHtml:
      "<p>שלום {{user.first_name}},</p><p>אשמח לשמוע איך הפניות האחרונות — כך אוכל לכוונן את הקמפיינים שיביאו לך לקוחות טובים יותר.</p>",
  },
];

export function getTrigger(key: string): EmailTrigger | undefined {
  return EMAIL_TRIGGERS.find((t) => t.key === key);
}

/** Sample context for previews / test sends. */
export function sampleContext(trigger: EmailTrigger): Record<string, string> {
  return Object.fromEntries(trigger.mergeTags.map((t) => [t.key, t.sample]));
}
