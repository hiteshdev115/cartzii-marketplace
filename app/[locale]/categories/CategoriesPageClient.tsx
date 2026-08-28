'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';

import {
  ChevronLeft, ChevronRight, ArrowRight, Tag, Zap, Sparkles, Gift,
} from 'lucide-react';
import { buildPath } from '@/config/countries';
import { fetchRootCategories } from '@/lib/api';
import { getCategoryIconConfig } from '@/lib/categoryIcons';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

// ─── Constants ──────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.cartzii.com';
const CATEGORY_CDN = `${API_BASE}/assets/upload/categoryImages`;

function buildCategoryImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${CATEGORY_CDN}/${url}`;
}

// ─── Carousel slides ─────────────────────────────────────────────────────────

const SLIDES = [
  {
    id: 1,
    badge: 'Limited Time',
    badgeIcon: Zap,
    title: 'Flash Sale — Up to 50% Off',
    subtitle: 'Huge savings across electronics, fashion & home. Today only.',
    cta: 'Shop Deals',
    ctaPath: '/deals',
    gradient: 'from-slate-900 via-orange-950 to-slate-900',
    accentGradient: 'from-orange-400 to-red-500',
    decorColor: 'bg-primary/25',
  },
  {
    id: 2,
    badge: 'Just Arrived',
    badgeIcon: Sparkles,
    title: 'New Arrivals Are Here',
    subtitle: 'Fresh styles, latest tech, and trending finds — be the first to shop.',
    cta: 'Explore New In',
    ctaPath: '/products',
    gradient: 'from-indigo-950 via-violet-950 to-slate-900',
    accentGradient: 'from-violet-400 to-indigo-500',
    decorColor: 'bg-violet-500/25',
  },
  {
    id: 3,
    badge: 'Member Exclusive',
    badgeIcon: Gift,
    title: 'Members Get More',
    subtitle: 'Sign in to unlock early access, exclusive prices, and free shipping perks.',
    cta: 'Join Free',
    ctaPath: '/auth/signup',
    gradient: 'from-emerald-950 via-teal-950 to-slate-900',
    accentGradient: 'from-emerald-400 to-teal-500',
    decorColor: 'bg-emerald-500/25',
  },
  {
    id: 4,
    badge: 'Seasonal Picks',
    badgeIcon: Tag,
    title: 'This Season\'s Top Picks',
    subtitle: 'Curated collections across every category. Discover what\'s trending now.',
    cta: 'Browse All',
    ctaPath: '/products',
    gradient: 'from-rose-950 via-pink-950 to-slate-900',
    accentGradient: 'from-rose-400 to-pink-500',
    decorColor: 'bg-rose-500/25',
  },
];

// ─── Skeleton ────────────────────────────────────────────────────────────────

function CategoryCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-5 animate-pulse">
      <div className="w-14 h-14 rounded-2xl bg-slate-200 mb-4" />
      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-1/2" />
    </div>
  );
}

// ─── Offers Carousel ─────────────────────────────────────────────────────────

function OffersCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((idx: number) => {
    setCurrent((idx + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (paused) return;
    timeoutRef.current = setTimeout(next, 4500);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [current, paused, next]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Offers and promotions"
    >
      {/* Slides */}
      <div className="relative h-52 sm:h-60 md:h-72">
        {SLIDES.map((slide, i) => {
          const BadgeIcon = slide.badgeIcon;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}`}
              aria-hidden={i !== current}
              className={cn(
                'absolute inset-0 transition-all duration-700 ease-in-out',
                i === current ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 pointer-events-none z-0',
                i < current ? '-translate-x-4' : 'translate-x-4',
              )}
            >
              {/* Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`} />
              {/* Decorative blobs */}
              <div className={`absolute -top-16 -right-16 w-64 h-64 ${slide.decorColor} rounded-full blur-[80px] pointer-events-none`} />
              <div className={`absolute -bottom-12 -left-12 w-48 h-48 ${slide.decorColor} rounded-full blur-[60px] pointer-events-none`} />
              {/* Subtle dot pattern */}
              <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle,_#fff_1px,_transparent_1px)] bg-[size:24px_24px]" />

              {/* Content */}
              <div className="relative h-full flex flex-col justify-center px-6 sm:px-10 md:px-14">
                <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-white/90 mb-3 w-fit">
                  <BadgeIcon className="w-3 h-3" />
                  {slide.badge}
                </div>
                <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r ${slide.accentGradient} bg-clip-text text-transparent leading-tight mb-2`}>
                  {slide.title}
                </h2>
                <p className="text-sm sm:text-base text-white/70 max-w-lg leading-relaxed mb-4 hidden sm:block">
                  {slide.subtitle}
                </p>
                <Link
                  href={buildPath(slide.ctaPath)}
                  className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition-all w-fit shadow-lg"
                >
                  {slide.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === current ? 'true' : undefined}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70',
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Category Card ────────────────────────────────────────────────────────────

function CategoryCard({ cat }: { cat: Category }) {
  const imgSrc = buildCategoryImageUrl(cat.image);
  const { icon: Icon, gradient } = getCategoryIconConfig(cat.slug, cat.name);
  const subCount = cat.subcategories?.length ?? 0;

  return (
    <Link
      href={buildPath(`/categories/${cat.slug}`)}
      className="group flex flex-col bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-2 focus-visible:outline-primary"
    >
      {/* Icon / Image box */}
      <div className="relative w-14 h-14 rounded-2xl overflow-hidden mb-4 flex-shrink-0">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={cat.name}
            fill
            sizes="56px"
            className="object-cover group-hover:scale-110 transition-transform duration-400"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
            <Icon className="w-7 h-7 text-white drop-shadow" />
          </div>
        )}
      </div>

      {/* Name */}
      <p className="text-sm font-bold text-slate-900 leading-snug group-hover:text-primary transition-colors">
        {cat.name}
      </p>

      {/* Meta */}
      <p className="mt-1 text-xs text-slate-400 leading-tight">
        {subCount > 0
          ? `${subCount} subcategor${subCount === 1 ? 'y' : 'ies'}`
          : cat.productCount > 0
          ? `${cat.productCount.toLocaleString()} products`
          : 'Explore →'}
      </p>

      {/* Arrow indicator */}
      <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300">
        Browse <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface Props {
  initialCategories: Category[];
}

export function CategoriesPageClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(initialCategories.length === 0);

  useEffect(() => {
    if (initialCategories.length > 0) return;
    fetchRootCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [initialCategories.length]);

  return (
    <div className="bg-[#F0F2F2] min-h-screen">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">

        {/* ── Offers Carousel ── */}
        <OffersCarousel />

        {/* ── All Categories ── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
                Browse All
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                All Categories
              </h1>
            </div>
            <span className="text-sm text-slate-400 font-medium">
              {loading ? '...' : `${categories.length} categories`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {loading
              ? Array.from({ length: 12 }).map((_, i) => <CategoryCardSkeleton key={i} />)
              : categories.length === 0
              ? (
                <div className="col-span-full text-center py-20 text-slate-400">
                  <p className="text-lg font-medium">No categories found</p>
                  <p className="text-sm mt-1">Please try again later.</p>
                </div>
              )
              : categories.map((cat) => (
                  <CategoryCard key={cat.id} cat={cat} />
                ))}
          </div>
        </section>

      </div>
    </div>
  );
}
