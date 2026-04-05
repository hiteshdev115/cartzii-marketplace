import { defineRouting } from 'next-intl/routing';
import { allLocales, defaultLocale } from '@/config/countries';

export const routing = defineRouting({
  locales: allLocales,
  defaultLocale,
});
