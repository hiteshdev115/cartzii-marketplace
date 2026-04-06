'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, Heart, User } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { buildCountryPath } from '@/config/countries';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { AnnouncementBar } from './AnnouncementBar';
import { MobileNav } from './MobileNav';
import { CountrySelector } from './CountrySelector';
import { CategoryMenu } from './CategoryMenu';
import { cn } from '@/lib/utils';
import { useHydrated } from '@/hooks/useHydration';

export function Header() {
  const t = useTranslations('Header');
  const tNav = useTranslations('Nav');
  const locale = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const hydrated = useHydrated();
  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.items.length);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 10);
      setVisible(currentScrollY <= 10 || currentScrollY < lastScrollY);
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navBeforeCategories = [
    { label: tNav('home'), href: buildCountryPath(locale, '/') },
    { label: tNav('shop'), href: buildCountryPath(locale, '/products') },
  ];

  const navAfterCategories = [
    { label: tNav('deals'), href: buildCountryPath(locale, '/deals') },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = buildCountryPath(locale, `/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header role="banner">
      <AnnouncementBar />
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 transition-all duration-300',
          scrolled ? 'shadow-sm' : '',
          visible ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Mobile menu + Logo */}
            <div className="flex items-center gap-3">
              <MobileNav />
              <Link href={buildCountryPath(locale, '/')} className="flex items-center gap-2">
                <Image src="/assets/cartzii-logo-wt-bg.png" alt="Cartzii" width={150} height={40} className="object-contain" priority />
              </Link>
            </div>

            {/* Center: Nav links (desktop) */}
            <nav className="hidden lg:flex items-center gap-1" role="navigation" aria-label="Main navigation">
              {navBeforeCategories.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <CategoryMenu />
              {navAfterCategories.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right: Search, actions */}
            <div className="flex items-center gap-2">
              {/* Search bar (desktop) */}
              <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-44 lg:w-64 xl:w-80 pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
                <Search className="absolute left-3 w-4 h-4 text-slate-400" aria-hidden="true" />
              </form>

              {/* Mobile search toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-slate-600" />
              </button>

              <CountrySelector />

              {/* Wishlist */}
              <Link
                href={buildCountryPath(locale, '/account/wishlist')}
                className="relative p-2 hover:bg-slate-100 rounded-lg hidden sm:flex"
                aria-label={`${t('wishlist')}${hydrated && wishlistCount > 0 ? ` (${wishlistCount})` : ''}`}
              >
                <Heart className="w-5 h-5 text-slate-600" />
                {hydrated && wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                href={buildCountryPath(locale, '/cart')}
                className="relative p-2 hover:bg-slate-100 rounded-lg"
                aria-label={`${t('cart')}${hydrated && cartCount > 0 ? ` (${cartCount})` : ''}`}
              >
                <ShoppingCart className="w-5 h-5 text-slate-600" />
                {hydrated && cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Account */}
              <Link
                href={buildCountryPath(locale, '/auth/login')}
                className="p-2 hover:bg-slate-100 rounded-lg"
                aria-label={t('account')}
              >
                <User className="w-5 h-5 text-slate-600" />
              </Link>
            </div>
          </div>

          {/* Mobile search expanded */}
          {searchOpen && (
            <div className="md:hidden pb-3">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-full bg-slate-50 focus:bg-white focus:border-primary transition-all outline-none"
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              </form>
            </div>
          )}
        </div>
      </div>
      {/* Spacer for fixed header */}
      <div className="h-16" />
    </header>
  );
}
