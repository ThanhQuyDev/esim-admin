import { apiClient } from '@/lib/api-client';
import type {
  CreateSiteScriptPayload,
  SiteScript,
  SiteScriptFilters,
  SiteScriptResponse,
  UpdateSiteScriptPayload
} from './types';

export async function getSiteScripts(filters: SiteScriptFilters): Promise<SiteScriptResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);
  const query = params.toString();
  return apiClient<SiteScriptResponse>(`/site-scripts${query ? `?${query}` : ''}`);
}

export async function createSiteScript(data: CreateSiteScriptPayload): Promise<SiteScript> {
  return apiClient<SiteScript>('/site-scripts', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateSiteScript(
  id: string,
  data: UpdateSiteScriptPayload
): Promise<SiteScript> {
  return apiClient<SiteScript>(`/site-scripts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteSiteScript(id: string): Promise<void> {
  await apiClient(`/site-scripts/${id}`, { method: 'DELETE' });
}
