import { getTranslations } from 'next-intl/server';
import { LibraryContent } from './LibraryContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Account' }).catch(() => null);
  return { title: `${t?.('library') ?? 'Library'} - Cartzii` };
}

export default function LibraryPage() {
  return <LibraryContent />;
}
