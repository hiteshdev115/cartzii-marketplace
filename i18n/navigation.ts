import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Locale-aware navigation.
 *
 * Import `Link` from here rather than `next/link` for any INTERNAL link. It
 * reads the active locale and adds the language prefix when one is needed, so
 * a link written as `/products` resolves to `/products` in English and
 * `/fr/products` in French without the caller thinking about it.
 *
 * That automatic prefixing is the whole point: plain `next/link` would send a
 * visitor reading French to the English page on every click, silently.
 *
 * `usePathname` here returns the path WITHOUT the language prefix, which is
 * what callers comparing against a route want.
 */
export const { Link, useRouter, usePathname, redirect, getPathname } =
  createNavigation(routing);
