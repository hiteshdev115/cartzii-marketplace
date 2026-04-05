import { NextRequest, NextResponse } from 'next/server';
import { countries } from '@/config/countries';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root to /us
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/us', request.url));
  }

  const segments = pathname.split('/').filter(Boolean);
  const country = segments[0]?.toLowerCase();

  if (!countries[country]) {
    return NextResponse.redirect(new URL('/us', request.url));
  }

  const countryConfig = countries[country];
  let internalLocale = countryConfig.defaultLocale;
  let restSegments = segments.slice(1);

  // Check if second segment is a language prefix for non-default lang
  if (country === 'ca' && segments[1] === 'fr') {
    internalLocale = 'fr-CA';
    restSegments = segments.slice(2);
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
  matcher: ['/', '/(us|ca)/:path*'],
};
