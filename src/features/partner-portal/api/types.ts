export type PartnerType = 'distribution' | 'kol';
export type PartnerLegalType = 'individual' | 'company';
export type PartnerStatus = 'pending' | 'active' | 'hold' | 'disabled' | 'rejected';

export type MyPartner = {
  /** Admin ticked this partner as allowed to name their own link code (#014). */
  canCustomLinkCode?: boolean;
  id: number;
  userId: number;
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
  /**
   * Ticked by an admin: this distribution partner may also run the affiliate
   * programme, which is what puts the four marketing menus in their portal
   * (#048).
   */
  canAffiliate?: boolean;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  /** Saved payout account; each withdrawal snapshots it at request time. */
  brandInfo: Record<string, unknown> | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  bankBranch: string | null;
};

export type UpdateMyProfilePayload = {
  contactName?: string;
  contactPhone?: string;
  companyName?: string;
  taxCode?: string;
  businessAddress?: string;
  channelInfo?: Record<string, unknown>;
  brandInfo?: Record<string, unknown>;
  // Bank details are not here: changing them needs the emailed code (#005).
};

export type BankAccountChangePayload = {
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  bankBranch?: string;
};

export type BankAccountChangeRequested = {
  /** Masked address the code went to, e.g. `th****@esim.vn`. */
  sentTo: string;
  expiresAt: string;
};

export type MyWalletSummary = {
  balanceVnd: number;
  availableBalanceVnd: number;
  pendingPayoutVnd: number;
  /** Commission clawed back after payout, netted off the next period (#007). */
  carriedDebtVnd?: number;
  /** Lifetime paid out and how many payments that was (#029). */
  withdrawnVnd?: number;
  payoutCount?: number;
  status: 'active' | 'locked';
  /**
   * The rules the top-up form has to state, from the server (#047), so the
   * screen and the validation cannot drift apart.
   */
  topupPolicy?: {
    minVnd: number;
    maxVnd: number;
    /** Taken out of a card top-up: send 100.000đ, 94.000đ is credited. */
    cardFeePercent: number;
  };
  /**
   * Below this the screen nudges the partner to top up (#077). A warning,
   * never a block: running out mid-order is what it exists to prevent.
   */
  lowDepositWarningVnd?: number;
};

export type MyWalletTransaction = {
  id: number;
  type: string;
  amountVnd: number;
  balanceAfterVnd: number;
  orderId: number | null;
  reason: string | null;
  createdAt: string;
};

export type PartnerTopupMethod = 'bank_transfer' | 'card';

export type MyDepositRequest = {
  id: number;
  amountVnd: number;
  /** How the partner paid (#047). Older rows predate the choice. */
  method?: PartnerTopupMethod;
  /** OnePay's fee on a card top-up; zero for a transfer. */
  feeVnd?: number;
  /** What actually reached the wallet: amount less fee. */
  creditedVnd?: number | null;
  bankTransferCode: string;
  qrUrl?: string;
  accountNumber?: string;
  accountName?: string;
  bankCode?: string;
  /** Where to send the partner to pay by card (#047). */
  paymentUrl?: string;
  paymentRef?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
};

export type CreateDepositRequestPayload = {
  amountVnd: number;
  method?: PartnerTopupMethod;
};

export type MyLink = {
  id: number;
  code: string;
  label: string;
  targetPath: string | null;
  status: 'active' | 'inactive';
  clickCount: number;
  conversionCount: number;
  totalCommissionVnd: number;
  createdAt: string;
  /** Set when the link was deleted — it then shows as "Đã xóa" (#054). */
  deletedAt?: string | null;
};

export type CreateLinkPayload = { label: string; targetPath?: string };
export type UpdateLinkPayload = {
  label?: string;
  targetPath?: string;
  isActive?: boolean;
};

export type MyCommission = {
  id: number;
  orderId: number;
  linkId: number | null;
  commissionVnd: number;
  tierSnapshot: string | null;
  status: 'pending' | 'credited' | 'reversed';
  createdAt: string;
};

export type MyPayout = {
  id: number;
  amountVnd: number;
  bankAccountInfo: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  /** On a refusal, the reason the admin gave — the partner reads it here (#069). */
  adminNote: string | null;
  createdAt: string;
};

export type CreatePayoutPayload = {
  amountVnd: number;
  bankAccountInfo?: string;
};

export type PartnerApplyPayload = {
  partnerType: PartnerType;
  legalType: PartnerLegalType;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  password: string;
  companyName?: string;
  taxCode?: string;
  businessAddress?: string;
  channelInfo?: Record<string, unknown>;
  notes?: string;
};

