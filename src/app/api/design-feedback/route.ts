import { generateJSONWithImage } from "@/lib/ai";
import { designFeedbackPrompt, DESIGN_FEEDBACK_SHAPE } from "@/lib/prompts";
import { json, readJson, clampText, enforceRateLimit, handleApiErrorWithHeaders, ApiError } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";
import type { DesignFeedback } from "@/lib/types";

export const maxDuration = 60;

// Un PNG del lienzo puede pesar bastante en base64; permitimos ~8 MB de body.
const MAX_BODY = 8_000_000;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "design-feedback" });

    const { image, brief, intent, discipline, locale } = await readJson<{
      image?: string;
      brief?: string;
      intent?: string;
      discipline?: string;
      locale?: string;
    }>(req, MAX_BODY);

    if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
      throw new ApiError("Dibuja algo en el lienzo antes de pedir retroalimentación.", 400);
    }

    const data = await generateJSONWithImage<DesignFeedback>(
      designFeedbackPrompt({
        brief: clampText(brief, 600),
        intent: clampText(intent, 1000),
        discipline: clampText(discipline, 60),
        locale,
      }),
      DESIGN_FEEDBACK_SHAPE,
      { dataUrl: image }
    );
    return json(data, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "DesignFeedback", rl);
  }
}
