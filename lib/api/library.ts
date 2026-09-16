/**
 * Buyer Library API.
 *
 * `/account/library` is the persistent home of every digital purchase a
 * buyer has made — courses, planners, software licence keys. This
 * module wraps the two backend endpoints:
 *
 *   GET  /api/v1/customers/library
 *       → LibraryItem[]
 *   GET  /api/v1/customers/library/:grantId/download/:deliverableId
 *       → { url, expiresAt }
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.cartzii.com';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('cartzii-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

export interface LibraryFile {
  id: string;
  filename: string;
  mimetype: string;
  sizeBytes: number;
}

export interface LibraryItem {
  grantId: string;
  orderId: number;
  productId: number;
  productName: string;
  productSlug: string | null;
  subcategory: string | null;
  revoked: boolean;
  revokedReason: string | null;
  createdAt: string;
  files: LibraryFile[];
  licenseKey: string | null;
}

interface Envelope<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

async function authed<T>(path: string): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error('Sign in to view your library.');
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method:  'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache:   'no-store',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Envelope<T>;
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  const body = (await res.json()) as Envelope<T>;
  return (body.data ?? (body as unknown)) as T;
}

/** Fetch the buyer's Library. */
export async function fetchLibrary(): Promise<LibraryItem[]> {
  const data = await authed<{ library: LibraryItem[] }>(
    '/api/v1/customers/library',
  );
  return data.library ?? [];
}

/**
 * Ask the api-server for a short-lived signed URL for one file, then
 * open a new tab pointing at it. The URL lives ~24h; the tab has
 * already navigated, and the fetch is done.
 */
export async function requestDownload(
  grantId: string,
  deliverableId: string,
): Promise<{ url: string; expiresAt: string }> {
  return authed<{ url: string; expiresAt: string }>(
    `/api/v1/customers/library/${encodeURIComponent(grantId)}/download/${encodeURIComponent(deliverableId)}`,
  );
}
