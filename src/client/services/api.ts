// Dark Falcon Client API Service
// Environment-aware centralized API URL resolver
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    const cleanUrl = envUrl.trim().replace(/\/$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  return '/api';
};

const API_BASE = getApiBaseUrl();

/**
 * Resolves media URLs (e.g. `/uploads/image.jpg`) to the full backend origin
 * so that assets hosted on the backend load properly from Firebase Hosting.
 */
export function getMediaUrl(url?: string): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  if (url.startsWith('/uploads')) {
    const backendOrigin = (import.meta.env.VITE_API_BASE_URL || '')
      .trim()
      .replace(/\/$/, '')
      .replace(/\/api$/, '');
    return backendOrigin ? `${backendOrigin}${url}` : url;
  }
  return url;
}

export class ApiError extends Error {
  public code?: string;
  public status?: number;
  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message?: string; error?: string }> {
  const token = localStorage.getItem('falcon_token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Prevent accidental /api/api duplicate prefix
  let cleanEndpoint = endpoint;
  if (API_BASE.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.substring(4);
  }
  if (!cleanEndpoint.startsWith('/')) {
    cleanEndpoint = `/${cleanEndpoint}`;
  }

  const response = await fetch(`${API_BASE}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.message || data.error || `HTTP error ${response.status}`,
      data.code,
      response.status
    );
  }

  return data;
}

export const api = {
  get: <T = any>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, body?: any) =>
    request<T>(url, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T = any>(url: string, body?: any) =>
    request<T>(url, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T = any>(url: string) => request<T>(url, { method: 'DELETE' }),
  upload: <T = any>(file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<T>('/upload', {
      method: 'POST',
      body: formData,
    });
  },
};
