export type MembershipTierCode = 'traveler' | 'silver' | 'gold' | 'platinum';

/** One customer membership tier and what it pays (#024). */
export type MembershipTier = {
  tier: MembershipTierCode;
  minimumSpendVnd: number;
  cashbackPercent: number;
  referralRewardVnd: number;
};

export type UpdateMembershipTierPayload = Partial<Omit<MembershipTier, 'tier'>>;
