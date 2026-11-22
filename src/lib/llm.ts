import {
  ProductSchema,
  StorefrontSchema,
  type GenerateInput,
  type Product,
  type Proof,
  type Storefront,
  type Tone,
} from "./types";
import { THEMES, THEME_GUIDE } from "./photos";
import { addDays, snapPrice, suggestRegular, todayIST } from "./format";

// Google Gemini has a genuinely free API tier (no card required), which the
// brief explicitly allows. Model is swappable via env.
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

function endpoint(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
}

const PRICING_GUIDE = `WHAT SUPERPROFILE CAN SELL: exactly five kinds ("kind"), with typical India prices (INR):
- digital: ebooks, guides, notes / PYQ packs, templates, planners, Excel or Notion sheets, presets, recipe books, diet or workout plan PDFs, mock test series: 149 to 1,499
- course: pre-recorded mini-course 499 to 2,999; live cohort or bootcamp 1,999 to 9,999
- live: one-off webinar or workshop 199 to 999; 7, 14 or 21-day challenge 199 to 999
- membership: paid community, club or monthly group (price is per month): 99 to 499
- session: 1:1 call, consultation, reading (kundli, tarot), portfolio or resume review: 499 to 2,999
Pick round, familiar numbers (199, 299, 499, 999, 1499, 2999). Never price above
what a 5K-100K follower creator's audience would realistically pay. Include at least
one low-ticket entry product under 500.`;

const PRODUCT_RULES = `CHOOSING PRODUCTS (the most important decision: creators don't know what to sell):
- Choose the formats that best fit THIS niche and audience. Do not default to "ebook + mini-course + 1:1 call".
- Use at least two different kinds. Use at most one "session", and only if personal guidance genuinely suits the niche.
- Where it suits the niche, include one live or recurring product (workshop, challenge, cohort or community): they build a relationship with the audience.
- "format" is a short, niche-specific label (max 3 words) a buyer instantly understands, e.g. "PYQ notes pack", "Mock test series", "Kundli reading", "21-day challenge", "Lightroom presets", "Recipe ebook", "Budget template", "Stock-picks club", "Canva crash course", "Wardrobe audit call". Never use these generic labels on their own: "Mini-course", "Template pack", "Ebook", "Guide", "1:1 call", "1:1 consultation", "Webinar". Always say what it is about.
- Examples of good fits: UPSC -> PYQ notes pack, mock test series, live doubt-solving workshop. Astrologer -> kundli reading, monthly horoscope club. Fitness -> 21-day home workout challenge, diet plan, community. Finance -> budget template, live tax-saving workshop, money club.
- Launch offer: on the single cheapest product only, suggest a launch price. Set "priceInr" to the launch price and "regularPriceInr" to the creator's normal price (higher, at most double the launch price, e.g. 299 and 499). Omit "regularPriceInr" on every other product.`;

const SYSTEM = `You help Indian creators (fitness, finance, cooking, design, exam prep, astrology, fashion, and similar niches) turn a short self-description into a storefront that sells. You write warm, concrete, trustworthy copy — never generic hype, no empty buzzwords.

${PRICING_GUIDE}

${PRODUCT_RULES}

Rules:
- Prices are whole numbers in INR, appropriate for India and this creator's likely audience size.
- Write for a buyer scrolling on a phone: short, specific, benefit first. No filler words.
- tagline: max 8 words. A promise to the buyer, not a job title ("Get fit at home in 20 minutes", not "Fitness coach").
- bio: 2 short sentences, max 40 words, first person: who you help and why trust you.
- HONESTY (these creators are first-time sellers): never invent facts about the creator. No made-up years of experience, follower counts, student numbers, certifications, awards, reviews, ratings or testimonials. Use a number or credential only if the creator stated it. If they gave none, build trust with what they do and who they help instead.
- proof: 0 to 4 short trust facts (max 6 words each) taken ONLY from what the creator stated, e.g. "18K followers on Instagram", "5 years teaching yoga", "Certified CA", "200+ students taught". kind is followers, experience, credential, clients or other. If they stated none, return an empty array.
- Each product: a clear title (max 7 words), a description of 1-2 short sentences (max 28 words) leading with what the buyer gets, and exactly 3 "highlights": concrete what-you-get points, max 6 words each ("30 ten-minute workouts", "Lifetime access", "WhatsApp support").
- priceRationale is one short line for the creator only, explaining the price ("Priced for first-time buyers; one coaching call usually costs more").
- theme / imageTheme pick the photo shown. Choose from: ${THEMES.map((t) => `${t} (${THEME_GUIDE[t]})`).join("; ")}. "theme" suits the creator's niche; each product's "imageTheme" suits that product's picture (for a 1:1 call use "call", for an ebook or guide use "books" or the niche). Always use the English theme key, whatever the writing language.
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
  "tagline": string,           // max 8 words, a promise to the buyer
  "bio": string,               // 2 short sentences, max 40 words, first person
  "accent": "violet"|"emerald"|"rose"|"amber"|"sky",
  "theme": string,             // one theme key for the cover photo
  "proof": [ { "kind": "followers"|"experience"|"credential"|"clients"|"other", "text": string } ], // stated facts only, [] if none
  "assumptions": string,       // "" unless input was thin; then what you assumed
  "products": [                // 2 to 4 items
    {
      "title": string,         // max 7 words
      "kind": "digital"|"course"|"live"|"membership"|"session",
      "format": string,        // niche-specific, max 3 words, e.g. "PYQ notes pack", "Kundli reading", "21-day challenge"
      "priceInr": number,      // whole number, INR (the launch price if regularPriceInr is set)
      "regularPriceInr": number, // OPTIONAL, cheapest product only: normal price for a launch offer
      "priceRationale": string,
      "description": string,   // 1-2 short sentences, max 28 words
      "highlights": [string, string, string], // max 6 words each
      "imageTheme": string     // one theme key for this product's photo
    }
  ]
}`;

