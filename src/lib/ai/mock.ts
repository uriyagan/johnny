import { serverEnv } from "@/lib/env";
import type { AIProvider } from "./provider";
import type {
  AIChatResult,
  AssetAnalysis,
  CampaignPlanResult,
  ChatMessageInput,
  FeedbackAnalysis,
  GeneratedCopy,
  GeneratedImage,
  IntentAction,
  ParsedIntent,
  RejectionExplanation,
} from "./types";

// 1x1 transparent PNG.
const PLACEHOLDER_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

/** Hebrew keyword heuristics → intent. Mirrors the live model's output shape. */
const RULES: { action: IntentAction; keywords: string[] }[] = [
  { action: "run_diagnostic", keywords: ["לא עובד", "תקוע", "בעיה", "לא רץ"] },
  { action: "get_spend", keywords: ["כמה", "הוצאתי", "עלות", "כסף", "תקציב נוצל"] },
  { action: "change_budget", keywords: ["תקציב", "להעלות", "להוריד", "פחות", "יותר כסף"] },
  { action: "adjust_targeting", keywords: ["מי רואה", "קהל", "מתאים", "לקוחות", "סקרנים"] },
  { action: "pause_campaign", keywords: ["לעצור", "עצור", "להפסיק", "תפסיק"] },
  { action: "resume_campaign", keywords: ["להפעיל", "תפעיל", "להמשיך", "תחזיר"] },
];

const REPLIES: Record<IntentAction, string> = {
  run_diagnostic:
    "אני בודק עכשיו את הקמפיין שלך כדי לראות מה קורה. תכף אחזור עם תשובה ברורה 🙂",
  get_spend: "רגע אחד, אני בודק כמה הוצאת עד עכשיו ומראה לך בדיוק.",
  adjust_targeting:
    "הבנתי — נדאג שהמודעות יגיעו לאנשים הנכונים יותר. אני מעדכן את זה.",
  change_budget: "אין בעיה, אני מעדכן את התקציב בשבילך כרגע.",
  pause_campaign: "סבבה, אני עוצר את הקמפיין. תוכל להפעיל אותו שוב מתי שתרצה.",
  resume_campaign: "מעולה, אני מפעיל את הקמפיין שוב 👍",
  general_help: "אני כאן בשבילך! ספר לי במילים שלך מה תרצה לעשות.",
  unknown: "לא בטוח שהבנתי לגמרי — אפשר להסביר לי שוב במילים פשוטות?",
};

export class MockAIProvider implements AIProvider {
  readonly models: { text: string; image: string };

  constructor() {
    const env = serverEnv();
    this.models = { text: env.GEMINI_TEXT_MODEL, image: env.GEMINI_IMAGE_MODEL };
  }

  async chat(messages: ChatMessageInput[]): Promise<AIChatResult> {
    await delay();
    const last = [...messages].reverse().find((m) => m.role === "user");
    const text = last?.content ?? "";
    const intent = this.parse(text);
    return { reply: REPLIES[intent.action], intent };
  }

  async analyzeAsset(input: {
    filename: string;
    mimeType: string;
  }): Promise<AssetAnalysis> {
    await delay();
    return {
      attributes: ["תאורה טבעית", "צבעים חמים", "מוצר במרכז התמונה"],
      suggestions: [
        "כדאי להוסיף טקסט קצר עם הצעת ערך",
        "אפשר לחתוך את התמונה לפורמט מרובע שמתאים לפיד",
      ],
    };
  }

  async generateCopy(input: {
    product: string;
    tone?: string;
  }): Promise<GeneratedCopy> {
    await delay();
    const p = input.product || "המוצר שלך";
    return {
      variants: [
        `${p} שכולם מדברים עליו — הזמינו עכשיו וקבלו משלוח מהיר! 🌟`,
        `רוצים את ${p}? הגיע הזמן לפנק את עצמכם. לחצו ותגלו.`,
        `${p} במחיר שלא תמצאו במקום אחר. כמות מוגבלת!`,
      ],
    };
  }

