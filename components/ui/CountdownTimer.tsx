'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { getTimeRemaining } from '@/lib/utils';

interface CountdownTimerProps {
  endDate: string;
  compact?: boolean;
  /**
   * `accent` is the red urgency treatment used on the deals page hero.
   * `mono` is plain black-on-white, for the product card — a card already
   * carries a red sale badge, and a second red element beside it competes with
   * the price rather than supporting it.
   */
  tone?: 'accent' | 'mono';
}

export function CountdownTimer({ endDate, compact, tone = 'accent' }: CountdownTimerProps) {
  const t = useTranslations('Deals');
  const [time, setTime] = useState<ReturnType<typeof getTimeRemaining> | null>(null);

  useEffect(() => {
    const update = () => setTime(getTimeRemaining(endDate));
    const immediate = setTimeout(update, 0);
    const timer = setInterval(update, 1000);
    return () => {
      clearTimeout(immediate);
      clearInterval(timer);
    };
  }, [endDate]);

  const compactTone = tone === 'mono' ? 'text-slate-900' : 'text-red-600';

  if (!time) {
    if (compact) {
      return <span className={`font-mono text-sm font-semibold ${compactTone}`}>--:--:--</span>;
    }
    return (
      <div className="flex gap-2">
        {[t('days'), t('hours'), t('minutes'), t('seconds')].map((label) => (
          <div key={label} className="flex flex-col items-center bg-slate-900 text-white rounded-lg px-3 py-2 min-w-[3.5rem]">
            <span className="text-xl font-bold font-mono">--</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (time.total <= 0) {
    return (
      <span className={`font-semibold text-sm ${tone === 'mono' ? 'text-slate-500' : 'text-red-600'}`}>
        Expired
      </span>
    );
  }

  const units = [
    { label: t('days'), value: time.days },
    { label: t('hours'), value: time.hours },
    { label: t('minutes'), value: time.minutes },
    { label: t('seconds'), value: time.seconds },
  ];

  if (compact) {
    // Days are shown when there are any. Without this a three-day deal read as
    // "21:00:00" — indistinguishable from twenty-one hours, and the clock
    // appeared to jump backwards each midnight.
    const clock =
      `${String(time.hours).padStart(2, '0')}:` +
      `${String(time.minutes).padStart(2, '0')}:` +
      `${String(time.seconds).padStart(2, '0')}`;
    return (
      <span className={`font-mono text-sm font-semibold ${compactTone}`}>
        {time.days > 0 ? `${time.days}d ${clock}` : clock}
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
