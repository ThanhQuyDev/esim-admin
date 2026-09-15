import { apiClient } from '@/lib/api-client';
import type { MembershipTier, MembershipTierCode, UpdateMembershipTierPayload } from './types';

export async function getMembershipTiers(): Promise<MembershipTier[]> {
  return apiClient<MembershipTier[]>('/membership-tiers');
}

/** Returns the whole ladder, since one threshold constrains its neighbours. */
export async function updateMembershipTier(
  tier: MembershipTierCode,
  data: UpdateMembershipTierPayload
): Promise<MembershipTier[]> {
  return apiClient<MembershipTier[]>(`/membership-tiers/${tier}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}
