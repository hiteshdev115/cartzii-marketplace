'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { useHydrated } from '@/hooks/useHydration';
import { buildCountryPath } from '@/config/countries';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const locale = useLocale();
  const hydrated = useHydrated();
  const token = useAuthStore((s) => s.token);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (hydrated && !token) {
      router.replace(buildCountryPath(locale, '/auth/login'));
    }
  }, [hydrated, token, router, locale]);

  if (!hydrated || !token) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
