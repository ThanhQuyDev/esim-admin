import { apiClient } from '@/lib/api-client';
import type {
  CreateMembershipTierPayload,
  MembershipTier,
  MembershipTierCode,
  UpdateMembershipTierPayload
} from './types';

export async function getMembershipTiers(): Promise<MembershipTier[]> {
  return apiClient<MembershipTier[]>('/membership-tiers');
}

/** Returns the whole ladder, since one threshold constrains its neighbours. */
export async function updateMembershipTier(
  tier: MembershipTierCode,
  data: UpdateMembershipTierPayload
): Promise<MembershipTier[]> {
  return apiClient<MembershipTier[]>(`/membership-tiers/${encodeURIComponent(tier)}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

/** A new tier; it falls into place on the ladder by its threshold (vande #066). */
export async function createMembershipTier(
  data: CreateMembershipTierPayload
): Promise<MembershipTier[]> {
  return apiClient<MembershipTier[]>('/membership-tiers', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function deleteMembershipTier(tier: MembershipTierCode): Promise<MembershipTier[]> {
  return apiClient<MembershipTier[]>(`/membership-tiers/${encodeURIComponent(tier)}`, {
    method: 'DELETE'
  });
}
