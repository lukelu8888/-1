export type PortalRole = 'admin' | 'customer' | 'supplier' | 'agent';

export interface BackendUser {
  id?: number | string;
  user_code?: string | null;
  username?: string;
  email: string;
  portal_role?: PortalRole;
  rbac_role?: string | null;
  region?: string | null;
  country?: string | null;
  currency?: string | null;
  permissions?: any;
  [key: string]: any;
}

export interface BackendLoginResponse {
  token: string;
  user: BackendUser;
}

const TOKEN_KEY = 'cosun_api_token';
const BACKEND_USER_KEY = 'cosun_backend_user';

export function getApiBaseUrl(): string {
  const raw = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined;
  if (!raw) return '';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function buildUrl(pathname: string): string {
  const base = getApiBaseUrl();
  if (!base) return pathname;
  return `${base}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
}

/**
 * Resolve a backend-served public file URL.
 *
 * Backend may return relative paths like `/storage/...`, which would otherwise
 * be resolved against the frontend origin (e.g. localhost:3000) in dev.
 */
export function resolveBackendPublicUrl(input?: string | null): string {
  const raw = (input ?? '').toString().trim();
  if (!raw) return '';

  // Keep preview schemes intact.
  if (/^data:/i.test(raw) || /^blob:/i.test(raw)) return raw;

  // Absolute URL: if it mistakenly points to current frontend origin, remap to API origin.
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (typeof window !== 'undefined') {
        const sameAsFrontendOrigin = parsed.origin === window.location.origin;
        const sameAsFrontendHost = parsed.hostname === window.location.hostname;
        const isLocalDevHost = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
        const backendHostedStaticPath =
          parsed.pathname.startsWith('/storage/') || parsed.pathname.startsWith('/payment-proofs/');
        const shouldRemapToApiBase =
          backendHostedStaticPath &&
          (sameAsFrontendOrigin || (sameAsFrontendHost && isLocalDevHost) || isLocalDevHost);
        if (shouldRemapToApiBase) {
          const apiBase = getApiBaseUrl();
          return `${apiBase}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      }
    } catch {
      // Fall through to return raw URL.
    }
    return raw;
  }

  // Protocol-relative URL (rare but valid).
  if (/^\/\//.test(raw)) return `https:${raw}`;

  return buildUrl(raw);
}

export function setApiToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  // notify same-tab listeners (storage event won't fire in same tab)
  try {
    window.dispatchEvent(new Event('authTokenChanged'));
  } catch {
    // ignore
  }
}

export function getApiToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearApiToken() {
  localStorage.removeItem(TOKEN_KEY);
  try {
    window.dispatchEvent(new Event('authTokenChanged'));
  } catch {
    // ignore
  }
}

export function setBackendUser(user: BackendUser) {
  localStorage.setItem(BACKEND_USER_KEY, JSON.stringify(user));
}

export function getBackendUser(): BackendUser | null {
  const raw = localStorage.getItem(BACKEND_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BackendUser;
  } catch {
    return null;
  }
}

export function clearBackendUser() {
  localStorage.removeItem(BACKEND_USER_KEY);
}

export function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getApiToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  };
}

export async function apiFetch(pathname: string, init?: RequestInit): Promise<Response> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error('Backend API is disabled (no VITE_API_BASE_URL configured)');
  }

  const headers = new Headers(init?.headers || {});
  const url = buildUrl(pathname);

  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('Authorization')) {
    const token = getApiToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, { ...init, headers });
}

export async function apiFetchJson<T>(pathname: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(pathname, init);
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  return (await res.json()) as T;
}

export async function apiLogout(): Promise<void> {
  const token = getApiToken();
  if (!token) return;

  const res = await apiFetch('/api/auth/logout', { method: 'POST' });

  // Ignore failures during logout (we still clear local state)
  if (!res.ok) {
    // Try read message for debugging but don't throw
    try {
      await res.json();
    } catch {
      // ignore
    }
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data?.message) return String(data.message);
    if (data?.error) return String(data.error);
    if (data?.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0];
      const firstVal = (data.errors as any)[firstKey];
      if (Array.isArray(firstVal) && firstVal[0]) return String(firstVal[0]);
    }
  } catch {
    // ignore
  }
  return `Request failed (${res.status})`;
}

export async function apiLogin(params: {
  email: string;
  password: string;
  deviceName?: string;
}): Promise<BackendLoginResponse> {
  // NOTE: login request should NOT include an old Authorization header
  return await apiFetchJson<BackendLoginResponse>('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      device_name: params.deviceName,
    }),
  });
}

