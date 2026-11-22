import type { Product, ProductKind, Storefront } from "./types";
import { guessTheme, photoUrl, type Theme } from "./photos";

/** Cover photo theme: the model's choice, else a guess from the niche text. */
export function storeTheme(s: Storefront): Theme {
  return s.theme ?? guessTheme(`${s.niche} ${s.tagline} ${s.bio}`);
}

export function coverPhoto(s: Storefront): string {
  return photoUrl(storeTheme(s), s.coverIndex ?? 0, 1200, 600);
}

/**
 * Product photo. Defaults to the product's position + 1 so that products
 * sharing the store's theme don't repeat the cover or each other.
 */
export function productPhoto(s: Storefront, p: Product, i: number): string {
  const fallback: Theme = productKind(p) === "session" ? "call" : storeTheme(s);
  return photoUrl(p.imageTheme ?? fallback, p.imageIndex ?? i + 1, 800, 450);
}

export function formatInr(n: number): string {
  return "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export type FormatMeta = {
  icon: string;
  /** Buyer-facing button verb. A call is "booked", a community is "joined". */
  cta: string;
  /** One line telling the buyer what they actually receive. */
  detail: string;
  /** Price suffix, e.g. "/month" for memberships. */
  suffix: string;
};

const SESSION: FormatMeta = { icon: "📞", cta: "Book a slot", detail: "Live 1:1 video call", suffix: "/session" };
const MEMBERSHIP: FormatMeta = { icon: "👥", cta: "Join", detail: "Members-only community", suffix: "/month" };
const LIVE: FormatMeta = { icon: "🎤", cta: "Register", detail: "Live online session", suffix: "" };
const COURSE: FormatMeta = { icon: "🎬", cta: "Enroll", detail: "Pre-recorded · learn at your pace", suffix: "" };
const DIGITAL: FormatMeta = { icon: "🎁", cta: "Get it", detail: "Instant download", suffix: "" };

/**
 * Map a product's format (often niche-specific, e.g. "Kundli reading") to
 * buyer-facing copy. Specific words win; otherwise fall back to the product
 * kind, then to a plain digital product.
 */
export function formatMeta(format: string, kind?: ProductKind): FormatMeta {
  const f = format.toLowerCase();
  if (/kundli|tarot|reading|horoscope report|birth chart/.test(f) && !/club|monthly|membership/.test(f))
    return { icon: "🔮", cta: "Book reading", detail: "Live 1:1 reading", suffix: "/session" };
  if (/review|audit|feedback session/.test(f))
    return { icon: "🔍", cta: "Book review", detail: "Personal 1:1 review", suffix: "" };
  if (/1:1|one.on.one|call|consult|session|mentor|coaching/.test(f) && !/group/.test(f)) return SESSION;
  if (/challenge/.test(f))
    return { icon: "🏁", cta: "Join challenge", detail: "Daily tasks · live group challenge", suffix: "" };
  if (/community|membership|club|group|circle|monthly/.test(f)) return MEMBERSHIP;
  if (/test series|mock test|mock/.test(f))
    return { icon: "📝", cta: "Start tests", detail: "Online mock tests with answers", suffix: "" };
  if (/cohort|bootcamp|live course|batch/.test(f))
    return { icon: "🎙️", cta: "Enroll", detail: "Live cohort · learn with a group", suffix: "" };
  if (/webinar|workshop|masterclass|live class|event/.test(f)) return LIVE;
  if (/course|program|video series/.test(f)) return COURSE;
  if (/preset|lut/.test(f)) return { icon: "🎞️", cta: "Get presets", detail: "Instant download", suffix: "" };
  if (/notes|pyq|question/.test(f)) return { icon: "📚", cta: "Get notes", detail: "Instant PDF download", suffix: "" };
  if (/recipe|cookbook/.test(f)) return { icon: "🍲", cta: "Get recipes", detail: "Instant PDF download", suffix: "" };
  if (/plan|chart/.test(f)) return { icon: "🗓️", cta: "Get plan", detail: "Ready-to-follow PDF plan", suffix: "" };
  if (/template|pack|kit|notion|sheet|planner|tracker|checklist|printable/.test(f))
    return { icon: "🧩", cta: "Get it", detail: "Instant download", suffix: "" };
  if (/ebook|e-book|guide|book|pdf|handbook/.test(f))
    return { icon: "📘", cta: "Get it", detail: "Instant PDF download", suffix: "" };
  if (kind === "session") return SESSION;
  if (kind === "membership") return MEMBERSHIP;
  if (kind === "live") return LIVE;
  if (kind === "course") return COURSE;
  return DIGITAL;
}

