'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { getTimeRemaining } from '@/lib/utils';

interface CountdownTimerProps {
  endDate: string;
  compact?: boolean;
}

export function CountdownTimer({ endDate, compact }: CountdownTimerProps) {
  const t = useTranslations('Deals');
  const [time, setTime] = useState<ReturnType<typeof getTimeRemaining> | null>(() => {
    if (typeof window === 'undefined') return null;
    return getTimeRemaining(endDate);
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeRemaining(endDate)), 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (!time) {
    if (compact) {
      return <span className="font-mono text-sm font-semibold text-red-600">--:--:--</span>;
    }
    return (
      <div className="flex gap-2">
        {[t('days'), t('hours'), t('minutes'), t('seconds')].map((label) => (
          <div key={label} className="flex flex-col items-center bg-slate-900 text-white rounded-lg px-3 py-2 min-w-[3.5rem]">
            <span className="text-xl font-bold font-mono">--</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (time.total <= 0) return <span className="text-red-600 font-semibold text-sm">Expired</span>;

  const units = [
    { label: t('days'), value: time.days },
    { label: t('hours'), value: time.hours },
    { label: t('minutes'), value: time.minutes },
    { label: t('seconds'), value: time.seconds },
  ];

  if (compact) {
    return (
      <span className="font-mono text-sm font-semibold text-red-600">
        {String(time.hours).padStart(2, '0')}:{String(time.minutes).padStart(2, '0')}:{String(time.seconds).padStart(2, '0')}
      </span>
    );
  }

  return (
    <div className="flex gap-2" aria-label={`${t('endsIn')} ${time.days}d ${time.hours}h ${time.minutes}m`}>
      {units.map((unit) => (
        <div key={unit.label} className="flex flex-col items-center bg-slate-900 text-white rounded-lg px-3 py-2 min-w-[3.5rem]">
          <span className="text-xl font-bold font-mono">{String(unit.value).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
