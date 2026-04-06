import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { allCategories, getProductsByCategory } from '@/lib/mockData';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ActiveFilterChips } from '@/components/products/ActiveFilterChips';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { buildCountryPath } from '@/config/countries';
import { generateAlternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const category = allCategories.find((c) => c.slug === slug);
  if (!category) return {};
  // TODO: Use country-specific SEO from API: category.metatitle || `${category.name} - Cartzii`
  // TODO: Use country-specific SEO from API: category.metadescription || category.description
  const alternates = generateAlternates(process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com', `/categories/${slug}`, locale);
  return {
    title: `${category.name} - Cartzii`,
    description: category.description,
    alternates,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const category = allCategories.find((c) => c.slug === slug);
  if (!category) notFound();

  const t = await getTranslations({ locale, namespace: 'Products' });
  const products = getProductsByCategory(slug);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: t('allProducts'), href: buildCountryPath(locale, '/products') },
          { label: category.name },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{category.name}</h1>
        <p className="text-slate-600 mt-2">{category.description}</p>
      </div>

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

      <ProductGrid products={products} />
    </main>
  );
}
