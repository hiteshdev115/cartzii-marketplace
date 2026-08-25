import { MetadataRoute } from 'next';
import { allProducts } from '@/lib/mockData';
import { fetchRootCategories } from '@/lib/api';
import { deploymentLocales, localeUrlPath } from '@/config/countries';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com';

/**
 * This deployment's sitemap — its own country only.
 *
 * Each page is listed once per LANGUAGE this deployment serves — so twice on
 * cartzii.ca (/products and /fr/products) and once on cartzii.com. It is not
 * listed once per country: the other country is a different domain with its
 * own sitemap, and hreflang in the page head is what ties the two together.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
