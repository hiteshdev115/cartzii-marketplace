'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { buildPath } from '@/config/countries';
import { Link } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchHomeBanners, type HomeBanner } from '@/lib/api/banners';

const SLIDE_INTERVAL = 5000;

/** Used until banners load, and whenever none are configured. */
const FALLBACK_HEIGHT = 480;

const fallbackStyles = [
  'from-slate-900 via-slate-800 to-orange-900',
  'from-indigo-900 via-purple-900 to-slate-900',
  'from-emerald-900 via-teal-800 to-slate-900',
];

export function HeroBanner() {
  const t = useTranslations('Home');
  const [current, setCurrent] = useState(0);
  const [feed, setFeed] = useState<{ banners: HomeBanner[]; carouselHeight: number }>({
    banners: [],
    carouselHeight: FALLBACK_HEIGHT,
  });

  useEffect(() => {
    let cancelled = false;
    fetchHomeBanners().then((data) => {
      if (!cancelled) setFeed(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * The translated slides, used only when no banners are configured.
   *
   * Kept so a fresh install still has a hero rather than a blank strip, and so
   * the section does not disappear the moment an admin deactivates the last
   * banner.
   */
  const fallbackSlides = useMemo(
    () => [
      {
        title: t('heroTitle'),
        subtitle: t('heroSubtitle'),
        cta: t('shopNow'),
        ctaHref: buildPath('/products'),
        secondaryCta: t('exploreDeals'),
        secondaryHref: buildPath('/deals'),
      },
      { title: t('slide2Title'), subtitle: t('slide2Subtitle'), cta: t('slide2Cta'), ctaHref: buildPath('/deals') },
      { title: t('slide3Title'), subtitle: t('slide3Subtitle'), cta: t('slide3Cta'), ctaHref: buildPath('/products') },
    ],
    [t],
  );

  const usingBanners = feed.banners.length > 0;
  const slideCount = usingBanners ? feed.banners.length : fallbackSlides.length;

  /**
   * ONE height for the whole carousel.
   *
   * The old version left the active slide in normal flow and absolutely
   * positioned the rest, so the section was exactly as tall as whichever slide
   * was showing. Slide 1 had two buttons and a longer subtitle, slides 2 and 3
   * had one — so every auto-advance re-measured the section and shoved the
   * whole page up or down. Fixing the height here is what stops that, and it
   * is why every slide below is absolutely positioned, including the active one.
   */
  const height = usingBanners ? feed.carouselHeight : FALLBACK_HEIGHT;

  const goTo = useCallback(
    (index: number) => setCurrent(((index % slideCount) + slideCount) % slideCount),
    [slideCount],
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Reset when the slide count changes, so a shrinking list cannot leave the
  // index pointing past the end. Deferred a tick rather than set inline:
  // setting state synchronously inside an effect cascades a second render.
  useEffect(() => {
    const reset = setTimeout(() => setCurrent((c) => (c < slideCount ? c : 0)), 0);
    return () => clearTimeout(reset);
  }, [slideCount]);

  useEffect(() => {
    if (slideCount <= 1) return;
    const timer = setInterval(next, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [next, slideCount]);

  return (
    <section
      className="relative overflow-hidden bg-slate-900"
      // Inline because the value is configured per deployment; a Tailwind class
      // cannot express an arbitrary pixel height set by an admin.
      style={{ height }}
      aria-roledescription="carousel"
      aria-label={t('heroTitle')}
    >
      {usingBanners
        ? feed.banners.map((banner, i) => (
            <div
              key={banner.bannerid}
              className={cn(
                'absolute inset-0 transition-opacity duration-700 ease-in-out',
                i === current ? 'opacity-100' : 'opacity-0 pointer-events-none',
              )}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${slideCount}`}
              aria-hidden={i !== current}
            >
              <Image
                src={banner.imageUrl}
                alt={banner.title ?? `Banner ${i + 1}`}
                fill
                sizes="100vw"
                // The first banner is the page's largest contentful paint.
                priority={i === 0}
                className="object-cover"
              />

              {(banner.title || banner.subtitle || banner.ctaText) && (
                <>
                  {/* Only drawn when there is copy to make readable — an
                      image-only banner should not be dimmed for nothing. */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900/75 via-slate-900/40 to-transparent" />
                  <div className="relative h-full max-w-[var(--container-max)] mx-auto px-4 sm:px-6 flex items-center">
                    <div className="max-w-xl">
                      {banner.title && (
                        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight">
                          {banner.title}
                        </h2>
                      )}
                      {banner.subtitle && (
                        <p className="mt-4 text-base md:text-lg text-slate-200 leading-relaxed">
                          {banner.subtitle}
                        </p>
                      )}
                      {banner.ctaText && (
                        <Link
                          href={banner.ctaHref || buildPath('/products')}
                          className="btn-primary mt-6 inline-block text-base px-8 py-3.5"
                        >
                          {banner.ctaText}
                        </Link>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        : fallbackSlides.map((slide, i) => (
            <div
              key={i}
              className={cn(
                'absolute inset-0 transition-opacity duration-700 ease-in-out bg-gradient-to-br',
                fallbackStyles[i % fallbackStyles.length],
                i === current ? 'opacity-100' : 'opacity-0 pointer-events-none',
              )}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${slideCount}`}
              aria-hidden={i !== current}
            >
              <div className="h-full max-w-[var(--container-max)] mx-auto px-4 sm:px-6 flex items-center">
                <div className="max-w-2xl">
                  <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight">
                    {slide.title}
                  </h2>
                  <p className="mt-4 text-base md:text-lg text-slate-300 leading-relaxed max-w-xl">
                    {slide.subtitle}
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Link href={slide.ctaHref} className="btn-primary text-base px-8 py-3.5 text-center">
                      {slide.cta}
                    </Link>
                    {slide.secondaryCta && (
                      <Link
                        href={slide.secondaryHref!}
                        className="btn-outline border-white text-white hover:bg-white hover:text-slate-900 text-base px-8 py-3.5 text-center"
                      >
                        {slide.secondaryCta}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

      {slideCount > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-colors z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-colors z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {Array.from({ length: slideCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === current ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/70',
                )}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current ? 'true' : undefined}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
