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

export function buildCountryPath(locale: string, pagePath: string): string {
  const country = getCountryFromLocale(locale);
  const lang = locale.split('-')[0];
  const countryConfig = countries[country];
  const isDefaultLang = locale === countryConfig.defaultLocale;
  const normalizedPath = pagePath === '/' ? '' : pagePath;

  if (isDefaultLang) {
    return `/${country}${normalizedPath}`;
  }
  return `/${country}/${lang}${normalizedPath}`;
}
