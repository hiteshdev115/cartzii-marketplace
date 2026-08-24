import { getTranslations } from 'next-intl/server';
import { OrderConfirmationContent } from './OrderConfirmationContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; orderNumber: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Checkout' });
  return { title: `${t('orderConfirmed')} - Cartzii` };
}

export default async function OrderConfirmationPage({ params }: { params: Promise<{ locale: string; orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <OrderConfirmationContent orderNumber={orderNumber} />;
}