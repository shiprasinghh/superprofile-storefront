import LZString from "lz-string";
import { StorefrontSchema, type Storefront } from "./types";

// The whole storefront is encoded into the share URL itself. No database:
// links are public by default, never expire, and cost nothing to keep live.
//
// lz-string's URI-safe alphabet still uses "+" and "$", which get mangled in a
// URL *path* segment. We swap them for "_" and "." (which never appear in
// lz-string output) so the data survives the path untouched, and swap back
// before decompressing.
function toPathSafe(s: string): string {
  return s.replace(/\+/g, "_").replace(/\$/g, ".");
}
function fromPathSafe(s: string): string {
  return s.replace(/_/g, "+").replace(/\./g, "$");
}

export function encodeStorefront(s: Storefront): string {
  // Drop empty highlight rows left over from editing, so the link validates.
  const clean: Storefront = {
    ...s,
    products: s.products.map((p) => ({
      ...p,
      highlights: p.highlights?.map((h) => h.trim()).filter(Boolean),
    })),
  };
  return toPathSafe(LZString.compressToEncodedURIComponent(JSON.stringify(clean)));
}

export function decodeStorefront(data: string): Storefront | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(fromPathSafe(data));
    if (!json) return null;
    const parsed = StorefrontSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
