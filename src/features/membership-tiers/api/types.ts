/**
 * A tier's code: the four built-in ones (traveler, silver, gold, platinum) or
 * one an admin added, e.g. "kim-cuong" (vande #066).
 */
export type MembershipTierCode = string;

/** One customer membership tier and what it pays (#024). */
export type MembershipTier = {
  tier: MembershipTierCode;
  /** What customers and admins read, e.g. "Du khách bạch kim" (vande #066). */
  name: string;
  nameEn: string | null;
  minimumSpendVnd: number;
  cashbackPercent: number;
  referralRewardVnd: number;
};

export type UpdateMembershipTierPayload = Partial<Omit<MembershipTier, 'tier'>>;

export type CreateMembershipTierPayload = Omit<MembershipTier, 'tier' | 'nameEn'> & {
  nameEn?: string | null;
};
