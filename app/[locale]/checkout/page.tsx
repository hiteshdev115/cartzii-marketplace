import { getTranslations } from 'next-intl/server';
import { CheckoutPageContent } from './CheckoutPageContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Checkout' });
  return { title: `${t('title')} - Cartzii` };
}

export default function CheckoutPage() {
  return <CheckoutPageContent />;
}
