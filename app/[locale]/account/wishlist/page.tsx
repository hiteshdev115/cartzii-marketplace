import { getTranslations } from 'next-intl/server';
import { WishlistContent } from './WishlistContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Account' });
  return { title: `${t('wishlist')} - Cartziio` };
}

export default function WishlistPage() {
  return <WishlistContent />;
}
