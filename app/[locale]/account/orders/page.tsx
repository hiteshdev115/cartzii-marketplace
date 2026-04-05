import { getTranslations } from 'next-intl/server';
import { OrdersContent } from './OrdersContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Account' });
  return { title: `${t('orders')} - Cartzii` };
}

export default function OrdersPage() {
  return <OrdersContent />;
}
