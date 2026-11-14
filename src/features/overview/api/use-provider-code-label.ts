'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { providerSalesStatusesQueryOptions } from '@/features/providers/api/queries';
import { providerCodeLabel } from './constants';

/**
 * The masked code of a supplier on the overview, as set in "Danh sách Nhà cung
 * cấp" (vande-1411 #024); the built-in code while the list loads or for a
 * supplier without one, so a real name never shows.
 */
export function useProviderCodeLabel(): (provider: string) => string {
  const { data } = useQuery({
    ...providerSalesStatusesQueryOptions(),
    retry: false
  });
  return useCallback(
    (provider: string) =>
      data?.data.find((row) => row.provider === provider)?.shortCode || providerCodeLabel(provider),
    [data]
  );
}
