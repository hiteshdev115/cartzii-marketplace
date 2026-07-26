import { getTranslations } from 'next-intl/server';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CheckoutPageContent } from './CheckoutPageContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Checkout' });
  return { title: `${t('title')} - Cartziio` };
}

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutPageContent />
    </AuthGuard>
  );
}
