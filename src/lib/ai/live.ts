import { serverEnv } from "@/lib/env";
import { SYSTEM_PROMPT_HE } from "./prompt";
import type { AIProvider } from "./provider";
import type {
  AIChatResult,
  AssetAnalysis,
  ChatMessageInput,
  FeedbackAnalysis,
  GeneratedCopy,
  IntentAction,
  LeadQuality,
  RejectionExplanation,
} from "./types";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

type GeminiContent = { role: "user" | "model"; parts: { text: string }[] };

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

function parseJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        /* fall through */
      }
    }
    return fallback;
  }
}

/** Live Gemini provider — calls the Generative Language REST API (JSON mode). */
export class LiveAIProvider implements AIProvider {
  readonly models: { text: string; image: string };

  constructor() {
    const env = serverEnv();
    this.models = { text: env.GEMINI_TEXT_MODEL, image: env.GEMINI_IMAGE_MODEL };
  }

  private async generate(
    system: string,
    contents: GeminiContent[],
    temperature = 0.7,
  ): Promise<string> {
    const { GEMINI_API_KEY } = serverEnv();
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");

    const res = await fetch(
      `${ENDPOINT}/${this.models.text}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: {
            responseMimeType: "application/json",
            temperature,
          },
        }),
      },
    );

    if (!res.ok) {
      throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p: { text?: string }) => p.text ?? "").join("");
  }

  async chat(messages: ChatMessageInput[]): Promise<AIChatResult> {
    const system =
      SYSTEM_PROMPT_HE +
      '\n\nהחזר אך ורק JSON במבנה: {"reply": string (תשובה רגועה בעברית), ' +
      '"action": one of ["run_diagnostic","get_spend","adjust_targeting",' +
      '"change_budget","pause_campaign","resume_campaign","general_help","unknown"], ' +
      '"parameters": object, "confidence": number between 0 and 1}.';

    const contents: GeminiContent[] = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    if (contents.length === 0) {
      contents.push({ role: "user", parts: [{ text: "שלום" }] });
    }

    const text = await this.generate(system, contents);
    const parsed = parseJson(text, {
      reply: "מצטער, לא הצלחתי להבין. אפשר לנסות שוב במילים אחרות?",
      action: "unknown" as IntentAction,
      parameters: {} as Record<string, string | number>,
      confidence: 0,
    });

    const allowed: IntentAction[] = [
      "run_diagnostic",
      "get_spend",
      "adjust_targeting",
      "change_budget",
      "pause_campaign",
      "resume_campaign",
      "general_help",
      "unknown",
    ];
    const action = allowed.includes(parsed.action as IntentAction)
      ? (parsed.action as IntentAction)
      : "general_help";

    return {
      reply: String(parsed.reply ?? ""),
      intent: {
        action,
        parameters: parsed.parameters ?? {},
        confidence: Number(parsed.confidence ?? 0.5),
      },
    };
  }

  async analyzeAsset(input: {
    filename: string;
    mimeType: string;
  }): Promise<AssetAnalysis> {
    const user =
      `קובץ מדיה בשם "${input.filename}" מסוג ${input.mimeType} שמיועד למודעה. ` +
      'החזר JSON בלבד: {"attributes": string[] (3-5 מאפיינים ויזואליים משוערים בעברית), ' +
      '"suggestions": string[] (2-3 הצעות לשיפור בעברית)}.';
    const text = await this.generate(
      "אתה מומחה ליצירת מודעות ויזואליות. החזר JSON בלבד.",
      [{ role: "user", parts: [{ text: user }] }],
    );
    const p = parseJson(text, { attributes: [], suggestions: [] });
    return {
      attributes: asStringArray(p.attributes),
      suggestions: asStringArray(p.suggestions),
    };
  }

  async generateCopy(input: {
    product: string;
    tone?: string;
  }): Promise<GeneratedCopy> {
    const user =
      `כתוב 3 וריאציות של טקסט שיווקי קצר וממיר בעברית עבור: "${input.product}".` +
      (input.tone ? ` סגנון: ${input.tone}.` : "") +
      ' החזר JSON בלבד: {"variants": string[]}.';
    const text = await this.generate(
      "אתה קופירייטר מומחה לעברית שיווקית. החזר JSON בלבד.",
      [{ role: "user", parts: [{ text: user }] }],
    );
    const p = parseJson(text, { variants: [] });
    return { variants: asStringArray(p.variants) };
  }

  async explainRejection(reason: string): Promise<RejectionExplanation> {
    const user =
      `מודעת פייסבוק נדחתה מהסיבה הבאה (באנגלית): "${reason}". ` +
      "הסבר בעברית פשוטה לבעל עסק לא טכני למה זה קרה, והצע נוסחים חלופיים בטוחים. " +
      'החזר JSON בלבד: {"reasonHe": string, "safeCopy": string[]}.';
    const text = await this.generate(
      "אתה מומחה למדיניות פרסום של Meta. החזר JSON בלבד.",
      [{ role: "user", parts: [{ text: user }] }],
    );
    const p = parseJson(text, {
      reasonHe: "המודעה נדחתה. כדאי לשנות מעט את הנוסח ולשלוח שוב.",
      safeCopy: [],
    });
    return {
      reasonHe: String(p.reasonHe ?? ""),
      safeCopy: asStringArray(p.safeCopy),
    };
  }

  async analyzeFeedback(text: string): Promise<FeedbackAnalysis> {
    const user =
      `בעל עסק תיאר את איכות הלידים שקיבל: "${text}". ` +
      'נתח את איכות הלידים והמלץ על התאמות מיקוד. החזר JSON בלבד: ' +
      '{"summary": string (עברית), "leadQuality": "good"|"mixed"|"poor", ' +
      '"adjustments": string[] (התאמות מיקוד בעברית)}.';
    const out = await this.generate(
      "אתה מנהל קמפיינים מומחה. החזר JSON בלבד.",
      [{ role: "user", parts: [{ text: user }] }],
    );
    const p = parseJson(out, {
      summary: "",
      leadQuality: "mixed" as LeadQuality,
      adjustments: [],
    });
    const lq: LeadQuality = (["good", "mixed", "poor"] as LeadQuality[]).includes(
      p.leadQuality as LeadQuality,
    )
      ? (p.leadQuality as LeadQuality)
      : "mixed";
    return {
      summary: String(p.summary ?? ""),
      leadQuality: lq,
      adjustments: asStringArray(p.adjustments),
    };
  }
}
