'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import {
  ArrowRight, Scissors, Paintbrush2, Hammer, Gem, Leaf, BookOpen,
  Shirt, Star, Sparkles, ChevronRight, Search,
} from 'lucide-react';
import { buildCountryPath } from '@/config/countries';
import { fetchCategoryTree } from '@/lib/api';
import { getCategoryIconConfig } from '@/lib/categoryIcons';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import type { Category } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.cartzii.com';
const CATEGORY_CDN = `${API_BASE}/assets/upload/categoryImages`;

function buildCategoryImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${CATEGORY_CDN}/${url}`;
}

const HANDICRAFT_KEYWORDS = [
  'craft', 'handicraft', 'handmade', 'artisan', 'art', 'knit', 'sew', 'stitch',
  'embroid', 'weav', 'crochet', 'pottery', 'ceramic', 'paint', 'sculpt', 'wood',
  'carv', 'jewel', 'bead', 'macram', 'quilt', 'origami', 'calligraph', 'print',
  'stamp', 'diy', 'fabric', 'yarn', 'thread', 'canvas', 'sketch', 'draw',
  'leatherwork', 'leather', 'glass', 'mosaic', 'textile', 'lace', 'tassel',
  'home decor', 'stationery', 'paper', 'scrapbook', 'candle', 'soap', 'resin',
];

function isHandicraftCategory(cat: Category): boolean {
  const hay = `${cat.slug} ${cat.name} ${cat.description}`.toLowerCase();
  return HANDICRAFT_KEYWORDS.some((kw) => hay.includes(kw));
}

function collectHandicraftCategories(cats: Category[]): Category[] {
  const result: Category[] = [];
  for (const cat of cats) {
    if (isHandicraftCategory(cat)) {
      result.push(cat);
    } else if (cat.subcategories?.length) {
      result.push(...collectHandicraftCategories(cat.subcategories));
    }
  }
  return result;
}

// ─── Static spotlight crafts ─────────────────────────────────────────────────
// Shown always — highlights the breadth of handicraft with curated icons + nav

const CRAFT_SPOTLIGHTS = [
  {
    icon: Scissors,
    gradient: 'from-pink-500 to-rose-600',
    title: 'Knitting & Crochet',
    desc: 'Yarn, needles, patterns and finished pieces for every skill level.',
    query: 'knitting crochet',
  },
  {
    icon: Paintbrush2,
    gradient: 'from-violet-500 to-purple-600',
    title: 'Painting & Drawing',
    desc: 'Canvases, brushes, watercolours, oils and sketch supplies.',
    query: 'painting drawing',
  },
  {
    icon: Hammer,
    gradient: 'from-amber-500 to-orange-600',
    title: 'Woodworking & Carving',
    desc: 'Tools, lumber, finishes and handcrafted wooden goods.',
    query: 'wood carving',
  },
  {
    icon: Gem,
    gradient: 'from-cyan-500 to-teal-600',
    title: 'Jewellery Making',
    desc: 'Beads, wire, findings and handmade artisan jewellery.',
    query: 'jewelry jewellery',
  },
  {
    icon: Shirt,
    gradient: 'from-indigo-500 to-blue-600',
    title: 'Sewing & Embroidery',
    desc: 'Fabric, patterns, hoops, thread and embroidery kits.',
    query: 'sewing embroidery',
  },
  {
    icon: Leaf,
    gradient: 'from-emerald-500 to-green-600',
    title: 'Candle & Soap Making',
    desc: 'Wax, moulds, fragrance oils and natural soap ingredients.',
    query: 'candle soap',
  },
  {
    icon: BookOpen,
    gradient: 'from-rose-500 to-pink-600',
    title: 'Scrapbooking & Paper',
    desc: 'Albums, stickers, washi tape and paper crafting essentials.',
    query: 'scrapbook paper',
  },
  {
    icon: Star,
    gradient: 'from-yellow-500 to-amber-600',
    title: 'Pottery & Ceramics',
    desc: 'Clay, wheels, glazes and hand-built ceramic creations.',
    query: 'pottery ceramic',
  },
];

// ─── Skeleton ────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-5 animate-pulse">
      <div className="w-14 h-14 rounded-2xl bg-slate-200 mb-4" />
      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-1/2" />
    </div>
  );
}

// ─── Category Card ────────────────────────────────────────────────────────────

function CategoryCard({ cat, locale }: { cat: Category; locale: string }) {
  const imgSrc = buildCategoryImageUrl(cat.image);
  const { icon: Icon, gradient } = getCategoryIconConfig(cat.slug, cat.name);
  const subCount = cat.subcategories?.length ?? 0;

  return (
    <Link
      href={buildCountryPath(locale, `/categories/${cat.slug}`)}
      className="group flex flex-col bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="relative w-14 h-14 rounded-2xl overflow-hidden mb-4 flex-shrink-0">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={cat.name}
            fill
            sizes="56px"
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <Icon className="w-7 h-7 text-white drop-shadow" />
          </div>
        )}
      </div>
      <p className="text-sm font-bold text-slate-900 leading-snug group-hover:text-primary transition-colors">
        {cat.name}
      </p>
      <p className="mt-1 text-xs text-slate-400 leading-tight">
        {subCount > 0
          ? `${subCount} subcategor${subCount === 1 ? 'y' : 'ies'}`
          : cat.productCount > 0
          ? `${cat.productCount.toLocaleString()} products`
          : 'Explore →'}
      </p>
      <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300">
        Browse <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

interface Props {
  initialHandicraftCategories: Category[];
  initialAllCategories: Category[];
}

export function HandicraftPageClient({ initialHandicraftCategories, initialAllCategories }: Props) {
  const locale = useLocale();
  const [handicraftCategories, setHandicraftCategories] = useState<Category[]>(initialHandicraftCategories);
  const [allCategories, setAllCategories] = useState<Category[]>(initialAllCategories);
  const [loading, setLoading] = useState(
    initialHandicraftCategories.length === 0 && initialAllCategories.length === 0,
  );
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (initialAllCategories.length > 0) return;
    fetchCategoryTree()
      .then((tree) => {
        setAllCategories(tree);
        setHandicraftCategories(collectHandicraftCategories(tree));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialAllCategories.length]);

  // Use handicraft-filtered categories; if none match, fall back to all
  const sourceCategories = handicraftCategories.length > 0 ? handicraftCategories : allCategories;

  const filtered = search.trim()
    ? sourceCategories.filter((c) =>
        `${c.name} ${c.description} ${c.slug}`.toLowerCase().includes(search.toLowerCase()),
      )
    : sourceCategories;

  const showFallback = !loading && handicraftCategories.length === 0 && allCategories.length > 0;

  return (
    <div className="bg-[#F0F2F2] min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={[{ label: 'Handicraft' }]} />
      </div>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-950 via-pink-950 to-slate-900 text-white mt-4">
        {/* Blobs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-pink-500/15 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full bg-rose-400/10 blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle,_#fff_1px,_transparent_1px)] bg-[size:28px_28px]" />

        <div className="relative max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 text-amber-400" /> Handcrafted with love
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4">
              The World of{' '}
              <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                Handicraft
              </span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed mb-8">
              From knitting and pottery to jewellery-making and woodwork — explore
              artisan categories, discover handmade goods, and find everything you
              need for your next creative project.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={buildCountryPath(locale, '/search?q=handmade')}
                className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-all shadow-lg"
              >
                Shop Handmade <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={buildCountryPath(locale, '/products')}
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-all"
              >
                All Products
              </Link>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-10 md:h-14">
            <path d="M0 60L60 52C120 44 240 28 360 24C480 20 600 28 720 32C840 36 960 36 1080 32C1200 28 1320 20 1380 16L1440 12V60H0Z" fill="#F0F2F2" />
          </svg>
        </div>
      </section>

      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">

        {/* ── Craft Spotlights ───────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Explore by Craft</p>
              <h2 className="text-2xl font-extrabold text-slate-900">Popular Craft Types</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {CRAFT_SPOTLIGHTS.map((craft) => (
              <Link
                key={craft.title}
                href={buildCountryPath(locale, `/search?q=${encodeURIComponent(craft.query)}`)}
                className="group flex flex-col bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${craft.gradient} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300 shadow-md`}>
                  <craft.icon className="w-7 h-7 text-white drop-shadow" />
                </div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug">
                  {craft.title}
                </p>
                <p className="mt-1 text-xs text-slate-400 leading-snug line-clamp-2">{craft.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300">
                  Search <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── API-sourced categories ─────────────────────────────── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
                {showFallback ? 'Browse All' : 'Artisan Categories'}
              </p>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {showFallback ? 'All Product Categories' : 'Shop by Craft Category'}
              </h2>
              {showFallback && (
                <p className="text-sm text-slate-500 mt-1">
                  Browse all categories and use the search bar above to find craft-specific results.
                </p>
              )}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {loading
              ? Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)
              : filtered.length === 0
              ? (
                <div className="col-span-full text-center py-16 text-slate-400">
                  <p className="text-base font-medium">No categories found for &ldquo;{search}&rdquo;</p>
                  <button
                    onClick={() => setSearch('')}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              )
              : filtered.map((cat) => (
                  <CategoryCard key={cat.id} cat={cat} locale={locale} />
                ))}
          </div>
        </section>

        {/* ── Why Handmade CTA ──────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl px-8 py-14 text-center text-white shadow-xl">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-rose-500/20 rounded-full blur-[70px] pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-pink-500/15 rounded-full blur-[60px] pointer-events-none" />
          <div className="relative max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Support artisan makers
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
              Every piece tells a{' '}
              <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">story.</span>
            </h2>
            <p className="text-white/70 text-base mb-8 leading-relaxed">
              Handmade products carry the care, skill, and creativity of the maker.
              Shop authentic handicrafts and support independent artisans on Cartzii.
            </p>
            <Link
              href={buildCountryPath(locale, '/search?q=handmade artisan')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold px-8 py-3.5 rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-rose-900/40"
            >
              Discover Handmade <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
