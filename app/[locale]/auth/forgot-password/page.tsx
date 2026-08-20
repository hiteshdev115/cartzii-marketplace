import { getTranslations } from 'next-intl/server';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return { title: `${t('forgotPassword')} - Cartzii` };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
