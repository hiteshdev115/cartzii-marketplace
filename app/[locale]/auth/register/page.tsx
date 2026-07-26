import { getTranslations } from 'next-intl/server';
import { RegisterForm } from './RegisterForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return { title: `${t('register')} - Cartziio` };
}

export default function RegisterPage() {
  return <RegisterForm />;
}
