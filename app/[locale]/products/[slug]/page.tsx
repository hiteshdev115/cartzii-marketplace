import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { currentCountry, countrySiteUrl, buildPath } from '@/config/countries';
import { resolveSeo, deploymentCountry } from '@/lib/seo/resolve';
import { buildBreadcrumbJsonLd, buildProductJsonLd, jsonLdScript } from '@/lib/seo/jsonLd';
import { fetchHandicraftProduct, countryName } from '@/lib/api/handicraft';
import { ProductDetailClient } from './ProductDetailClient';

/**
 * Metadata — merges the agency-managed SEO overrides and Gemini auto-fill
 * with the handicraft enrichment (maker + origin) when present. Overrides
 * win every field; the handicraft helper only runs when the API has no
 * override and no auto value.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'Products' });

  const seo = await resolveSeo({
    pageType: 'product',
    pageKey: slug,
    country: deploymentCountry(),
  });

  // Only enrich with handicraft text when no override has been set — the
  // override is the more specific signal.
  let enrichedTitle = seo.title;
  let enrichedDescription = seo.description;
  let enrichedKeywords = seo.keywords;
  let ogImages: { url: string }[] | undefined;

  if (seo.source !== 'override') {
    try {
      const hc = await fetchHandicraftProduct(currentCountry.toUpperCase(), slug);
      if (hc?.handicraft) {
        const origin = countryName(hc.handicraft.craft_origin_country);
        const parts = [
          hc.handicraft.is_handmade ? 'Handmade' : 'Artisan-made',
          hc.handicraft.craft_technique ? `using ${hc.handicraft.craft_technique.toLowerCase()}` : null,
          `by ${hc.handicraft.artisan_name}`,
          origin ? `in ${hc.handicraft.craft_origin_region ? `${hc.handicraft.craft_origin_region}, ` : ''}${origin}` : null,
        ].filter(Boolean);
        enrichedTitle = `${hc.name} — Handmade by ${hc.handicraft.artisan_name} | Cartzii`;
        enrichedDescription = `${parts.join(' ')}. ${hc.shortDescription || ''}`.trim();
        enrichedKeywords = Array.from(new Set([
          'handmade', 'artisan', hc.handicraft.artisan_name,
          ...(hc.handicraft.craft_technique ? [hc.handicraft.craft_technique] : []),
          ...hc.handicraft.material_used,
          ...seo.keywords,
        ]));
        if (hc.images?.[0]) ogImages = [{ url: hc.images[0] }];
      }
    } catch { /* ignore enrichment failures */ }
  }

  return {
    title: enrichedTitle || t('allProducts'),
    description: enrichedDescription,
    keywords: enrichedKeywords.length ? enrichedKeywords : undefined,
    alternates: { canonical: seo.canonical, languages: seo.alternates },
    openGraph: {
      title: enrichedTitle,
      description: enrichedDescription,
      url: seo.canonical,
      siteName: 'Cartzii',
      images: ogImages,
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: enrichedTitle,
      description: enrichedDescription,
      images: ogImages?.map((i) => i.url),
    },
    robots: seo.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'Products' });

  // Structured data. Fetched server-side so it is in the initial HTML,
  // where a crawler will actually see it — data injected after
  // hydration is routinely missed.
  const product = await fetchHandicraftProduct(currentCountry.toUpperCase(), slug);
  const handicraft = product?.handicraft;
  const origin = countrySiteUrl[deploymentCountry().toLowerCase()] ?? countrySiteUrl.us;

  const jsonLd = product && handicraft
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || product.shortDescription,
        image: product.images,
        sku: product.sku,
        category: product.category,
        material: handicraft.material_used,
        // The maker is the brand on a handmade item — the store name is the
        // shop it is sold through, which is a different thing.
        brand: { '@type': 'Brand', name: handicraft.artisan_name },
        manufacturer: { '@type': 'Person', name: handicraft.artisan_name },
        countryOfOrigin: handicraft.craft_origin_country
          ? { '@type': 'Country', name: countryName(handicraft.craft_origin_country) }
          : undefined,
        offers: {
          '@type': 'Offer',
          price: (product.salePrice ?? product.price).toFixed(2),
          priceCurrency: product.currency,
          availability: product.inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          url: `${origin}${buildPath(`/products/${slug}`)}`,
        },
        ...(product.reviewCount > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.rating,
                reviewCount: product.reviewCount,
              },
            }
          : {}),
      }
    : product
      ? buildProductJsonLd({
          name: product.name,
          description: product.description || product.shortDescription,
          images: product.images,
          sku: product.sku,
          brand: null,
          price: product.salePrice ?? product.price,
          currency: product.currency,
          availability: product.inStock ? 'InStock' : 'OutOfStock',
          url: `${origin}${buildPath(`/products/${slug}`)}`,
          rating: product.reviewCount > 0 ? product.rating : null,
          reviewCount: product.reviewCount > 0 ? product.reviewCount : null,
        })
      : null;

  const breadcrumbs = product
    ? buildBreadcrumbJsonLd([
        { name: t('allProducts'), url: `${origin}${buildPath('/products')}` },
        { name: product.name, url: `${origin}${buildPath(`/products/${slug}`)}` },
      ])
    : null;

  return (
    <main className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
        />
      )}
      {breadcrumbs && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }}
        />
      )}
      <ProductDetailClient slug={slug} />
    </main>
  );
}
