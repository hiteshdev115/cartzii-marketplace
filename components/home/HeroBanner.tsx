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

/**
 * The viewport width at which an admin's chosen height is honoured exactly.
 * Below it the banner scales down proportionally rather than cropping harder.
 */
const DESIGN_WIDTH = 1440;

/** The banner never collapses below this, however narrow the screen. */
const MIN_HEIGHT = 200;

/** Where the copy sits, and the scrim that keeps it readable. */
const ALIGNMENT: Record<string, { row: string; text: string; scrim: string }> = {
  left: {
    row: 'justify-start',
    text: 'text-left',
    scrim: 'bg-gradient-to-r from-slate-900/80 via-slate-900/45 to-transparent',
  },
  right: {
    row: 'justify-end',
    text: 'text-right',
    // Mirrored, so the dark end is always BEHIND the copy rather than opposite
    // it — a left-side gradient under right-aligned text leaves the words on
    // the bright edge of the photograph, which is where they become unreadable.
    scrim: 'bg-gradient-to-l from-slate-900/80 via-slate-900/45 to-transparent',
  },
  center: {
    row: 'justify-center',
    text: 'text-center',
    // Centre copy has no single side to shade, so the whole frame is dimmed.
    scrim: 'bg-slate-900/55',
  },
};

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
   * ONE height for the whole carousel — but one that scales with the viewport.
   *
   * Two separate problems live here.
   *
   * The first is the squeeze: the old version left the active slide in normal
   * flow and absolutely positioned the rest, so the section was exactly as tall
   * as whichever slide was showing, and every auto-advance re-measured it and
   * shoved the page. That is why every slide below is absolutely positioned,
   * including the active one, and why this is a single value rather than a
   * per-slide one.
   *
   * The second is the crop. Holding the admin's pixel height at EVERY viewport
   * width is what made banners look stretched on a phone: `object-cover`
   * preserves aspect ratio and crops, so a 1920x600 artwork forced into a
   * 390x480 frame was scaled ~3x and had most of its width thrown away.
   *
   * So the height is expressed as a clamp: honoured exactly at the design
   * width, scaled DOWN proportionally on narrower screens — which keeps the
   * frame's aspect ratio close to the artwork's and removes most of the crop —
   * and floored so it never collapses to a strip.
   *
   * It stays viewport-derived, never slide-derived, so the squeeze cannot come
   * back: every slide in the rotation resolves to the identical height.
   */
  const height = usingBanners ? feed.carouselHeight : FALLBACK_HEIGHT;
  const responsiveHeight = `clamp(${MIN_HEIGHT}px, calc(100vw * ${height} / ${DESIGN_WIDTH}), ${height}px)`;

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
      style={{ height: responsiveHeight }}
      aria-roledescription="carousel"
      aria-label={t('heroTitle')}
    >
      {usingBanners
        ? feed.banners.map((banner, i) => {
            const align = ALIGNMENT[banner.contentAlign] ?? ALIGNMENT.left;
            const hasCopy = Boolean(banner.title || banner.subtitle || banner.ctaText);

            return (
              <div
                key={banner.bannerid}
                className={cn(
                  'absolute inset-0 transition-opacity duration-700 ease-in-out',
                  i === current ? 'opacity-100' : 'opacity-0 pointer-events-none',
                )}
                // Only visible where 'contain' letterboxes the artwork. Set per
                // banner so the bars are a chosen colour rather than whatever
                // happens to sit behind the section.
                style={{ backgroundColor: banner.backdropColor }}
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
                  className={banner.imageFit === 'contain' ? 'object-contain' : 'object-cover'}
                  // Which part of the artwork survives a crop. Only meaningful
                  // for 'cover'; harmless for 'contain', which crops nothing.
                  style={{ objectPosition: banner.focalPoint }}
                />

                {hasCopy && (
                  <>
                    {/* Only drawn when there is copy to make readable — an
                        image-only banner should not be dimmed for nothing. */}
                    <div className={cn('absolute inset-0', align.scrim)} />
                    <div
                      className={cn(
                        'relative h-full max-w-[var(--container-max)] mx-auto px-4 sm:px-6 flex items-center',
                        align.row,
                      )}
                    >
                      <div className={cn('max-w-xl', align.text)}>
                        {banner.title && (
                          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight">
                            {banner.title}
                          </h2>
                        )}
                        {banner.subtitle && (
                          <p className="mt-3 md:mt-4 text-sm sm:text-base md:text-lg text-slate-200 leading-relaxed">
                            {banner.subtitle}
                          </p>
                        )}
                        {banner.ctaText && (
                          <Link
                            href={banner.ctaHref || buildPath('/products')}
                            className="btn-primary mt-4 md:mt-6 inline-block text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5"
                          >
                            {banner.ctaText}
                          </Link>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
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
