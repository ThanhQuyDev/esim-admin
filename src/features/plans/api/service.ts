import { apiClient } from '@/lib/api-client';
import type {
  Plan,
  PlanFilters,
  PlansResponse,
  CreatePlanPayload,
  UpdatePlanPayload,
  ImportPlansExcelPayload,
  ImportPlansExcelResponse
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

export async function importPlansExcel(
  payload: ImportPlansExcelPayload
): Promise<ImportPlansExcelResponse> {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('provider', payload.provider);
  formData.append('columnMapping', JSON.stringify(payload.columnMapping));
  if (payload.sheet) {
    formData.append('sheet', payload.sheet);
  }

  const res = await fetch('/api/plans/import-excel', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Import failed: ${res.status}`);
  }

  return res.json();
}