/** Product kind, from the model's answer or guessed from the format text. */
export function productKind(p: Product): ProductKind {
  if (p.kind) return p.kind;
  const m = formatMeta(p.format);
  if (m.suffix === "/session" || m.cta.startsWith("Book")) return "session";
  if (m.suffix === "/month") return "membership";
  if (["Register", "Join challenge"].includes(m.cta) || m.icon === "🎙️") return "live";
  if (m.cta === "Enroll") return "course";
  return "digital";
}

/** YYYY-MM-DD for "today" in India, so offers end on the creator's calendar day. */
export function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The price a buyer should see right now. A launch offer only shows a cut
 * price while it's real: regular price higher, and the end date not passed.
 */
export function livePrice(p: Product, today = todayIST()): { price: number; was: number | null } {
  const offer =
    !!p.regularPriceInr &&
    p.regularPriceInr > p.priceInr &&
    (!p.offerEndsAt || today <= p.offerEndsAt);
  if (offer) return { price: p.priceInr, was: p.regularPriceInr! };
  // Offer ended: the regular price is the real price again.
  if (p.regularPriceInr && p.regularPriceInr > p.priceInr) return { price: p.regularPriceInr, was: null };
  return { price: p.priceInr, was: null };
}

const FAMILIAR_PRICES = [
  49, 99, 149, 199, 249, 299, 349, 399, 449, 499, 599, 699, 799, 899, 999, 1199, 1299, 1499, 1799, 1999,
  2499, 2999, 3499, 3999, 4499, 4999, 5999, 6999, 7999, 8999, 9999, 12999, 14999, 19999, 24999,
];

/**
 * Snap an AI-suggested price to the nearest familiar Indian price point
 * (₹300 → ₹299, ₹1,503 → ₹1,499). Only used on AI output; prices a creator
 * types are left exactly as they are.
 */
export function snapPrice(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return n;
  if (n > 24999) return Math.round(n / 1000) * 1000 - 1;
  return FAMILIAR_PRICES.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
}

/** A sensible regular price to start from when a creator switches an offer on. */
export function suggestRegular(price: number): number {
  // Familiar price points between 1.5x and 2x the offer price, nearest to ~1.67x.
  const nice = [149, 199, 249, 299, 349, 399, 449, 499, 599, 699, 799, 999, 1299, 1499, 1999, 2499, 2999, 3999, 4999, 6999, 9999];
  const fits = nice.filter((n) => n >= price * 1.5 && n <= price * 2);
  if (!fits.length) return Math.round(price * 1.6);
  const target = price * 1.67;
  return fits.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
}

/** Split a trust fact into a big number and a short label, if it has a number. */
export function splitStat(text: string): { value: string; label: string } | null {
  const m = text.match(/(\d[\d,.]*)\s*(k|K|L|lakh|lac|M)?\s*(\+)?/);
  if (!m || m.index === undefined) return null;
  let value = m[1] + (m[2] ? m[2].toUpperCase().replace(/^LAKH$|^LAC$/, "L") : "") + (m[3] ?? "");
  let label = (text.slice(0, m.index) + " " + text.slice(m.index + m[0].length)).replace(/\s+/g, " ").trim();
  const yrs = label.match(/^(years?|yrs?)\b\s*(of\s+)?/i);
  if (yrs) {
    value += " yrs";
    label = label.slice(yrs[0].length).trim();
  }
  label = label.replace(/^(of|on)\s+/i, "") || "";
  return { value, label: label.charAt(0).toLowerCase() + label.slice(1) };
}

export type Tier = { label: "Entry" | "Core" | "Premium"; pill: string; bar: string };

export function tierFor(price: number): Tier {
  if (price < 500) return { label: "Entry", pill: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-400" };
  if (price < 3000) return { label: "Core", pill: "bg-sky-50 text-sky-700", bar: "bg-sky-400" };
  return { label: "Premium", pill: "bg-violet-50 text-violet-700", bar: "bg-violet-400" };
}

/** The cheapest paid product is the lowest-risk first purchase for a new buyer. */
export function startHereIndex(products: Product[]): number {
  let best = -1;
  products.forEach((p, i) => {
    if (p.priceInr > 0 && (best === -1 || p.priceInr < products[best].priceInr)) best = i;
  });
  return best;
}
