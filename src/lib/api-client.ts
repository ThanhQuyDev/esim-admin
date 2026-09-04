function getBaseUrl() {
  if (typeof window !== 'undefined') return '/api';
  // Server-side (RSC prefetch) needs an absolute URL. On Vercel there is no
  // localhost listener inside the function, so fall back to VERCEL_URL before
  // the local dev default — otherwise every prefetch would ECONNREFUSED.
  if (process.env.NEXT_PUBLIC_APP_URL) return `${process.env.NEXT_PUBLIC_APP_URL}/api`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api`;
  return `http://localhost:${process.env.PORT || 3000}/api`;
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