async function callModel(user: string, maxTokens: number): Promise<string> {
  return geminiRequest({
    system_instruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: maxTokens,
      responseMimeType: "application/json",
    },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Gemini call that rides out short "overloaded" spells: on a 503 or 429 it
 * waits briefly and tries again (up to 2 more times) before giving up.
 */
async function geminiRequest(payload: object): Promise<string> {
  const waits = [1200, 2500];
  for (let i = 0; ; i++) {
    try {
      return await geminiOnce(payload);
    } catch (e) {
      const busy = e instanceof Error && /Gemini (503|429|500)/.test(e.message);
      if (!busy || i >= waits.length) throw e;
      await sleep(waits[i]);
    }
  }
}

/** One Gemini call with a 28s timeout. Returns the raw text of the reply. */
async function geminiOnce(payload: object): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28_000);
  try {
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(payload),
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

/** Numbers in a string, normalised so "18K", "18,000" and "18000" all match. */
function numbersIn(text: string): string[] {
  return (text.replace(/(\d),(\d)/g, "$1$2").match(/\d+/g) ?? []).map(
    (n) => n.replace(/^0+(?=\d)/, "").replace(/0+$/, "") || "0",
  );
}

/**
 * Quality control: drop any trust fact containing a number the creator
 * never typed. Stops the model from inventing "10K followers" or "8 years".
 */
function keepStatedProof(proof: Proof[] | undefined, input: GenerateInput): Proof[] {
  const stated = new Set(numbersIn(`${input.description ?? ""} ${input.handle ?? ""}`));
  return (proof ?? []).filter((p) => numbersIn(p.text).every((n) => stated.has(n))).slice(0, 4);
}

/** Snap AI prices to familiar points (₹300 → ₹299). Creator-typed prices never pass through here. */
function snapProductPrices(p: Product): Product {
  return {
    ...p,
    priceInr: snapPrice(p.priceInr),
    regularPriceInr: p.regularPriceInr ? snapPrice(p.regularPriceInr) : undefined,
  };
}

/**
 * Quality control on launch offers: at most one, on the cheapest product,
 * with a real discount no deeper than 50%, ending in 14 days. Anything else
 * the model suggests is removed so a buyer never sees an inflated "was" price.
 */
function keepHonestOffer(products: Product[]): Product[] {
  const cheapest = products.reduce((best, p, i) => (p.priceInr < products[best].priceInr ? i : best), 0);
  const ends = addDays(todayIST(), 14);
  return products.map((p, i) => {
    if (i !== cheapest || p.priceInr <= 0) {
      return { ...p, regularPriceInr: undefined, offerEndsAt: undefined };
    }
    const r = p.regularPriceInr;
    const valid = !!r && r > p.priceInr && r <= p.priceInr * 2;
    // If the model skipped or botched it, suggest a modest offer the creator can edit or switch off.
    const regular = valid ? r! : Math.min(suggestRegular(p.priceInr), p.priceInr * 2);
    return { ...p, regularPriceInr: regular, offerEndsAt: ends };
  });
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
      const text = await callModel(user, 2600);
      const parsed = StorefrontSchema.safeParse(extractJson(text));
      if (parsed.success) {
        // The AI never writes testimonials; only the creator can add one.
        return {
          ...parsed.data,
          products: keepHonestOffer(parsed.data.products.map(snapProductPrices)),
          proof: keepStatedProof(parsed.data.proof, input),
          testimonial: undefined,
        };
      }
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

Write a fresh, different bio: 2 short first-person sentences, max 40 words, saying who you help and why to trust you. Do not invent numbers, years of experience, certifications or reviews; use only facts already in the storefront. ${toneLine(tone)}
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
  const others = current.products
    .filter((_, i) => i !== index)
    .map((p) => `${p.title} (${p.format})`);
  const user = `Creator niche: ${current.niche}. Bio: ${current.bio}
Their other products: ${others.length ? others.join(", ") : "(none)"}.

${PRICING_GUIDE}

Propose ONE different product idea that fits this niche and complements the others. Prefer a kind and format the other products don't already use; never a second "session". Use a niche-specific format label (max 3 words, e.g. "PYQ notes pack", "Kundli reading", "21-day challenge"). Title max 7 words; description 1-2 short sentences (max 28 words) leading with what the buyer gets; exactly 3 highlights of max 6 words each. ${toneLine(tone)}
kind is one of: digital, course, live, membership, session.
imageTheme is one of: ${THEMES.join(", ")} (English key; "call" for a 1:1 call).
Reply with ONLY this JSON:
{ "title": string, "kind": string, "format": string, "priceInr": number, "priceRationale": string, "description": string, "highlights": [string, string, string], "imageTheme": string }`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await callModel(user, 800);
      const parsed = ProductSchema.safeParse(extractJson(text));
      // A swapped-in product starts without a launch offer; the creator can add one.
      if (parsed.success)
        return { ...snapProductPrices(parsed.data), regularPriceInr: undefined, offerEndsAt: undefined };
    } catch {
      /* retry */
    }
  }
  throw new Error("Could not regenerate product");
}

