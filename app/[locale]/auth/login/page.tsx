import { getTranslations } from 'next-intl/server';
import { LoginForm } from './LoginForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return { title: `${t('login')} - Cartzii` };
}

export default function LoginPage() {
  return <LoginForm />;
}
