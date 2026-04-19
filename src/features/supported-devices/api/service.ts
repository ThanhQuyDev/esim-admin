import { apiClient } from '@/lib/api-client';
import type {
  SupportedDevice,
  CreateSupportedDevicePayload,
  UpdateSupportedDevicePayload,
  SupportedDeviceFilters
} from './types';

export async function getSupportedDevices(
  filters?: SupportedDeviceFilters
): Promise<SupportedDevice[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.type) params.append('type', filters.type);

  const queryString = params.toString();
  const url = `/supported-devices${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient<{ data: SupportedDevice[] }>(url);
  return response.data;
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
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function deleteSupportedDevice(id: number): Promise<void> {
  await apiClient(`/supported-devices/${id}`, {
    method: 'DELETE'
  });
}
