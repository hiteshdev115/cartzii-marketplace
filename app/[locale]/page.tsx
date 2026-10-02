import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

import { HeroBanner } from '@/components/home/HeroBanner';
import { FeaturedCategories } from '@/components/home/FeaturedCategories';
import { TrendingProducts } from '@/components/home/TrendingProducts';
import { FlashDeals } from '@/components/home/FlashDeals';
import { Newsletter } from '@/components/home/Newsletter';
import { resolveSeo, deploymentCountry } from '@/lib/seo/resolve';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  // The agency can override the home page's SEO from /seo in super-admin.
  // Fall back to the i18n defaults if the API is unreachable.
  const seo = await resolveSeo({
    pageType: 'home',
    pageKey: '',
    country: deploymentCountry(),
  });

  return {
    title: seo.title || t('homeTitle'),
    description: seo.description || t('homeDescription'),
    keywords: seo.keywords.length ? seo.keywords : undefined,
    alternates: { canonical: seo.canonical, languages: seo.alternates },
    openGraph: {
      title: seo.title || t('homeTitle'),
      description: seo.description || t('homeDescription'),
      url: seo.canonical,
      siteName: 'Cartzii',
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title || t('homeTitle'),
      description: seo.description || t('homeDescription'),
    },
    robots: seo.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default function HomePage() {
  return (
    <main>
      <HeroBanner />
      <FeaturedCategories />
      <TrendingProducts />
      <FlashDeals />
      <Newsletter />
    </main>
  );
}
