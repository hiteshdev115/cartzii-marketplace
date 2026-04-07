import { getTranslations } from 'next-intl/server';
import { HeroBanner } from '@/components/home/HeroBanner';
import { FeaturedCategories } from '@/components/home/FeaturedCategories';
import { TrendingProducts } from '@/components/home/TrendingProducts';
import { FlashDeals } from '@/components/home/FlashDeals';
import { BrandShowcase } from '@/components/home/BrandShowcase';
import { Testimonials } from '@/components/home/Testimonials';
import { Newsletter } from '@/components/home/Newsletter';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
  };
}

export default function HomePage() {
  return (
    <main data-build="20250407-v2">
      <HeroBanner />
      <FeaturedCategories />
      <TrendingProducts />
      <FlashDeals />
      <WhyChooseUs />
      <BrandShowcase />
      <Testimonials />
      <Newsletter />
    </main>
  );
}
