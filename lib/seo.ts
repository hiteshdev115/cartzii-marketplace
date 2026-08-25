import { getLocale } from 'next-intl/server';
import {
  buildPath,
  countries,
  countrySiteUrl,
  getCountryFromLocale,
  localeUrlPath,
} from '@/config/countries';

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com';

/**
 * Canonical and hreflang for a page.
 *
 * hreflang is the one place the split into two domains actually shows up in
 * the markup: the Canadian alternate of a page is on cartzii.ca and the US one
 * on cartzii.com, so these entries cannot be paths — they have to be absolute
 * URLs on the other origin.
 *
 * Getting this wrong is how two country sites with near-identical catalogues
 * end up competing with each other in search instead of being understood as
 * regional variants of the same page.
 *
 * `pagePath` is the shared, country-free path — the whole reason it can be
 * reused verbatim across both origins.
 */
export async function generateAlternates(baseUrl: string, pagePath: string) {
  // The canonical URL has to name the language actually being served, so this
  // reads the request's locale rather than assuming the default. A French page
  // declaring the English URL as canonical asks Google to drop it.
  const locale = await getLocale();
  const country = getCountryFromLocale(locale);

  const languages: Record<string, string> = {};
  for (const [c, config] of Object.entries(countries)) {
    for (const l of config.locales) {
      languages[l.toLowerCase()] = `${countrySiteUrl[c]}${localeUrlPath(l, pagePath)}`;
    }
  }
  // x-default is where a searcher outside both countries should land.
  languages['x-default'] = `${countrySiteUrl.us}${localeUrlPath('en-US', pagePath)}`;

  return {
    canonical: `${baseUrl}${localeUrlPath(locale, pagePath)}`,
    languages,
  };
}

export function generateProductJsonLd(product: {
  name: string;
  description: string;
  image: string;
  sku: string;
  price: number;
  currency: string;
  availability: 'InStock' | 'OutOfStock';
  rating?: number;
  reviewCount?: number;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: product.currency,
      availability: `https://schema.org/${product.availability}`,
      url: product.url,
    },
    ...(product.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      },
    }),
  };
}

/**
 * Generates Schema.org Product JSON-LD with AggregateOffer for products that have
 * multiple variants (e.g., different sizes, colors, or SKUs). Use this instead of
 * `generateProductJsonLd` when a product has variant-level pricing so that search
 * engines can display a price range rather than a single price.
 */
export function generateVariantProductJsonLd(product: {
  name: string;
  description: string;
  image: string;
  currency: string;
  availability: 'InStock' | 'OutOfStock';
  rating?: number;
  reviewCount?: number;
  url: string;
  offers: {
    sku: string;
    price: number;
    currency: string;
    availability: 'InStock' | 'OutOfStock';
  }[];
}) {
  const prices = product.offers.map((o) => o.price);
  if (prices.length === 0) {
    throw new Error(
      `Product '${product.name}' has no offers. At least one offer is required for generateVariantProductJsonLd.`
    );
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: Math.min(...prices).toFixed(2),
      highPrice: Math.max(...prices).toFixed(2),
      priceCurrency: product.currency,
      offerCount: product.offers.length,
      offers: product.offers.map((o) => ({
        '@type': 'Offer',
        sku: o.sku,
        price: o.price.toFixed(2),
        priceCurrency: o.currency,
        availability: `https://schema.org/${o.availability}`,
        url: product.url,
      })),
    },
    ...(product.rating !== undefined && product.reviewCount !== undefined && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      },
    }),
  };
}

export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
