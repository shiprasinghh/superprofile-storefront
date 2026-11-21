"use client";

import type { ReactNode } from "react";
import type { Storefront } from "@/lib/types";
import { formatInr, formatMeta, tierFor } from "@/lib/format";

function Card({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * Creator-only side panel. The AI drafts the store; this panel helps the
 * creator judge whether it is ready to sell, using simple rules of thumb.
 */
export default function CoachPanel({ storefront }: { storefront: Storefront }) {
  const p = storefront.products;

  const checks = [
    {
      ok: storefront.bio.trim().length >= 60,
      label: "Bio says who you help",
      tip: "Aim for 2–3 sentences about who you help and how.",
    },
    {
      ok: p.length >= 2 && p.length <= 4,
      label: `${p.length} focused offerings`,
      tip: "Keep it to 2–4 so buyers aren't overwhelmed.",
    },
    {
      ok: p.some((x) => x.priceInr > 0 && x.priceInr < 500),
      label: "Low-price entry product (under ₹500)",
      tip: "A small first purchase builds trust before bigger buys.",
    },
    {
      ok: p.every((x) => x.priceInr > 0),
      label: "Every product has a price",
      tip: "Add a price to each product.",
    },
    {
      ok: new Set(p.map((x) => formatMeta(x.format).icon)).size >= 2,
      label: "Mix of formats",
      tip: "Try two formats, e.g. an ebook plus a 1:1 call.",
    },
  ];
  const done = checks.filter((c) => c.ok).length;

  const ladder = [...p].sort((x, y) => x.priceInr - y.priceInr);
  const max = Math.max(...p.map((x) => x.priceInr), 1);

  return (
    <div className="space-y-4">
      {storefront.assumptions && (
        <section className="hidden rounded-2xl border border-amber-200 bg-amber-50 p-4 lg:block">
          <p className="text-sm font-semibold text-amber-900">🤔 AI filled in some gaps</p>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">{storefront.assumptions}</p>
          <p className="mt-2 text-xs text-amber-700">Tap any text in your store to correct it.</p>
        </section>
      )}

      <Card
        title="Store readiness"
        subtitle="Quick checks before you share"
        right={
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${done === checks.length ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
          >
            {done}/{checks.length}
          </span>
        }
      >
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${(done / checks.length) * 100}%` }}
          />
        </div>
        <ul className="mt-3 space-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex gap-2 text-sm">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${c.ok ? "bg-emerald-500 text-white" : "border border-gray-300 text-transparent"}`}
                aria-hidden
              >
                ✓
              </span>
              <div>
                <p className={c.ok ? "text-gray-700" : "font-medium text-gray-900"}>{c.label}</p>
                {!c.ok && <p className="text-xs text-gray-500">{c.tip}</p>}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="Your price ladder"
        subtitle="Lead buyers from a small first purchase to bigger ones."
      >
        <ul className="space-y-3">
          {ladder.map((x, i) => {
            const t = tierFor(x.priceInr);
            return (
              <li key={i}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${t.pill}`}>
                      {t.label}
                    </span>
                    <span className="truncate text-gray-700">{x.title}</span>
                  </div>
                  <span className="shrink-0 font-semibold text-gray-900">{formatInr(x.priceInr)}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${t.bar}`}
                    style={{ width: `${Math.max(6, (x.priceInr / max) * 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="After you publish" subtitle="Where your first buyers come from">
        <ol className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="font-semibold text-gray-400">1</span>Add the link to your Instagram bio
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-gray-400">2</span>Share it on WhatsApp status &amp; groups
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-gray-400">3</span>Post a Reel that points to your entry product
          </li>
        </ol>
      </Card>
    </div>
  );
}
