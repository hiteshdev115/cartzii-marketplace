import { MetadataRoute } from 'next';
import { allProducts, allCategories } from '@/lib/mockData';

const BASE_URL = 'https://cartzii.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: `${BASE_URL}/us`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${BASE_URL}/ca`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${BASE_URL}/us/products`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${BASE_URL}/ca/products`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${BASE_URL}/us/deals`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${BASE_URL}/us/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
  ];

  const productPages = allProducts.flatMap((product) => [
    { url: `${BASE_URL}/us/products/${product.slug}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${BASE_URL}/ca/products/${product.slug}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
  ]);

  const categoryPages = allCategories.flatMap((cat) => [
    { url: `${BASE_URL}/us/categories/${cat.slug}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${BASE_URL}/ca/categories/${cat.slug}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
  ]);

  return [...staticPages, ...productPages, ...categoryPages];
}
