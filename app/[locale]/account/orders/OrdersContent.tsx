'use client';

import { useTranslations, useLocale } from 'next-intl';
import { mockOrders } from '@/lib/mockData';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { buildCountryPath } from '@/config/countries';
import { formatPrice, formatDate } from '@/lib/utils';
import { Package } from 'lucide-react';
import Image from 'next/image';

export function OrdersContent() {
  const t = useTranslations('Account');
  const locale = useLocale();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: t('dashboard'), href: buildCountryPath(locale, '/account') },
          { label: t('orders') },
        ]}
      />
      <h1 className="text-3xl font-bold text-slate-900 mb-8">{t('orders')}</h1>

      {mockOrders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">{t('noOrders')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {mockOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-slate-50">
                <div>
                  <p className="font-semibold text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPrice(order.total, locale)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="64px" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatPrice((item.product.salePrice || item.product.price) * item.quantity, locale)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
