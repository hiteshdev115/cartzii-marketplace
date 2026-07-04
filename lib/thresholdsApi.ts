// ---------------------------------------------------------------------------
// Thresholds API client — buyer-side free-shipping threshold fetch
// ---------------------------------------------------------------------------
// Fetches per-seller free-shipping thresholds from the API server.
// Silent-fail by design — banners are non-critical upsells, not blocking info.
// ---------------------------------------------------------------------------

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.cartzii.com';

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
 * Guest buyers (no auth token) silently receive an empty Map since the
 * thresholds endpoint requires authentication.
 */
export async function getSellerShippingThresholds(
  sellerIds: number[],
): Promise<Map<number, SellerThreshold>> {
  if (sellerIds.length === 0) return new Map();

  const token = getAuthToken();
  if (!token) return new Map();

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/sellers/shipping-thresholds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ sellerIds }),
    });
    if (!res.ok) return new Map();
    const data = (await res.json()) as { thresholds?: SellerThreshold[] };
    const map = new Map<number, SellerThreshold>();
    for (const th of data.thresholds ?? []) {
      map.set(th.sellerId, th);
    }
    return map;
  } catch {
    return new Map();
  }
}
