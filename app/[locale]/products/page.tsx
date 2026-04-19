import { getTranslations } from 'next-intl/server';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { generateAlternates } from '@/lib/seo';
import { ProductListingClient } from './ProductListingClient';

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

  return (
    <main className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: t('allProducts') }]} />
      <h1 className="text-3xl font-bold text-slate-900 mb-6">{t('allProducts')}</h1>
      <ProductListingClient />
    </main>
  );
}
