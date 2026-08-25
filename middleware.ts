import { NextRequest, NextResponse } from 'next/server';
import {
  currentCountry,
  currentLocale,
  deploymentLocales,
  localePathPrefixes,
} from '@/config/countries';

const ALLOWED_COUNTRIES = new Set(['US', 'CA']);

// Matched against the first path segment.
const PROTECTED_PATH_SEGMENTS = new Set(['account']);

// Path prefixes this site used to serve, mapped to what replaces them.
//
// The value is the prefix the visitor should end up on, so a French URL stays
// French: /ca/fr/products becomes /fr/products, not /products. Redirecting a
// reader of French onto the English page would look like the language setting
// silently resetting itself.
const LEGACY_PREFIX_MAP: Record<string, string> = {
  '/ca/fr': localePathPrefixes['fr-CA'] ?? '',
  '/fr-CA': localePathPrefixes['fr-CA'] ?? '',
  '/en-CA': '',
  '/en-US': '',
  '/ca': '',
  '/us': '',
};

function getGeoCountry(request: NextRequest): string | null {
  // Set by nginx GeoIP when present.
  return request.headers.get('x-country-code') || null;
}

/**
 * Rewrites a legacy country/locale prefix onto its replacement.
 * `/ca/products` → `/products`, `/ca/fr/products` → `/fr/products`,
 * `/products` → null (nothing to do).
 */
function replaceLegacyPrefix(pathname: string): string | null {
  // Longest first, so `/ca/fr` is matched before `/ca`.
  const prefixes = Object.keys(LEGACY_PREFIX_MAP).sort((a, b) => b.length - a.length);
  for (const prefix of prefixes) {
    const target = LEGACY_PREFIX_MAP[prefix];
    if (pathname === prefix) return target || '/';
    if (pathname.startsWith(`${prefix}/`)) {
      return `${target}${pathname.slice(prefix.length)}`;
    }
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
  const replaced = replaceLegacyPrefix(pathname);
  if (replaced !== null) {
    const url = request.nextUrl.clone();
    url.pathname = replaced;
    return NextResponse.redirect(url, { status: 301 });
  }

  // Auth guard, before the rewrite, so the redirect is built from the URL the
  // visitor actually typed. The language prefix is stripped first, or
  // /fr/account would slip past the guard that /account is subject to.
  const languagePrefix = deploymentLocales
    .map((l) => localePathPrefixes[l])
    .find((p) => p && (pathname === p || pathname.startsWith(`${p}/`)));
  const guardPath = languagePrefix ? pathname.slice(languagePrefix.length) || '/' : pathname;

  const firstSegment = guardPath.split('/').filter(Boolean)[0]?.toLowerCase();
  if (firstSegment && PROTECTED_PATH_SEGMENTS.has(firstSegment)) {
    const token = request.cookies.get('cartzii_access_token')?.value;
    if (!token) {
      // Keep the visitor in their language through the login round-trip.
      const loginUrl = new URL(`${languagePrefix ?? ''}/auth/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Resolve the language from its URL prefix. The country came from the
  // domain; only the language can still be in the path, and only when it is
  // not this country's default — so `/fr/products` is French and `/products`
  // is English.
  let locale = currentLocale;
  let pagePath = pathname;
  for (const candidate of deploymentLocales) {
    const prefix = localePathPrefixes[candidate];
    if (!prefix) continue;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      locale = candidate;
      pagePath = pathname.slice(prefix.length) || '/';
      break;
    }
  }

  // The routes still live under app/[locale], so the public path is rewritten
  // onto the internal locale segment. The visitor's URL does not change.
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pagePath === '/' ? '' : pagePath}`;

  const response = NextResponse.rewrite(url);
  // next-intl reads this in getRequestConfig.
  response.headers.set('X-NEXT-INTL-LOCALE', locale);
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
