'use client';

import { useTranslations } from 'next-intl';

export function SkipLink() {
  const t = useTranslations('Accessibility');
  return (
    <a href="#main-content" className="skip-link">
      {t('skipToContent')}
    </a>
  );
}
