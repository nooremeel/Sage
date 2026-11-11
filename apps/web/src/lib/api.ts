import type { ApiErrorResponse } from '@sage/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Fast-fail health state to eliminate 2-3 second localhost hangs when backend is offline
let isBackendReachable: boolean | null = null;
let lastHealthCheckTime = 0;
const HEALTH_CACHE_TTL_MS = 20000; // recheck every 20s

export class ApiError extends Error {
  code?: string;
  statusCode?: number;

  constructor(message: string, code?: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

async function quickHealthProbe(): Promise<boolean> {
  const now = Date.now();
  if (isBackendReachable !== null && now - lastHealthCheckTime < HEALTH_CACHE_TTL_MS) {
    return isBackendReachable;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 200);

  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    isBackendReachable = res.ok;
  } catch {
    clearTimeout(timer);
    isBackendReachable = false;
  }

  lastHealthCheckTime = Date.now();
  return isBackendReachable;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // If known to be offline, fast-fail in 0ms to let offline fallbacks render immediately
  if (isBackendReachable === false && Date.now() - lastHealthCheckTime < HEALTH_CACHE_TTL_MS) {
    throw new ApiError('Backend service offline', 'BACKEND_OFFLINE', 503);
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include httpOnly cookies
    });

    isBackendReachable = true;
    lastHealthCheckTime = Date.now();

    // Handle empty or 204 responses
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      const message = errorData.message || response.statusText || 'Request failed';
      throw new ApiError(message, errorData.code, response.status);
    }

    return data as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network failure (connection refused / timeout)
    isBackendReachable = false;
    lastHealthCheckTime = Date.now();
    throw err;
  }
}

