import { MetadataRoute } from 'next';
import { allProducts } from '@/lib/mockData';
import { fetchRootCategories } from '@/lib/api';
import {
  currentCountry,
  deploymentLocales,
  localeUrlPath,
} from '@/config/countries';

// Re-exported from lib/seo so one definition decides this deployment's origin.
import { BASE_URL } from '@/lib/seo';

interface ApiSitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

interface ApiSitemapResponse {
  success: boolean;
  data?: {
    country: string;
    entries: ApiSitemapEntry[];
  };
}

/**
 * This deployment's sitemap — its own country only.
 *
 * Primary path is the api-server's `/public/seo/sitemap` endpoint: it is
 * the source of truth for every category, storefront and product currently
 * sold here. The static-page / mock-data branch is a safety net for the
 * boot window when the API has not yet come up — a sitemap that errors is
 * what gets dropped from Search Console, not just the one bad entry.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const country = currentCountry.toUpperCase();

  // 1) Preferred source — api-server.
  const apiEntries = await fetchApiSitemap(country);
  if (apiEntries && apiEntries.length > 0) {
    return apiEntries.map((e) => ({
      url: e.loc,
      lastModified: e.lastmod ? new Date(e.lastmod) : new Date(),
      changeFrequency: e.changefreq ?? 'weekly',
      priority: e.priority ?? 0.5,
    }));
  }

  // 2) Fallback — compose from mockData + static paths. Mirrors the
  //    previous behaviour so a broken API never ships an empty sitemap.
  const staticPaths: { path: string; changeFrequency: 'daily' | 'monthly'; priority: number }[] = [
    { path: '', changeFrequency: 'daily', priority: 1 },
    { path: '/products', changeFrequency: 'daily', priority: 0.9 },
    { path: '/deals', changeFrequency: 'daily', priority: 0.8 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  ];

  const staticPages = deploymentLocales.flatMap((locale) =>
    staticPaths.map(({ path, changeFrequency, priority }) => ({
      url: `${BASE_URL}${localeUrlPath(locale, path)}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    })),
  );

  const productPages = deploymentLocales.flatMap((locale) =>
    allProducts.map((product) => ({
      url: `${BASE_URL}${localeUrlPath(locale, `/products/${product.slug}`)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  );

  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const apiCategories = await fetchRootCategories();
    categoryPages = deploymentLocales.flatMap((locale) =>
      apiCategories.map((cat) => ({
        url: `${BASE_URL}${localeUrlPath(locale, `/categories/${cat.slug}`)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    );
  } catch {
    // API unavailable — skip category pages rather than fail the whole sitemap.
  }

  return [...staticPages, ...productPages, ...categoryPages];
}

async function fetchApiSitemap(country: string): Promise<ApiSitemapEntry[] | null> {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? '').replace(/\/$/, '');
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/v1/public/seo/sitemap?country=${encodeURIComponent(country)}`, {
      headers: { 'X-Portal-Locale': country.toLowerCase() },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiSitemapResponse;
    if (!json.success || !json.data?.entries) return null;
    return json.data.entries;
  } catch {
    return null;
  }
}
