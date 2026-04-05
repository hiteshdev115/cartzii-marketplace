import { buildCountryPath, allLocales } from '@/config/countries';

const BASE_URL = 'https://cartzii.com';

export function generateAlternates(baseUrl: string, pagePath: string, currentLocale: string) {
  const languages: Record<string, string> = {
    'x-default': `${baseUrl}${buildCountryPath('en-US', pagePath)}`,
  };

  for (const locale of allLocales) {
    const hreflangCode = locale.toLowerCase();
    languages[hreflangCode] = `${baseUrl}${buildCountryPath(locale, pagePath)}`;
  }

  return {
    canonical: `${baseUrl}${buildCountryPath(currentLocale, pagePath)}`,
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
