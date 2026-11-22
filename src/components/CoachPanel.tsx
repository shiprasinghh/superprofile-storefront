"use client";

import { useState } from "react";
import type { Storefront } from "@/lib/types";
import { formatInr, livePrice, productKind, productPhoto } from "@/lib/format";

export type FixTarget = "edit-bio" | "edit-trust" | "edit-products";

type Check = {
  short: string;
  ok: boolean;
  icon: string;
  title: string;
  hint: string;
  action: string;
  target: FixTarget;
};

const RING = 2 * Math.PI * 27;

/**
 * Creator-only "Tips and checks", kept to one screen: a progress ring, the
 * single next thing to fix (with a button that jumps to it), done items in one
 * line, the price ladder, and one-tap share actions for after publishing.
 */
export default function CoachPanel({
  storefront: s,
  onFix,
  onPublish,
  shareUrl,
}: {
  storefront: Storefront;
  onFix: (target: FixTarget) => void;
  onPublish: () => void;
  shareUrl: () => string;
}) {
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showReel, setShowReel] = useState(false);
  const p = s.products;

  const checks: Check[] = [
    {
      short: "Bio",
      ok: s.bio.trim().length >= 60,
      icon: "✍️",
      title: "Write a short bio",
      hint: "Say who you help and how",
      action: "Edit",
      target: "edit-bio",
    },
    {
      short: "Trust",
      ok: (s.proof ?? []).some((x) => x.text.trim()) || !!s.testimonial?.quote.trim(),
      icon: "🛡️",
      title: "Add why buyers can trust you",
      hint: "Followers, experience or a qualification",
      action: "Add",
      target: "edit-trust",
    },
    {
      short: `${p.length} products`,
      ok: p.length >= 2 && p.length <= 4,
      icon: "📦",
      title: "Keep 2 to 4 products",
      hint: "Fewer choices make buying easier",
      action: "Fix",
      target: "edit-products",
    },
    {
      short: "Prices",
      ok: p.every((x) => x.priceInr > 0),
      icon: "🏷️",
      title: "Price every product",
      hint: "Buyers need to see a price",
      action: "Fix",
      target: "edit-products",
    },
    {
      short: "Starter offer",
      ok: p.some((x) => x.priceInr > 0 && x.priceInr < 500),
      icon: "🌱",
      title: "Add a product under ₹500",
      hint: "A small first buy builds trust",
      action: "Fix",
      target: "edit-products",
    },
    {
      short: "Mix",
      ok: new Set(p.map(productKind)).size >= 2,
      icon: "🧩",
      title: "Offer two kinds of product",
      hint: "For example a guide plus a live workshop",
      action: "Fix",
      target: "edit-products",
    },
  ];

  const done = checks.filter((c) => c.ok);
  const todo = checks.filter((c) => !c.ok);
  const next = todo[0];
  const left = todo.length;

  const ladder = p
    .map((prod, i) => ({ prod, i, price: livePrice(prod).price }))
    .sort((a, b) => a.price - b.price);
  const hasPremium = ladder.some((x) => x.price >= 2999);
  const entry = ladder[0];

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((k) => (k === key ? null : k)), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  const entryLine = entry ? `“${entry.prod.title}” at ${formatInr(entry.price)}` : "";
  const statusText = () =>
    `✨ My store is live! ${s.tagline}\n${entry ? `Start with ${entryLine}.\n` : ""}${shareUrl()}`;
  const reelIdea = entry
    ? `Share one quick tip from “${entry.prod.title}” in 15 seconds. End with: “Want the full thing? It's ${formatInr(entry.price)}, link in my bio.”`
    : `Share one quick tip from your niche in 15 seconds, then point to the link in your bio.`;

  return (
    <div className="space-y-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden>
          <circle cx="32" cy="32" r="27" fill="none" stroke="#f1f1f4" strokeWidth="7" />
          <circle
            cx="32"
            cy="32"
            r="27"
            fill="none"
            stroke="#10b981"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${(done.length / checks.length) * RING} ${RING}`}
            transform="rotate(-90 32 32)"
            className="transition-all duration-500"
          />
          <text x="32" y="38" textAnchor="middle" fontSize="16" fontWeight="700" fill="#111827">
            {done.length}/{checks.length}
          </text>
        </svg>
        <div>
          <p className="text-base font-bold text-gray-900">
            {left === 0 ? "Ready to share" : left === 1 ? "Almost ready" : "Getting there"}
          </p>
          <p className="text-xs text-gray-500">
            {left === 0
              ? "Your store looks clear and trustworthy"
              : `${left} step${left > 1 ? "s" : ""} left before you share`}
          </p>
        </div>
      </div>

      {/* The one next thing to do, or the publish nudge */}
      {next ? (
        <div className="flex items-center gap-3 rounded-2xl bg-orange-50 p-3">
          <span className="text-xl" aria-hidden>
            {next.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-orange-900">{next.title}</p>
            <p className="text-xs text-orange-800/80">{next.hint}</p>
          </div>
          <button
            onClick={() => onFix(next.target)}
            className="shrink-0 rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-gray-800"
          >
            {next.action}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-3">
          <span className="text-xl" aria-hidden>
            🎉
          </span>
          <p className="min-w-0 flex-1 text-sm font-semibold text-emerald-900">All checks done</p>
          <button
            onClick={onPublish}
            className="shrink-0 rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-gray-800"
          >
            Publish
          </button>
        </div>
      )}

      {/* Done, in one line */}
      {done.length > 0 && (
        <div className="text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
              ✓
            </span>
            <span className="min-w-0 flex-1 truncate">{done.map((c) => c.short).join(", ")}</span>
            <button onClick={() => setShowAll((v) => !v)} className="shrink-0 font-medium text-gray-700 hover:underline">
              {showAll ? "Hide" : "See all"}
            </button>
          </div>
          {showAll && (
            <ul className="mt-2 space-y-1.5 border-l border-gray-100 pl-6">
              {checks.map((c) => (
                <li key={c.title} className="flex items-center gap-2">
                  <span className={c.ok ? "text-emerald-600" : "text-gray-300"}>{c.ok ? "✓" : "○"}</span>
                  <span className={c.ok ? "" : "font-medium text-gray-800"}>{c.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {s.assumptions && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span className="font-semibold">AI filled in some gaps:</span> {s.assumptions}
        </p>
      )}

      <hr className="border-gray-100" />

      {/* Price ladder */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500">Price ladder</p>
        <div className="flex items-start justify-between gap-1">
          {ladder.map((x, n) => (
            <div key={x.i} className="flex items-start gap-1">
              {n > 0 && <span className="mt-3 text-gray-300">›</span>}
              <div className="w-12 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={productPhoto(s, x.prod, x.i)}
                  alt=""
                  className="h-12 w-12 rounded-xl object-cover ring-1 ring-black/5"
                />
                <p className="mt-1 text-xs font-bold text-gray-900">{formatInr(x.price)}</p>
              </div>
            </div>
          ))}
          {!hasPremium && (
            <div className="flex items-start gap-1">
              <span className="mt-3 text-gray-300">›</span>
              <button onClick={() => onFix("edit-products")} className="w-12 text-center" title="Add a premium product">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-gray-300 text-lg text-gray-400">
                  +
                </span>
                <span className="mt-1 block text-[11px] text-gray-400">₹2,999+</span>
              </button>
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {hasPremium
            ? "Nice spread, from a small first buy to premium."
            : "Good start. A premium option could earn more."}
        </p>
      </div>

      <hr className="border-gray-100" />

      {/* After you publish: one tap each */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500">After you publish</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => copy("bio", shareUrl())}
            className="rounded-2xl border border-gray-200 py-2.5 text-center text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <span className="block text-lg" aria-hidden>
              📸
            </span>
            {copied === "bio" ? "Link copied" : "Bio link"}
          </button>
          <button
            onClick={() => copy("status", statusText())}
            className="rounded-2xl border border-gray-200 py-2.5 text-center text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <span className="block text-lg" aria-hidden>
              💬
            </span>
            {copied === "status" ? "Message copied" : "WhatsApp status"}
          </button>
          <button
            onClick={() => setShowReel((v) => !v)}
            className={`rounded-2xl border py-2.5 text-center text-xs font-medium hover:bg-gray-50 ${showReel ? "border-gray-900 text-gray-900" : "border-gray-200 text-gray-700"}`}
          >
            <span className="block text-lg" aria-hidden>
              🎬
            </span>
            Reel idea
          </button>
        </div>
        {showReel && (
          <div className="mt-2 rounded-2xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-700">
            {reelIdea}
            <button
              onClick={() => copy("reel", reelIdea)}
              className="mt-1.5 block font-semibold text-gray-900 hover:underline"
            >
              {copied === "reel" ? "Copied" : "Copy idea"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
