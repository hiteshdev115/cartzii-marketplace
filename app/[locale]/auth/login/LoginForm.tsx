'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import Link from 'next/link';
import { buildCountryPath } from '@/config/countries';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';

export function LoginForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (_data: LoginFormData) => {
    // Demo: simulate login
    await new Promise((r) => setTimeout(r, 1000));
    alert('Login successful! (demo)');
  };

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <Breadcrumb items={[{ label: t('login') }]} />
      <div className="mt-6 bg-white rounded-2xl border p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('welcomeBack')}</h1>
        <p className="text-sm text-slate-500 mb-6">{t('loginSubtitle')}</p>

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
            <Link href="#" className="text-sm text-primary hover:underline">{t('forgotPassword')}</Link>
          </div>
          <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={isSubmitting}>
            <LogIn className="w-4 h-4" /> {isSubmitting ? t('loggingIn') : t('login')}
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
