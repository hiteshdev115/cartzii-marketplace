'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, KeyRound, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { buildPath } from '@/config/countries';
import { api, ApiError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import { useHydrated } from '@/hooks/useHydration';
import { mergeCartOnLogin } from '@/lib/mergeCart';

interface OtpRequestResponse {
  success: boolean;
  message: string;
}

interface OtpVerifyResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  userid?: number;
  errorCode?: number;
}

export function OtpLoginForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const targetEmail = searchParams.get('email');

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState(targetEmail ?? '');
  const [code, setCode] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestoringCart, setIsRestoringCart] = useState(false);

  const hydrated = useHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const authEmail = useAuthStore((s) => s.email);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  // Skip straight to the destination ONLY if the already-signed-in session
  // belongs to the same person this link was sent to. A link with a specific
  // ?email= must always require that person's own OTP — never let it ride on
  // a different, unrelated account still logged in on a shared device. When
  // there's no target email (a bare /auth/otp-login visit), any active
  // session is enough.
  const sessionMatchesTarget =
    !targetEmail || (!!authEmail && authEmail.toLowerCase() === targetEmail.toLowerCase());
  const shouldBypassOtp = hydrated && isAuthenticated && sessionMatchesTarget;

  useEffect(() => {
    if (shouldBypassOtp) {
      router.replace(redirectTo ?? buildPath('/account/orders'));
    }
  }, [shouldBypassOtp, redirectTo, router, locale]);

  if (!hydrated || shouldBypassOtp) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setInfoMessage(null);
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post<OtpRequestResponse>('/api/v1/auth/otp/request', { email: email.trim() });
      setInfoMessage(res.message || t('codeSentTo', { email }));
      setStep('code');
    } catch {
      // Same generic message even on failure — don't leak account existence.
      setInfoMessage(t('codeSentTo', { email }));
      setStep('code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!code.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post<OtpVerifyResponse>('/api/v1/auth/otp/verify', {
        email: email.trim(),
        code: code.trim(),
      });

      if (res.success && res.token && res.refreshToken) {
        setTokens(res.token, res.refreshToken);
        setUser({ email: email.trim() });

        const userId = res.userid != null ? String(res.userid) : useAuthStore.getState().userId;
        if (userId) {
          setIsRestoringCart(true);
          try {
            await mergeCartOnLogin(res.token, userId);
          } catch {
            // Cart restore failed — redirect anyway, cart will reload on next visit
          } finally {
            setIsRestoringCart(false);
          }
        }

        const destination = redirectTo ?? buildPath('/account/orders');
        router.push(destination);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const body = error.body as OtpVerifyResponse | null;
        setApiError(body?.message || t('invalidOrExpiredCode'));
      } else {
        setApiError(t('invalidOrExpiredCode'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setApiError(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    try {
      const res = await api.post<OtpRequestResponse>('/api/v1/auth/otp/request', { email: email.trim() });
      setInfoMessage(res.message || t('codeSentTo', { email }));
    } catch {
      setInfoMessage(t('codeSentTo', { email }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <Breadcrumb items={[{ label: t('otpLoginTitle') }]} />
      <div className="mt-6 bg-white rounded-2xl border p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('otpLoginTitle')}</h1>
        <p className="text-sm text-slate-500 mb-6">
          {step === 'email' ? t('enterEmailForCode') : t('enterCode')}
        </p>

        {infoMessage && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            {infoMessage}
          </div>
        )}

        {apiError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {apiError}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <Input
              label={t('email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={isSubmitting}>
              <Mail className="w-4 h-4" />
              {isSubmitting ? t('sendingCode') : t('sendCode')}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <Input
              label={t('enterCode')}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoComplete="one-time-code"
              required
            />
            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2"
              disabled={isSubmitting || isRestoringCart}
            >
              {isRestoringCart ? (
                <>
                  <ShoppingCart className="w-4 h-4 animate-pulse" />
                  {t('restoringCart')}
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  {isSubmitting ? t('verifying') : t('verifyAndLogin')}
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={handleResend}
              disabled={isSubmitting}
              className="w-full text-sm text-primary hover:underline"
            >
              {t('resendCode')}
            </button>
          </form>
        )}

        <p className="text-sm text-slate-500 text-center mt-6">
          <Link href={buildPath('/auth/login')} className="text-primary font-medium hover:underline">
            {t('loginWithPasswordInstead')}
          </Link>
        </p>
      </div>
    </main>
  );
}
