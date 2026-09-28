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
  /** Contract details quoted in the monthly reconciliation file (#061). */
  contractInfo?: { label: string; value: string }[] | null;
  /** This partner's own top-up limits; null means the programme default (#061). */
  depositMinVnd?: number | null;
  depositMaxVnd?: number | null;
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
  /** Balance less anything already claimed and waiting to be paid (#060). */
  availableBalanceVnd?: number;
  /** When the partner last signed in — the list's "hoạt động gần nhất" (#060). */
  lastLoginAt?: string | null;
  lastOrderAt?: string | null;
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
  /** Filter the list to one tier (#058). */
  tierCode?: string;
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
  /** Deposit that also earns this tier — an alternative to revenue (#073). */
  minDepositVnd?: number;
  /** % added to cost price for a distribution partner (#073). */
  costMarkupPercent?: number;
  /** Negotiated rather than earned: off the public ladder (#074). */
  isInternal?: boolean;
  sortOrder: number;
  isActive: boolean;
};

export type RejectPartnerPayload = { reason: string };
export type UpdatePartnerStatusPayload = { status: PartnerStatus };
export type AssignTierPayload = { tierCode: string };
/** The reason is required (#060) — it is what the partner sees in their history. */
export type AdjustWalletPayload = { amountVnd: number; reason: string };
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

/** Change several partners' status at once (#059). */
export type BulkPartnerStatusPayload = {
  ids: number[];
  status: PartnerStatus;
  /** Required for a hold or a lock — an admin has to say why (#060). */
  reason?: string;
};

/** An account an admin creates by hand; no password, the system mints it (#059). */
export type AdminCreatePartnerPayload = {
  partnerType: PartnerType;
  legalType: 'individual' | 'company';
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  companyName?: string;
  taxCode?: string;
  businessAddress?: string;
  channelInfo?: Record<string, unknown>;
  notes?: string;
};

/** One entry of a partner's status history, with the reason (#060). */
export type PartnerStatusChange = {
  id: number;
  partnerId: number;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  changedByAdminId: number | null;
  createdAt: string;
};

/** Contract details and per-partner deposit limits (#061). */
export type UpdatePartnerProfileByAdminPayload = {
  contractInfo?: { label: string; value: string }[];
  depositMinVnd?: number | null;
  depositMaxVnd?: number | null;
};

/** Link and code performance over the last 30 days (#061). */
export type PartnerPerformance = {
  partnerType: string;
  links: {
    id: number;
    code: string;
    label: string | null;
    clicks: number;
    orders: number;
    commissionVnd: number;
    refundedOrders: number;
    refundRatePercent: number;
  }[];
  coupons: {
    code: string;
    orders: number;
    commissionVnd: number;
    refundedOrders: number;
    refundRatePercent: number;
  }[];
  distribution: {
    revenueVnd: number;
    orders: number;
    refundedOrders: number;
    refundRatePercent: number;
  } | null;
};

/**
 * The five figures at the head of "Hoa hồng & Đối soát" (#063).
 *
 * Five stages of the same money; the partner count beside each is what turns a
 * total into something an admin can act on.
 */
export type CommissionSummary = {
  pendingConfirmation: { totalVnd: number; partners: number };
  approvedAwaitingPayout: { totalVnd: number; partners: number };
  payoutRequested: { totalVnd: number; partners: number };
  paidThisMonth: { totalVnd: number; partners: number };
  reversed: { totalVnd: number; partners: number };
};

/** Filters on "Hoa hồng & Đối soát" (#064). */
export type CommissionFilters = {
  page?: number;
  limit?: number;
  partnerId?: number;
  /** all | pending (chờ xác nhận) | reviewing (đang kiểm tra) | credited (đã duyệt) */
  status?: string;
  search?: string;
  /** Reconciliation period as `YYYY-MM`. */
  period?: string;
  from?: string;
  to?: string;
};

