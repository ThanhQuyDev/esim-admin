// --- API User types ---

export type MembershipTier = 'traveler' | 'silver' | 'gold' | 'platinum';
export type TierSource = 'automatic' | 'override';

export type TierBenefits = {
  minimumSpendVnd: number;
  cashbackPercent: number;
  referralRewardVnd: number;
};

export type User = {
  id: number;
  email: string;
  provider: string;
  socialId: string | null;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  lifetimeSpendVnd: number;
  /** The customer's own referral code — the one they hand out (#056). */
  referralCode?: string | null;
  /** Orders this customer has paid for; refunded orders are not counted (#056). */
  paidOrderCount?: number;
  automaticTier: MembershipTier;
  membershipTier: MembershipTier;
  tierOverride: MembershipTier | null;
  tierOverrideReason: string | null;
  tierSource: TierSource;
  tierBenefits: TierBenefits;
  photo: { id: string; path: string } | null;
  authorProfile?: {
    id: number;
    userId: number;
    name: string;
    nameEn?: string | null;
    slug: string;
    avatar?: string | null;
    description?: string | null;
    descriptionEn?: string | null;
  } | null;
  role: { id: number; name: string };
  status: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type UserFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
  roleIds?: number[];
};

export type UsersResponse = {
  data: User[];
  hasNextPage: boolean;
  totalCount: number;
};

export type CreateUserPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  photo?: { id: string };
  authorProfile?: {
    name: string;
    nameEn?: string | null;
    slug: string;
    avatar?: string | null;
    description?: string | null;
    descriptionEn?: string | null;
  };
  role?: { id: number };
  status?: { id: number };
};

export type UpdateUserPayload = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  tierOverride?: MembershipTier | null;
  tierOverrideReason?: string | null;
  photo?: { id: string };
  authorProfile?: {
    name: string;
    nameEn?: string | null;
    slug: string;
    avatar?: string | null;
    description?: string | null;
    descriptionEn?: string | null;
  };
  role?: { id: number };
  status?: { id: number };
};
