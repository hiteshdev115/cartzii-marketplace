import { NextRequest, NextResponse } from 'next/server';
import { countries, allLocales } from '@/config/countries';

const ALLOWED_COUNTRIES = new Set(['US', 'CA']);

// Paths that require a logged-in user (matched against the first segment after the country prefix).
const PROTECTED_PATH_SEGMENTS = new Set(['checkout', 'account']);

// Map internal locale back to external country path prefix
const localeToCountryPath: Record<string, string> = {
  'en-US': '/us',
  'en-CA': '/ca',
  'fr-CA': '/ca/fr',
};

function getGeoCountry(request: NextRequest): string | null {
  // Nginx GeoIP sets this header
  return request.headers.get('x-country-code') || null;
}

function mapGeoToPath(geoCountry: string): string {
  switch (geoCountry) {
    case 'CA':
      return 'ca';
    case 'US':
    default:
      return 'us';
  }
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the geo-blocked page to render without redirect loops
  if (pathname === '/blocked') {
    return NextResponse.next();
  }

  const geoCountry = getGeoCountry(request);

  // Block users outside US and CA (only when header is present, i.e. behind Nginx)
  if (geoCountry && !ALLOWED_COUNTRIES.has(geoCountry)) {
    return NextResponse.rewrite(new URL('/blocked', request.url));
  }

  // Redirect root to geo-detected country path
  if (pathname === '/') {
    const countryPath = geoCountry ? mapGeoToPath(geoCountry) : 'ca';
    return NextResponse.redirect(new URL(`/${countryPath}`, request.url));
  }

  // Redirect internal locale-prefixed paths → external country paths
  // e.g. /en-CA/products → /ca/products  |  /fr-CA/deals → /ca/fr/deals
  for (const locale of allLocales) {
    const localePrefix = `/${locale}`;
    if (pathname === localePrefix || pathname.startsWith(`${localePrefix}/`)) {
      const countryBase = localeToCountryPath[locale] ?? '/us';
      const rest = pathname.slice(localePrefix.length); // '' or '/products/...'
      return NextResponse.redirect(
        new URL(`${countryBase}${rest}`, request.url),
        { status: 301 },
      );
    }
  }

  const segments = pathname.split('/').filter(Boolean);
  const country = segments[0]?.toLowerCase();

  if (!countries[country]) {
    const countryPath = geoCountry ? mapGeoToPath(geoCountry) : 'ca';
    return NextResponse.redirect(new URL(`/${countryPath}`, request.url));
  }

  const countryConfig = countries[country];
  let internalLocale = countryConfig.defaultLocale;
  let restSegments = segments.slice(1);

  // Check if second segment is a language prefix for non-default lang
  if (country === 'ca' && segments[1] === 'fr') {
    internalLocale = 'fr-CA';
    restSegments = segments.slice(2);
  }

  // --- Auth guard for protected paths ---
  // Check BEFORE rewriting so we can construct the redirect using the external URL.
  const firstSegment = restSegments[0]?.toLowerCase();
  if (firstSegment && PROTECTED_PATH_SEGMENTS.has(firstSegment)) {
    const token = request.cookies.get('cartzii_access_token')?.value;
    if (!token) {
      const loginUrl = new URL(`/${country}/auth/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Rewrite external URL to internal [locale] route
  const internalPath = `/${internalLocale}${restSegments.length ? '/' + restSegments.join('/') : ''}`;
  const url = request.nextUrl.clone();
  url.pathname = internalPath;

  const response = NextResponse.rewrite(url);
  // Set the locale header so next-intl can resolve the locale in getRequestConfig
  response.headers.set('X-NEXT-INTL-LOCALE', internalLocale);
  return response;
}

export const config = {
  matcher: [
    '/',
    '/blocked',
    '/(us|ca)/:path*',
    '/(us|ca)/checkout/:path*',
    '/(us|ca)/account/:path*',
    // Also intercept bare locale-prefixed paths so they get redirected to /country/*
    '/en-US',
    '/en-CA',
    '/fr-CA',
    '/en-US/:path*',
    '/en-CA/:path*',
    '/fr-CA/:path*',
  ],
};
