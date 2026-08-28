'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Check } from 'lucide-react';

/**
 * The sign-up strip that closes the home page.
 *
 * Deliberately compact — it is the last thing on the page, not a destination,
 * and at py-16 with centred stacked content it took as much height as the
 * product sections above it. Heading and form sit side by side from `md` up,
 * which roughly halves it without shrinking the tap targets.
 */
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
    <section className="py-10 bg-gradient-to-br from-primary to-primary-dark">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="md:max-w-md">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{t('newsletter')}</h2>
            {/* orange-50, not primary-light. The subtitle used to be orange
                text on an orange gradient — 1.35:1 against the lighter end,
                which is invisible rather than merely low-contrast. This is
                4.88:1 at the worst point of the gradient. */}
            <p className="mt-1 text-sm text-orange-50">{t('newsletterSubtitle')}</p>
          </div>

          {subscribed ? (
            <div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-3 backdrop-blur ring-1 ring-white/25">
              <Check className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
              <p className="text-white font-semibold text-sm">{t('subscribedSuccess')}</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:min-w-[26rem]"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                {t('emailPlaceholder')}
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                required
                className="flex-1 px-4 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
              />
              <button
                type="submit"
                className="bg-white text-primary-dark font-semibold px-5 py-2.5 rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                {t('subscribe')}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
