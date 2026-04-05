import { getTranslations } from 'next-intl/server';
import { SearchContent } from './SearchContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Search' });
  return { title: `${t('title')} - Cartzii` };
}

export default function SearchPage() {
  return <SearchContent />;
}
