import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { getMessageFile } from '@/config/countries';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  const msgFile = getMessageFile(locale);

  return {
    locale,
    messages: (await import(`../messages/${msgFile}.json`)).default,
  };
});
