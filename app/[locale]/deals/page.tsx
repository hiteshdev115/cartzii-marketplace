import { getTranslations } from 'next-intl/server';
import { DealsContent } from './DealsContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Deals' });
  return { title: `${t('title')} - Cartzii` };
}

export default function DealsPage() {
  return <DealsContent />;
}
