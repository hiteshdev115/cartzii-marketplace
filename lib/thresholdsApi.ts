// ---------------------------------------------------------------------------
// Thresholds API client — buyer-side free-shipping threshold fetch
// ---------------------------------------------------------------------------
// Fetches per-seller free-shipping thresholds from the API server.
// Silent-fail by design — banners are non-critical upsells, not blocking info.
// ---------------------------------------------------------------------------

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.cartzii.com';

const GUEST_TOKEN = process.env.NEXT_PUBLIC_GUEST_API_TOKEN || '';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('cartzii-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string } };
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

export interface SellerThreshold {
  sellerId: number;
  freeShippingThresholdCents: number | null;
  storeName: string;
}

/**
 * Fetch free-shipping thresholds for a list of seller IDs.
 *
 * Returns a Map from sellerId -> SellerThreshold, or an empty Map on any
 * network/auth/parse failure (silent-fail UX).
 *
 * Works for both authenticated and guest buyers (uses guest token fallback).
 */
export async function getSellerShippingThresholds(
  sellerIds: number[],
): Promise<Map<number, SellerThreshold>> {
  if (sellerIds.length === 0) return new Map();

  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (GUEST_TOKEN) {
    headers['x-guest-token'] = GUEST_TOKEN;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/sellers/shipping-thresholds`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sellerIds }),
    });
    if (!res.ok) return new Map();
    const json = (await res.json()) as {
      data?: {
        thresholds?: Record<
          string,
          { freeShippingThresholdCents: number | null; storeName: string | null }
        >;
      };
      thresholds?: SellerThreshold[];
    };

    const map = new Map<number, SellerThreshold>();

    // Handle object-keyed format: { data: { thresholds: { "1": {...}, "2": {...} } } }
    if (json.data?.thresholds && typeof json.data.thresholds === 'object' && !Array.isArray(json.data.thresholds)) {
      for (const [key, val] of Object.entries(json.data.thresholds)) {
        const sellerId = Number(key);
        if (!Number.isFinite(sellerId)) continue;
        map.set(sellerId, {
          sellerId,
          freeShippingThresholdCents: val.freeShippingThresholdCents ?? null,
          storeName: val.storeName || `Seller #${sellerId}`,
        });
      }
      return map;
    }

    // Fallback: array format { thresholds: [{ sellerId, ... }] }
    for (const th of json.thresholds ?? []) {
      map.set(th.sellerId, th);
    }
    return map;
  } catch {
    return new Map();
  }
}
