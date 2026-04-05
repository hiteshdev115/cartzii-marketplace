'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);
  const t = useTranslations('Announcement');

  if (dismissed) return null;

  return (
    <div className="bg-primary text-white text-center py-2 px-4 text-sm relative">
      <p className="font-medium">{t('freeShipping')}</p>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-white/20 rounded-full p-1 transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
