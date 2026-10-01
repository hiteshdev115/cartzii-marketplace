import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { resolveSeo, deploymentCountry } from '@/lib/seo/resolve';
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

  // Resolve agency-managed SEO on top of what the API already returned
  // for this storefront. The storefront's own banner image is still what
  // Open Graph points at.
  const seo = await resolveSeo({
    pageType: 'storefront',
    pageKey: slug,
    country: deploymentCountry(),
  });

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords.length ? seo.keywords : undefined,
    alternates: { canonical: seo.canonical, languages: seo.alternates },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.canonical,
      siteName: 'Cartzii',
      images: envelope.store.bannerUrl ? [{ url: envelope.store.bannerUrl }] : undefined,
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: envelope.store.bannerUrl ? [envelope.store.bannerUrl] : undefined,
    },
    robots: seo.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function SellerStorePage({ params }: Props) {
  const { slug } = await params;
  const envelope = await fetchStorefront(slug);
  if (!envelope) notFound();
  return <StorefrontView store={envelope.store} productCount={envelope.stats.productCount} />;
}
