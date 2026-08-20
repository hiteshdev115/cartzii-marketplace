import { getTranslations } from 'next-intl/server';
import { AccountDashboard } from './AccountDashboard';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Account' });
  return { title: `${t('dashboard')} - Cartzii` };
}

export default function AccountPage() {
  return <AccountDashboard />;
}
