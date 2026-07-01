import { generateAlternates } from '@/lib/seo';
import { DollarStreetPageClient } from './DollarStreetPageClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const alternates = generateAlternates(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com',
    '/dollar-street',
    locale,
  );
  return {
    title: 'Dollar Street — Products Under $5 | Cartzii',
    description:
      'Shop products priced under $5 on Cartzii. Quality everyday items, accessories, and essentials at unbeatable value. Updated daily with fresh finds.',
    keywords: ['under $5', 'cheap products', 'budget shopping', 'dollar deals', 'affordable'],
    alternates,
    openGraph: {
      title: 'Dollar Street — Products Under $5 | Cartzii',
      description: 'Browse hundreds of quality products all priced under $5.',
      type: 'website',
    },
  };
}

export default async function DollarStreetPage() {
  return <DollarStreetPageClient />;
}
