// ---------------------------------------------------------------------------
// Centralized API Client
// ---------------------------------------------------------------------------
// All HTTP calls go through this client so headers, auth tokens, base URL,
// error handling, and response parsing are managed in one place.
// ---------------------------------------------------------------------------

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.cartzii.com';

const GUEST_TOKEN = process.env.NEXT_PUBLIC_GUEST_API_TOKEN || '';

// ---- Types ----------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  statusText: string;
  body: unknown;

  constructor(status: number, statusText: string, body: unknown) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

export interface RequestConfig extends Omit<RequestInit, 'body'> {
  /** Query-string params — appended automatically */
  params?: Record<string, string | number | boolean | undefined>;
  /** JSON body — serialised automatically */
  body?: unknown;
  /** Skip the default guest-token header (e.g. for auth'd requests) */
  skipGuestToken?: boolean;
}

// ---- Helpers --------------------------------------------------------------

function buildUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

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

function buildHeaders(config?: RequestConfig, hasBody?: boolean): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  // Only set Content-Type for requests with a body
  if (hasBody !== false) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach guest token by default; skip for authenticated endpoints
  if (!config?.skipGuestToken && GUEST_TOKEN) {
    headers['x-guest-token'] = GUEST_TOKEN;
  }

  // Auto-attach auth token if available
  const authToken = getAuthToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Merge any caller-supplied headers (e.g. Authorization bearer)
  if (config?.headers) {
    const extra =
      config.headers instanceof Headers
        ? Object.fromEntries(config.headers.entries())
        : Array.isArray(config.headers)
          ? Object.fromEntries(config.headers)
          : config.headers;
    Object.assign(headers, extra);
  }

  return headers;
}

// ---- Core request ---------------------------------------------------------

async function request<T>(
  endpoint: string,
  config?: RequestConfig,
): Promise<T> {
  const { params, body, ...rest } = config ?? {};

  const url = buildUrl(endpoint, params);

  const res = await fetch(url, {
    ...rest,
    headers: buildHeaders(config, !!body),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorBody: unknown;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = await res.text().catch(() => null);
    }
    throw new ApiError(res.status, res.statusText, errorBody);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ---- Convenience methods --------------------------------------------------

export const api = {
  get<T>(endpoint: string, config?: RequestConfig) {
    return request<T>(endpoint, { ...config, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, config?: RequestConfig) {
    return request<T>(endpoint, { ...config, method: 'POST', body });
  },

  put<T>(endpoint: string, body?: unknown, config?: RequestConfig) {
    return request<T>(endpoint, { ...config, method: 'PUT', body });
  },

  patch<T>(endpoint: string, body?: unknown, config?: RequestConfig) {
    return request<T>(endpoint, { ...config, method: 'PATCH', body });
  },

  delete<T>(endpoint: string, config?: RequestConfig) {
    return request<T>(endpoint, { ...config, method: 'DELETE' });
  },
};
