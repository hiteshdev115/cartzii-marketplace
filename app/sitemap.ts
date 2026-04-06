import { MetadataRoute } from 'next';
import { allProducts, allCategories } from '@/lib/mockData';
import { allLocales, buildCountryPath } from '@/config/countries';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths: { path: string; changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'; priority: number }[] = [
    { path: '', changeFrequency: 'daily', priority: 1 },
    { path: '/products', changeFrequency: 'daily', priority: 0.9 },
    { path: '/deals', changeFrequency: 'daily', priority: 0.8 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  ];

  const staticPages = allLocales.flatMap((locale) =>
    staticPaths.map(({ path, changeFrequency, priority }) => ({
      url: `${BASE_URL}${buildCountryPath(locale, path)}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    }))
  );

  const productPages = allProducts.flatMap((product) =>
    allLocales.map((locale) => ({
      url: `${BASE_URL}${buildCountryPath(locale, `/products/${product.slug}`)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  );

  const categoryPages = allCategories.flatMap((cat) =>
    allLocales.map((locale) => ({
      url: `${BASE_URL}${buildCountryPath(locale, `/categories/${cat.slug}`)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  return [...staticPages, ...productPages, ...categoryPages];
}
