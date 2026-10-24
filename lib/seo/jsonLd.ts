/**
 * JSON-LD helpers for product and breadcrumb schema.
 *
 * The marketplace already carries a product schema builder in `lib/seo.ts`.
 * This module wraps the resolver's output so a page can emit a complete,
 * Google-friendly Product + AggregateRating + BreadcrumbList in one call.
 */

export interface ProductJsonLdInput {
  name: string;
  description: string;
  images: string[];
  sku?: string | null;
  brand?: string | null;
  price: number | string | null;
  currency: string;
  availability: "InStock" | "OutOfStock" | "PreOrder";
  url: string;
  rating?: number | null;
  reviewCount?: number | null;
  reviews?: Array<{
    author: string;
    rating: number;
    body: string;
    datePublished?: string;
  }>;
}

/**
 * Build a Product + Offer JSON-LD payload for a PDP.
 *
 * Keeps the result as a plain object so the caller can spread it into
 * a `dangerouslySetInnerHTML` `<script>` without extra JSON.parse hops.
 */
export function buildProductJsonLd(input: ProductJsonLdInput): Record<string, unknown> {
  const priceStr = input.price == null
    ? null
    : (typeof input.price === "number" ? input.price.toFixed(2) : String(input.price));

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.images,
    brand: {
      "@type": "Organization",
      name: input.brand || "Cartzii",
    },
  };

  if (input.sku) data.sku = input.sku;

  if (priceStr) {
    data.offers = {
      "@type": "Offer",
      priceCurrency: input.currency,
      price: priceStr,
      availability: `https://schema.org/${input.availability}`,
      url: input.url,
    };
  }

  if (input.rating != null && input.reviewCount != null) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: input.rating,
      reviewCount: input.reviewCount,
    };
  }

  if (input.reviews && input.reviews.length > 0) {
    data.review = input.reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.body,
      ...(r.datePublished ? { datePublished: r.datePublished } : {}),
    }));
  }

  return data;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Render a `<script type="application/ld+json">` block that is safe to
 * drop straight into a server component's JSX. `JSON.stringify` is run
 * with HTML-escaping of the forward slash so an attribute value cannot
 * close the script tag early.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
