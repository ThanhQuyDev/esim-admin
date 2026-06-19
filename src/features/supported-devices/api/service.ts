import { apiClient } from '@/lib/api-client';
import type {
  SupportedDevice,
  SupportedDevicesResponse,
  CreateSupportedDevicePayload,
  UpdateSupportedDevicePayload,
  SupportedDeviceFilters
} from './types';

export async function getSupportedDevices(
  filters?: SupportedDeviceFilters
): Promise<SupportedDevicesResponse> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.search) params.set('search', filters.search);
  if (filters?.type) params.set('type', filters.type);
  if (filters?.sort) params.set('sort', filters.sort);

  const queryString = params.toString();
  const url = `/supported-devices${queryString ? `?${queryString}` : ''}`;

  return apiClient<SupportedDevicesResponse>(url);
}

export async function getSupportedDeviceById(id: number): Promise<SupportedDevice | null> {
  try {
    const response = await apiClient<{ data: SupportedDevice }>(`/supported-devices/${id}`);
    return response.data;
  } catch {
    return null;
  }
}

export async function createSupportedDevice(
  payload: CreateSupportedDevicePayload
): Promise<SupportedDevice> {
  const response = await apiClient<{ data: SupportedDevice }>('/supported-devices', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function updateSupportedDevice(
  id: number,
  payload: UpdateSupportedDevicePayload
): Promise<SupportedDevice> {
  const response = await apiClient<{ data: SupportedDevice }>(`/supported-devices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function deleteSupportedDevice(id: number): Promise<void> {
  await apiClient(`/supported-devices/${id}`, {
    method: 'DELETE'
  });
}
