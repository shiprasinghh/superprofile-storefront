"use client";

import { useEffect, useState } from "react";

/** Post-publish sheet. WhatsApp first: it's where Indian creators share links. */
export default function PublishSheet({
  url,
  name,
  tagline,
  onClose,
}: {
  url: string;
  name: string;
  tagline?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the link is visible to copy manually */
    }
  }

  // Short, warm message with the link on its own line at the end, so WhatsApp
  // reads cleanly and shows the store's preview card above the link.
  const message = [
    `✨ ${name} is live!`,
    tagline?.trim() || "Everything I offer, in one link.",
    "",
    "Have a look 👇",
    url,
  ].join("\n");
  const wa = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-title"
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />
        <div className="text-center">
          <div className="text-4xl">🎉</div>
          <h2 id="publish-title" className="mt-2 text-xl font-bold text-gray-900">
            Your store is ready to share
          </h2>
          <p className="mt-1 text-sm text-gray-500">Anyone with this link can open it — no login needed.</p>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1.5 pl-3">
          <span className="min-w-0 flex-1 truncate text-sm text-gray-600">
            {url.replace(/^https?:\/\//, "")}
          </span>
          <button
            onClick={copy}
            className="shrink-0 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white"
          >
            {copied ? "Copied ✓" : "Copy link"}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-[#25D366] py-3 text-center text-sm font-semibold text-white hover:brightness-95"
          >
            Share on WhatsApp
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-gray-200 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Open page ↗
          </a>
        </div>

        <div className="mt-4 rounded-xl bg-violet-50 p-3 text-xs leading-relaxed text-violet-900">
          <span className="font-semibold">📸 Instagram tip:</span> Profile → Edit profile → Links → paste
          this link, so every follower can find your store.
        </div>

        <p className="mt-3 text-center text-[11px] text-gray-400">
          Changed something later? Publish again to get an updated link.
        </p>
        <button onClick={onClose} className="mt-2 w-full py-2 text-sm font-medium text-gray-500">
          Keep editing
        </button>
      </div>
    </div>
  );
}
