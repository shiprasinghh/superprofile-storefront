import type { Product } from "./types";

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

/**
 * Map a free-text product format to buyer-facing copy. Different formats are
 * bought differently, so the CTA and "what you get" line change with them.
 */
export function formatMeta(format: string): FormatMeta {
  const f = format.toLowerCase();
  if (/1:1|call|consult|session|mentor/.test(f))
    return { icon: "📞", cta: "Book a slot", detail: "Live 1:1 video call", suffix: "/session" };
  if (/community|membership|club|group/.test(f))
    return { icon: "👥", cta: "Join", detail: "Members-only community", suffix: "/month" };
  if (/cohort|bootcamp|live course|batch/.test(f))
    return { icon: "🎙️", cta: "Enroll", detail: "Live cohort · learn with a group", suffix: "" };
  if (/webinar|workshop|masterclass|class|event/.test(f))
    return { icon: "🎤", cta: "Register", detail: "Live online session", suffix: "" };
  if (/course|program|video/.test(f))
    return { icon: "🎬", cta: "Enroll", detail: "Pre-recorded · learn at your pace", suffix: "" };
  if (/template|pack|kit|notion|sheet|notes|planner|tracker|preset/.test(f))
    return { icon: "🧩", cta: "Get it", detail: "Instant download", suffix: "" };
  if (/ebook|e-book|guide|book|pdf|handbook/.test(f))
    return { icon: "📘", cta: "Get it", detail: "Instant PDF download", suffix: "" };
  return { icon: "🎁", cta: "Get it", detail: "Digital product", suffix: "" };
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
