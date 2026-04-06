import { getTranslations } from 'next-intl/server';
import { allProducts, allCategories } from '@/lib/mockData';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ActiveFilterChips } from '@/components/products/ActiveFilterChips';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { generateAlternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const alternates = generateAlternates(process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com', '/products', locale);
  return {
    title: t('productsTitle'),
    description: t('productsDescription'),
    alternates,
  };
}

export default async function ProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Products' });
  const products = allProducts;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: t('allProducts') }]} />
      <h1 className="text-3xl font-bold text-slate-900 mb-6">{t('allProducts')}</h1>

      {/* Filter bar + sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <ProductFilters />
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">{t('productsFound', { count: products.length })}</p>
          <select className="input w-auto text-sm py-2" aria-label={t('sortBy')}>
            <option value="featured">{t('sortFeatured')}</option>
            <option value="newest">{t('sortNewest')}</option>
            <option value="price-asc">{t('sortPriceLow')}</option>
            <option value="price-desc">{t('sortPriceHigh')}</option>
            <option value="rating">{t('sortRating')}</option>
          </select>
        </div>
      </div>

      {/* Active filter chips */}
      <ActiveFilterChips />

      {/* Full-width product grid */}
      <ProductGrid products={products} />
    </main>
  );
}
