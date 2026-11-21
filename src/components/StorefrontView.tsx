"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Accent, Product, Storefront } from "@/lib/types";
import {
  coverPhoto,
  formatInr,
  formatMeta,
  initials,
  productPhoto,
  startHereIndex,
} from "@/lib/format";

// Full class strings (not built dynamically) so Tailwind keeps them.
const ACCENT: Record<
  Accent,
  { grad: string; text: string; soft: string; btn: string; ring: string; startRing: string }
> = {
  violet: {
    grad: "from-violet-500 via-purple-500 to-indigo-500",
    text: "text-violet-700",
    soft: "bg-violet-50",
    btn: "bg-violet-600 hover:bg-violet-700",
    ring: "focus:ring-violet-200",
    startRing: "ring-2 ring-violet-400",
  },
  emerald: {
    grad: "from-emerald-400 via-emerald-500 to-teal-600",
    text: "text-emerald-700",
    soft: "bg-emerald-50",
    btn: "bg-emerald-600 hover:bg-emerald-700",
    ring: "focus:ring-emerald-200",
    startRing: "ring-2 ring-emerald-400",
  },
  rose: {
    grad: "from-rose-400 via-pink-500 to-fuchsia-500",
    text: "text-rose-700",
    soft: "bg-rose-50",
    btn: "bg-rose-600 hover:bg-rose-700",
    ring: "focus:ring-rose-200",
    startRing: "ring-2 ring-rose-400",
  },
  amber: {
    grad: "from-amber-400 via-orange-500 to-red-400",
    text: "text-amber-700",
    soft: "bg-amber-50",
    btn: "bg-orange-600 hover:bg-orange-700",
    ring: "focus:ring-amber-200",
    startRing: "ring-2 ring-orange-400",
  },
  sky: {
    grad: "from-sky-400 via-blue-500 to-indigo-500",
    text: "text-sky-700",
    soft: "bg-sky-50",
    btn: "bg-blue-600 hover:bg-blue-700",
    ring: "focus:ring-sky-200",
    startRing: "ring-2 ring-blue-400",
  },
};

type EditHandlers = {
  onChange: (patch: Partial<Storefront>) => void;
  onProductChange: (index: number, patch: Partial<Product>) => void;
  onRegenBio: () => void;
  onRegenProduct: (index: number) => void;
  onDeleteProduct: (index: number) => void;
  busyBio?: boolean;
  busyProduct?: number | null;
};

