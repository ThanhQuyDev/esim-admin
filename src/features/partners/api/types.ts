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
  /** When the current tier took effect — never applied backwards (#042). */
  tierEffectiveFrom?: string | null;
  assignedManagerId: number | null;
  approvedAt: string | null;
  approvedByAdminId: number | null;
  rejectionReason: string | null;
  /** Ticked by an admin: this partner may name their own link code (#014). */
  canCustomLinkCode?: boolean;
  /**
   * The reviewer's own note (#056) — kept apart from `notes`, which is what the
   * applicant wrote about themselves.
   */
  adminNote?: string | null;
  /**
   * Ticked by an admin: this distribution partner may also run the affiliate
   * programme, which is what puts the four marketing menus in their portal
   * (#048). Always effectively true for a marketing partner.
   */
  canAffiliate?: boolean;
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
  status: 'pending' | 'credited' | 'reversed' | 'rejected';
  /** Why a `rejected` commission earned nothing — a self-referral code (#041). */
  rejectionReason?: string | null;
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
  /** Days a click keeps earning this tier the order (#037). */
  attributionDays?: number;
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
  attributionDays?: number;
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

/**
 * What esim.vn actually keeps from each kind of partner (#050).
 *
 * Not the order value: a marketing partner's revenue is what is left after the
 * commission is paid away, a distribution or API partner's is what they paid us
 * for the eSIMs.
 */
export type PartnerRevenueByType = {
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  byType: {
    partnerType: string;
    partners: number;
    revenueVnd: number;
    previousRevenueVnd: number;
    growthPercent: number;
    attributedGrossVnd: number;
    commissionVnd: number;
    purchasesVnd: number;
  }[];
  totalRevenueVnd: number;
  previousTotalRevenueVnd: number;
  growthPercent: number;
};

/**
 * Orders, live partners and what is waiting to be settled (#051).
 *
 * "Đang hoạt động" is transaction-based, not the status field: a partner who
 * has not sent an order in 30 days is active on paper and dormant in fact.
 */
export type PartnerActivityByType = {
  range: { from: string; to: string };
  orders: { total: number; byType: { partnerType: string; orders: number }[] };
  activePartners: {
    total: number;
    byType: { partnerType: string; partners: number }[];
  };
  pendingApprovals: {
    total: number;
    byType: { partnerType: string; partners: number }[];
  };
  commissionToReconcile: { totalVnd: number; partners: number };
};

/** Revenue and orders over time, split by partner type (#052). */
export type PartnerSeriesByType = {
  range: { from: string; to: string };
  points: {
    bucket: string;
    byType: { partnerType: string; revenueVnd: number; orders: number }[];
  }[];
};

/** Where partner-driven orders are going (#052). */
export type PartnerTopDestination = {
  name: string;
  plansPurchased: number;
  revenueVnd: number;
};

/** A row of the top-30 table at the foot of the overview (#054). */
export type TopPartnerRow = {
  id: number;
  contactName: string | null;
  partnerType: string;
  tierCode: string | null;
  status: string;
  revenueVnd: number;
  orders: number;
  commissionVnd: number;
};

/**
 * The four figures at the head of the partner list (#057).
 *
 * All about the state of the accounts, which is what that page lists — locked
 * accounts are left out of the total, because counting accounts nobody can use
 * overstates the programme.
 */
export type PartnerListStats = {
  total: { count: number; byType: { partnerType: string; count: number }[] };
  active: {
    count: number;
    percentOfTotal: number;
    byType: { partnerType: string; count: number }[];
  };
  newThisMonth: { count: number; byType: { partnerType: string; count: number }[] };
  onHold: { count: number; byType: { partnerType: string; count: number }[] };
};
