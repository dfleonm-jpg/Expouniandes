import { generateJSON } from "@/lib/ai";
import { examAnalysisPrompt, EXAM_ANALYSIS_SHAPE } from "@/lib/prompts";
import { json, readJson, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";
import type { ExamAnalysis } from "@/lib/types";

export const maxDuration = 60;

type Rec = { topic: string; score: number; total: number; date: string };

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "exam-analysis" });

    const { records, locale } = await readJson<{ records?: unknown; locale?: string }>(req);

    // Sanea y acota el historial recibido (máx. 50 registros).
    const safe: Rec[] = Array.isArray(records)
      ? records
          .filter((r) => r && typeof r === "object")
          .slice(0, 50)
          .map((r) => {
            const x = r as Record<string, unknown>;
            return {
              topic: typeof x.topic === "string" ? x.topic.slice(0, 120) : "—",
              score: Number(x.score) || 0,
              total: Number(x.total) || 0,
              date: typeof x.date === "string" ? x.date.slice(0, 10) : "",
            };
          })
      : [];

    if (safe.length < 2) {
      return json({ error: "Haz al menos 2 parciales para analizar tus patrones." }, 400, rl);
    }

    const data = await generateJSON<ExamAnalysis>(examAnalysisPrompt(safe, locale), EXAM_ANALYSIS_SHAPE);
    return json(data, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "ExamAnalysis", rl);
  }
}
