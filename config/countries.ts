/**
 * Country is a property of the DEPLOYMENT, not of the URL.
 *
 * cartzii.ca serves Canada and cartzii.com serves the United States, each from
 * its own build against its own API and database. Paths used to carry the
 * country (`/ca/products`, `/us/products`); they no longer do, because the
 * domain already says it.
 *
 * NEXT_PUBLIC_COUNTRY is what a deployment is told about itself. It is
 * NEXT_PUBLIC_ because the value is needed while rendering, which means Next
 * inlines it at BUILD time — a build made for one country cannot be moved to
 * the other by changing the environment afterwards. Each slot builds its own.
 */

export interface CountryConfig {
  code: string;
  name: string;
  defaultLocale: string;
  locales: string[];
  currency: string;
  currencyLocale: string;
  dateLocaleMap: Record<string, string>;
}

export const countries: Record<string, CountryConfig> = {
  us: {
    code: 'us',
    name: 'United States',
    defaultLocale: 'en-US',
    locales: ['en-US'],
    currency: 'USD',
    currencyLocale: 'en-US',
    dateLocaleMap: { 'en-US': 'en-US' },
  },
  ca: {
    code: 'ca',
    name: 'Canada',
    defaultLocale: 'en-CA',
    // fr-CA is not served yet. Re-adding it here is most of the work of
    // bringing French back: the language switcher hides itself while a country
    // has a single locale, and shows again when it does not.
    locales: ['en-CA'],
    currency: 'CAD',
    currencyLocale: 'en-CA',
    dateLocaleMap: { 'en-CA': 'en-CA' },
  },
};

export const allLocales = Object.values(countries).flatMap((c) => c.locales);
export const defaultLocale = 'en-US';

/** The country this deployment serves. Defaults to `ca` for local development. */
export const currentCountry: string =
  (process.env.NEXT_PUBLIC_COUNTRY || 'ca').toLowerCase() in countries
    ? (process.env.NEXT_PUBLIC_COUNTRY || 'ca').toLowerCase()
    : 'ca';

/** The locale this deployment renders in. */
export const currentLocale: string = countries[currentCountry].defaultLocale;

/**
 * Absolute origin of each country's storefront.
 *
 * Needed for hreflang, which has to point at the OTHER domain — the one thing
 * that cannot be expressed as a path now that the countries are separate
 * sites. Configurable so QA points at QA rather than production.
 */
export const countrySiteUrl: Record<string, string> = {
  ca: process.env.NEXT_PUBLIC_SITE_URL_CA || 'https://cartzii.ca',
  us: process.env.NEXT_PUBLIC_SITE_URL_US || 'https://cartzii.com',
};

export function getCountryFromLocale(locale: string): string {
  const suffix = locale.split('-')[1]?.toLowerCase();
  return suffix && countries[suffix] ? suffix : 'us';
}

export function getCountryConfig(locale: string): CountryConfig {
  return countries[getCountryFromLocale(locale)];
}

export function getMessageFile(locale: string): string {
  const lang = locale.split('-')[0];
  return lang === 'fr' ? 'fr' : 'en';
}

/**
 * A site-root-relative URL for a page.
 *
 * Now that the domain carries the country this is close to the identity
 * function, but it stays the single place page URLs are formed: it is what
 * made removing the country segment a one-line change instead of an edit to
 * every link in the app, and it is where a future prefix would go.
 */
export function buildPath(pagePath: string): string {
  if (!pagePath || pagePath === '/') return '/';
  return pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
}

/**
 * The page path as the visitor sees it.
 *
 * `usePathname()` reports the browser's URL, and middleware rewrites to the
 * internal `/{locale}/...` route without changing it — so the external path
 * needs no unwrapping. The internal prefix is still stripped defensively for
 * any caller that passes a rewritten path.
 */
export function extractPagePath(pathname: string): string {
  for (const locale of allLocales) {
    const prefix = `/${locale}`;
    if (pathname === prefix) return '/';
    if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  }
  return pathname || '/';
}