  async explainRejection(reason: string): Promise<RejectionExplanation> {
    await delay();
    const r = reason.toLowerCase();

    let reasonHe =
      "המודעה נדחתה. בדרך כלל מספיק לשנות מעט את הטקסט או את התמונה ולשלוח שוב.";
    if (r.includes("sensitive") || r.includes("social issues")) {
      reasonHe =
        "המודעה נדחתה כי היא נוגעת בנושא רגיש (למשל פוליטיקה או חברה). צריך לנסח אותה מחדש בלי התייחסות לנושא הרגיש.";
    } else if (r.includes("personal attributes")) {
      reasonHe =
        "המודעה נדחתה כי הטקסט מתייחס באופן אישי לגולש (למשל גיל או מצב אישי). כדאי לנסח בצורה כללית יותר.";
    } else if (r.includes("misleading") || r.includes("exaggerat")) {
      reasonHe =
        "המודעה נדחתה כי ההבטחה נשמעת מוגזמת. כדאי לרכך את הניסוח ולהיות מדויקים יותר.";
    }

    return {
      reasonHe,
      safeCopy: [
        "פרחים טריים לכל אירוע — משלוח מהיר עד הבית 🌸",
        "רוצים לשמח מישהו? אצלנו תמצאו זר מושלם לכל הזדמנות.",
      ],
    };
  }

  async analyzeFeedback(text: string): Promise<FeedbackAnalysis> {
    await delay();
    const poor = [
      "סקרנים",
      "בלי כסף",
      "לא רציני",
      "לא קונים",
      "מבזבזים",
      "זבל",
      "לא איכותי",
    ].some((k) => text.includes(k));
    const good = [
      "מעולים",
      "קונים",
      "סגרתי",
      "רכשו",
      "איכותי",
      "טובים",
      "מצוין",
    ].some((k) => text.includes(k));

    if (poor) {
      return {
        summary:
          "הלידים פחות איכותיים — מגיעים אנשים בלי כוונת קנייה אמיתית.",
        leadQuality: "poor",
        adjustments: [
          "נמקד את הקהל באנשים עם כוונת קנייה גבוהה יותר",
          "נחדד את הטקסט כדי לסנן פניות לא רלוונטיות",
        ],
      };
    }
    if (good) {
      return {
        summary: "הלידים איכותיים! נמשיך באותו כיוון ונרחיב בזהירות.",
        leadQuality: "good",
        adjustments: ["נגדיל מעט את התקציב לקהל שעובד טוב"],
      };
    }
    return {
      summary: "הלידים בסדר, אבל יש מקום לשיפור קטן באיכות הפניות.",
      leadQuality: "mixed",
      adjustments: ["ננסה לחדד את ההגדרות כדי לשפר את איכות הפניות"],
    };
  }

  async planCampaign(input: {
    brief: string;
    answers?: string;
    brandContext?: string;
  }): Promise<CampaignPlanResult> {
    await delay();
    const text = `${input.brief} ${input.answers ?? ""}`;
    if (text.trim().length < 8) {
      return {
        ready: false,
        questions: ["מה תרצה לפרסם, מה התקציב היומי, ולאן להפנות את הגולשים?"],
      };
    }
    return {
      ready: true,
      questions: [],
      draft: {
        name: "קמפיין חדש",
        objective: "OUTCOME_SALES",
        productDescription: input.brief.slice(0, 120),
        audience: { countries: ["IL"], ageMin: 18, ageMax: 65, interests: "כללי" },
        dailyBudgetIls: 50,
        headline: "המוצר החדש שלנו כבר כאן",
        primaryText: "גלו את הקולקציה החדשה — משלוח מהיר עד הבית 🌟",
        description: "הזמינו עכשיו",
        callToAction: "SHOP_NOW",
        imagePrompt: "clean product photo, soft daylight, minimal background",
      },
    };
  }

  async generateImage(): Promise<GeneratedImage> {
    await delay();
    return { base64: PLACEHOLDER_PNG, mimeType: "image/png" };
  }

  private parse(text: string): ParsedIntent {
    for (const rule of RULES) {
      if (rule.keywords.some((k) => text.includes(k))) {
        return { action: rule.action, parameters: {}, confidence: 0.8 };
      }
    }
    if (text.trim().length > 0) {
      return { action: "general_help", parameters: {}, confidence: 0.4 };
    }
    return { action: "unknown", parameters: {}, confidence: 0.2 };
  }
}
