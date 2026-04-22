'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useLoginModalStore } from '@/stores/loginModalStore';
import { Eye, EyeOff, LogIn, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  errorCode?: number;
}

export function LoginModal() {
  const t = useTranslations('Auth');
  const isOpen = useLoginModalStore((s) => s.isOpen);
  const close = useLoginModalStore((s) => s.close);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const syncGuestCart = useCartStore((s) => s.syncGuestCart);

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleClose = useCallback(() => {
    close();
    reset();
    setApiError(null);
    setShowPassword(false);
  }, [close, reset]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    },
    [handleClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    try {
      const res = await api.post<LoginResponse>('/api/v1/login', {
        email: data.email,
        password: data.password,
      });

      if (res.success && res.token && res.refreshToken) {
        setTokens(res.token, res.refreshToken);
        setUser({ email: data.email });
        // Extract userId from the newly set token payload
        const parts = res.token.split('.');
        let userId: string | null = null;
        if (parts.length === 3) {
          try {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            userId = String(payload?.userId ?? payload?.id ?? payload?.sub ?? '');
          } catch {
            // ignore decode errors
          }
        }
        if (userId) {
          // Merge guest cart with server cart asynchronously
          syncGuestCart(userId).catch(() => {});
        }
        handleClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full z-10 p-6 sm:p-8"
        role="dialog"
        aria-labelledby="login-modal-title"
        aria-modal="true"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        <h2 id="login-modal-title" className="text-xl font-bold text-slate-900 mb-1">
          {t('welcomeBack')}
        </h2>
        <p className="text-sm text-slate-500 mb-6">{t('loginSubtitle')}</p>

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
          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            <LogIn className="w-4 h-4" />
            {isSubmitting ? t('loggingIn') : t('login')}
          </Button>
        </form>
      </div>
    </div>
  );
}
