import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/account/', '/checkout/', '/auth/'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com'}/sitemap.xml`,
  };
}
