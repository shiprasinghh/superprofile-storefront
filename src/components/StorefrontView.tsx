"use client";

import { useState } from "react";
import Link from "next/link";
import type { Accent, Product, Storefront } from "@/lib/types";
import { formatInr, formatMeta, initials, startHereIndex } from "@/lib/format";

// Full class strings (not built dynamically) so Tailwind keeps them.
const ACCENT: Record<
  Accent,
  { grad: string; text: string; soft: string; btn: string; ring: string; border: string }
> = {
  violet: {
    grad: "from-violet-500 via-purple-500 to-indigo-500",
    text: "text-violet-700",
    soft: "bg-violet-50",
    btn: "bg-violet-600 hover:bg-violet-700",
    ring: "focus:ring-violet-200",
    border: "border-violet-300",
  },
  emerald: {
    grad: "from-emerald-400 via-emerald-500 to-teal-600",
    text: "text-emerald-700",
    soft: "bg-emerald-50",
    btn: "bg-emerald-600 hover:bg-emerald-700",
    ring: "focus:ring-emerald-200",
    border: "border-emerald-300",
  },
  rose: {
    grad: "from-rose-400 via-pink-500 to-fuchsia-500",
    text: "text-rose-700",
    soft: "bg-rose-50",
    btn: "bg-rose-600 hover:bg-rose-700",
    ring: "focus:ring-rose-200",
    border: "border-rose-300",
  },
  amber: {
    grad: "from-amber-400 via-orange-500 to-red-400",
    text: "text-amber-700",
    soft: "bg-amber-50",
    btn: "bg-orange-600 hover:bg-orange-700",
    ring: "focus:ring-amber-200",
    border: "border-amber-300",
  },
  sky: {
    grad: "from-sky-400 via-blue-500 to-indigo-500",
    text: "text-sky-700",
    soft: "bg-sky-50",
    btn: "bg-blue-600 hover:bg-blue-700",
    ring: "focus:ring-sky-200",
    border: "border-sky-300",
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

/**
 * One component renders both views of a store:
 *  - buyer view (no `edit`): clean, conversion-focused page
 *  - creator view (`edit`): same layout, every text tap-to-edit, plus
 *    creator-only coaching (pricing rationale) that buyers never see.
 */
export default function StorefrontView({
  storefront,
  edit,
}: {
  storefront: Storefront;
  edit?: EditHandlers;
}) {
  const a = ACCENT[storefront.accent] ?? ACCENT.violet;
  const editable = !!edit;
  const start = startHereIndex(storefront.products);
  const [toast, setToast] = useState<string | null>(null);

  // Subtle "this is editable" affordance: tint on hover, ring on focus.
  const field = `rounded-md outline-none transition hover:bg-gray-100/80 focus:bg-white focus:ring-2 ${a.ring}`;

  function onBuy(p: Product) {
    if (editable) return;
    setToast(`Checkout for “${p.title}” opens once this store is live on SuperProfile. (Demo)`);
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <div className="w-full bg-white">
      {/* Cover */}
      <div className={`relative h-32 bg-gradient-to-br ${a.grad}`}>
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_15%_25%,rgba(255,255,255,.6)_0,transparent_35%),radial-gradient(circle_at_85%_0%,rgba(255,255,255,.5)_0,transparent_30%)]" />
      </div>

      {/* Identity */}
      <div className="-mt-12 px-5 text-center">
        <div
          className={`relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${a.grad} text-3xl font-bold text-white shadow-lg ring-4 ring-white`}
        >
          {initials(storefront.creatorName) || "★"}
        </div>

        {editable ? (
          <input
            className={`mt-3 w-full text-center text-2xl font-bold tracking-tight text-gray-900 ${field}`}
            value={storefront.creatorName}
            onChange={(e) => edit!.onChange({ creatorName: e.target.value })}
            aria-label="Creator name"
          />
        ) : (
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
            {storefront.creatorName}
          </h1>
        )}

        {editable ? (
          <textarea
            rows={1}
            className={`mt-1 w-full resize-none text-center text-[15px] leading-snug text-gray-600 [field-sizing:content] ${field}`}
            value={storefront.tagline}
            onChange={(e) => edit!.onChange({ tagline: e.target.value })}
            aria-label="Tagline"
          />
        ) : (
          <p className="mt-1 text-[15px] leading-snug text-gray-600">{storefront.tagline}</p>
        )}

        <div className="mt-3 flex justify-center">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${a.soft} ${a.text}`}>
            {editable ? (
              <input
                className="bg-transparent text-center outline-none"
                size={Math.max(10, storefront.niche.length)}
                value={storefront.niche}
                onChange={(e) => edit!.onChange({ niche: e.target.value })}
                aria-label="Niche"
              />
            ) : (
              storefront.niche
            )}
          </span>
        </div>
      </div>

      {/* Bio */}
      <section className="mx-5 mt-5">
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
            className={`min-h-[96px] w-full resize-none p-2 text-[15px] leading-relaxed text-gray-700 [field-sizing:content] ${field} ${edit!.busyBio ? "animate-pulse opacity-50" : ""}`}
            value={storefront.bio}
            onChange={(e) => edit!.onChange({ bio: e.target.value })}
            aria-label="Bio"
          />
        ) : (
          <p className="text-center text-[15px] leading-relaxed text-gray-700">{storefront.bio}</p>
        )}
      </section>

      {/* Products */}
      <section className="mt-7 px-4">
        <div className="mb-4 flex items-baseline justify-between px-1">
          <h2 className="text-sm font-semibold text-gray-900">Products &amp; services</h2>
          <span className="text-xs text-gray-400">{storefront.products.length} offerings</span>
        </div>

        <div className="space-y-4">
          {storefront.products.map((p, i) => {
            const meta = formatMeta(p.format);
            const busy = edit?.busyProduct === i;
            const isStart = i === start;
            return (
              <article
                key={i}
                className={`relative rounded-2xl border bg-white p-4 shadow-sm ${isStart ? `border-2 ${a.border}` : "border-gray-200"}`}
              >
                {isStart && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-gray-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Best place to start
                  </span>
                )}

                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${a.soft}`}
                    aria-hidden
                  >
                    {meta.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    {editable ? (
                      <input
                        className={`w-full text-[11px] font-semibold uppercase tracking-wide ${a.text} ${field}`}
                        value={p.format}
                        onChange={(e) => edit!.onProductChange(i, { format: e.target.value })}
                        aria-label="Product format"
                      />
                    ) : (
                      <p className={`text-[11px] font-semibold uppercase tracking-wide ${a.text}`}>
                        {p.format}
                      </p>
                    )}
                    {editable ? (
                      <textarea
                        rows={1}
                        className={`mt-0.5 w-full resize-none text-base font-semibold leading-snug text-gray-900 [field-sizing:content] ${field}`}
                        value={p.title}
                        onChange={(e) => edit!.onProductChange(i, { title: e.target.value })}
                        aria-label="Product title"
                      />
                    ) : (
                      <h3 className="mt-0.5 text-base font-semibold leading-snug text-gray-900">
                        {p.title}
                      </h3>
                    )}
                    <p className="mt-0.5 text-xs text-gray-500">{meta.detail}</p>
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
                      {storefront.products.length > 2 && (
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
                    className={`mt-3 w-full resize-none p-1 text-sm leading-relaxed text-gray-600 [field-sizing:content] ${field}`}
                    rows={3}
                    value={p.description}
                    onChange={(e) => edit!.onProductChange(i, { description: e.target.value })}
                    aria-label="Product description"
                  />
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">{p.description}</p>
                )}

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                  <div className="flex items-baseline gap-0.5">
                    {editable ? (
                      <span className="flex items-baseline text-xl font-bold text-gray-900">
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
                      <span className="text-xl font-bold text-gray-900">{formatInr(p.priceInr)}</span>
                    )}
                    {meta.suffix && <span className="text-xs text-gray-400">{meta.suffix}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onBuy(p)}
                    tabIndex={editable ? -1 : 0}
                    title={editable ? "Buyers will tap this to purchase" : undefined}
                    className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${a.btn} ${editable ? "cursor-default" : ""}`}
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

                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 text-sm font-medium text-gray-600 backdrop-blur-[1px]">
                    <span className="animate-pulse">✨ Thinking of a new idea…</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Trust row: reduces purchase anxiety for first-time buyers */}
      <div className="mx-4 mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl bg-gray-50 px-3 py-2.5 text-[11px] text-gray-500">
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
