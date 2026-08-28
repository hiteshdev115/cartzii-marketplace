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
    locales: ['en-CA', 'fr-CA'],
    currency: 'CAD',
    currencyLocale: 'en-CA',
    dateLocaleMap: { 'en-CA': 'en-CA', 'fr-CA': 'fr-CA' },
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

/**
 * URL prefix for each non-default locale.
 *
 * The country is the domain, so only the LANGUAGE needs a path segment, and
 * only when it is not the country's default. On cartzii.ca that means English
 * lives at /products and French at /fr/products. The default locale is
 * deliberately unprefixed: adding one would move every existing English URL.
 *
 * `/fr` rather than `/fr-CA` — the country is already implied by the domain,
 * so repeating it in the path says nothing.
 */
export const localePathPrefixes: Record<string, string> = {
  'fr-CA': '/fr',
};

/** ISO code of this deployment's country, as addresses and the API spell it. */
export const currentCountryIso: string = currentCountry.toUpperCase();

/** The only currency this deployment prices, charges and settles in. */
export const currentCurrency: string = countries[currentCountry].currency;

/**
 * Options for every country dropdown on this site — which is exactly one.
 *
 * A storefront that can only ship, tax and settle in one country should not
 * offer another in a form. Offering both is how an address that checkout
 * cannot fulfil gets entered in the first place; the fix is to not present the
 * choice, rather than to validate it afterwards.
 */
export const countrySelectOptions: ReadonlyArray<{ value: string; label: string }> = [
  { value: currentCountryIso, label: countries[currentCountry].name },
];

/** Locales this deployment serves — its own country's, and no others. */
export const deploymentLocales: string[] = countries[currentCountry].locales;

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
/**
 * A page's path *for a given locale*, including the language prefix when that
 * locale needs one.
 *
 *   localeUrlPath('en-CA', '/products') → '/products'
 *   localeUrlPath('fr-CA', '/products') → '/fr/products'
 *
 * Used to build hreflang, where the French alternate of a page must be the
 * French URL. Pointing it at the English one tells a search engine the two
 * languages live at the same address, which is how the wrong language ends up
 * in results.
 */
export function localeUrlPath(locale: string, pagePath: string): string {
  const country = getCountryFromLocale(locale);
  const isDefaultLang = locale === countries[country]?.defaultLocale;
  const prefix = isDefaultLang ? '' : (localePathPrefixes[locale] ?? '');
  const path = buildPath(pagePath);
  return path === '/' ? prefix || '/' : `${prefix}${path}`;
}

export function extractPagePath(pathname: string): string {
  for (const locale of allLocales) {
    const prefix = `/${locale}`;
    if (pathname === prefix) return '/';
    if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  }
  return pathname || '/';
}
