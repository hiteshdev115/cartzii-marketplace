import { create } from 'zustand';
import type { ApiAddress, CreateAddressPayload, UpdateAddressPayload } from '@/types';
import {
  fetchUserAddresses,
  createAddress as apiCreateAddress,
  updateAddress as apiUpdateAddress,
  deleteAddress as apiDeleteAddress,
} from '@/lib/api';

interface AddressStore {
  addresses: ApiAddress[];
  loading: boolean;
  error: string | null;

  fetchAddresses: (userId: number) => Promise<void>;
  addAddress: (payload: CreateAddressPayload) => Promise<{ success: boolean; error?: string }>;
  editAddress: (id: number, payload: UpdateAddressPayload) => Promise<{ success: boolean; error?: string }>;
  removeAddress: (id: number) => Promise<{ success: boolean; error?: string }>;
  reset: () => void;
}

export const useAddressStore = create<AddressStore>()((set, get) => ({
  addresses: [],
  loading: false,
  error: null,

  fetchAddresses: async (userId) => {
    set({ loading: true, error: null });
    try {
      const addresses = await fetchUserAddresses(userId);
      set({ addresses, loading: false });
    } catch {
      set({ error: 'Failed to load addresses', loading: false });
    }
  },

  addAddress: async (payload) => {
    set({ loading: true, error: null });
    try {
      const result = await apiCreateAddress(payload);
      if (result.error) {
        set({ error: result.error, loading: false });
        return { success: false, error: result.error };
      }
      const newAddress = result.data!;
      // If new address is primary, unset primary on others
      const existing = newAddress.is_primary
        ? get().addresses.map((a) => ({ ...a, is_primary: false }))
        : get().addresses;
      set({ addresses: [newAddress, ...existing], loading: false });
      return { success: true };
    } catch {
      set({ error: 'Failed to create address', loading: false });
      return { success: false, error: 'Failed to create address' };
    }
  },

  editAddress: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const result = await apiUpdateAddress(id, payload);
      if (result.error) {
        set({ error: result.error, loading: false });
        return { success: false, error: result.error };
      }
      const updated = result.data!;
      set({
        addresses: get().addresses.map((a) => {
          if (a.id === id) return updated;
          // If the updated address became primary, unset primary on others
          if (updated.is_primary && a.is_primary) return { ...a, is_primary: false };
          return a;
        }),
        loading: false,
      });
      return { success: true };
    } catch {
      set({ error: 'Failed to update address', loading: false });
      return { success: false, error: 'Failed to update address' };
    }
  },

  removeAddress: async (id) => {
    set({ loading: true, error: null });
    try {
      const result = await apiDeleteAddress(id);
      if (!result.success) {
        set({ error: result.error || 'Failed to delete', loading: false });
        return { success: false, error: result.error };
      }
      set({ addresses: get().addresses.filter((a) => a.id !== id), loading: false });
      return { success: true };
    } catch {
      set({ error: 'Failed to delete address', loading: false });
      return { success: false, error: 'Failed to delete address' };
    }
  },

  reset: () => set({ addresses: [], loading: false, error: null }),
}));
