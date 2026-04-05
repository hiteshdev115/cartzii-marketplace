'use client';

import { useTranslations, useLocale } from 'next-intl';
import { mockUser } from '@/lib/mockData';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { buildCountryPath } from '@/config/countries';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { User, MapPin, Bell } from 'lucide-react';

export function SettingsContent() {
  const t = useTranslations('Account');
  const locale = useLocale();
  const [name, setName] = useState(mockUser.name);
  const [email, setEmail] = useState(mockUser.email);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: t('dashboard'), href: buildCountryPath(locale, '/account') },
          { label: t('settings') },
        ]}
      />
      <h1 className="text-3xl font-bold text-slate-900 mb-8">{t('settings')}</h1>

      <div className="space-y-8">
        {/* Profile */}
        <section className="bg-white rounded-2xl border p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" /> {t('personalInfo')}
          </h2>
          <div className="space-y-4">
            <Input label={t('fullName')} value={name} onChange={(e) => setName(e.target.value)} />
            <Input label={t('emailAddress')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button>{t('saveChanges')}</Button>
          </div>
        </section>

        {/* Addresses */}
        <section className="bg-white rounded-2xl border p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" /> {t('addresses')}
          </h2>
          {mockUser.addresses.map((addr, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-xl mb-3 last:mb-0">
              <p className="font-medium text-sm">{addr.firstName} {addr.lastName}</p>
              <p className="text-sm text-slate-600">{addr.address}</p>
              <p className="text-sm text-slate-600">{addr.city}, {addr.state} {addr.zipCode}</p>
              <p className="text-sm text-slate-600">{addr.country}</p>
              {addr.isDefault && <span className="text-xs text-primary font-medium">{t('defaultAddress')}</span>}
            </div>
          ))}
        </section>

        {/* Notifications */}
        <section className="bg-white rounded-2xl border p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" /> {t('notifications')}
          </h2>
          <div className="space-y-3">
            {['orderUpdates', 'promotions', 'newsletter'].map((pref) => (
              <label key={pref} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{t(pref)}</span>
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary" />
              </label>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
