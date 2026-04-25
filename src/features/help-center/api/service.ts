import { apiClient } from '@/lib/api-client';
import type {
  HelpCenterArticle,
  HelpCenterFilters,
  HelpCenterResponse,
  CreateHelpCenterPayload,
  UpdateHelpCenterPayload
} from './types';

export async function getHelpCenterArticles(
  filters: HelpCenterFilters
): Promise<HelpCenterResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.category) params.set('category', filters.category);
  if (filters.parent) params.set('parent', filters.parent);
  const query = params.toString();
  return apiClient<HelpCenterResponse>(`/help-center${query ? `?${query}` : ''}`);
}

export async function getHelpCenterArticle(id: string): Promise<HelpCenterArticle> {
  return apiClient<HelpCenterArticle>(`/help-center/${id}`);
}

export async function createHelpCenterArticle(
  data: CreateHelpCenterPayload
): Promise<HelpCenterArticle> {
  return apiClient<HelpCenterArticle>('/help-center', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateHelpCenterArticle(
  id: string,
  data: UpdateHelpCenterPayload
): Promise<HelpCenterArticle> {
  return apiClient<HelpCenterArticle>(`/help-center/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteHelpCenterArticle(id: string): Promise<void> {
  await apiClient(`/help-center/${id}`, { method: 'DELETE' });
}
