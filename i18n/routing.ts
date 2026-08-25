import { defineRouting } from 'next-intl/routing';
import {
  currentCountry,
  currentLocale,
  deploymentLocales,
  localePathPrefixes,
} from '@/config/countries';

/**
 * Routing for THIS deployment only.
 *
 * The locale list is the current country's, not every locale the app knows:
 * cartzii.ca must not offer en-US and cartzii.com must not offer fr-CA. With
 * the country in the domain, a build only ever serves its own.
 *
 * `as-needed` keeps the default locale unprefixed, so English URLs are
 * unchanged and only French gains a segment.
 */
export const routing = defineRouting({
  locales: deploymentLocales,
  defaultLocale: currentLocale,
  localePrefix: {
    mode: 'as-needed',
    prefixes: Object.fromEntries(
      deploymentLocales
        .filter((l) => localePathPrefixes[l])
        .map((l) => [l, localePathPrefixes[l]]),
    ),
  },
  // The language is chosen explicitly and lives in the URL. Sniffing
  // Accept-Language would hand two visitors different content for the same
  // address, which breaks both caching and what a shared link means.
  localeDetection: false,
});

export const routingCountry = currentCountry;