/** Photo with a soft loading shimmer and a branded fallback if it fails. */
function Photo({
  src,
  alt,
  className,
  fallback,
  eager,
}: {
  src: string;
  alt: string;
  className: string;
  fallback: ReactNode;
  eager?: boolean;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<"loading" | "ok" | "err">("loading");

  // Reset on a new photo; also catch images that loaded before hydration.
  useEffect(() => {
    const img = ref.current;
    setState(img?.complete && img.naturalWidth > 0 ? "ok" : "loading");
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {state !== "err" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          onLoad={() => setState("ok")}
          onError={() => setState("err")}
          className={`h-full w-full object-cover transition-opacity duration-500 ${state === "ok" ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {state === "loading" && <div className="absolute inset-0 animate-pulse bg-gray-200" />}
      {state === "err" && <div className="absolute inset-0">{fallback}</div>}
    </div>
  );
}

/**
 * One component renders both views of a store:
 *  - buyer view (no `edit`): photo-led, conversion-focused page
 *  - creator view (`edit`): same layout, tap-to-edit text, photo swaps,
 *    plus creator-only coaching (pricing rationale) that buyers never see.
 */
export default function StorefrontView({
  storefront,
  edit,
}: {
  storefront: Storefront;
  edit?: EditHandlers;
}) {
  const s = storefront;
  const a = ACCENT[s.accent] ?? ACCENT.violet;
  const editable = !!edit;
  const start = startHereIndex(s.products);
  const [toast, setToast] = useState<string | null>(null);

  const field = `rounded-md outline-none transition hover:bg-gray-100/80 focus:bg-white focus:ring-2 ${a.ring}`;
  const chip =
    "rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur transition hover:bg-white";

  function onBuy(p: Product) {
    if (editable) return;
    setToast(`Checkout for “${p.title}” opens once this store is live on SuperProfile. (Demo)`);
    setTimeout(() => setToast(null), 3500);
  }

  function setHighlight(i: number, h: number, value: string) {
    const list = [...(s.products[i].highlights ?? [])];
    while (list.length < 3) list.push("");
    list[h] = value;
    edit!.onProductChange(i, { highlights: list });
  }

  return (
    <div className="w-full bg-white">
      {/* Hero photo */}
      <div className="relative">
        <Photo
          src={coverPhoto(s)}
          alt=""
          eager
          className="h-48 w-full sm:h-52"
          fallback={<div className={`h-full w-full bg-gradient-to-br ${a.grad}`} />}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
        {editable && (
          <button
            onClick={() => edit!.onChange({ coverIndex: (s.coverIndex ?? 0) + 1 })}
            className={`absolute right-3 top-3 ${chip}`}
          >
            🖼️ Change cover
          </button>
        )}
      </div>

      {/* Identity */}
      <div className="relative -mt-12 px-5 text-center">
        <div
          className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${a.grad} text-3xl font-bold text-white shadow-lg ring-4 ring-white`}
        >
          {initials(s.creatorName) || "★"}
        </div>

        {editable ? (
          <input
            className={`mt-3 w-full text-center text-2xl font-bold tracking-tight text-gray-900 ${field}`}
            value={s.creatorName}
            onChange={(e) => edit!.onChange({ creatorName: e.target.value })}
            aria-label="Creator name"
          />
        ) : (
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{s.creatorName}</h1>
        )}

        {editable ? (
          <textarea
            rows={1}
            className={`mt-1 w-full resize-none text-center text-[17px] font-semibold leading-snug text-gray-800 [field-sizing:content] ${field}`}
            value={s.tagline}
            onChange={(e) => edit!.onChange({ tagline: e.target.value })}
            aria-label="Tagline"
          />
        ) : (
          <p className="mx-auto mt-1 max-w-xs text-[17px] font-semibold leading-snug text-gray-800">
            {s.tagline}
          </p>
        )}

        <div className="mt-3 flex justify-center">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${a.soft} ${a.text}`}>
            {editable ? (
              <input
                className="bg-transparent text-center outline-none"
                size={Math.max(10, s.niche.length)}
                value={s.niche}
                onChange={(e) => edit!.onChange({ niche: e.target.value })}
                aria-label="Niche"
              />
            ) : (
              s.niche
            )}
          </span>
        </div>
      </div>

      {/* Bio */}
      <section className="mx-5 mt-4">
        {editable && (
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              About you
            </span>
            <button
              onClick={edit!.onRegenBio}
              disabled={edit!.busyBio}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.text} hover:bg-gray-100 disabled:opacity-40`}
            >
              {edit!.busyBio ? "Rewriting…" : "↻ Rewrite with AI"}
            </button>
          </div>
        )}
        {editable ? (
          <textarea
            className={`min-h-[72px] w-full resize-none p-2 text-center text-[15px] leading-relaxed text-gray-600 [field-sizing:content] ${field} ${edit!.busyBio ? "animate-pulse opacity-50" : ""}`}
            value={s.bio}
            onChange={(e) => edit!.onChange({ bio: e.target.value })}
            aria-label="Bio"
          />
        ) : (
          <p className="text-center text-[15px] leading-relaxed text-gray-600">{s.bio}</p>
        )}
      </section>

      {/* Products */}
      <section className="mt-7 px-4">
        <div className="mb-4 flex items-baseline justify-between px-1">
          <h2 className="text-base font-bold text-gray-900">Products &amp; services</h2>
          <span className="text-xs text-gray-400">{s.products.length} offerings</span>
        </div>

        <div className="space-y-5">
          {s.products.map((p, i) => {
            const meta = formatMeta(p.format);
            const busy = edit?.busyProduct === i;
            const isStart = i === start;
            const highlights = (p.highlights ?? []).filter((h) => h.trim());
            const editHighlights = [...(p.highlights ?? [])];
            while (editHighlights.length < 3) editHighlights.push("");
            return (
              <article
                key={i}
                className={`relative overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-black/5 ${isStart ? a.startRing : ""}`}
              >
                {/* Product photo */}
                <div className="relative">
                  <Photo
                    src={productPhoto(s, p, i)}
                    alt={p.title}
                    className="aspect-[16/9] w-full"
                    fallback={
                      <div
                        className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${a.grad} text-5xl`}
                      >
                        {meta.icon}
                      </div>
                    }
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-800 shadow-sm">
                    {meta.icon} {p.format}
                  </span>
                  {isStart && (
                    <span className="absolute right-3 top-3 rounded-full bg-gray-900/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      ⭐ Best place to start
                    </span>
                  )}
                  {editable && (
                    <button
                      onClick={() => edit!.onProductChange(i, { imageIndex: (p.imageIndex ?? i + 1) + 1 })}
                      className={`absolute bottom-3 right-3 ${chip}`}
                    >
                      🖼️ New photo
                    </button>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      {editable && (
                        <input
                          className={`w-full text-[11px] font-semibold uppercase tracking-wide ${a.text} ${field}`}
                          value={p.format}
                          onChange={(e) => edit!.onProductChange(i, { format: e.target.value })}
                          aria-label="Product format"
                        />
                      )}
                      {editable ? (
                        <textarea
                          rows={1}
                          className={`w-full resize-none text-lg font-bold leading-snug text-gray-900 [field-sizing:content] ${field}`}
                          value={p.title}
                          onChange={(e) => edit!.onProductChange(i, { title: e.target.value })}
                          aria-label="Product title"
                        />
                      ) : (
                        <h3 className="text-lg font-bold leading-snug text-gray-900">{p.title}</h3>
                      )}
                      <p className="mt-0.5 text-xs font-medium text-gray-400">{meta.detail}</p>
                    </div>

                    {editable && (
                      <div className="flex shrink-0 gap-0.5">
                        <button
                          onClick={() => edit!.onRegenProduct(i)}
                          disabled={busy}
                          title="Swap for a new AI idea"
                          aria-label="Regenerate this product"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                        >
                          ↻
                        </button>
                        {s.products.length > 2 && (
                          <button
                            onClick={() => edit!.onDeleteProduct(i)}
                            title="Remove product"
                            aria-label="Remove product"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {editable ? (
                    <textarea
                      className={`mt-2 w-full resize-none p-1 text-sm leading-relaxed text-gray-600 [field-sizing:content] ${field}`}
                      rows={2}
                      value={p.description}
                      onChange={(e) => edit!.onProductChange(i, { description: e.target.value })}
                      aria-label="Product description"
                    />
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{p.description}</p>
                  )}

                  {/* What you get */}
                  {(editable || highlights.length > 0) && (
                    <ul className="mt-3 space-y-1.5">
                      {(editable ? editHighlights : highlights).map((h, hi) => (
                        <li key={hi} className="flex items-center gap-2 text-sm text-gray-700">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${a.soft} ${a.text}`}
                            aria-hidden
                          >
                            ✓
                          </span>
                          {editable ? (
                            <input
                              className={`min-w-0 flex-1 px-1 ${field}`}
                              value={h}
                              placeholder="Add what buyers get"
                              onChange={(e) => setHighlight(i, hi, e.target.value)}
                              aria-label={`Highlight ${hi + 1}`}
                            />
                          ) : (
                            <span>{h}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-0.5">
                      {editable ? (
                        <span className="flex items-baseline text-2xl font-bold text-gray-900">
                          ₹
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            className={`w-24 px-1 ${field}`}
                            value={p.priceInr}
                            onChange={(e) =>
                              edit!.onProductChange(i, { priceInr: Number(e.target.value) || 0 })
                            }
                            aria-label="Price in rupees"
                          />
                        </span>
                      ) : (
                        <span className="text-2xl font-bold text-gray-900">{formatInr(p.priceInr)}</span>
                      )}
                      {meta.suffix && <span className="text-xs text-gray-400">{meta.suffix}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => onBuy(p)}
                      tabIndex={editable ? -1 : 0}
                      title={editable ? "Buyers will tap this to purchase" : undefined}
                      className={`shrink-0 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-sm transition ${a.btn} ${editable ? "cursor-default" : ""}`}
                    >
                      {meta.cta} →
                    </button>
                  </div>

                  {/* Creator-only coaching: why this price. Hidden from buyers. */}
                  {editable && (
                    <div className="mt-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 p-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-amber-900">💡 Why this price</span>
                        <span className="text-amber-700/80">Only you see this</span>
                      </div>
                      <textarea
                        rows={1}
                        className="mt-1 w-full resize-none bg-transparent text-xs leading-relaxed text-amber-900 outline-none [field-sizing:content]"
                        value={p.priceRationale}
                        onChange={(e) => edit!.onProductChange(i, { priceRationale: e.target.value })}
                        aria-label="Pricing rationale"
                      />
                    </div>
                  )}
                </div>

                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-medium text-gray-600 backdrop-blur-[1px]">
                    <span className="animate-pulse">✨ Thinking of a new idea…</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Trust row: reduces purchase anxiety for first-time buyers */}
      <div className="mx-4 mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl bg-gray-50 px-3 py-2.5 text-[11px] text-gray-500">
        <span>🔒 Secure checkout</span>
        <span aria-hidden>·</span>
        <span>UPI, cards &amp; netbanking</span>
        <span aria-hidden>·</span>
        <span>Instant access</span>
      </div>

      {/* Footer: on public pages, every store doubles as an acquisition loop */}
      <div className="px-5 pb-7 pt-5 text-center">
        {editable ? (
          <p className="text-[11px] text-gray-400">Powered by SuperProfile</p>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            ⚡ Create your own store on SuperProfile — free
          </Link>
        )}
        <p className="mt-3 text-[10px] text-gray-300">Photos from Unsplash</p>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-sm rounded-xl bg-gray-900 px-4 py-3 text-center text-sm text-white shadow-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
