/** Affiliate behind an order, and what it earned them (#095). */
export type OrderPartnerCommission = {
  partnerId: number;
  partnerName?: string | null;
  partnerStatus?: string | null;
  /** Referral link the buyer arrived through, when there was one. */
  linkCode?: string | null;
  commissionVnd: number;
  /** Share of the order value, derived by the API. */
  commissionPercent: number;
  status: string;
  /** Why a `rejected` commission earned nothing — a self-referral code (#041). */
  rejectionReason?: string | null;
  tierSnapshot?: string | null;
};
export type OrderUser = {
  id: number;
  email: string;
  provider?: string;
  socialId?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  photo?: { id: string; path: string } | null;
  role?: { id: number; name: string };
  status?: { id: number; name: string };
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type OrderDevice = {
  type: 'desktop' | 'mobile' | 'tablet' | null;
  browser: string | null;
  os: string | null;
};

export type Order = {
  id: number;
  userId: number;
  user: OrderUser;
  userEmail?: string;
  orderNumber: string;
  /** Device the order was placed from; null for CMS and older orders (doitac-1410 #082). */
  device?: OrderDevice | null;
  status: string;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentId: string;
  couponCode: string | null;
  referralCode?: string | null;
  /** Set when the order came through an affiliate (#095). */
  partnerCommission?: OrderPartnerCommission | null;
  /** Same device or network as another order for this partner (#036). */
  attributionWarning?: string | null;
  referralDiscountVndAmount?: number | null;
  discountAmount: number;
  vndPrice: number;
  vndCostPrice: number;
  couponDiscountVndAmount: number;
  walletSpentVndAmount: number | null;
  /** Cash paid — the same meaning on every kind of order. */
  payableVndPrice?: number | null;
  refundedAmountVnd?: number | null;
  cashbackAmountVnd: number | null;
  hasInvoice?: boolean;
  isInvoice?: boolean;
  itemCount?: number;
  totalQuantity?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type OrderCoupon = {
  id: number;
  code: string;
  discountPercent: number;
  maxUsage: number;
  maxUsagePerUser: number;
  usageCount: number;
  minOrderAmount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type PlanLocationInfo = {
  type: 'DESTINATION' | 'REGION';
  locationCode: string | null;
  slug: string;
  title: string | null;
  titleVi: string | null;
  thumbnailUrl: string | null;
};

export type OrderItemPlan = {
  id: number;
  name: string;
  slug: string;
  durationDays: number;
  dataMb: number;
  /** Call minutes / SMS included; both null on a data-only plan (#008). */
  call?: number | null;
  sms?: number | null;
  price: number;
  vndPrice: number;
  currency: string;
  speed: string;
  /** Throttled speed after the high-speed allowance runs out. */
  fupSpeed?: string | null;
  operatorName: string;
  countryCode: string;
  provider: string;
  locationInfo?: PlanLocationInfo | null;
  /**
   * Whether its eSIMs can be refunded (doitac-1410 #080): set by hand, else by
   * the rule. Refundable eSIMs are the roaming ones.
   */
  isRefundable?: boolean;
  /** Exit IP country the supplier states, "SG", "HK"… (doitac-1410 #081). */
  ipExport?: string | null;
  topUp?: boolean;
};

export type OrderItemEsim = {
  id: number;
  orderItemId: number;
  userId: number;
  planId: number;
  iccid: string;
  smdpAddress: string;
  activationCode: string;
  lpa: string;
  matchId: string;
  qrcode: string;
  directAppleInstallationUrl: string;
  apnValue: string;
  isRoaming: boolean;
  status: string;
  dataUsed: string;
  dataTotal: string;
  expiresAt: string | null;
  activatedAt: string | null;
  esimTranNo: string;
  provider: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type OrderItem = {
  id: number;
  planId: number;
  plan: OrderItemPlan;
  referralCode: string;
  orderRequestId: string;
  providerOrderId: string;
  providerOrderCode: string;
  /**
   * The supplier has not taken this line yet (vande #003): its last refusal,
   * how many tries, and when the system tries again (null = no more automatic
   * tries; use "Gọi lại API lấy eSIM" or refund).
   */
  provisioning?: {
    attempts: number;
    lastError: string | null;
    lastAttemptAt: string | null;
    nextAutoRetryAt: string | null;
  } | null;
  status: string;
  price: number;
  currency: string;
  quantity: number;
  /** Days the customer picked for a day pass; null for fixed plans (vande #006). */
  periodNum?: number | null;
  vndPrice: number;
  vndCostPrice: number;
  /** This line's share of the order discount, by price (#009). */
  discountShareVnd?: number;
  /** Line price after its discount share — what refunding it pays back. */
  netVndPrice?: number;
  esims: OrderItemEsim[];
  createdAt: string;
  updatedAt: string;
};

/** The eSIM a topup was applied to, for reconciling the result (#015). */
export type TopupTargetEsim = {
  id: number;
  iccid: string;
  status: string;
  provider: string | null;
  planName: string | null;
  dataUsed: string | null;
  dataTotal: string | null;
  expiresAt: string | null;
  activatedAt: string | null;
  originalOrderId: number | null;
  /** Shown and linked instead of the id (#021). */
  originalOrderNumber?: string | null;
};

/** A topup order in full; null on an ordinary order (#015). */
export type OrderTopupDetail = {
  targetIccid: string;
  provider: string | null;
  packageId: string | null;
  packageName: string | null;
  dataText: string | null;
  durationDays: number | null;
  isUnlimited: boolean;
  targetEsim: TopupTargetEsim | null;
};

export type AdminOrderInvoice = {
  id: string;
  status: InvoiceStatus;
  companyName: string;
  taxCode: string;
  address: string;
  invoicePhone: string;
  invoiceEmail: string;
  createdAt: string;
  updatedAt: string;
};

/** An order's money before and after its refunds (#009, test round 4). */
export type OrderAfterRefund = {
  originalOrderValueVnd: number;
  orderValueVnd: number;
  originalVndCostPrice: number;
  vndCostPrice: number;
  originalTotalAmount: number;
  totalAmount: number;
  refundedVnd: number;
  refundedToWalletVnd: number;
  refundedDirectVnd: number;
  originalCashbackVnd: number;
  cashbackVnd: number;
  originalCommissionVnd?: number | null;
  commissionVnd?: number | null;
};

export type OrderDetail = Order & {
  afterRefund?: OrderAfterRefund;
  /** Admin notes, newest first (doitac-1410 #067). */
  notes?: OrderNote[];
  /** Every refund with its reason and admin note (doitac-1410 #067). */
  refunds?: OrderRefundRecord[];
  coupon: OrderCoupon | null;
  items: OrderItem[];
  invoice: AdminOrderInvoice | null;
  orderType?: string;
  /** Present only on a topup order (#015). */
  topup?: OrderTopupDetail | null;
};

export type OrderFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
};

export type OrdersResponse = {
  data: Order[];
  hasNextPage: boolean;
  totalCount: number;
};

// Refund types
export type RefundMode = 'wallet' | 'direct_bank';

export type RefundOrderRequest = {
  mode: RefundMode;
  amountVnd: number;
  reason?: string;
  adminNote?: string;
  /**
   * Refund only these order items. Omit to refund the whole order.
   * Only the selected items are cancelled with their supplier.
   */
  orderItemIds?: number[];
  /**
   * Refund single eSIMs (ICCIDs) of a line bought in several copies (#008,
   * test round 4). Each counts at its line's unit price.
   */
  esimIds?: number[];
  /** Also ask Airalo to refund its eSIMs, for this reason (doitac-1410 #079). */
  airaloRefundReason?: string;
};

export type OrderRefundResponse = {
  /** Suppliers that refused to cancel the refunded eSIMs (v3 #002). */
  supplierWarnings?: string[];
  /** Refund requests sent to suppliers, e.g. Airalo (doitac-1410 #079). */
  supplierRequests?: string[];
  id: number;
  orderId: number;
  userId: number;
  mode: RefundMode;
  amountVnd: number;
  status: 'completed' | 'cancelled';
  reason: string | null;
  adminNote: string | null;
  walletTransactionId: number | null;
  createdByAdminId: number;
  createdAt: string;
};

// Resend eSIM email
export type ResendEsimEmailSkipReason =
  | 'buyer-has-no-email'
  | 'no-order-items'
  | 'no-esims-provisioned-yet';

export type ResendEsimEmailResponse = {
  sent: number;
  skippedReason?: ResendEsimEmailSkipReason | null;
};

// Invoice
export type InvoiceStatus = 'PENDING' | 'ISSUED' | 'FAILED';

export type CreateInvoiceForOrderPayload = {
  companyName: string;
  taxCode: string;
  address: string;
  invoicePhone: string;
  invoiceEmail: string;
};

export type Invoice = {
  id: string;
  status: InvoiceStatus;
  companyName: string;
  taxCode: string;
  address: string;
  invoicePhone: string;
  invoiceEmail: string;
  orderId: number;
  order?: Order;
  createdAt: string;
  updatedAt: string;
};

// Manual order
export type SubmitManualOrderPayload = {
  email: string;
  /** Used only when the email has no account yet — the backend creates one (#041). */
  customerName?: string;
  packageCode?: string;
  slug?: string;
  quantity?: number;
  /** Several plans at once, each with its quantity (#031). */
  items?: { packageCode: string; slug: string; quantity: number }[];
};

/** An order file read for "Đặt đơn hộ khách", each row with its plan (doitac-1410 #084). */
export type ManualOrderFilePreview = {
  lines: {
    row: number;
    slug: string;
    quantity: number;
    plan: { id: number; slug: string; packageCode: string; label: string } | null;
    error: string | null;
  }[];
  errorCount: number;
};

/** "Ghi chú" an admin keeps on an order (doitac-1410 #067). */
export type OrderNote = { id: number; body: string; createdAt: string; by: string };

/** One refund of an order, with what the admin wrote (doitac-1410 #067). */
export type OrderRefundRecord = {
  id: number;
  createdAt: string;
  /** wallet | direct_bank */
  mode: string;
  amountVnd: number;
  esimCount: number | null;
  reason: string | null;
  adminNote: string | null;
  by: string | null;
};
