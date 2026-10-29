import { apiClient } from '@/lib/api-client';
import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { esimKeys } from './queries';

/**
 * One package as `GET /topup/:iccid/packages` returns it — the same list the
 * storefront's top-up screen reads (vande #063: the dialog used to read
 * `title` / `data` / `day`, fields the API never sends, so every package
 * showed as its bare id).
 */
export type TopupPackage = {
  packageId: string;
  /** "3 GB - 100 SMS - 100 Mins - 30 Days" */
  name: string;
  /** "3 GB" */
  dataAmountText?: string;
  durationDays?: number;
  isUnlimited?: boolean;
  retailPrice: number;
  vndPrice?: number | null;
  /** "addon": data on top of the current plan (Billion, vande #081). */
  kind?: 'topup' | 'addon';
  addonKind?: 'boost' | 'upgrade' | 'extra';
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
