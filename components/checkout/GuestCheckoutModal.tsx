'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { X, User, LogIn } from 'lucide-react';
import { buildCountryPath } from '@/config/countries';

interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuestCheckoutModal({ isOpen, onClose }: GuestCheckoutModalProps) {
  const t = useTranslations('Cart');
  const locale = useLocale();
  const router = useRouter();

  if (!isOpen) return null;

  const handleGuestCheckout = () => {
    onClose();
    router.push(buildCountryPath(locale, '/checkout'));
  };

  const handleSignIn = () => {
    onClose();
    const cartPath = buildCountryPath(locale, '/cart');
    router.push(
      `${buildCountryPath(locale, '/auth/login')}?redirect=${encodeURIComponent(cartPath)}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 id="checkout-modal-title" className="text-lg font-bold text-slate-900 mb-1">
          {t('checkoutOptionsTitle')}
        </h2>
        <p className="text-sm text-slate-500 mb-5">{t('checkoutOptionsSubtitle')}</p>

        <div className="space-y-3">
          {/* Guest checkout option */}
          <button
            onClick={handleGuestCheckout}
            className="w-full flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
          >
            <div className="shrink-0 w-10 h-10 bg-slate-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors">
              <User className="w-5 h-5 text-slate-500 group-hover:text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 group-hover:text-blue-700">
                {t('continueAsGuest')}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{t('guestCheckoutDesc')}</p>
            </div>
          </button>

          {/* Sign in option */}
          <button
            onClick={handleSignIn}
            className="w-full flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
          >
            <div className="shrink-0 w-10 h-10 bg-slate-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors">
              <LogIn className="w-5 h-5 text-slate-500 group-hover:text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 group-hover:text-blue-700">
                {t('signInToCheckout')}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{t('signInCheckoutDesc')}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
