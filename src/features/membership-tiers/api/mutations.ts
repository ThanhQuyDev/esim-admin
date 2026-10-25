import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createMembershipTier, deleteMembershipTier, updateMembershipTier } from './service';
import { membershipTierKeys } from './queries';
import type {
  CreateMembershipTierPayload,
  MembershipTierCode,
  UpdateMembershipTierPayload
} from './types';

export const updateMembershipTierMutation = mutationOptions({
  mutationFn: ({ tier, data }: { tier: MembershipTierCode; data: UpdateMembershipTierPayload }) =>
    updateMembershipTier(tier, data),
  onSettled: () => getQueryClient().invalidateQueries({ queryKey: membershipTierKeys.all })
});

export const createMembershipTierMutation = mutationOptions({
  mutationFn: (data: CreateMembershipTierPayload) => createMembershipTier(data),
  onSettled: () => getQueryClient().invalidateQueries({ queryKey: membershipTierKeys.all })
});

export const deleteMembershipTierMutation = mutationOptions({
  mutationFn: (tier: MembershipTierCode) => deleteMembershipTier(tier),
  onSettled: () => getQueryClient().invalidateQueries({ queryKey: membershipTierKeys.all })
});
