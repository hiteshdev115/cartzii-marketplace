'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Search, ShoppingCart, Heart, User, LogOut, Package, Star, Settings, Truck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { buildPath } from '@/config/countries';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore } from '@/stores/authStore';
import { AnnouncementBar } from './AnnouncementBar';
import { MobileNav } from './MobileNav';
import { CountrySelector } from './CountrySelector';
import { CategoryMenu } from './CategoryMenu';
import { SearchDropdown } from './SearchDropdown';
import { cn } from '@/lib/utils';
import { useHydrated } from '@/hooks/useHydration';

export function Header() {
  const t = useTranslations('Header');
  const tNav = useTranslations('Nav');
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  // Separate ref for the mobile header's copy of the same menu — the two are
  // rendered at different breakpoints, so one ref cannot cover both.
  const mobileUserMenuRef = useRef<HTMLDivElement>(null);
  const searchDesktopRef = useRef<HTMLDivElement>(null);
  const searchMobileRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));
  const loadCart = useCartStore((s) => s.loadCart);
  const clearCart = useCartStore((s) => s.clearCart);
  const openCartDrawer = useCartStore((s) => s.openDrawer);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const fetchWishlistItems = useWishlistStore((s) => s.fetchItems);
  const clearWishlist = useWishlistStore((s) => s.clear);
  const token = useAuthStore((s) => s.token);
  const tokenExpiry = useAuthStore((s) => s.tokenExpiry);
  const userId = useAuthStore((s) => s.userId);
  const clearTokens = useAuthStore((s) => s.clearTokens);
  const userDisplayName = useAuthStore((s) => s.displayName());
  const isLoggedIn = hydrated && !!token;
  const router = useRouter();
  const pathname = usePathname();

  const handleCartIconClick = () => {
    if (pathname.includes('/checkout')) {
      router.push(buildPath('/cart'));
      return;
    }
    if (pathname.includes('/cart')) return;
    openCartDrawer();
  };

  const handleSignOut = () => {
    clearTokens();
    setUserMenuOpen(false);
    // If the user is on a protected page, redirect to home so they aren't
    // stuck on a page they can no longer access.
    const PROTECTED_SEGMENTS = ['checkout', 'account'];
    if (PROTECTED_SEGMENTS.some((seg) => pathname.includes(`/${seg}`))) {
      router.push(buildPath('/'));
    }
  };

  // Fetch wishlist and cart from API when user is authenticated
  const prevTokenRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (hydrated && token && userId) {
      fetchWishlistItems(userId).catch((err) => {
        // Token rejected by server → clear stale auth state
        if (err instanceof Error && err.message === 'Invalid auth token') {
          clearTokens();
        }
      });
      loadCart(userId);
    } else if (hydrated && !token && prevTokenRef.current) {
      // Only clear when transitioning from logged-in → logged-out (i.e. on logout),
      // not on every page load for guests — that would wipe the guest cart.
      clearWishlist();
      clearCart();
    }
    if (hydrated) prevTokenRef.current = token;
  }, [hydrated, token, userId, fetchWishlistItems, clearWishlist, loadCart, clearCart, clearTokens]);

  // Silently clear auth state when token expires, without forcing navigation.
  useEffect(() => {
    if (!hydrated || !token || !tokenExpiry) return;
    const now = Math.floor(Date.now() / 1000);
    if (tokenExpiry <= now) {
      clearTokens();
      return;
    }
    const timeout = setTimeout(() => {
      clearTokens();
    }, (tokenExpiry - now) * 1000);
    return () => clearTimeout(timeout);
  }, [hydrated, token, tokenExpiry, clearTokens]);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Must clear BOTH refs: checking only the desktop one closed the menu on
      // the very click that opened it on mobile.
      const insideUserMenu =
        (userMenuRef.current?.contains(e.target as Node)) ||
        (mobileUserMenuRef.current?.contains(e.target as Node));
      if (!insideUserMenu) {
        setUserMenuOpen(false);
      }
      const insideSearch =
        (searchDesktopRef.current?.contains(e.target as Node)) ||
        (searchMobileRef.current?.contains(e.target as Node));
      if (!insideSearch) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navBeforeCategories = [
    { label: tNav('home'), href: buildPath('/') },
    { label: tNav('shop'), href: buildPath('/products') },
  ];

  const navAfterCategories = [
    { label: tNav('deals'), href: buildPath('/deals') },
    // Accented: the spec asks for Handicraft to read as a distinct
    // destination rather than another category, and it is the one nav item
    // leading somewhere with its own rules and its own kind of seller.
    { label: tNav('handicraft'), href: buildPath('/handicraft'), accent: true },
    { label: tNav('dollarStreet'), href: buildPath('/dollar-street') },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchFocused(false);
      window.location.href = buildPath(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchSelect = () => {
    setSearchFocused(false);
    setSearchQuery('');
  };

  // One definition for both breakpoints. The mobile header used to render a
  // bare <Link href="/account"> here, so phone users had no way to sign out —
  // duplicating this markup instead would guarantee the two drift apart again.
  const userMenuPanel = (
    <div className="absolute right-0 top-full pt-1 z-50">
                      <div className="w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-2">
                        {isLoggedIn ? (
                          <>
                            {userDisplayName && (
                              <>
                                <div className="px-4 py-2 text-sm font-medium text-slate-900 truncate">
                                  {userDisplayName}
                                </div>
                                <div className="border-t border-gray-100 my-1" />
                              </>
                            )}
                            <Link
                              href={buildPath('/account/orders')}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Package className="w-4 h-4" /> {t('orders')}
                            </Link>
                            <Link
                              href={buildPath('/track')}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Truck className="w-4 h-4" /> {t('trackOrder')}
                            </Link>
                            <Link
                              href={buildPath('/account/reviews')}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Star className="w-4 h-4" /> {t('reviews')}
                            </Link>
                            <Link
                              href={buildPath('/account/settings')}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Settings className="w-4 h-4" /> {t('accountSettings')}
                            </Link>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              type="button"
                              onClick={handleSignOut}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <LogOut className="w-4 h-4" /> {t('signOut')}
                            </button>
                          </>
                        ) : (
                          <Link
                            href={buildPath('/auth/login')}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User className="w-4 h-4" /> {t('signIn')}
                          </Link>
                        )}
                      </div>
                    </div>
  );

  return (
    <header role="banner">
      <AnnouncementBar />
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 transition-all duration-300',
          scrolled ? 'shadow-sm' : '',
          visible ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6">

          {/* ===== MOBILE HEADER (< lg) ===== */}
          <div className="lg:hidden">
            {/* Mobile Row 1: Hamburger | Logo (centered) | Icons */}
            <div className="flex items-center justify-between h-12">
              <MobileNav />
              <Link href={buildPath('/')} className="absolute left-1/2 -translate-x-1/2">
                <Image src="/assets/cartzii-logo.png" alt="Cartzii" width={120} height={34} className="object-contain" priority />
              </Link>
              <div className="flex items-center gap-0.5">
                <Link
                  href={buildPath('/account/wishlist')}
                  className="relative p-2 hover:bg-slate-100 rounded-lg"
                  aria-label={`${t('wishlist')}${hydrated && wishlistCount > 0 ? ` (${wishlistCount})` : ''}`}
                >
                  <Heart className="w-5 h-5 text-slate-600" />
                  {hydrated && wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <div className="relative" ref={mobileUserMenuRef}>
                  <button
                    type="button"
                    className="relative p-2 hover:bg-slate-100 rounded-lg"
                    aria-label={t('account')}
                    aria-haspopup="true"
                    aria-expanded={userMenuOpen}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <User className="w-5 h-5 text-slate-600" />
                  </button>
                  {userMenuOpen && userMenuPanel}
                </div>
                <button
                  type="button"
                  onClick={handleCartIconClick}
                  className="relative p-2 hover:bg-slate-100 rounded-lg"
                  aria-label={`${t('cart')}${hydrated && cartCount > 0 ? ` (${cartCount})` : ''}`}
                >
                  <ShoppingCart className="w-5 h-5 text-slate-600" />
                  {hydrated && cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Row 2: Full-width search bar */}
            <div className="pb-2.5" ref={searchMobileRef}>
              <div className="relative">
                <form onSubmit={handleSearch} className="relative flex items-center">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder={t('searchPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-full bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-slate-500"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                </form>
                <SearchDropdown
                  query={searchQuery}
                  onSelect={handleSearchSelect}
                  visible={searchFocused}
                />
              </div>
            </div>
          </div>

          {/* ===== DESKTOP HEADER (>= lg) ===== */}
          <div className="hidden lg:block">
            {/* Desktop Row 1: Logo | Search | Icons */}
            <div className="flex items-center h-16 gap-4">
              <Link href={buildPath('/')} className="flex items-center shrink-0">
                <Image src="/assets/cartzii-logo.png" alt="Cartzii" width={144} height={41} className="object-contain" priority />
              </Link>

              {/* Search bar — grows to fill space */}
              <div className="flex-1 min-w-0" ref={searchDesktopRef}>
                <div className="relative">
                  <form onSubmit={handleSearch} className="relative flex items-center">
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      placeholder={t('searchPlaceholder')}
                      className="w-full pl-4 pr-28 py-2.5 text-base border-2 border-gray-300 rounded-full bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-slate-500"
                    />
                    <button
                      type="submit"
                      className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary/90 active:scale-95 transition-all"
                      aria-label={t('search')}
                    >
                      <Search className="w-4 h-4" aria-hidden="true" />
                      {t('search')}
                    </button>
                  </form>
                  <SearchDropdown
                    query={searchQuery}
                    onSelect={handleSearchSelect}
                    visible={searchFocused}
                  />
                </div>
              </div>

              {/* Icons */}
              <div className="flex items-center gap-2 shrink-0">
                <CountrySelector />

                <Link
                  href={buildPath('/account/wishlist')}
                  className="relative p-2 hover:bg-slate-100 rounded-lg"
                  aria-label={`${t('wishlist')}${hydrated && wishlistCount > 0 ? ` (${wishlistCount})` : ''}`}
                >
                  <Heart className="w-5 h-5 text-slate-600" />
                  {hydrated && wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={handleCartIconClick}
                  className="relative p-2 hover:bg-slate-100 rounded-lg"
                  aria-label={`${t('cart')}${hydrated && cartCount > 0 ? ` (${cartCount})` : ''}`}
                >
                  <ShoppingCart className="w-5 h-5 text-slate-600" />
                  {hydrated && cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce">
                      {cartCount}
                    </span>
                  )}
                </button>

                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    className="p-2 hover:bg-slate-100 rounded-lg"
                    aria-label={t('account')}
                    aria-haspopup="true"
                    aria-expanded={userMenuOpen}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <User className="w-5 h-5 text-slate-600" />
                  </button>
                  {userMenuOpen && userMenuPanel}
                </div>
              </div>
            </div>

            {/* Desktop Row 2: Nav links — aligned under search bar */}
            <nav className="flex items-center gap-1 -mt-1 pb-1.5 ml-[136px]" role="navigation" aria-label="Main navigation">
              {navBeforeCategories.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-3 py-1 text-sm font-medium text-slate-600 hover:text-primary rounded-md hover:bg-slate-50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <CategoryMenu />
              {navAfterCategories.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={
                    link.accent
                      ? 'px-3 py-1 text-sm font-semibold text-amber-800 hover:text-amber-900 rounded-md hover:bg-amber-50 transition-colors'
                      : 'px-3 py-1 text-sm font-medium text-slate-600 hover:text-primary rounded-md hover:bg-slate-50 transition-colors'
                  }
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

        </div>
      </div>
      {/* Spacer — mobile: 2 rows (~6.5rem), desktop: logo row + nav row */}
      <div className="h-[6.5rem] lg:h-[5.5rem]" />
    </header>
  );
}
