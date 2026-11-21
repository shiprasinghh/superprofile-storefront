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
    <div className="mx-auto mt-5 w-full max-w-md">
      <button
        onClick={share}
        className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white"
      >
        {copied ? "Link copied ✓" : "Share this page"}
      </button>
    </div>
  );
}