export type PartnerTier = {
  id: number;
  partnerType: PartnerType;
  tierCode: string;
  tierName: string;
  minVolumeVnd: string | number;
  commissionPercent: string | number;
  maxDiscountPercent: string | number;
  /** Days a click keeps earning this tier the order (#037). */
  attributionDays?: string | number | null;
  sortOrder: number;
  isActive: boolean;
};

/** Read model behind the portal overview screen. */
export type MySummary = {
  /** Window the performance figures cover (#010). */
  range?: { from: string; to: string };
  performance: {
    clicks: number;
    orders: number;
    revenueVnd: number;
    commissionVnd: number;
  };
  lifetime: {
    clicks: number;
    orders: number;
    revenueVnd: number;
    commissionVnd: number;
  };
  /** Buyers in the window, split by whether esim.vn had seen them before (#011). */
  customers?: { newCount: number; returningCount: number };
  commissionPendingVnd: number;
  /** This month so far vs the same days of last month (#008). */
  monthOverMonth?: {
    commissionVnd: number;
    previousCommissionVnd: number;
    commissionGrowthPercent: number;
  };
  wallet: MyWalletSummary;
  tier: {
    current: PartnerTier | null;
    next: PartnerTier | null;
    /**
     * When the current tier took effect (#042). Orders placed before it keep
     * the rate of the tier that was in force then — nothing is recalculated
     * backwards.
     */
    effectiveFrom?: string | null;
    toNextTierVnd: number;
    progressPercent: number;
  };
};

/** One row of "điểm đến mua nhiều" on the partner dashboard (#012). */
export type MyTopDestination = {
  name: string;
  plansPurchased: number;
  revenueVnd: number;
};

export type MyOrderItem = {
  planName: string;
  quantity: number;
  /** Line price and whether this product was refunded (#023). */
  vndPrice?: number;
  refunded?: boolean;
};

export type MyOrder = {
  orderNumber: string;
  status: string;
  /** Revenue after refunds — what the order is worth now (#018). */
  vndPrice: number;
  grossVndPrice?: number;
  refundedVnd?: number;
  createdAt: string;
  commissionVnd: number | null;
  commissionStatus: 'pending' | 'credited' | 'reversed' | null;
  linkCode: string | null;
  /** Rate this order paid, read back from the money (#026). */
  commissionPercent?: number | null;
  /** Discount code the order came in on, when it was not a link (#024). */
  couponCode?: string | null;
  /** Whether esim.vn had seen this buyer before this order (#021). */
  customerType?: 'new' | 'returning';
  esimCount: number;
  items: MyOrderItem[];
};

