import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getSupportedDevices,
  createSupportedDevice,
  updateSupportedDevice,
  deleteSupportedDevice,
  getSupportedDeviceOrdering,
  saveSupportedDeviceOrdering,
  getSupportedDeviceManufacturers
} from './service';
import type {
  SupportedDevice,
  CreateSupportedDevicePayload,
  UpdateSupportedDevicePayload,
  SupportedDeviceFilters,
  SaveSupportedDeviceOrderingPayload
} from './types';

export const supportedDeviceKeys = {
  all: ['supported-devices'] as const,
  list: (filters: SupportedDeviceFilters) => [...supportedDeviceKeys.all, 'list', filters] as const,
  detail: (id: number) => [...supportedDeviceKeys.all, 'detail', id] as const,
  ordering: () => [...supportedDeviceKeys.all, 'ordering'] as const,
  manufacturers: () => [...supportedDeviceKeys.all, 'manufacturers'] as const
};

/** Brand names for the list filter's select box (#052). */
export function supportedDeviceManufacturersQueryOptions() {
  return {
    queryKey: supportedDeviceKeys.manufacturers(),
    queryFn: () => getSupportedDeviceManufacturers(),
    staleTime: 5 * 60 * 1000
  };
}

export function supportedDeviceOrderingQueryOptions() {
  return {
    queryKey: supportedDeviceKeys.ordering(),
    queryFn: () => getSupportedDeviceOrdering()
  };
}

export const saveSupportedDeviceOrderingMutation = {
  mutationFn: (payload: SaveSupportedDeviceOrderingPayload) => saveSupportedDeviceOrdering(payload)
};

export function supportedDevicesQueryOptions(filters: SupportedDeviceFilters = {}) {
  return {
    queryKey: supportedDeviceKeys.list(filters),
    queryFn: () => getSupportedDevices(filters)
  };
}

export function useSupportedDevicesQuery(filters: SupportedDeviceFilters = {}) {
  return useQuery({
    ...supportedDevicesQueryOptions(filters)
  });
}

export const createSupportedDeviceMutation = {
  mutationFn: (payload: CreateSupportedDevicePayload) => createSupportedDevice(payload)
};

export const updateSupportedDeviceMutation = {
  mutationFn: ({ id, values }: { id: number; values: UpdateSupportedDevicePayload }) =>
    updateSupportedDevice(id, values)
};

export const deleteSupportedDeviceMutation = {
  mutationFn: (id: number) => deleteSupportedDevice(id)
};
