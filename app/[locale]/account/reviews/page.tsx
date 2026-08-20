import { getTranslations } from 'next-intl/server';
import { ReviewsContent } from './ReviewsContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Account' });
  return { title: `${t('reviews')} - Cartzii` };
}

export default function ReviewsPage() {
  return <ReviewsContent />;
}