/** One partner's month on the reconciliation list (#065). */
export type ReconciliationRow = {
  partnerId: number;
  contactName: string | null;
  contactEmail: string | null;
  validOrders: number;
  esimsSold: number;
  /** Share of completed orders that arrived through a discount code. */
  viaCouponPercent: number;
  revenueVnd: number;
  commissionVnd: number;
  /** pending (chờ xác nhận) | reviewing (đang kiểm tra) | approved (đã duyệt) */
  status: string;
  note: string | null;
};

export type ReconciliationList = { period: string; rows: ReconciliationRow[] };

export type SetReconciliationStatusPayload = {
  partnerIds: number[];
  period: string;
  status: string;
  note?: string;
};

/** The four figures at the head of "Tài chính" (#067). */
export type PayoutSummary = {
  payoutRequested: { totalVnd: number; partners: number };
  paidThisMonth: { totalVnd: number; partners: number };
  paidAllTime: { totalVnd: number; partners: number };
  distributionDeposit: { totalVnd: number; partners: number };
};

/** A withdrawal request with the partner and the account behind it (#069). */
export type AdminPayoutRow = {
  id: number;
  partnerId: number;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  partnerType: string | null;
  amountVnd: number;
  status: string;
  /** On a refusal this is the reason, which the partner also sees. */
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
  /** The month the request was made, as `YYYY-MM`. */
  period: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  bankBranch: string | null;
  bankAccountLast4: string | null;
  bankAccountInfo: string | null;
};

export type AdminPayoutList = { data: AdminPayoutRow[]; totalCount: number };

export type PayoutFilters = {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type BulkPayoutDecisionPayload = {
  ids: number[];
  decision: 'approve' | 'reject';
  adminNote?: string;
};

/** One line of an order, on either tab of "Đơn hàng đối tác" (#071). */
export type PartnerOrderItem = {
  planName: string | null;
  quantity: number;
  vndPrice: number;
};

/** A marketing partner's attributed order, as the admin sees it (#071). */
export type AdminMarketingOrderRow = {
  orderNumber: string;
  partnerId: number;
  partnerName: string | null;
  status: string;
  vndPrice: number;
  grossVndPrice: number;
  refundedVnd: number;
  createdAt: string;
  commissionVnd: number | null;
  commissionPercent: number | null;
  commissionStatus: string | null;
  linkCode: string | null;
  couponCode: string | null;
  customerType: 'new' | 'returning';
  esimCount: number;
  items: PartnerOrderItem[];
  validity: string;
  invalidReason: string | null;
};

/** A distribution partner's own purchase, as the admin sees it (#071). */
export type AdminDistributionOrderRow = {
  orderNumber: string;
  partnerId: number;
  partnerName: string | null;
  status: string;
  orderType: string | null;
  paidVnd: number;
  listVnd: number;
  refundedVnd: number;
  esimCount: number;
  createdAt: string;
  items: PartnerOrderItem[];
};

export type PartnerOption = { id: number; name: string; email: string | null };

export type PartnerOrderFilters = {
  partnerType?: string;
  partnerId?: number;
  search?: string;
  status?: string;
  limit?: number;
};

/** The partner programme's settings (#075, #076, #077). */
export type PartnerProgramSettings = {
  payoutMinKolVnd: number;
  payoutMinDistributionVnd: number;
  depositMinKolVnd: number;
  depositMinDistributionVnd: number;
  /** Below this, a distribution partner is nudged to top up (#077). */
  lowDepositWarningVnd: number;
  reconciliationEmailEnabled: boolean;
  /** Day of month N+1 the statement for month N goes out (#076). */
  reconciliationEmailDayOfMonth: number;
};

export type UpdateProgramSettingsPayload = Partial<PartnerProgramSettings>;

/** An announcement an admin sent to partners (#079). */
export type PartnerNotification = {
  id: number;
  title: string;
  body: string;
  /** all | kol | distribution */
  audience: string;
  sendEmail: boolean;
  /** How many emails actually went out — not the size of the audience. */
  emailsSent: number;
  recipients: number;
  readCount: number;
  createdAt: string;
};

export type CreateNotificationPayload = {
  title: string;
  body: string;
  audience?: string;
  sendEmail?: boolean;
};
