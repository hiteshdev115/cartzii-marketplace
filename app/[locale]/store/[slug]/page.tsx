import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { generateAlternates } from '@/lib/seo';
import { fetchStorefront } from '@/lib/api/storefront';
import { StorefrontView } from '@/components/storefront/StorefrontView';

/**
 * Public seller storefront — /store/[slug].
 *
 * Renders the seller's banner, about text, per-store terms, opt-in
 * contact block, product list and reviews. Every read goes through the
 * unauthenticated `/api/v1/public/stores/*` family; the api-server
 * enforces every safety rule (see publicStorefront.controller.js).
 *
 * A slug that doesn't resolve returns Next's 404 page — the api-server
 * returns 404 for both "does not exist" and "restricted", so we never
 * leak the difference here either.
 */

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const envelope = await fetchStorefront(slug);
  if (!envelope) {
    return { title: 'Store not found · Cartzii', robots: { index: false } };
  }
  const { store } = envelope;
  const title = `${store.storeName} · Cartzii`;
  const description = store.about
    ? store.about.slice(0, 160)
    : store.description
      ? store.description.slice(0, 160)
      : `Shop ${store.storeName} on Cartzii.`;

  const alternates = await generateAlternates(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com',
    `/store/${slug}`,
  );

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      images: store.bannerUrl ? [{ url: store.bannerUrl }] : undefined,
      locale,
    },
  };
}

export default async function SellerStorePage({ params }: Props) {
  const { slug } = await params;
  const envelope = await fetchStorefront(slug);
  if (!envelope) notFound();
  return <StorefrontView store={envelope.store} productCount={envelope.stats.productCount} />;
}
