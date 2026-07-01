'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { buildCountryPath } from '@/config/countries';
import { api, ApiError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import { mergeCartOnLogin } from '@/lib/mergeCart';
import { Eye, EyeOff, LogIn, CheckCircle, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  userid?: number;
  errorCode?: number;
}

export function LoginForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';
  const redirectTo = searchParams.get('redirect');
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isRestoringCart, setIsRestoringCart] = useState(false);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    try {
      const res = await api.post<LoginResponse>('/api/v1/login', {
        email: data.email,
        password: data.password,
      });

      const accessToken = res.token ?? res.accessToken;
      if (res.success && accessToken && res.refreshToken) {
        setTokens(accessToken, res.refreshToken);
        setUser({ email: data.email });

        // Resolve userId: prefer response body, fall back to JWT decode in store
        const userId =
          res.userid != null
            ? String(res.userid)
            : useAuthStore.getState().userId;

        // Merge guest cart → server cart (errors must not block redirect)
        if (userId) {
          setIsRestoringCart(true);
          try {
            // Merge guest_cart items via /cart/merge, then reload from server.
            // loadCart is called inside mergeCartOnLogin so no further sync needed.
            await mergeCartOnLogin(accessToken, userId);
          } catch {
            // Cart restore failed — redirect anyway, cart will reload on next visit
          } finally {
            setIsRestoringCart(false);
          }
        }

        const destination = redirectTo ?? buildCountryPath(locale, '/');
        router.push(destination);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const body = error.body as LoginResponse | null;
        if (body?.errorCode === 1013) {
          setApiError(t('accountNotVerified'));
        } else if (body?.errorCode === 1007) {
          setApiError(t('invalidCredentials'));
        } else {
          setApiError(body?.message || t('loginFailed'));
        }
      } else {
        setApiError(t('loginFailed'));
      }
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <Breadcrumb items={[{ label: t('login') }]} />
      <div className="mt-6 bg-white rounded-2xl border p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('welcomeBack')}</h1>
        <p className="text-sm text-slate-500 mb-6">{t('loginSubtitle')}</p>

        {justRegistered && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {t('registrationSuccess')}
          </div>
        )}

        {apiError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('email')} type="email" {...register('email')} error={errors.email?.message} autoComplete="email" />
          <div className="relative">
            <Input
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              error={errors.password?.message}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-gray-300 text-primary" />
              {t('rememberMe')}
            </label>
            <Link href={buildCountryPath(locale, '/auth/forgot-password')} className="text-sm text-primary hover:underline">{t('forgotPassword')}</Link>
          </div>
          <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={isSubmitting || isRestoringCart}>
            {isRestoringCart ? (
              <>
                <ShoppingCart className="w-4 h-4 animate-pulse" />
                {t('restoringCart')}
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> {isSubmitting ? t('loggingIn') : t('login')}
              </>
            )}
          </Button>
        </form>

        <p className="text-sm text-slate-500 text-center mt-6">
          {t('noAccount')}{' '}
          <Link href={buildCountryPath(locale, '/auth/register')} className="text-primary font-medium hover:underline">
            {t('createAccount')}
          </Link>
        </p>
      </div>
    </main>
  );
}
