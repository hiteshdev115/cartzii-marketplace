import { getTranslations } from 'next-intl/server';
import { DealsContent } from './DealsContent';
import { generateAlternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Deals' });
  const alternates = generateAlternates(process.env.NEXT_PUBLIC_BASE_URL || 'https://cartzii.com', '/deals', locale);
  return { title: `${t('title')} - Cartziio`, alternates };
}

export default function DealsPage() {
  return <DealsContent />;
}
