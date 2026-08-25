import { getTranslations } from 'next-intl/server';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { generateAlternates } from '@/lib/seo';
import { fetchRootCategories } from '@/lib/api';
import { CategoriesPageClient } from './CategoriesPageClient';
import type { Category } from '@/types';

export async function generateMetadata() {
  const alternates = await generateAlternates(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com',
    '/categories',
  );
  return {
    title: 'All Categories - Cartzii',
    description: 'Browse all product categories on Cartzii — electronics, fashion, home & living, sports, beauty, and more.',
    alternates,
  };
}

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Nav' });

  let categories: Category[] = [];
  try {
    categories = await fetchRootCategories();
  } catch {
    // fall through — client will also try fetching
  }

  return (
    <main>
      {/* Breadcrumb */}
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <Breadcrumb items={[{ label: t('categories') }]} />
      </div>

      <CategoriesPageClient initialCategories={categories} />
    </main>
  );
}
