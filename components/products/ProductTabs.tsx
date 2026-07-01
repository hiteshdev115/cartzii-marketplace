'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Product } from '@/types';
import { ReviewList } from './ReviewList';
import { cn } from '@/lib/utils';
import type { ReviewAPIItem, ReviewStats } from '@/lib/api/reviews';

interface ProductTabsProps {
  product: Product;
  reviews: ReviewAPIItem[];
  stats: ReviewStats;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function ProductTabs({ product, reviews, stats, activeTab: controlledTab, onTabChange }: ProductTabsProps) {
  const t = useTranslations('ProductDetail');
  const [internalTab, setInternalTab] = useState('description');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: string) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  const tabs = [
    { id: 'description', label: t('description') },
    { id: 'specifications', label: t('specifications') },
    { id: 'reviews', label: `${t('reviews')} (${stats.totalReviews})` },
  ];

  return (
    <div id="reviews-section">
      {/* Tab headers */}
      <div className="flex overflow-x-auto border-b border-gray-200 -mx-4 px-4 sm:mx-0 sm:px-0" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 sm:px-6 py-3 text-sm font-medium transition-colors relative whitespace-nowrap shrink-0',
              activeTab === tab.id
                ? 'text-primary'
                : 'text-slate-500 hover:text-slate-700'
            )}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-6">
        {activeTab === 'description' && (
          <div
            id="panel-description"
            role="tabpanel"
            className="prose prose-slate max-w-none overflow-hidden break-words prose-li:text-slate-600 prose-p:text-slate-600 prose-ul:space-y-1"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}

        {activeTab === 'specifications' && (
          <div id="panel-specifications" role="tabpanel" className="overflow-x-auto">
            <SpecificationsTable product={product} t={t} />
          </div>
        )}

        {activeTab === 'reviews' && (
          <div id="panel-reviews" role="tabpanel">
            <ReviewList reviews={reviews} stats={stats} />
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Specifications tab -----------------------------------------------------

/** Build the ordered rows for the specifications table, including
 *  weight/dimensions when the product (or its currently-selected variant)
 *  exposes them. */
function SpecificationsTable({
  product,
  t,
}: {
  product: Product;
  t: (key: string) => string;
}) {
  const weightRow =
    product.weight != null
      ? { key: t('weight'), val: `${product.weight}${product.weightUnit ? ` ${product.weightUnit}` : ''}` }
      : null;

  const hasAnyDim =
    product.length != null || product.width != null || product.height != null;
  const dimsRow = hasAnyDim
    ? (() => {
        const parts = [product.length, product.width, product.height]
          .filter((n): n is number => n != null)
          .map((n) => String(n));
        const unit = product.dimensionUnit ? ` ${product.dimensionUnit}` : '';
        return { key: t('dimensions'), val: `${parts.join(' × ')}${unit}` };
      })()
    : null;

  const specRows = Object.entries(product.specifications).map(([key, val]) => ({ key, val }));

  const rows = [
    ...(weightRow ? [weightRow] : []),
    ...(dimsRow ? [dimsRow] : []),
    ...specRows,
  ];

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">{t('noSpecifications')}</p>;
  }

  return (
    <table className="w-full">
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-b border-gray-100">
            <td className="py-3 pr-4 text-sm font-medium text-slate-900 w-2/5 sm:w-1/3 align-top">{row.key}</td>
            <td className="py-3 text-sm text-slate-600 break-words">{row.val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
