"use client";

import { useState } from "react";
import StorefrontView from "@/components/StorefrontView";
import { encodeStorefront } from "@/lib/share";
import { TONES, type Product, type Storefront, type Tone } from "@/lib/types";

type Phase = "input" | "loading" | "editing";

const EXAMPLES = [
  "I'm a home-workout coach for busy moms in Pune. 18k on Instagram. I teach 20-min no-equipment routines.",
  "CA who explains personal finance & tax saving in simple Hindi. Small but engaged audience.",
  "I teach Warli & doodle art online. I sell to hobbyists and parents looking for kids' activities.",
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>("input");
  const [description, setDescription] = useState("");
  const [handle, setHandle] = useState("");
  const [tone, setTone] = useState<Tone>("English");
  const [error, setError] = useState<string | null>(null);

  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [busyBio, setBusyBio] = useState(false);
  const [busyProduct, setBusyProduct] = useState<number | null>(null);
  const [regenAll, setRegenAll] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setError(null);
    setPhase("loading");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "full", description, handle, tone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Something went wrong.");
      setStorefront(data.storefront as Storefront);
      setPhase("editing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("input");
    }
  }

  async function regenerateAll() {
    if (!storefront) return;
    setRegenAll(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "full", description, handle, tone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error);
      setStorefront(data.storefront as Storefront);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not regenerate.");
    } finally {
      setRegenAll(false);
    }
  }

  async function regenBio() {
    if (!storefront) return;
    setBusyBio(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "bio", current: storefront, tone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error);
      setStorefront({ ...storefront, bio: data.bio });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not rewrite bio.");
    } finally {
      setBusyBio(false);
    }
  }

  async function regenProduct(index: number) {
    if (!storefront) return;
    setBusyProduct(index);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "product", current: storefront, index, tone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error);
      const products = storefront.products.map((p, i) => (i === index ? (data.product as Product) : p));
      setStorefront({ ...storefront, products });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not regenerate product.");
    } finally {
      setBusyProduct(null);
    }
  }

  function updateStorefront(patch: Partial<Storefront>) {
    setStorefront((s) => (s ? { ...s, ...patch } : s));
  }
  function updateProduct(index: number, patch: Partial<Product>) {
    setStorefront((s) =>
      s ? { ...s, products: s.products.map((p, i) => (i === index ? { ...p, ...patch } : p)) } : s,
    );
  }
  function deleteProduct(index: number) {
    setStorefront((s) =>
      s && s.products.length > 2
        ? { ...s, products: s.products.filter((_, i) => i !== index) }
        : s,
    );
  }

  async function share() {
    if (!storefront) return;
    const url = `${window.location.origin}/s/${encodeStorefront(storefront)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: storefront.creatorName, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user dismissed share sheet */
    }
  }

  function openPublic() {
    if (!storefront) return;
    window.open(`/s/${encodeStorefront(storefront)}`, "_blank");
  }

  // ---------- INPUT ----------
  if (phase === "input") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-xl font-bold text-white">
            S
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Your store, in a minute</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tell us what you do. We&apos;ll draft your bio, products and prices — you edit and share.
          </p>
        </div>

        <label className="mb-1 block text-sm font-medium text-gray-700">
          About you & what you teach
        </label>
        <textarea
          className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          rows={4}
          placeholder="e.g. I'm a yoga teacher in Jaipur. I help beginners build a daily practice…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setDescription(ex)}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-500 hover:bg-gray-200"
            >
              Try example {i + 1}
            </button>
          ))}
        </div>

        <label className="mb-1 mt-4 block text-sm font-medium text-gray-700">
          Instagram handle <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          placeholder="@yourhandle"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />

        <label className="mb-1 mt-4 block text-sm font-medium text-gray-700">Language</label>
        <div className="flex gap-2">
          {TONES.map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                tone === t
                  ? "border-violet-400 bg-violet-50 text-violet-700"
                  : "border-gray-200 text-gray-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 p-2.5 text-sm text-rose-600">{error}</p>
        )}

        <button
          onClick={generate}
          disabled={!description.trim() && !handle.trim()}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-200 disabled:opacity-40"
        >
          Generate my store ✨
        </button>
        <p className="mt-3 text-center text-[11px] text-gray-400">
          We don&apos;t read Instagram — your description is what we use.
        </p>
      </main>
    );
  }

  // ---------- LOADING ----------
  if (phase === "loading") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-200 border-t-violet-500" />
        <p className="mt-5 animate-pulse text-sm text-gray-500">
          Writing your bio, product ideas and prices…
        </p>
        <p className="mt-1 text-xs text-gray-400">This usually takes a few seconds.</p>
      </main>
    );
  }

  // ---------- EDITING ----------
  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setPhase("input")} className="text-sm text-gray-400">
          ← Start over
        </button>
        <button
          onClick={regenerateAll}
          disabled={regenAll}
          className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 disabled:opacity-40"
        >
          {regenAll ? "Regenerating…" : "↻ Regenerate all"}
        </button>
      </div>

      {storefront?.assumptions ? (
        <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
          <span className="font-semibold">We filled in some gaps:</span> {storefront.assumptions} Tap
          any text to edit.
        </div>
      ) : (
        <p className="mb-4 text-center text-xs text-gray-400">Tap any text to edit it.</p>
      )}

      {error && (
        <p className="mb-3 rounded-lg bg-rose-50 p-2.5 text-sm text-rose-600">{error}</p>
      )}

      {storefront && (
        <StorefrontView
          storefront={storefront}
          edit={{
            onChange: updateStorefront,
            onProductChange: updateProduct,
            onRegenBio: regenBio,
            onRegenProduct: regenProduct,
            onDeleteProduct: deleteProduct,
            busyBio,
            busyProduct,
          }}
        />
      )}

      {/* Sticky share bar */}
      <div className="sticky bottom-4 mt-5 flex gap-2">
        <button
          onClick={openPublic}
          className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 shadow"
        >
          Preview page
        </button>
        <button
          onClick={share}
          className="flex-[2] rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200"
        >
          {copied ? "Link copied ✓" : "Publish & share →"}
        </button>
      </div>
    </main>
  );
}
