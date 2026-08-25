'use client';

import { useTranslations } from 'next-intl';
import { buildPath } from '@/config/countries';
import { allDeals } from '@/lib/mockData';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { PriceTag } from '@/components/ui/PriceTag';
import { Badge } from '@/components/ui/Badge';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
export function FlashDeals() {
  const t = useTranslations('Home');
  const flashDeals = allDeals.filter((d) => d.type === 'flash').slice(0, 4);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">⚡ {t('flashDeals')}</h2>
            <p className="mt-2 text-slate-500">{t('flashDealsSubtitle')}</p>
          </div>
          <Link href={buildPath('/deals')} className="hidden sm:inline-flex btn-ghost text-primary font-semibold">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {flashDeals.map((deal) => (
            <Link
              key={deal.id}
              href={buildPath(`/products/${deal.product.slug}`)}
              className="card-interactive group"
            >
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={deal.product.images[0]}
                  alt={deal.product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <Badge variant="sale" className="absolute top-3 left-3">
                  -{deal.discountPercent}%
                </Badge>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-2">{deal.product.name}</h3>
                <PriceTag price={deal.originalPrice} salePrice={deal.dealPrice} size="sm" />
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-1">{t('endsIn')}</p>
                  <CountdownTimer endDate={deal.endsAt} compact />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
