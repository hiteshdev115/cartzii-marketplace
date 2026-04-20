import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  token: string | null;
  refreshToken: string | null;
  userId: string | null;
  firstName: string | null;
  email: string | null;
  tokenExpiry: number | null;
  setTokens: (token: string, refreshToken: string) => void;
  setUser: (info: { firstName?: string; email?: string }) => void;
  clearTokens: () => void;
  isAuthenticated: () => boolean;
  displayName: () => string | null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      userId: null,
      firstName: null,
      email: null,
      tokenExpiry: null,
      setTokens: (token, refreshToken) => {
        const claims = decodeJwtPayload(token);
        const exp = typeof claims?.exp === 'number' ? claims.exp : (claims?.exp ? Number(claims.exp) : null);
        set({
          token,
          refreshToken,
          userId: (claims?.userId as string) ?? (claims?.id as string) ?? (claims?.sub as string) ?? get().userId,
          email: (claims?.email as string) ?? get().email,
          firstName: (claims?.firstName as string) ?? get().firstName,
          tokenExpiry: exp ?? null,
        });
      },
      setUser: (info) =>
        set({
          firstName: info.firstName ?? get().firstName,
          email: info.email ?? get().email,
        }),
      clearTokens: () =>
        set({ token: null, refreshToken: null, userId: null, firstName: null, email: null, tokenExpiry: null }),
      isAuthenticated: () => {
        const state = get();
        if (!state.token) return false;
        if (!state.tokenExpiry) return true;
        return state.tokenExpiry > Math.floor(Date.now() / 1000);
      },
      displayName: () => get().firstName || get().email || null,
    }),
    { name: 'cartzii-auth' },
  ),
);
