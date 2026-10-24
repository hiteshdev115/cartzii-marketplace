/**
 * Resolve the SEO payload for one page/country via the api-server.
 *
 * Called from `generateMetadata` in every server component. The payload
 * comes with override / auto / default merged already, so this file is
 * a thin fetcher + a QA no-index guard:
 *
 *   - Any non-production deployment ALWAYS returns `noIndex: true`,
 *     regardless of what the API says. Robots.txt is one line of defence;
 *     the meta tag on every page is the other. See `app/robots.ts` for
 *     the matching behaviour.
 */

import {
  currentCountry,
  countrySiteUrl,
  countries as COUNTRIES,
  localeUrlPath,
} from "@/config/countries";

export type SeoPageType = "home" | "product" | "category" | "storefront" | "static";
export type SeoCountry = "CA" | "US";

export interface SeoResolveParams {
  pageType: SeoPageType;
  pageKey: string;
  country: SeoCountry;
}

export interface ResolvedSeo {
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  introHtml?: string;
  canonical: string;
  alternates: Record<string, string>;
  noIndex: boolean;
  entity?: Record<string, unknown> | null;
  source: "override" | "auto" | "default" | "fallback";
}

const DEFAULT_TITLE = "Cartzii";
const DEFAULT_DESCRIPTION = "Cartzii — curated marketplace for Canada and the United States.";

/**
 * The API server base URL. In the browser the Next.js rewrite serves
 * `/api/v1/*` through the same origin; on the server (`generateMetadata`
 * runs there) we need the absolute upstream URL. `NEXT_PUBLIC_API_URL`
 * is set per deployment.
 */
function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL
    ?? process.env.API_URL
    ?? "http://localhost:3000";
}

function siteEnv(): string {
  return (process.env.NEXT_PUBLIC_SITE_ENV || process.env.SITE_ENV || "development")
    .toLowerCase();
}

function isProduction(): boolean {
  return siteEnv() === "production";
}

function fallbackDefault(params: SeoResolveParams): ResolvedSeo {
  const origin = countrySiteUrl[params.country.toLowerCase()] ?? countrySiteUrl.us;
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    keywords: ["cartzii", "marketplace"],
    h1: DEFAULT_TITLE,
    canonical: `${origin}${pathFor(params)}`,
    alternates: alternatesFor(params),
    noIndex: !isProduction(),
    source: "fallback",
  };
}

function pathFor(params: SeoResolveParams): string {
  switch (params.pageType) {
    case "home":       return "/";
    case "product":    return `/products/${params.pageKey}`;
    case "category":   return `/categories/${params.pageKey}`;
    case "storefront": return `/store/${params.pageKey}`;
    case "static":     return params.pageKey.startsWith("/") ? params.pageKey : `/${params.pageKey}`;
    default:           return "/";
  }
}

function alternatesFor(params: SeoResolveParams): Record<string, string> {
  const path = pathFor(params);
  const alternates: Record<string, string> = {};
  for (const [countryCode, config] of Object.entries(COUNTRIES)) {
    const origin = countrySiteUrl[countryCode];
    if (!origin) continue;
    for (const locale of config.locales) {
      alternates[locale.toLowerCase()] = `${origin}${localeUrlPath(locale, path)}`;
    }
  }
  // x-default: searcher outside both countries should land on US.
  alternates["x-default"] = `${countrySiteUrl.us}${localeUrlPath("en-US", path)}`;
  return alternates;
}

/**
 * Fetch the resolved SEO payload. Returns a fallback shape if the API
 * is unreachable so page builds never crash on a missing SEO service.
 */
export async function resolveSeo(params: SeoResolveParams): Promise<ResolvedSeo> {
  const base = apiBaseUrl().replace(/\/$/, "");
  const url = new URL(`${base}/api/v1/public/seo/resolve`);
  url.searchParams.set("pageType", params.pageType);
  url.searchParams.set("pageKey", params.pageKey);
  url.searchParams.set("country", params.country);

  let payload: {
    success: boolean;
    data?: {
      title: string;
      description: string;
      keywords: string[];
      h1: string;
      introHtml?: string;
      canonical: string;
      noIndex: boolean;
      source: "override" | "auto" | "default";
      entity?: Record<string, unknown> | null;
    };
  } | null = null;

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        // Narrow the API to this deployment's country. Same contract the
        // storefront's API client uses for every public read.
        "X-Portal-Locale": params.country.toLowerCase(),
      },
      // 60s page-level cache lines up with the API's own Redis TTL so the
      // storefront does not generate more load than it saves.
      next: { revalidate: 60 },
    });
    if (res.ok) {
      payload = await res.json();
    }
  } catch {
    // ignore — fall through to the fallback shape
  }

  if (!payload?.success || !payload.data) {
    return fallbackDefault(params);
  }

  const data = payload.data;
  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords ?? [],
    h1: data.h1,
    introHtml: data.introHtml,
    canonical: data.canonical,
    alternates: alternatesFor(params),
    // The non-production no-index guarantee lives HERE, not just in
    // robots.txt. A QA page that the DB says is indexable must still
    // ship a noindex meta tag so a stray crawler cannot register the
    // host before robots is checked.
    noIndex: !isProduction() || Boolean(data.noIndex),
    entity: data.entity ?? null,
    source: data.source,
  };
}

/**
 * The current deployment's country as the API spells it (upper case).
 * Available for callers so they don't have to re-derive it from
 * `currentCountry`.
 */
export function deploymentCountry(): SeoCountry {
  const c = String(currentCountry).toUpperCase();
  return c === "CA" ? "CA" : "US";
}
