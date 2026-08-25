'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { buildPath } from '@/config/countries';

export function TrackingLookupForm() {
  const t = useTranslations('Tracking');
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError(t('codeRequired'));
      return;
    }
    setError('');
    router.push(buildPath(`/track/${encodeURIComponent(trimmed)}`));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        {t('trackingCodeLabel')}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError('');
          }}
          placeholder={t('trackingCodePlaceholder')}
          className="input flex-1"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="btn-primary flex items-center gap-2 px-4">
          <Search className="h-4 w-4" />
          {t('track')}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
