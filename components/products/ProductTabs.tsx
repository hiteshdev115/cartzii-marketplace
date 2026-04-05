'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Product, Review } from '@/types';
import { ReviewList } from './ReviewList';
import { cn } from '@/lib/utils';

interface ProductTabsProps {
  product: Product;
  reviews: Review[];
}

export function ProductTabs({ product, reviews }: ProductTabsProps) {
  const t = useTranslations('ProductDetail');
  const [activeTab, setActiveTab] = useState('description');

  const tabs = [
    { id: 'description', label: t('description') },
    { id: 'specifications', label: t('specifications') },
    { id: 'reviews', label: `${t('reviews')} (${reviews.length})` },
  ];

  return (
    <div>
      {/* Tab headers */}
      <div className="flex overflow-x-auto border-b border-gray-200" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-6 py-3 text-sm font-medium transition-colors relative',
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
          <div id="panel-description" role="tabpanel" className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">{product.description}</p>
          </div>
        )}

        {activeTab === 'specifications' && (
          <div id="panel-specifications" role="tabpanel">
            <table className="w-full">
              <tbody>
                {Object.entries(product.specifications).map(([key, val]) => (
                  <tr key={key} className="border-b border-gray-100">
                    <td className="py-3 pr-4 text-sm font-medium text-slate-900 w-1/3">{key}</td>
                    <td className="py-3 text-sm text-slate-600">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div id="panel-reviews" role="tabpanel">
            <ReviewList reviews={reviews} />
          </div>
        )}
      </div>
    </div>
  );
}
