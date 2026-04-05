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
    sitemap: 'https://cartzii.com/sitemap.xml',
  };
}
