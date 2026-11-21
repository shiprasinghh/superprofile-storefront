import {
  ProductSchema,
  StorefrontSchema,
  type GenerateInput,
  type Product,
  type Storefront,
  type Tone,
} from "./types";

// Google Gemini has a genuinely free API tier (no card required), which the
// brief explicitly allows. Model is swappable via env.
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

function endpoint(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
}

const PRICING_GUIDE = `INDIA PRICING GUIDE (price-sensitive micro-creator audiences, INR):
- Ebook / guide: 149 to 799
- Template / notes / resource pack: 199 to 999
- Mini-course (pre-recorded): 499 to 2,999
- Cohort / live course: 1,999 to 9,999
- 1:1 call or consult (per session): 499 to 2,999
- Paid community (per month): 99 to 499
- Webinar / workshop (one-off): 199 to 999
Pick round, familiar numbers (199, 299, 499, 999, 1499, 2999). Never price above
what a 5K-100K follower creator's audience would realistically pay. Prefer at least
one low-ticket entry product under 500.`;

const SYSTEM = `You help Indian creators (fitness, finance, cooking, design, exam prep, astrology, fashion, and similar niches) turn a short self-description into a storefront that sells. You write warm, concrete, trustworthy copy — never generic hype, no empty buzzwords.

${PRICING_GUIDE}

Rules:
- Prices are whole numbers in INR, appropriate for India and this creator's likely audience size.
- Each product has a clear format and a specific, benefit-led description (2-3 sentences) a creator would be proud to publish.
- priceRationale is one short line the creator can show their audience ("Priced for first-time buyers; one coaching call usually costs more").
- If the input is thin, vague, gibberish, or a single word, DO NOT refuse. Make reasonable, clearly-stated assumptions, still produce a full valid storefront, and summarise what you assumed in "assumptions". Otherwise set "assumptions" to "".
- accent is one of: violet, emerald, rose, amber, sky. Pick one that suits the niche.
- Reply with ONLY a single JSON object. No markdown, no commentary, no code fences.`;

function toneLine(tone?: Tone): string {
  if (tone === "Hinglish")
    return "Write in friendly Hinglish (Roman-script Hindi + English mix), the way Indian creators talk to their audience.";
  if (tone === "Hindi")
    return "Write in Hindi (Devanagari script), natural and conversational.";
  return "Write in clear, simple English.";
}

const FULL_SHAPE = `Return JSON of exactly this shape:
{
  "creatorName": string,       // a natural display name; infer from the handle/description, else a sensible niche-based name
  "niche": string,             // short niche label, e.g. "Home workouts for busy moms"
  "tagline": string,           // one punchy line under the name
  "bio": string,               // 2-3 warm sentences in first person
  "accent": "violet"|"emerald"|"rose"|"amber"|"sky",
  "assumptions": string,       // "" unless input was thin; then what you assumed
  "products": [                // 2 to 4 items
    {
      "title": string,
      "format": string,        // e.g. Ebook, Mini-course, 1:1 call, Community, Template pack
      "priceInr": number,      // whole number, INR
      "priceRationale": string,
      "description": string
    }
  ]
}`;

async function callModel(user: string, maxTokens: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28_000);
  try {
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = await res.json();
    const parts: string = (data?.candidates?.[0]?.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim();
    if (!parts) throw new Error("Empty model response");
    return parts;
  } finally {
    clearTimeout(timer);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractJson(text: string): any {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

function describeInput(input: GenerateInput): string {
  const parts: string[] = [];
  if (input.handle?.trim()) {
    parts.push(
      `Instagram handle: ${input.handle.trim()} (we do NOT read Instagram; treat the handle only as a naming/niche hint).`,
    );
  }
  const desc = input.description?.trim();
  parts.push(`Self-description: ${desc && desc.length > 0 ? desc : "(none provided)"}`);
  return parts.join("\n");
}

/** Generate a full storefront. Retries once, then throws for the caller to handle. */
export async function generateStorefront(input: GenerateInput): Promise<Storefront> {
  const base = `${describeInput(input)}\n\n${toneLine(input.tone)}\n\n${FULL_SHAPE}`;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const user =
        attempt === 0
          ? base
          : `${base}\n\nIMPORTANT: your previous reply could not be parsed. Reply with ONLY the raw JSON object, nothing else.`;
      const text = await callModel(user, 2000);
      const parsed = StorefrontSchema.safeParse(extractJson(text));
      if (parsed.success) return parsed.data;
      lastErr = new Error("Schema validation failed");
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Generation failed");
}

/** Regenerate only the bio, keeping the rest of the storefront as context. */
export async function regenerateBio(current: Storefront, tone?: Tone): Promise<string> {
  const user = `Here is the creator's current storefront JSON:
${JSON.stringify({ creatorName: current.creatorName, niche: current.niche, tagline: current.tagline, products: current.products.map((p) => p.title) })}

Write a fresh, different bio (2-3 warm first-person sentences). ${toneLine(tone)}
Reply with ONLY this JSON: { "bio": string }`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await callModel(user, 400);
      const obj = extractJson(text);
      const bio = asString(obj?.bio);
      if (bio) return bio;
    } catch {
      /* retry */
    }
  }
  throw new Error("Could not regenerate bio");
}

/** Regenerate a single product by index, keeping the others as context. */
export async function regenerateProduct(
  current: Storefront,
  index: number,
  tone?: Tone,
): Promise<Product> {
  const others = current.products.filter((_, i) => i !== index).map((p) => p.title);
  const user = `Creator niche: ${current.niche}. Bio: ${current.bio}
Their other products: ${others.length ? others.join(", ") : "(none)"}.

Propose ONE different product idea that complements the others (avoid duplicates). Use India-appropriate INR pricing. ${toneLine(tone)}
Reply with ONLY this JSON:
{ "title": string, "format": string, "priceInr": number, "priceRationale": string, "description": string }`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await callModel(user, 500);
      const parsed = ProductSchema.safeParse(extractJson(text));
      if (parsed.success) return parsed.data;
    } catch {
      /* retry */
    }
  }
  throw new Error("Could not regenerate product");
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}
