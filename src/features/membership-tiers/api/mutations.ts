import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { updateMembershipTier } from './service';
import { membershipTierKeys } from './queries';
import type { MembershipTierCode, UpdateMembershipTierPayload } from './types';

export const updateMembershipTierMutation = mutationOptions({
  mutationFn: ({ tier, data }: { tier: MembershipTierCode; data: UpdateMembershipTierPayload }) =>
    updateMembershipTier(tier, data),
  onSettled: () => getQueryClient().invalidateQueries({ queryKey: membershipTierKeys.all })
});
