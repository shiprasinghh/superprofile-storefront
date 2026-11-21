import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/llm";

export const runtime = "nodejs";

// ~3.5 MB of base64 is roughly 80s of 16 kHz mono WAV; the client caps at 45s.
const MAX_BASE64_LENGTH = 3_500_000;
const ALLOWED_MIME = /^audio\/(wav|x-wav|webm|mp4|mpeg|ogg|aac|flac)/;

function json(data: object, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: Request) {
  let body: { audio?: unknown; mimeType?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "No audio received." }, 400);
  }

  const audio = typeof body.audio === "string" ? body.audio : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";

  if (!audio || !ALLOWED_MIME.test(mimeType)) {
    return json({ ok: false, error: "No audio received. Please try again." }, 400);
  }
  if (audio.length > MAX_BASE64_LENGTH) {
    return json({ ok: false, error: "That recording is too long. Keep it under 45 seconds." }, 413);
  }

  try {
    const text = await transcribeAudio(audio, mimeType);
    if (!text) {
      return json(
        { ok: false, error: "We couldn't catch any words. Try again a little closer to the mic." },
        422,
      );
    }
    return json({ ok: true, text });
  } catch (err) {
    console.error("[transcribe] ", err);
    return json(
      { ok: false, error: "Voice input is busy right now. Try again, or type instead." },
      503,
    );
  }
}
