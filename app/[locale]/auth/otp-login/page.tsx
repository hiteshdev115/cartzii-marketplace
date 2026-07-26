import { getTranslations } from 'next-intl/server';
import { OtpLoginForm } from './OtpLoginForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return { title: `${t('otpLoginTitle')} - Cartziio` };
}

export default function OtpLoginPage() {
  return <OtpLoginForm />;
}
