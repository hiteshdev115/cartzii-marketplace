'use client';

import { useTranslations } from 'next-intl';
import { Truck, Shield, RotateCcw, Headphones } from 'lucide-react';

const benefits = [
  { icon: Truck, titleKey: 'benefit1Title', descKey: 'benefit1Desc' },
  { icon: Shield, titleKey: 'benefit2Title', descKey: 'benefit2Desc' },
  { icon: RotateCcw, titleKey: 'benefit3Title', descKey: 'benefit3Desc' },
  { icon: Headphones, titleKey: 'benefit4Title', descKey: 'benefit4Desc' },
];

export function WhyChooseUs() {
  const t = useTranslations('Home');

  return (
    <section className="py-16 bg-white">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">{t('whyChooseUs')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b) => (
            <div key={b.titleKey} className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface-secondary">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <b.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{t(b.titleKey)}</h3>
              <p className="text-sm text-slate-500">{t(b.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
