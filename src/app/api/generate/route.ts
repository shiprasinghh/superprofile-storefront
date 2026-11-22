import { NextResponse } from "next/server";
import {
  generateStorefront,
  regenerateBio,
  regenerateProduct,
} from "@/lib/llm";
import { StorefrontSchema, type Tone } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

type Body = {
  mode?: "full" | "bio" | "product";
  description?: string;
  handle?: string;
  tone?: Tone;
  current?: unknown;
  index?: number;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  const mode = body.mode ?? "full";
  const tone = body.tone;

  try {
    if (mode === "full") {
      const description = (body.description ?? "").trim();
      const handle = (body.handle ?? "").trim();
      if (!description && !handle) {
        return json(
          { ok: false, error: "Tell us a little about what you do." },
          400,
        );
      }
      const storefront = await generateStorefront({ description, handle, tone });
      return json({ ok: true, storefront });
    }

    // Partial regeneration needs the current storefront as context.
    const parsed = StorefrontSchema.safeParse(body.current);
    if (!parsed.success) {
      return json({ ok: false, error: "Missing current storefront." }, 400);
    }

    if (mode === "bio") {
      const bio = await regenerateBio(parsed.data, tone);
      return json({ ok: true, bio });
    }

    if (mode === "product") {
      const index = Number(body.index);
      if (!Number.isInteger(index) || index < 0 || index >= parsed.data.products.length) {
        return json({ ok: false, error: "Invalid product." }, 400);
      }
      const product = await regenerateProduct(parsed.data, index, tone);
      return json({ ok: true, product });
    }

    return json({ ok: false, error: "Unknown mode." }, 400);
  } catch (err) {
    const message =
      err instanceof Error && /GEMINI_API_KEY/.test(err.message)
        ? "The AI isn't configured yet (missing API key)."
        : "The AI is busy right now. Please try again in a moment.";
    // Logged server-side only; the creator sees a friendly message.
    console.error("[generate] ", err);
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
