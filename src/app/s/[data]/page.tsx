import Link from "next/link";
import type { Metadata } from "next";
import StorefrontView from "@/components/StorefrontView";
import ShareBar from "@/components/ShareBar";
import { decodeStorefront } from "@/lib/share";
import { coverPhoto } from "@/lib/format";

type Params = { data: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { data } = await params;
  const s = decodeStorefront(data);
  if (!s) return { title: "Store not found" };
  // A rich preview card: the cover photo, the creator's name and tagline show
  // up when the link is shared on WhatsApp, Instagram or anywhere else — so the
  // card is what people tap, not the long URL.
  const cover = coverPhoto(s);
  const title = `${s.creatorName} — ${s.tagline}`;
  return {
    title,
    description: s.tagline,
    openGraph: {
      title: s.creatorName,
      description: s.tagline,
      type: "website",
      images: [{ url: cover, width: 1200, height: 600, alt: s.creatorName }],
    },
    twitter: {
      card: "summary_large_image",
      title: s.creatorName,
      description: s.tagline,
      images: [cover],
    },
  };
}

export default async function PublicStore({ params }: { params: Promise<Params> }) {
  const { data } = await params;
  const storefront = decodeStorefront(data);

  if (!storefront) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl">🔗</div>
        <h1 className="mt-3 text-xl font-bold text-gray-900">This link looks broken</h1>
        <p className="mt-1 text-sm text-gray-500">
          The store link may be incomplete or out of date.
        </p>
        <Link
          href="/"
          className="mt-5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white"
        >
          Create your own store
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 py-0 sm:py-8">
      <div className="mx-auto max-w-md overflow-hidden bg-white shadow-xl ring-1 ring-black/5 sm:rounded-3xl">
        <StorefrontView storefront={storefront} />
      </div>
      <div className="mx-auto max-w-md px-4">
        <ShareBar name={storefront.creatorName} />
      </div>
    </main>
  );
}
