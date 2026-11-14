'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getCountryFromLocale } from '@/config/countries';
import { fetchRelatedProducts } from '@/lib/api/products';
import { ProductSlider } from '@/components/home/ProductSlider';
import type { Product } from '@/types';

interface RelatedProductsProps {
  productId: string | number;
  /** How many tiles to request — backend caps at 24. */
  limit?: number;
}

/**
 * `RelatedProducts` — bottom-of-product-page carousel of similar items.
 *
 * Lazy-loads via IntersectionObserver: the fetch doesn't fire until the
 * component scrolls into view, so a shopper who buys without scrolling
 * never pays for the request. Once mounted and fetched, the slider
 * reuses the existing <ProductSlider> + <ProductCard> primitives so the
 * tiles look identical to every other product row on the site and
 * inherit the same Add-to-Cart behavior (direct add of the default
 * variant, mini-cart drawer opens).
 *
 * Failure is silent — an empty-array return from fetchRelatedProducts
 * collapses the component to nothing rather than showing an error.
 * The slider is auxiliary; losing it must never block the product page.
 */
export function RelatedProducts({ productId, limit = 10 }: RelatedProductsProps) {
  const locale = useLocale();
  const t = useTranslations('Products');
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Observe the section — fire the fetch when it's within 400px of the
  // viewport. Shoppers usually land mid-page, so the carousel may be
  // well below the fold; deferring until near-view is pure savings.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      // Fallback for SSR or very old browsers — load immediately.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || loaded) return;
    const country = getCountryFromLocale(locale);
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetchRelatedProducts(productId, country, limit)
      .then((list) => {
        if (cancelled) return;
        setProducts(list);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [inView, loaded, productId, limit, locale]);

  // If we've finished fetching and got nothing back, collapse — don't
  // render an empty heading. A blank "You may also like" row would be
  // worse than no row at all.
  if (loaded && products.length === 0) {
    return <div ref={sectionRef} aria-hidden="true" />;
  }

  return (
    <section
      ref={sectionRef}
      className="mt-10 sm:mt-14"
      aria-labelledby="related-products-heading"
    >
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2
            id="related-products-heading"
            className="text-xl sm:text-2xl font-semibold text-slate-900"
          >
            {t('youMightAlsoLike')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t('youMightAlsoLikeSubtitle')}
          </p>
        </div>
      </div>
      <ProductSlider
        products={products}
        loading={loading}
        label={t('youMightAlsoLike')}
      />
    </section>
  );
}
