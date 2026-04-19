import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getSupportedDevices,
  createSupportedDevice,
  updateSupportedDevice,
  deleteSupportedDevice
} from './service';
import type {
  SupportedDevice,
  CreateSupportedDevicePayload,
  UpdateSupportedDevicePayload,
  SupportedDeviceFilters
} from './types';

export const supportedDeviceKeys = {
  all: ['supported-devices'] as const,
  list: (filters: SupportedDeviceFilters) => [...supportedDeviceKeys.all, 'list', filters] as const,
  detail: (id: number) => [...supportedDeviceKeys.all, 'detail', id] as const
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
