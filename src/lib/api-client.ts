function getBaseUrl() {
  if (typeof window !== 'undefined') return '/api';
  const host = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${host}/api`;
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
