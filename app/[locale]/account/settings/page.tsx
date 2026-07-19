import { getTranslations } from 'next-intl/server';
import { SettingsContent } from './SettingsContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Account' });
  return { title: `${t('settings')} - Cartziio` };
}

export default function SettingsPage() {
  return <SettingsContent />;
}
