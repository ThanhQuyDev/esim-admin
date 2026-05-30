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

export type Order = {
  id: number;
  userId: number;
  user: OrderUser;
  userEmail?: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentId: string;
  couponCode: string | null;
  referralCode?: string | null;
  referralDiscountVndAmount?: number | null;
  discountAmount: number;
  vndPrice: number;
  vndCostPrice: number;
  walletSpentVndAmount: number | null;
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
  price: number;
  vndPrice: number;
  currency: string;
  speed: string;
  operatorName: string;
  countryCode: string;
  provider: string;
  locationInfo?: PlanLocationInfo | null;
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
  status: string;
  price: number;
  currency: string;
  quantity: number;
  vndPrice: number;
  vndCostPrice: number;
  esims: OrderItemEsim[];
  createdAt: string;
  updatedAt: string;
};

export type AdminOrderInvoice = {
  id: string;
  status: InvoiceStatus;
  companyName: string;
  taxCode: string;
  address: string;
  invoiceEmail: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderDetail = Order & {
  coupon: OrderCoupon | null;
  items: OrderItem[];
  invoice: AdminOrderInvoice | null;
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
};

export type OrderRefundResponse = {
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
  invoiceEmail: string;
};

export type Invoice = {
  id: string;
  status: InvoiceStatus;
  companyName: string;
  taxCode: string;
  address: string;
  invoiceEmail: string;
  orderId: number;
  order?: Order;
  createdAt: string;
  updatedAt: string;
};

// Manual order
export type SubmitManualOrderPayload = {
  email: string;
  packageCode: string;
  slug: string;
  quantity: number;
};
