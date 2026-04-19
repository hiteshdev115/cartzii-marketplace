'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { buildCountryPath } from '@/config/countries';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const SLIDE_INTERVAL = 5000;

const slideStyles = [
  {
    bg: 'from-slate-900 via-slate-800 to-orange-900',
    accent: 'bg-primary',
  },
  {
    bg: 'from-indigo-900 via-purple-900 to-slate-900',
    accent: 'bg-indigo-500',
  },
  {
    bg: 'from-emerald-900 via-teal-800 to-slate-900',
    accent: 'bg-emerald-500',
  },
];

export function HeroBanner() {
  const t = useTranslations('Home');
  const locale = useLocale();
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const slides = [
    {
      title: t('heroTitle'),
      subtitle: t('heroSubtitle'),
      cta: t('shopNow'),
      ctaHref: buildCountryPath(locale, '/products'),
      secondaryCta: t('exploreDeals'),
      secondaryHref: buildCountryPath(locale, '/deals'),
    },
    {
      title: t('slide2Title'),
      subtitle: t('slide2Subtitle'),
      cta: t('slide2Cta'),
      ctaHref: buildCountryPath(locale, '/deals'),
    },
    {
      title: t('slide3Title'),
      subtitle: t('slide3Subtitle'),
      cta: t('slide3Cta'),
      ctaHref: buildCountryPath(locale, '/products'),
    },
  ];

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, slides.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, slides.length, goTo]);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(next, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

  const style = slideStyles[current];

  return (
    <section className="relative overflow-hidden" aria-roledescription="carousel" aria-label={t('heroTitle')}>
      {/* Background */}
      <div className={cn('absolute inset-0 bg-gradient-to-br transition-all duration-700 ease-in-out', style.bg)} />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

      {/* Slides */}
      <div className="relative max-w-[var(--container-max)] mx-auto px-4 sm:px-6 py-20 md:py-28 lg:py-36">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={cn(
              'transition-all duration-600 ease-in-out',
              i === current
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 absolute inset-0 px-4 sm:px-6 py-20 md:py-28 lg:py-36 pointer-events-none',
              i < current ? '-translate-x-8' : i > current ? 'translate-x-8' : ''
            )}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${slides.length}`}
            aria-hidden={i !== current}
          >
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                {slide.title}
              </h2>
              <p className="mt-6 text-lg md:text-xl text-slate-300 leading-relaxed max-w-xl">
                {slide.subtitle}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href={slide.ctaHref}
                  className="btn-primary text-base px-8 py-4 text-center"
                >
                  {slide.cta}
                </Link>
                {slide.secondaryCta && (
                  <Link
                    href={slide.secondaryHref!}
                    className="btn-outline border-white text-white hover:bg-white hover:text-slate-900 text-base px-8 py-4 text-center"
                  >
                    {slide.secondaryCta}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              i === current ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
            )}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === current ? 'true' : undefined}
          />
        ))}
      </div>
    </section>
  );
}
