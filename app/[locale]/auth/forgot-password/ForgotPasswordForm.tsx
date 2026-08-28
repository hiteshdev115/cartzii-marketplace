'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Link } from '@/i18n/navigation';
import { buildPath } from '@/config/countries';
import { api, ApiError } from '@/lib/api/client';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const t = useTranslations('Auth');
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setApiError(null);
    try {
      await api.post('/api/v1/forgotPassword', { email: data.email });
      setSuccess(true);
    } catch (error) {
      if (error instanceof ApiError) {
        const body = error.body as Record<string, unknown> | null;
        setApiError((body?.message as string) || t('forgotPasswordFailed'));
      } else {
        setApiError(t('forgotPasswordFailed'));
      }
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <Breadcrumb items={[{ label: t('forgotPassword') }]} />
      <div className="mt-6 bg-white rounded-2xl border p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('forgotPassword')}</h1>
        <p className="text-sm text-slate-500 mb-6">{t('forgotPasswordSubtitle')}</p>

        {success ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-700 font-medium">{t('forgotPasswordSuccess')}</p>
              <p className="text-sm text-slate-500 mt-1">{t('forgotPasswordCheckInbox')}</p>
            </div>
            <Link
              href={buildPath('/auth/login')}
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> {t('backToLogin')}
            </Link>
          </div>
        ) : (
          <>
            {apiError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label={t('email')}
                type="email"
                {...register('email')}
                error={errors.email?.message}
                autoComplete="email"
              />
              <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={isSubmitting}>
                <Mail className="w-4 h-4" /> {isSubmitting ? t('sending') : t('sendResetLink')}
              </Button>
            </form>

            <p className="text-sm text-slate-500 text-center mt-6">
              <Link
                href={buildPath('/auth/login')}
                className="text-primary font-medium hover:underline flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> {t('backToLogin')}
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
