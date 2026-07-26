import { getTranslations } from 'next-intl/server';
import { SearchContent } from './SearchContent';
import { generateAlternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Search' });
  const alternates = generateAlternates(process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com', '/search', locale);
  return { title: `${t('title')} - Cartziio`, alternates };
}

export default function SearchPage() {
  return <SearchContent />;
}
