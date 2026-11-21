"use client";

import { useState } from "react";
import StorefrontView from "@/components/StorefrontView";
import CoachPanel from "@/components/CoachPanel";
import PublishSheet from "@/components/PublishSheet";
import { encodeStorefront } from "@/lib/share";
import { TONES, type Product, type Storefront, type Tone } from "@/lib/types";

type Phase = "input" | "loading" | "editing";
type MobileTab = "store" | "coach";

const EXAMPLES = [
  { emoji: "🧘🏽‍♀️", label: "Fitness coach", text: "I'm a home-workout coach for busy moms in Pune. 18k on Instagram. I teach 20-min no-equipment routines." },
  { emoji: "📊", label: "Finance creator", text: "CA who explains personal finance & tax saving in simple Hindi. Small but engaged audience." },
  { emoji: "🎨", label: "Art teacher", text: "I teach Warli & doodle art online. I sell to hobbyists and parents looking for kids' activities." },
];

const LOADING_STEPS = [
  "Understanding your niche",
  "Writing your bio",
  "Designing product ideas",
  "Setting India-ready prices",
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
  const [mobileTab, setMobileTab] = useState<MobileTab>("store");
  const [publishUrl, setPublishUrl] = useState<string | null>(null);

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
      setMobileTab("store");
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
      s && s.products.length > 2 ? { ...s, products: s.products.filter((_, i) => i !== index) } : s,
    );
  }

  function shareUrl(): string {
    return `${window.location.origin}/s/${encodeStorefront(storefront!)}`;
  }
  function openPublic() {
    if (storefront) window.open(`/s/${encodeStorefront(storefront)}`, "_blank");
  }
  function publish() {
    if (storefront) setPublishUrl(shareUrl());
  }

  // ---------- INPUT ----------
  if (phase === "input") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-white">
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-2xl font-bold text-white shadow-lg shadow-violet-200">
              S
            </div>
            <h1 className="text-[27px] font-bold leading-tight tracking-tight text-gray-900">
              Your creator store,
              <br />
              written for you
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
              Describe what you do in one line. AI drafts your bio, product ideas and prices — you
              edit and share in minutes.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-xl shadow-violet-100/50 ring-1 ring-black/5">
            <label className="mb-1.5 block text-sm font-semibold text-gray-800">
              What do you do?
            </label>
            <textarea
              className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm leading-relaxed outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              rows={3}
              placeholder="e.g. I'm a yoga teacher in Jaipur. I help beginners build a daily practice…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <p className="mb-2 mt-3 text-[11px] font-medium uppercase tracking-wide text-gray-400">
              Or start from an example
            </p>
            <div className="flex flex-col gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => setDescription(ex.text)}
                  className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3 py-2 text-left text-sm text-gray-600 transition hover:border-violet-300 hover:bg-violet-50"
                >
                  <span className="text-lg">{ex.emoji}</span>
                  <span className="font-medium text-gray-700">{ex.label}</span>
                  <span className="ml-auto text-xs text-gray-300">Use →</span>
                </button>
              ))}
            </div>

            <label className="mb-1.5 mt-5 block text-sm font-semibold text-gray-800">
              Instagram handle <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              placeholder="@yourhandle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />

            <label className="mb-1.5 mt-5 block text-sm font-semibold text-gray-800">Language</label>
            <div className="flex gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    tone === t
                      ? "border-violet-400 bg-violet-50 text-violet-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-rose-50 p-2.5 text-sm text-rose-600">{error}</p>
            )}

            <button
              onClick={generate}
              disabled={!description.trim() && !handle.trim()}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-200 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Generate my store ✨
            </button>
          </div>

          <p className="mt-4 text-center text-[11px] text-gray-400">
            🔒 We don&apos;t read Instagram — your description is what we use.
          </p>
        </div>
      </main>
    );
  }

  // ---------- LOADING ----------
  if (phase === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-violet-50 to-white px-6">
        <div className="relative mb-8 h-16 w-16">
          <div className="absolute inset-0 animate-ping rounded-full bg-violet-200" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-2xl text-white shadow-lg">
            ✨
          </div>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Building your store…</h2>
        <ul className="mt-5 space-y-2.5">
          {LOADING_STEPS.map((s, i) => (
            <li
              key={s}
              className="flex items-center gap-2.5 text-sm text-gray-500"
              style={{ animation: "fadeUp .5s ease both", animationDelay: `${i * 0.25}s` }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
              {s}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-gray-400">This usually takes a few seconds.</p>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
      </main>
    );
  }

  // ---------- EDITING ----------
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button
            onClick={() => setPhase("input")}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800"
          >
            ← Start over
          </button>
          <span className="hidden text-sm font-semibold text-gray-900 sm:block">
            Editing your store
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={regenerateAll}
              disabled={regenAll}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              {regenAll ? "Regenerating…" : "↻ Regenerate all"}
            </button>
            <button
              onClick={publish}
              className="hidden rounded-full bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 sm:block"
            >
              Publish &amp; share
            </button>
          </div>
        </div>
      </header>

      {error && (
        <p className="mx-auto mt-3 max-w-5xl px-4 text-sm text-rose-600">{error}</p>
      )}

      {/* Mobile segmented control */}
      <div className="sticky top-[57px] z-20 border-b border-gray-200 bg-gray-50 px-4 py-2 lg:hidden">
        <div className="mx-auto flex max-w-md rounded-xl bg-gray-200/70 p-1">
          {(["store", "coach"] as MobileTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setMobileTab(t)}
              className={`flex-1 rounded-lg py-1.5 text-sm font-medium capitalize transition ${
                mobileTab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {t === "store" ? "Your store" : "Tips & checks"}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-6 pb-28 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {/* Preview */}
        <div className={`${mobileTab === "store" ? "block" : "hidden"} lg:block`}>
          <p className="mb-2 hidden text-xs font-medium text-gray-400 lg:block">
            👇 Tap any text to edit it — changes show instantly
          </p>
          {/* Phone frame on desktop */}
          <div className="mx-auto max-w-md overflow-hidden rounded-[32px] bg-white shadow-xl ring-1 ring-black/5 lg:border-[6px] lg:border-gray-900/90">
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
          </div>
        </div>

        {/* Coach panel */}
        <aside className={`${mobileTab === "coach" ? "block" : "hidden"} lg:sticky lg:top-24 lg:block`}>
          {storefront && <CoachPanel storefront={storefront} />}
        </aside>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 p-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md gap-2">
          <button
            onClick={openPublic}
            className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700"
          >
            Preview
          </button>
          <button
            onClick={publish}
            className="flex-[2] rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200"
          >
            Publish &amp; share →
          </button>
        </div>
      </div>

      {publishUrl && storefront && (
        <PublishSheet
          url={publishUrl}
          name={storefront.creatorName}
          onClose={() => setPublishUrl(null)}
        />
      )}
    </main>
  );
}
