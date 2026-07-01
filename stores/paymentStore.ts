import { create } from 'zustand';
import type { PaymentMethod, CreatePaymentIntentPayload } from '@/types/payment';
import {
  createPaymentIntent,
  getPaymentMethods,
  deletePaymentMethod,
} from '@/lib/api/payment';
import { ApiError } from '@/lib/api/client';

// ---- Types ----------------------------------------------------------------

type PaymentStatus = 'idle' | 'processing' | 'succeeded' | 'failed';

interface PaymentStore {
  // State
  clientSecret: string | null;
  paymentIntentId: string | null;
  publishableKey: string | null;
  savedMethods: PaymentMethod[];
  isLoading: boolean;
  error: string | null;
  paymentStatus: PaymentStatus;

  // Actions
  initializePayment: (payload: CreatePaymentIntentPayload) => Promise<void>;
  fetchSavedMethods: () => Promise<void>;
  removeSavedMethod: (id: string) => Promise<void>;
  setPaymentStatus: (status: PaymentStatus) => void;
  resetPayment: () => void;
}

// ---- Store ----------------------------------------------------------------

export const usePaymentStore = create<PaymentStore>()((set, get) => ({
  clientSecret: null,
  paymentIntentId: null,
  publishableKey: null,
  savedMethods: [],
  isLoading: false,
  error: null,
  paymentStatus: 'idle',

  initializePayment: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await createPaymentIntent(payload);
      set({
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
        publishableKey: data.publishableKey,
        isLoading: false,
      });
    } catch (err) {
      console.error('[PaymentStore] create-intent failed:', err);
      let message = 'Failed to initialize payment';
      if (err instanceof ApiError) {
        const body = err.body as Record<string, unknown> | null;
        message = (body?.message as string) ?? (body?.error as string) ?? `${err.status}: ${err.statusText}`;
      } else if (err instanceof Error) {
        message = err.message;
      }
      set({ error: message, isLoading: false });
    }
  },

  fetchSavedMethods: async () => {
    set({ isLoading: true, error: null });
    try {
      const methods = await getPaymentMethods();
      // Backend may return non-array on unexpected shape — guard defensively
      set({ savedMethods: Array.isArray(methods) ? methods : [], isLoading: false });
    } catch {
      // Backend returns 500 when the user has no Stripe customer yet —
      // treat as empty list (same pattern as fetchCartItemsAPI in cart.ts).
      set({ savedMethods: [], isLoading: false });
    }
  },

  removeSavedMethod: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deletePaymentMethod(id);
      set({
        savedMethods: get().savedMethods.filter((m) => m.id !== id),
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to remove payment method',
        isLoading: false,
      });
    }
  },

  setPaymentStatus: (status) => set({ paymentStatus: status }),

  resetPayment: () =>
    set({
      clientSecret: null,
      paymentIntentId: null,
      paymentStatus: 'idle',
      error: null,
    }),
}));
