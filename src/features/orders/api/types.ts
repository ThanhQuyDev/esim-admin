export type OrderUser = {
  id: number;
  email: string;
  provider?: string;
  socialId?: string;
  firstName: string;
  lastName: string;
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
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentId: string;
  couponCode: string | null;
  discountAmount: number;
  vndPrice: number;
  vndCostPrice: number;
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

export type OrderDetail = Order & {
  coupon: OrderCoupon | null;
  items: OrderItem[];
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
};
