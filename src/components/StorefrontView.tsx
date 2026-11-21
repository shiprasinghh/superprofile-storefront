"use client";

import { type Accent, type Product, type Storefront } from "@/lib/types";

const ACCENT_CLASSES: Record<Accent, { grad: string; text: string; ring: string; soft: string }> = {
  violet: { grad: "from-violet-500 to-indigo-500", text: "text-violet-700", ring: "ring-violet-200", soft: "bg-violet-50" },
  emerald: { grad: "from-emerald-500 to-teal-500", text: "text-emerald-700", ring: "ring-emerald-200", soft: "bg-emerald-50" },
  rose: { grad: "from-rose-500 to-pink-500", text: "text-rose-700", ring: "ring-rose-200", soft: "bg-rose-50" },
  amber: { grad: "from-amber-500 to-orange-500", text: "text-amber-700", ring: "ring-amber-200", soft: "bg-amber-50" },
  sky: { grad: "from-sky-500 to-blue-500", text: "text-sky-700", ring: "ring-sky-200", soft: "bg-sky-50" },
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatInr(n: number): string {
  return "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));
}

type EditHandlers = {
  onChange: (patch: Partial<Storefront>) => void;
  onProductChange: (index: number, patch: Partial<Product>) => void;
  onRegenBio: () => void;
  onRegenProduct: (index: number) => void;
  onDeleteProduct: (index: number) => void;
  busyBio?: boolean;
  busyProduct?: number | null;
};

export default function StorefrontView({
  storefront,
  edit,
}: {
  storefront: Storefront;
  edit?: EditHandlers;
}) {
  const a = ACCENT_CLASSES[storefront.accent] ?? ACCENT_CLASSES.violet;
  const editable = !!edit;

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5">
      {/* Header */}
      <div className={`bg-gradient-to-br ${a.grad} px-6 pb-8 pt-10 text-center text-white`}>
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-2xl font-bold ring-4 ring-white/30 backdrop-blur">
          {initials(storefront.creatorName) || "★"}
        </div>
        {editable ? (
          <input
            className="mt-4 w-full bg-transparent text-center text-2xl font-bold text-white placeholder-white/60 outline-none focus:border-b focus:border-white/50"
            value={storefront.creatorName}
            onChange={(e) => edit!.onChange({ creatorName: e.target.value })}
            aria-label="Creator name"
          />
        ) : (
          <h1 className="mt-4 text-2xl font-bold">{storefront.creatorName}</h1>
        )}
        {editable ? (
          <input
            className="mt-1 w-full bg-transparent text-center text-sm text-white/90 placeholder-white/60 outline-none"
            value={storefront.tagline}
            onChange={(e) => edit!.onChange({ tagline: e.target.value })}
            aria-label="Tagline"
          />
        ) : (
          <p className="mt-1 text-sm text-white/90">{storefront.tagline}</p>
        )}
      </div>

      {/* Body */}
      <div className="space-y-6 px-5 py-6">
        {/* Bio */}
        <section>
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">About</h2>
            {editable && (
              <button
                onClick={edit!.onRegenBio}
                disabled={edit!.busyBio}
                className={`text-xs font-medium ${a.text} disabled:opacity-40`}
              >
                {edit!.busyBio ? "Rewriting…" : "↻ Rewrite"}
              </button>
            )}
          </div>
          {editable ? (
            <textarea
              className="w-full resize-none rounded-xl bg-gray-50 p-3 text-sm leading-relaxed text-gray-700 outline-none ring-1 ring-transparent focus:ring-gray-200"
              rows={3}
              value={storefront.bio}
              onChange={(e) => edit!.onChange({ bio: e.target.value })}
              aria-label="Bio"
            />
          ) : (
            <p className="text-sm leading-relaxed text-gray-700">{storefront.bio}</p>
          )}
        </section>

        {/* Products */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            What you can get
          </h2>
          {storefront.products.map((p, i) => (
            <article key={i} className="rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <span className={`rounded-full ${a.soft} ${a.text} px-2.5 py-0.5 text-[11px] font-semibold`}>
                  {editable ? (
                    <input
                      className="w-24 bg-transparent outline-none"
                      value={p.format}
                      onChange={(e) => edit!.onProductChange(i, { format: e.target.value })}
                      aria-label="Product format"
                    />
                  ) : (
                    p.format
                  )}
                </span>
                {editable && (
                  <div className="flex shrink-0 gap-2 text-xs">
                    <button
                      onClick={() => edit!.onRegenProduct(i)}
                      disabled={edit!.busyProduct === i}
                      className={`font-medium ${a.text} disabled:opacity-40`}
                    >
                      {edit!.busyProduct === i ? "…" : "↻"}
                    </button>
                    {storefront.products.length > 2 && (
                      <button
                        onClick={() => edit!.onDeleteProduct(i)}
                        className="font-medium text-gray-300 hover:text-rose-500"
                        aria-label="Remove product"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>

              {editable ? (
                <input
                  className="mt-2 w-full bg-transparent text-base font-semibold text-gray-900 outline-none"
                  value={p.title}
                  onChange={(e) => edit!.onProductChange(i, { title: e.target.value })}
                  aria-label="Product title"
                />
              ) : (
                <h3 className="mt-2 text-base font-semibold text-gray-900">{p.title}</h3>
              )}

              {editable ? (
                <textarea
                  className="mt-1 w-full resize-none rounded-lg bg-gray-50 p-2 text-sm text-gray-600 outline-none"
                  rows={2}
                  value={p.description}
                  onChange={(e) => edit!.onProductChange(i, { description: e.target.value })}
                  aria-label="Product description"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-600">{p.description}</p>
              )}

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-gray-900">
                    {editable ? (
                      <span className="inline-flex items-baseline">
                        ₹
                        <input
                          type="number"
                          className="w-20 bg-transparent font-bold outline-none"
                          value={p.priceInr}
                          onChange={(e) =>
                            edit!.onProductChange(i, { priceInr: Number(e.target.value) || 0 })
                          }
                          aria-label="Price in INR"
                        />
                      </span>
                    ) : (
                      formatInr(p.priceInr)
                    )}
                  </span>
                </div>
                <button
                  className={`rounded-full bg-gradient-to-r ${a.grad} px-4 py-1.5 text-sm font-semibold text-white shadow`}
                  type="button"
                >
                  Get this
                </button>
              </div>

              {editable ? (
                <input
                  className="mt-2 w-full bg-transparent text-[11px] italic text-gray-400 outline-none"
                  value={p.priceRationale}
                  onChange={(e) => edit!.onProductChange(i, { priceRationale: e.target.value })}
                  aria-label="Price rationale"
                />
              ) : (
                p.priceRationale && (
                  <p className="mt-2 text-[11px] italic text-gray-400">{p.priceRationale}</p>
                )
              )}
            </article>
          ))}
        </section>

        <p className="pt-2 text-center text-[11px] text-gray-300">
          Made with SuperStore · built on SuperProfile
        </p>
      </div>
    </div>
  );
}
