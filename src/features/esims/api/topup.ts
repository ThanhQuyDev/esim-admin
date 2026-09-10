import { apiClient } from '@/lib/api-client';
import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { esimKeys } from './queries';

export type TopupPackage = {
  packageId: string;
  title?: string;
  data?: string;
  day?: number;
  retailPrice: number;
  vndPrice?: number | null;
};

export type TopupPackagesResponse = {
  success: boolean;
  iccid: string;
  provider: string;
  packages: TopupPackage[];
};

export type AdminManualTopupPayload = {
  iccid: string;
  packageId: string;
  provider: string;
  note?: string;
};

export type AdminManualTopupResponse = {
  success: boolean;
  orderNumber: string;
  status: string;
  vndAmount: number;
};

export async function getTopupPackages(iccid: string): Promise<TopupPackagesResponse> {
  return apiClient<TopupPackagesResponse>(`/topup/packages?iccid=${encodeURIComponent(iccid)}`);
}

export async function adminManualTopup(
  payload: AdminManualTopupPayload
): Promise<AdminManualTopupResponse> {
  return apiClient<AdminManualTopupResponse>('/topup/admin/manual', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export const topupPackagesQueryOptions = (iccid: string, enabled: boolean) =>
  queryOptions({
    queryKey: ['topup', 'packages', iccid],
    queryFn: () => getTopupPackages(iccid),
    enabled: enabled && iccid.length > 0
  });

export const adminManualTopupMutation = mutationOptions({
  mutationFn: (payload: AdminManualTopupPayload) => adminManualTopup(payload),
  // The eSIM's usage counters change once the provider applies the topup.
  onSettled: () => {
    getQueryClient().invalidateQueries({ queryKey: esimKeys.all });
  }
});
