import { apiClient } from '@/lib/api-client';
import type {
  CreateMenuSlidePayload,
  MenuSlide,
  MenuSlideFilters,
  MenuSlideResponse,
  UpdateMenuSlidePayload
} from './types';

export async function getMenuSlides(filters: MenuSlideFilters): Promise<MenuSlideResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.menuKey) params.set('menuKey', filters.menuKey);
  const query = params.toString();
  return apiClient<MenuSlideResponse>(`/menu-slides${query ? `?${query}` : ''}`);
}

export async function getMenuSlideById(id: string): Promise<MenuSlide> {
  return apiClient<MenuSlide>(`/menu-slides/${id}`);
}

export async function createMenuSlide(data: CreateMenuSlidePayload): Promise<MenuSlide> {
  return apiClient<MenuSlide>('/menu-slides', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateMenuSlide(
  id: string,
  data: UpdateMenuSlidePayload
): Promise<MenuSlide> {
  return apiClient<MenuSlide>(`/menu-slides/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteMenuSlide(id: string): Promise<void> {
  await apiClient(`/menu-slides/${id}`, { method: 'DELETE' });
}
