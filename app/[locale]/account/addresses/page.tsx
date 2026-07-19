import { getTranslations } from 'next-intl/server';
import { AddressesContent } from './AddressesContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Account' });
  return { title: `${t('addresses')} - Cartziio` };
}

export default function AddressesPage() {
  return <AddressesContent />;
}
