'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';

export function Newsletter() {
  const t = useTranslations('Home');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-primary to-primary-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl font-bold text-white">{t('newsletter')}</h2>
        <p className="mt-3 text-primary-light/80 text-lg">{t('newsletterSubtitle')}</p>
        {subscribed ? (
          <div className="mt-8 p-4 bg-white/20 rounded-xl backdrop-blur">
            <p className="text-white font-semibold">✓ {t('subscribedSuccess')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:max-w-lg mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
              className="flex-1 px-5 py-3.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button type="submit" className="bg-white text-primary font-semibold px-6 py-3.5 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <Send className="w-4 h-4" />
              {t('subscribe')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
