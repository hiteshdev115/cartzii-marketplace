'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { allDeals } from '@/lib/mockData';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Badge } from '@/components/ui/Badge';
import { buildCountryPath } from '@/config/countries';
import { formatPrice } from '@/lib/utils';
import { Flame, ArrowRight } from 'lucide-react';

export function DealsContent() {
  const t = useTranslations('Deals');
  const locale = useLocale();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: t('title') }]} />

      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-primary mb-2">
          <Flame className="w-6 h-6" />
          <span className="font-semibold uppercase tracking-wider text-sm">{t('hotDeals')}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{t('title')}</h1>
        <p className="text-slate-600">{t('subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allDeals.map((deal) => (
          <Link
            key={deal.id}
            href={buildCountryPath(locale, `/products/${deal.product.slug}`)}
            className="group card-interactive overflow-hidden"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={deal.product.images[0]}
                alt={deal.product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute top-3 left-3">
                <Badge variant="sale">-{deal.discountPercent}%</Badge>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors mb-2">
                {deal.product.name}
              </h3>
              <p className="text-sm text-slate-500 mb-3">{deal.product.shortDescription}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-primary">{formatPrice(deal.dealPrice, locale)}</span>
                <span className="text-sm text-slate-400 line-through">{formatPrice(deal.originalPrice, locale)}</span>
              </div>
              <CountdownTimer endDate={deal.endsAt} />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-500 capitalize">{deal.type}</span>
                <span className="text-sm text-primary font-medium flex items-center gap-1">
                  {t('shopNow')} <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
