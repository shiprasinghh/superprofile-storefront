import { z } from "zod";

// Accent colours a creator can pick for their page header.
export const ACCENTS = ["violet", "emerald", "rose", "amber", "sky"] as const;
export type Accent = (typeof ACCENTS)[number];

// Suggested product formats. The model may use these or a close variant.
export const PRODUCT_FORMATS = [
  "Ebook",
  "Mini-course",
  "Cohort course",
  "1:1 call",
  "Webinar",
  "Community",
  "Template pack",
  "Guide",
] as const;

export const TONES = ["English", "Hinglish", "Hindi"] as const;
export type Tone = (typeof TONES)[number];

export const ProductSchema = z.object({
  title: z.string().min(1).max(90),
  format: z.string().min(1).max(40),
  priceInr: z.coerce.number().int().min(0).max(1_000_000),
  priceRationale: z.string().min(1).max(320),
  description: z.string().min(1).max(700),
});
export type Product = z.infer<typeof ProductSchema>;

export const StorefrontSchema = z.object({
  creatorName: z.string().min(1).max(60),
  tagline: z.string().min(1).max(140),
  bio: z.string().min(1).max(700),
  niche: z.string().min(1).max(60),
  products: z.array(ProductSchema).min(2).max(4),
  accent: z.enum(ACCENTS).catch("violet"),
  // Filled in only when the input was thin/ambiguous, so the creator knows
  // what we assumed and can correct it. Empty string otherwise.
  assumptions: z.string().max(320).catch("").default(""),
});
export type Storefront = z.infer<typeof StorefrontSchema>;

export type GenerateInput = {
  description: string;
  handle?: string;
  tone?: Tone;
};
