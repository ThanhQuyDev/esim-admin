import { apiClient } from '@/lib/api-client';
import type {
  Plan,
  PlanFilters,
  PlansResponse,
  CreatePlanPayload,
  UpdatePlanPayload
} from './types';

export async function getPlans(filters: PlanFilters): Promise<PlansResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);

  const query = params.toString();
  return apiClient<PlansResponse>(`/plans${query ? `?${query}` : ''}`);
}

export async function getPlan(id: number): Promise<Plan> {
  return apiClient<Plan>(`/plans/${id}`);
}

export async function createPlan(data: CreatePlanPayload): Promise<Plan> {
  return apiClient<Plan>('/plans', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updatePlan(id: number, data: UpdatePlanPayload): Promise<Plan> {
  return apiClient<Plan>(`/plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deletePlan(id: number): Promise<void> {
  await apiClient(`/plans/${id}`, {
    method: 'DELETE'
  });
}
