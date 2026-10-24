import { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/seo';

/**
 * This deployment's robots.txt.
 *
 * Non-production slots (NEXT_PUBLIC_SITE_ENV !== 'production') DISALLOW
 * every path. QA sites must stay out of Google — the meta tag on each page
 * is the second line of defence, and no QA host is registered in Search
 * Console, but this is the one Googlebot checks before anything else.
 *
 * Production slots return the open rule plus the sitemap link so a crawler
 * finds the catalogue in one hop.
 */
export default function robots(): MetadataRoute.Robots {
  const siteEnv = (process.env.NEXT_PUBLIC_SITE_ENV || process.env.SITE_ENV || 'development').toLowerCase();
  const isProduction = siteEnv === 'production';

  if (!isProduction) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/account/', '/checkout/', '/auth/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
