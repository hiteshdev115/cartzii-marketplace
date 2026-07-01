'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '@/lib/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { buildCountryPath } from '@/config/countries';
import { api, ApiError } from '@/lib/api/client';
import { UserPlus, Eye, EyeOff, Phone, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export function RegisterForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  // Build the login URL, carrying the redirect param forward if present
  const loginUrl =
    buildCountryPath(locale, '/auth/login') +
    (redirectTo
      ? `?redirect=${encodeURIComponent(redirectTo)}`
      : '?registered=true');

  useEffect(() => {
    if (!registered) return;
    const timer = setTimeout(() => router.push(loginUrl), 2000);
    return () => clearTimeout(timer);
  }, [registered, router, loginUrl]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    try {
      await api.post('/api/v1/register', {
        firstName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
      setRegistered(true);
    } catch (error) {
      if (error instanceof ApiError) {
        const body = error.body as Record<string, unknown> | null;
        setApiError(
          (body?.message as string) || t('registrationFailed'),
        );
      } else {
        setApiError(t('registrationFailed'));
      }
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <Breadcrumb items={[{ label: t('register') }]} />
      <div className="mt-6 bg-white rounded-2xl border p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('createAccount')}</h1>
        <p className="text-sm text-slate-500 mb-6">{t('registerSubtitle')}</p>

        {registered && (
          <div className="mb-4 flex flex-col gap-3 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{t('registrationSuccess')}</span>
            </div>
            <Button
              type="button"
              onClick={() => router.push(loginUrl)}
              className="self-start text-xs px-3 py-1.5"
            >
              {t('loginNow')}
            </Button>
          </div>
        )}

        {apiError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('fullName')} {...register('fullName')} error={errors.fullName?.message} />
          <Input label={t('email')} type="email" {...register('email')} error={errors.email?.message} autoComplete="email" />
          <div className="relative">
            <Input
              label={t('phone')}
              type="tel"
              {...register('phone')}
              error={errors.phone?.message}
              autoComplete="tel"
            />
            <Phone className="absolute right-3 top-9 w-4 h-4 text-slate-400" />
          </div>
          <div className="relative">
            <Input
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              error={errors.password?.message}
              autoComplete="new-password"
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
          <Input
            label={t('confirmPassword')}
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
          />
          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input type="checkbox" className="rounded border-gray-300 text-primary mt-0.5" {...register('agreeTerms')} />
            <span>{t.rich('agreeTerms', {
              terms: (chunks) => <a href="#" className="text-primary hover:underline">{chunks}</a>,
              privacy: (chunks) => <a href="#" className="text-primary hover:underline">{chunks}</a>,
            })}</span>
          </label>
          <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={isSubmitting || registered}>
            <UserPlus className="w-4 h-4" /> {isSubmitting ? t('creating') : t('register')}
          </Button>
        </form>

        <p className="text-sm text-slate-500 text-center mt-6">
          {t('haveAccount')}{' '}
          <Link href={loginUrl} className="text-primary font-medium hover:underline">
            {t('login')}
          </Link>
        </p>
      </div>
    </main>
  );
}
