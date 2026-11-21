"use client";

import { useState } from "react";

export default function ShareBar({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* dismissed */
    }
  }

  return (
    <div className="mt-4 flex items-center justify-center gap-2 pb-6">
      <button
        onClick={share}
        className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
      >
        {copied ? "Link copied ✓" : "↗ Share this store"}
      </button>
    </div>
  );
}
