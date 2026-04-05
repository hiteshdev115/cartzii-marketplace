'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '@/lib/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import Link from 'next/link';
import { buildCountryPath } from '@/config/countries';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export function RegisterForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    await new Promise((r) => setTimeout(r, 1000));
    alert('Account created! (demo)');
  };

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <Breadcrumb items={[{ label: t('register') }]} />
      <div className="mt-6 bg-white rounded-2xl border p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('createAccount')}</h1>
        <p className="text-sm text-slate-500 mb-6">{t('registerSubtitle')}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('fullName')} {...register('fullName')} error={errors.fullName?.message} />
          <Input label={t('email')} type="email" {...register('email')} error={errors.email?.message} autoComplete="email" />
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
          <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={isSubmitting}>
            <UserPlus className="w-4 h-4" /> {isSubmitting ? t('creating') : t('register')}
          </Button>
        </form>

        <p className="text-sm text-slate-500 text-center mt-6">
          {t('haveAccount')}{' '}
          <Link href={buildCountryPath(locale, '/auth/login')} className="text-primary font-medium hover:underline">
            {t('login')}
          </Link>
        </p>
      </div>
    </main>
  );
}