/** Parse a JSON object or array from model text. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractAny(text: string): any {
  const t = text.trim().replace(/^```(?:json)?\s*|```$/gi, "").trim();
  try {
    return JSON.parse(t);
  } catch {
    return extractJson(t);
  }
}

/**
 * The model sometimes wraps the answer ({ product }) or returns the whole list
 * with the new item added. Pick the one new product in any of those shapes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickNewProduct(obj: any, existing: Set<string>): unknown {
  const list = Array.isArray(obj) ? obj : Array.isArray(obj?.products) ? obj.products : null;
  if (list) {
    const fresh = list.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => typeof p?.title === "string" && !existing.has(p.title.trim().toLowerCase()),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return fresh.sort((a: any, b: any) => Number(b.priceInr) - Number(a.priceInr))[0];
  }
  return obj?.product ?? obj;
}

/** Add one premium product (₹2,999+) that fits the niche and the existing range. */
export async function addPremiumProduct(current: Storefront, tone?: Tone): Promise<Product> {
  const others = current.products.map((p) => `${p.title} (${p.format}, ₹${p.priceInr})`);
  const hasSession = current.products.some((p) => p.kind === "session");
  const user = `Creator niche: ${current.niche}. Bio: ${current.bio}
Their current products: ${others.join(", ")}.

${PRICING_GUIDE}

Propose ONE premium product priced 2,999 to 9,999 INR for their most committed buyers: the top step of their price ladder. Good premium formats: live cohort or bootcamp, multi-week group programme, 3-month mentorship${hasSession ? "" : ", 1:1 coaching package"}. It must fit this niche, be clearly more in-depth than the products above, and not duplicate them.${hasSession ? ' Do not use kind "session"; they already offer a 1:1.' : ""} Use a niche-specific format label (max 3 words, e.g. "Live art cohort", "UPSC mentorship"). Title max 7 words; description 1-2 short sentences (max 28 words) leading with what the buyer gets; exactly 3 highlights of max 6 words each. ${toneLine(tone)}
kind is one of: course, live, membership, session.
imageTheme is one of: ${THEMES.join(", ")} (English key).
Reply with ONLY the ONE new product as a single JSON object (not a list, and do not repeat the existing products):
{ "title": string, "kind": string, "format": string, "priceInr": number, "priceRationale": string, "description": string, "highlights": [string, string, string], "imageTheme": string }`;
  const existing = new Set(current.products.map((p) => p.title.trim().toLowerCase()));
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await callModel(user, 1400);
      const parsed = ProductSchema.safeParse(pickNewProduct(extractAny(text), existing));
      if (!parsed.success) console.error("[premium] invalid reply", parsed.error.issues.slice(0, 3), text.slice(0, 300));
      if (parsed.success) {
        const p = snapProductPrices(parsed.data);
        // Guarantee it really is the premium step.
        const priceInr = Math.min(Math.max(p.priceInr, 2999), 9999);
        return { ...p, priceInr: snapPrice(priceInr), regularPriceInr: undefined, offerEndsAt: undefined };
      }
    } catch (e) {
      console.error("[premium] attempt failed", e instanceof Error ? e.message.slice(0, 200) : e);
    }
  }
  throw new Error("Could not add a premium product");
}

const TRANSCRIBE_PROMPT = `This is a short voice note from an Indian creator describing what they do, who they help or what they teach. They may speak English, Hindi, or a Hindi-English mix (Hinglish).

Transcribe what they said. Rules:
- Keep their words and meaning. Do not add, summarise or translate.
- Write it the way they would type it on their phone: English words in English, Hindi words in Roman script (for example "main yoga sikhati hoon"). Use Devanagari only if the whole note is in pure Hindi.
- Drop filler sounds (umm, uh) and add normal punctuation.
- If there is no clear speech, return an empty string.
Reply with ONLY this JSON: { "text": string }`;

/** Turn a creator's voice note (English, Hindi or Hinglish) into text. */
export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await geminiRequest({
        contents: [
          {
            role: "user",
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Audio } },
              { text: TRANSCRIBE_PROMPT },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 800,
          responseMimeType: "application/json",
        },
      });
      const obj = extractJson(text);
      return (typeof obj?.text === "string" ? obj.text.trim() : "").slice(0, 1000);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Transcription failed");
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}
