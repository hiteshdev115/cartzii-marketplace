import { NextRequest, NextResponse } from 'next/server';
import { countries, allLocales, currentCountry, currentLocale } from '@/config/countries';

const ALLOWED_COUNTRIES = new Set(['US', 'CA']);

// Matched against the first path segment.
const PROTECTED_PATH_SEGMENTS = new Set(['account']);

// Path prefixes this site used to serve, kept only so old links still resolve.
const LEGACY_PREFIXES = [
  ...Object.keys(countries).map((c) => `/${c}`), // /ca, /us
  ...allLocales.map((l) => `/${l}`),             // /en-CA, /en-US
  '/fr-CA',                                      // fr-CA is no longer in allLocales
  '/ca/fr',
];

function getGeoCountry(request: NextRequest): string | null {
  // Set by nginx GeoIP when present.
  return request.headers.get('x-country-code') || null;
}

/**
 * Strips a legacy country or locale prefix, if the path carries one.
 * `/ca/products` → `/products`, `/ca` → `/`, `/products` → null (nothing to do).
 */
function stripLegacyPrefix(pathname: string): string | null {
  // Longest first, so `/ca/fr` is matched before `/ca`.
  for (const prefix of [...LEGACY_PREFIXES].sort((a, b) => b.length - a.length)) {
    if (pathname === prefix) return '/';
    if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length) || '/';
  }
  return null;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Render without redirecting, or the block page would bounce forever.
  if (pathname === '/blocked') {
    return NextResponse.next();
  }

  const geoCountry = getGeoCountry(request);

  // Only enforced when nginx supplied the header; absent, everyone is allowed.
  if (geoCountry && !ALLOWED_COUNTRIES.has(geoCountry)) {
    return NextResponse.rewrite(new URL('/blocked', request.url));
  }

  // Country now comes from the domain, so /ca and /us are dead prefixes. They
  // are redirected rather than dropped: they are in sent emails, in links
  // people have shared, and possibly in a search index. 301 moves that history
  // onto the new URL instead of stranding it on a 404.
  //
  // No cross-domain redirect. A US visitor opening a cartzii.ca link stays on
  // cartzii.ca — bouncing them to .com would break every shared link and make
  // the canonical URL disagree with the page actually served.
  const stripped = stripLegacyPrefix(pathname);
  if (stripped !== null) {
    const url = request.nextUrl.clone();
    url.pathname = stripped;
    return NextResponse.redirect(url, { status: 301 });
  }

  // Auth guard, before the rewrite, so the redirect is built from the URL the
  // visitor actually typed.
  const firstSegment = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  if (firstSegment && PROTECTED_PATH_SEGMENTS.has(firstSegment)) {
    const token = request.cookies.get('cartzii_access_token')?.value;
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // The routes still live under app/[locale], so the public path is rewritten
  // onto the internal locale segment. The visitor's URL does not change.
  const url = request.nextUrl.clone();
  url.pathname = `/${currentLocale}${pathname === '/' ? '' : pathname}`;

  const response = NextResponse.rewrite(url);
  // next-intl reads this in getRequestConfig.
  response.headers.set('X-NEXT-INTL-LOCALE', currentLocale);
  // Lets the API and any cache tell the two storefronts apart.
  response.headers.set('X-Cartzii-Country', currentCountry);
  return response;
}

export const config = {
  // Everything except Next internals, API routes and files with an extension.
  // The old matcher listed `/(us|ca)/:path*`, which cannot work now that those
  // segments are gone from real URLs.
  matcher: ['/((?!_next/static|_next/image|api/|favicon.ico|.*\\..*).*)'],
};
