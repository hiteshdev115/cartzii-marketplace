'use client';

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { buildPath } from '@/config/countries';
import { Link } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchHomeBanners, type HomeBannerFeed } from '@/lib/api/banners';

const SLIDE_INTERVAL = 5000;

/**
 * Space held while the feed is in flight.
 *
 * Not a banner and not content — just a reserved box, so the rest of the home
 * page does not jump downwards the moment the real banners arrive. It is the
 * common case that a site HAS banners, so reserving is the smaller disruption.
 */
const RESERVED_HEIGHT = 480;

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

/**
 * The home page hero.
 *
 * Renders ONLY what an admin has published. There are no built-in slides: this
 * used to fall back to three hard-coded ones, which meant a storefront with no
 * banners configured advertised products and sales nobody had approved, and an
 * admin who deactivated every banner still saw a hero they could not edit.
 *
 * With nothing published the section renders nothing at all, and the page
 * simply starts at whatever comes next.
 */
export function HeroBanner() {
  const t = useTranslations('Home');
  const [current, setCurrent] = useState(0);
  // `null` means "not loaded yet", which is deliberately distinct from "loaded
  // and empty" — the first reserves space, the second renders nothing.
  const [feed, setFeed] = useState<HomeBannerFeed | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHomeBanners().then((data) => {
      if (!cancelled) setFeed(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const banners = feed?.banners ?? [];
  const slideCount = banners.length;

  /**
   * The frame every slide is drawn in.
   *
   * 'auto' sizes it by ASPECT RATIO rather than by pixels, so the artwork's own
   * proportions decide the shape and nothing has to be cropped to fit. With
   * `contain` there are no bars either, because the frame already matches the
   * picture.
   *
   * `maxHeight` still applies — without it a square banner would be as tall as
   * the viewport is wide, which is 2560px of hero on a large monitor.
   *
   * 'fixed' keeps the pixel height, expressed as a clamp so it scales DOWN on
   * narrow screens instead of cropping harder there.
   *
   * Either way the value is derived from the VIEWPORT and the feed, never from
   * the active slide — so the section cannot re-measure as slides advance,
   * which is what made the page squeeze.
   */
  const height = feed?.carouselHeight ?? RESERVED_HEIGHT;
  const frameStyle: CSSProperties =
    feed?.frame.mode === 'auto' && feed.frame.aspectRatio
      ? { aspectRatio: String(feed.frame.aspectRatio), maxHeight: `${feed.frame.heightPx}px`, width: '100%' }
      : { height: `clamp(${MIN_HEIGHT}px, calc(100vw * ${height} / ${DESIGN_WIDTH}), ${height}px)` };

  const goTo = useCallback(
    (index: number) =>
      // Guarded: with no slides the modulo below would be a division by zero
      // and set the index to NaN.
      setCurrent((currentIndex) =>
        slideCount > 0 ? ((index % slideCount) + slideCount) % slideCount : currentIndex,
      ),
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

  // Still loading: hold the space, show no content. Every hook above has
  // already run, so this early return cannot change the hook order.
  if (feed === null) {
    return <div style={frameStyle} className="bg-slate-100" aria-hidden="true" />;
  }

  // Loaded, and an admin has published nothing. Render nothing rather than
  // inventing a slide.
  if (slideCount === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-slate-900"
      // Inline because the value is configured per deployment; a Tailwind class
      // cannot express an arbitrary pixel height set by an admin.
      style={frameStyle}
      aria-roledescription="carousel"
      aria-label={t('bannerCarousel')}
    >
      {banners.map((banner, i) => {
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
              className={
                banner.imageFit === 'contain' ? 'object-contain'
                : banner.imageFit === 'fill' ? 'object-fill'
                : banner.imageFit === 'scale-down' ? 'object-scale-down'
                : banner.imageFit === 'none' ? 'object-none'
                : 'object-cover'
              }
              // Which part of the artwork survives a crop. Only meaningful for
              // the fits that actually crop; harmless for the rest.
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
      })}

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
