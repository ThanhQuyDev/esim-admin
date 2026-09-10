export type PartnerType = 'distribution' | 'kol';
export type PartnerLegalType = 'individual' | 'company';
export type PartnerStatus = 'pending' | 'active' | 'hold' | 'disabled' | 'rejected';

export type PartnerUser = {
  id: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

export type Partner = {
  id: number;
  userId: number;
  user?: PartnerUser;
  partnerType: PartnerType;
  legalType: PartnerLegalType;
  companyName: string | null;
  taxCode: string | null;
  businessAddress: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  channelInfo: Record<string, unknown> | null;
  status: PartnerStatus;
  tierCode: string | null;
  assignedManagerId: number | null;
  approvedAt: string | null;
  approvedByAdminId: number | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  /** Aggregates returned with each admin list row. */
  revenue30dVnd?: number;
  walletBalanceVnd?: number;
  lastActivityAt?: string | null;
  /** Lifetime paid/completed orders attributed to this partner (#095). */
  totalOrders?: number;
  /** Lifetime value of those orders. */
  totalRevenueVnd?: number;
  /** Revenue less cost of goods less the commission we paid them; can be negative. */
  profitVnd?: number;
  /** Lifetime commission credited to this partner — what we have paid them. */
  totalCommissionVnd?: number;
  /** Share of their orders that ended up refunded, 0–100 by order count. */
  refundRatePercent?: number;
};

/** Aggregates behind the admin partner overview screen. */
export type PartnerOverview = {
  partners: {
    total: number;
    active: number;
    pendingApprovals: number;
    hold: number;
    disabled: number;
    kol: number;
    distribution: number;
  };
  queue: {
    pendingApprovals: number;
    pendingPayouts: number;
    pendingPayoutVnd: number;
    pendingDeposits: number;
    pendingCommissionVnd: number;
    pendingCommissions: number;
  };
  money: {
    revenue30dVnd: number;
    orders30d: number;
    commission30dVnd: number;
    commissionTotalVnd: number;
  };
  policy: {
    payoutMinVnd: number;
    depositMinVnd: number;
  };
  topPartners: {
    id: number;
    contactName: string;
    partnerType: PartnerType;
    tierCode: string | null;
    revenue30dVnd: number;
    orders30d: number;
  }[];
};

export type PartnerListResponse = {
  data: Partner[];
  totalCount: number;
  hasNextPage: boolean;
};

export type PartnerFilters = {
  page?: number;
  limit?: number;
  partnerType?: PartnerType;
  status?: PartnerStatus;
  search?: string;
};

export type PartnerWalletTransaction = {
  id: number;
  walletId: number;
  partnerId: number;
  type: string;
  amountVnd: number;
  balanceAfterVnd: number;
  orderId: number | null;
  reason: string | null;
  createdAt: string;
};

export type PartnerDepositRequest = {
  id: number;
  partnerId: number;
  amountVnd: number;
  bankTransferCode: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  confirmedByAdminId: number | null;
  confirmedAt: string | null;
  createdAt: string;
};

export type OrderPartnerCommission = {
  id: number;
  orderId: number;
  partnerId: number;
  linkId: number | null;
  commissionVnd: number;
  tierSnapshot: string | null;
  status: 'pending' | 'credited' | 'reversed';
  createdAt: string;
};

export type PartnerPayout = {
  id: number;
  partnerId: number;
  amountVnd: number;
  bankAccountInfo: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  adminNote: string | null;
  processedAt: string | null;
  createdAt: string;
};

export type PartnerTier = {
  id: number;
  partnerType: PartnerType;
  tierCode: string;
  tierName: string;
  minVolumeVnd: number;
  commissionPercent: number;
  maxDiscountPercent: number;
  sortOrder: number;
  isActive: boolean;
};

export type RejectPartnerPayload = { reason: string };
export type UpdatePartnerStatusPayload = { status: PartnerStatus };
export type AssignTierPayload = { tierCode: string };
export type AdjustWalletPayload = { amountVnd: number; reason?: string };
export type ProcessPayoutPayload = { adminNote?: string };
export type CreateTierPayload = {
  partnerType: PartnerType;
  tierCode: string;
  tierName: string;
  minVolumeVnd?: number;
  commissionPercent?: number;
  maxDiscountPercent?: number;
  sortOrder?: number;
  isActive?: boolean;
};
export type UpdateTierPayload = Partial<Omit<CreateTierPayload, 'partnerType' | 'tierCode'>>;

/** A marketing link the partner created (#095). */
export type PartnerLinkRow = {
  id: number;
  code: string;
  label: string;
  targetPath: string | null;
  status: string;
  clickCount: number;
  conversionCount: number;
  totalCommissionVnd: number | string;
  createdAt: string;
};

/** A discount code owned by the partner, with how much it has been used. */
export type PartnerCouponRow = {
  id: number;
  code: string;
  discountPercent: number | null;
  usageCount: number;
  maxUsage: number | null;
  isActive: boolean;
  myOrders: number;
  discountGivenVnd: number;
};

export type PartnerMarketing = {
  links: PartnerLinkRow[];
  coupons: PartnerCouponRow[];
};
