import { MetadataRoute } from 'next';
import { allProducts } from '@/lib/mockData';
import { fetchRootCategories } from '@/lib/api';
import { buildPath } from '@/config/countries';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com';

/**
 * This deployment's sitemap — its own country only.
 *
 * Each page appears exactly once. It used to be emitted once per locale, which
 * was right while `/ca/products` and `/us/products` were two URLs on one site.
 * They are now the same path on two different domains, so fanning out over
 * locales would list the identical URL repeatedly. Canada's sitemap is served
 * from cartzii.ca and the United States' from cartzii.com, and hreflang in the
 * page head is what ties the two together.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths: { path: string; changeFrequency: 'daily' | 'monthly'; priority: number }[] = [
    { path: '', changeFrequency: 'daily', priority: 1 },
    { path: '/products', changeFrequency: 'daily', priority: 0.9 },
    { path: '/deals', changeFrequency: 'daily', priority: 0.8 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  ];

  const staticPages = staticPaths.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE_URL}${buildPath(path)}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  const productPages = allProducts.map((product) => ({
    url: `${BASE_URL}${buildPath(`/products/${product.slug}`)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const apiCategories = await fetchRootCategories();
    categoryPages = apiCategories.map((cat) => ({
      url: `${BASE_URL}${buildPath(`/categories/${cat.slug}`)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // API unavailable — skip category pages rather than fail the whole sitemap.
  }

  return [...staticPages, ...productPages, ...categoryPages];
}
