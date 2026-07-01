'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { buildCountryPath } from '@/config/countries';
import { mockOrders } from '@/lib/mockData';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { formatPrice, formatDate } from '@/lib/utils';
import { Package, Heart, MapPin, Settings, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { fetchUserProfile } from '@/lib/api';
import type { UserProfile } from '@/types';

export function AccountDashboard() {
  const t = useTranslations('Account');
  const locale = useLocale();
  const userId = useAuthStore((s) => s.userId);
  const authFirstName = useAuthStore((s) => s.firstName);
  const authEmail = useAuthStore((s) => s.email);
  const setUser = useAuthStore((s) => s.setUser);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const result = await fetchUserProfile(Number(userId));
      if (cancelled || !result.data) return;
      setProfile(result.data);
      setUser({
        firstName: result.data.firstname || undefined,
        email: result.data.email || undefined,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, setUser]);

  const firstName = profile?.firstname || authFirstName || '';
  const lastName = profile?.lastname || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const email = profile?.email || authEmail || '';
  const displayName = fullName || email || t('dashboard');
  const avatarUrl = profile?.profilepicture || '';
  const initial = (firstName || email || '?').charAt(0).toUpperCase();

  const quickLinks = [
    { icon: Package, label: t('orders'), href: '/account/orders', count: mockOrders.length },
    { icon: Heart, label: t('wishlist'), href: '/account/wishlist' },
    { icon: MapPin, label: t('addresses'), href: '/account/settings' },
    { icon: Settings, label: t('settings'), href: '/account/settings' },
  ];

  return (
    <main className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: t('dashboard') }]} />
      <div className="flex items-center gap-4 mb-8 mt-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={64}
              height={64}
              className="w-16 h-16 object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-primary">{initial}</span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('hello', { name: displayName })}</h1>
          {email && <p className="text-sm text-slate-600">{email}</p>}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {quickLinks.map((link) => (
          <Link
            key={link.label}
            href={buildCountryPath(locale, link.href)}
            className="card-base p-4 flex items-center gap-3 hover:border-primary transition-colors"
          >
            <link.icon className="w-8 h-8 text-primary" />
            <div>
              <p className="font-semibold text-sm text-slate-900">{link.label}</p>
              {link.count !== undefined && <p className="text-xs text-slate-500">{link.count} items</p>}
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('recentOrders')}</h2>
          <Link href={buildCountryPath(locale, '/account/orders')} className="text-sm text-primary hover:underline flex items-center gap-1">
            {t('viewAll')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {mockOrders.length === 0 ? (
          <p className="text-slate-600 text-center py-8">{t('noOrders')}</p>
        ) : (
          <div className="space-y-4">
            {mockOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-8 h-8 text-slate-400" />
                  <div>
                    <p className="font-medium text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatPrice(order.total, locale)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
