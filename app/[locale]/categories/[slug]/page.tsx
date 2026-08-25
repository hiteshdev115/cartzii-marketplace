import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { fetchCategoryTree } from '@/lib/api';
import { Category } from '@/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { buildPath } from '@/config/countries';
import { generateAlternates } from '@/lib/seo';
import { CategoryPageContent } from './CategoryPageContent';

/** Recursively find a category by slug in the tree */
function findBySlug(cats: Category[], slug: string): Category | undefined {
  for (const cat of cats) {
    if (cat.slug === slug) return cat;
    if (cat.subcategories) {
      const found = findBySlug(cat.subcategories, slug);
      if (found) return found;
    }
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  let category: Category | undefined;
  try {
    const tree = await fetchCategoryTree();
    category = findBySlug(tree, slug);
  } catch { /* fall through */ }
  if (!category) return {};
  const alternates = generateAlternates(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com',
    `/categories/${slug}`,
  );
  return {
    title: `${category.name} - Cartzii`,
    description: category.description,
    alternates,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;

  let category: Category | undefined;
  try {
    const tree = await fetchCategoryTree();
    category = findBySlug(tree, slug);
  } catch { /* fall through */ }
  if (!category) notFound();

  const t = await getTranslations({ locale, namespace: 'Products' });

  return (
    <main className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: t('allProducts'), href: buildPath('/products') },
          { label: category!.name },
        ]}
      />

      <div className="mt-6">
        <CategoryPageContent
          slug={slug}
          categoryName={category!.name}
          categoryDescription={category!.description}
        />
      </div>
    </main>
  );
}