export type MyTicket = {
  id: number;
  /**
   * `HT-000123` — the same reference that appears in the subject line of the
   * support emails, so a partner can match the portal against their inbox (#060).
   */
  ticketNumber: string | null;
  customerEmail: string;
  subject: string;
  description: string;
  orderId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateTicketPayload = {
  customerEmail: string;
  subject: string;
  description: string;
  orderId?: string;
};

/** A discount a partner funds out of their own commission (#028). */
export type CreateCouponPayload = {
  code: string;
  discountPercent: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  expiresAt?: string;
  maxUsage?: number;
  maxUsagePerUser?: number;
};

export type MyCoupon = {
  id: number;
  code: string;
  discountPercent: number;
  usageCount: number;
  maxUsage: number | null;
  expiresAt: string | null;
  isActive: boolean;
  /** Paid orders of THIS partner that used the code. */
  myOrders: number;
  discountGivenVnd: number;
};

export type MyTierEvaluation = {
  id: number;
  evaluatedAt: string;
  revenueVnd: string | number;
  validOrders: number;
  tierBefore: string | null;
  tierAfter: string | null;
  result: 'promoted' | 'unchanged';
};

/** Branding a partner sets for their own portal page. */
export type PartnerBrandInfo = {
  displayName?: string;
  logoUrl?: string;
  tagline?: string;
};

/** One attributed order in full, with its attribution timeline (#026). */
export type MyOrderDetail = {
  orderNumber: string;
  status: string;
  createdAt: string;
  items: MyOrderItem[];
  revenueVnd: number;
  refundedVnd: number;
  commissionVnd: number | null;
  commissionPercent: number | null;
  commissionStatus: 'pending' | 'credited' | 'reversed' | null;
  source: { type: 'link' | 'coupon'; code: string | null };
  timeline: {
    clickedAt: string | null;
    placedAt: string;
    activatedAt: string | null;
    creditedAt: string | null;
    reversedAt: string | null;
  };
};

/** One message in a support ticket thread (#032). */
export type TicketMessage = {
  id: number;
  ticketId: number;
  authorRole: 'customer' | 'admin';
  authorName: string | null;
  body: string;
  attachments: string[] | null;
  createdAt: string;
};

/**
 * Dashboard figures for a distribution partner (#043).
 *
 * A different business from the marketing side: this partner buys the eSIMs and
 * resells them, so what matters is their own buying — orders, cancellations and
 * spend, split between eSIMs and top-ups — plus how many of the eSIMs they
 * bought have actually been switched on, because one that has not is stock.
 */
export type MyDistributionSummary = {
  range: { from: string; to: string };
  total: { orders: number; cancelledOrders: number; revenueVnd: number };
  esim: { orders: number; cancelledOrders: number; revenueVnd: number };
  topup: { orders: number; cancelledOrders: number; revenueVnd: number };
  activatedEsims: { count: number; revenueVnd: number };
};

/** One bucket of the distribution partner's chart (#045). */
export type MyDistributionSeriesPoint = {
  /** Start of the bucket, as an ISO timestamp. */
  bucket: string;
  orders: number;
  activatedEsims: number;
};

/**
 * One eSIM in a distribution partner's stock (#046).
 *
 * A marketing partner never holds stock, so this has no equivalent on that
 * side: they never touch the eSIM at all.
 */
export type MyEsim = {
  iccid: string | null;
  status: string | null;
  planName: string | null;
  destination: string | null;
  orderNumber: string | null;
  /** What this one eSIM cost, the line total spread over the line. */
  costVnd: number;
  dataUsed: number | null;
  dataTotal: number | null;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string | null;
};

/** An order the distribution partner placed themselves (#046). */
export type MyPurchase = {
  orderNumber: string;
  status: string;
  orderType: string | null;
  paidVnd: number;
  /** Before any discount, so the page can show the margin. */
  listVnd: number;
  refundedVnd: number;
  /** Doanh thu bán ra theo giá niêm yết esim.vn (chốt 02/10/2026, phương án a). */
  listPriceVnd: number;
  /** Giá vốn thật đã trừ ví, đã trừ phần hoàn lại. */
  walletCostVnd: number;
  /** Doanh thu bán ra − giá vốn đã trừ ví. Âm là có thật, đừng kẹp về 0. */
  marginVnd: number;
  esimCount: number;
  createdAt: string;
  items: { planName: string | null; quantity: number; vndPrice: number }[];
};

/** Một dòng trong bảng giá đối tác phân phối (#046). */
export type CataloguePlan = {
  id: number;
  name: string;
  slug: string;
  destinationName: string | null;
  durationDays: number;
  dataMb: number;
  /** Giá niêm yết esim.vn. */
  listPriceVnd: number;
  /** Giá đối tác phải trả: giá vốn + % cộng thêm của hạng. */
  unitPriceVnd: number;
  marginVnd: number;
  /** false khi gói chưa có giá vốn — hiện nhưng không bấm mua được. */
  purchasable: boolean;
};

export type PartnerCatalogue = {
  /** % cộng vào giá vốn theo hạng đang giữ. */
  markupPercent: number;
  plans: CataloguePlan[];
};

/** Báo giá một lần mua, tính trước khi bấm (#046). */
export type PurchaseQuote = {
  quantity: number;
  unitPriceVnd: number;
  totalVnd: number;
  listUnitPriceVnd: number;
  listTotalVnd: number;
  marginVnd: number;
  marginPercent: number;
  /** Câu tiếng Việt vì sao chưa mua được, hoặc null khi mua được. */
  rejection: string | null;
};

export type CreatePurchasePayload = { planId: number; quantity: number };

/** Một phiếu đối tác báo eSIM lỗi (#046, A4 — admin duyệt tay mới hoàn tiền). */
export type EsimFaultReport = {
  id: number;
  orderNumber: string;
  iccid: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  refundVnd: number;
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type ReportEsimFaultPayload = {
  orderNumber: string;
  iccid: string;
  reason: string;
};

export type PurchaseResult = {
  orderNumber: string;
  status: string;
  quantity: number;
  unitPriceVnd: number;
  totalVnd: number;
  listPriceVnd: number;
  marginVnd: number;
  esimCount: number;
};

/** An announcement from esim.vn, as this partner sees it (#079). */
export type MyNotification = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
};

export type MyNotificationList = { unreadCount: number; data: MyNotification[] };
