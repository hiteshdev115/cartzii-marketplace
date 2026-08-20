import { getTranslations } from 'next-intl/server';
import { TrackingLookupForm } from '@/components/shipping/TrackingLookupForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Tracking' });
  return { title: `${t('pageTitle')} — Cartzii` };
}

export default async function TrackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Tracking' });

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('pageTitle')}</h1>
        <p className="text-sm text-slate-500 mb-6">{t('pageDescription')}</p>
        <TrackingLookupForm />
      </div>
    </main>
  );
}
