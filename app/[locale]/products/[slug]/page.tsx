import { getTranslations } from 'next-intl/server';
import { currentCountry } from '@/config/countries';
import { fetchHandicraftProduct, countryName } from '@/lib/api/handicraft';
import { ProductDetailClient } from './ProductDetailClient';

/**
 * Metadata, enriched for a handicraft listing.
 *
 * A general product keeps the existing title and description. A handmade one
 * gets the maker and the origin in both, because that is what someone is
 * searching for — "hand block printed cotton throw from Kutch", not the SKU.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'Products' });
  const fallbackTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const product = await fetchHandicraftProduct(currentCountry.toUpperCase(), slug);
  const handicraft = product?.handicraft;

  if (!product || !handicraft) {
    return { title: fallbackTitle, description: t('allProducts') };
  }

  const origin = countryName(handicraft.craft_origin_country);
  const parts = [
    handicraft.is_handmade ? 'Handmade' : 'Artisan-made',
    handicraft.craft_technique ? `using ${handicraft.craft_technique.toLowerCase()}` : null,
    `by ${handicraft.artisan_name}`,
    origin ? `in ${handicraft.craft_origin_region ? `${handicraft.craft_origin_region}, ` : ''}${origin}` : null,
  ].filter(Boolean);

  return {
    title: `${product.name} — Handmade by ${handicraft.artisan_name} | Cartzii`,
    description: `${parts.join(' ')}. ${product.shortDescription || ''}`.trim(),
    keywords: [
      'handmade', 'artisan', handicraft.artisan_name,
      ...(handicraft.craft_technique ? [handicraft.craft_technique] : []),
      ...handicraft.material_used,
    ],
    openGraph: {
      title: `${product.name} — Handmade by ${handicraft.artisan_name}`,
      description: parts.join(' '),
      type: 'website',
      images: product.images.slice(0, 1),
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;

  // Structured data for a handicraft listing. Fetched server-side so it is in
  // the initial HTML, where a crawler will actually see it — data injected
  // after hydration is routinely missed.
  const product = await fetchHandicraftProduct(currentCountry.toUpperCase(), slug);
  const handicraft = product?.handicraft;

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
    : null;

  return (
    <main className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient slug={slug} />
    </main>
  );
}
