import { getTranslations } from 'next-intl/server';
import { CartPageContent } from './CartPageContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Cart' });
  return { title: `${t('title')} - Cartziio` };
}

export default function CartPage() {
  return <CartPageContent />;
}
