import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchCategoryTree } from '@/lib/api';
import { Category } from '@/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { buildPath, countrySiteUrl } from '@/config/countries';
import { resolveSeo, deploymentCountry } from '@/lib/seo/resolve';
import { buildBreadcrumbJsonLd, jsonLdScript } from '@/lib/seo/jsonLd';
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

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const seo = await resolveSeo({
    pageType: 'category',
    pageKey: slug,
    country: deploymentCountry(),
  });

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords.length ? seo.keywords : undefined,
    alternates: { canonical: seo.canonical, languages: seo.alternates },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.canonical,
      siteName: 'Cartzii',
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
    },
    robots: seo.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
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

  // Breadcrumb JSON-LD so Google can render the category chain under
  // the blue link. Dynamic so a renaming of "All products" picks up
  // automatically in the next locale load.
  const origin = countrySiteUrl[deploymentCountry().toLowerCase()] ?? countrySiteUrl.us;
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: t('allProducts'), url: `${origin}${buildPath('/products')}` },
    { name: category.name, url: `${origin}${buildPath(`/categories/${slug}`)}` },
  ]);

  return (
    <main className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }}
      />
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
