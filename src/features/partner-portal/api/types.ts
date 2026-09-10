export type PartnerType = 'distribution' | 'kol';
export type PartnerLegalType = 'individual' | 'company';
export type PartnerStatus = 'pending' | 'active' | 'hold' | 'disabled' | 'rejected';

export type MyPartner = {
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
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  bankBranch?: string;
};

export type MyWalletSummary = {
  balanceVnd: number;
  availableBalanceVnd: number;
  pendingPayoutVnd: number;
  status: 'active' | 'locked';
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

export type MyDepositRequest = {
  id: number;
  amountVnd: number;
  bankTransferCode: string;
  qrUrl?: string;
  accountNumber?: string;
  accountName?: string;
  bankCode?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
};

export type CreateDepositRequestPayload = { amountVnd: number };

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
};

export type CreateLinkPayload = { label: string; targetPath?: string };
export type UpdateLinkPayload = { label?: string; targetPath?: string; isActive?: boolean };

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
  createdAt: string;
};

export type CreatePayoutPayload = { amountVnd: number; bankAccountInfo?: string };

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
  sortOrder: number;
  isActive: boolean;
};

/** Read model behind the portal overview screen. */
export type MySummary = {
  performance30d: {
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
  commissionPendingVnd: number;
  wallet: MyWalletSummary;
  tier: {
    current: PartnerTier | null;
    next: PartnerTier | null;
    toNextTierVnd: number;
    progressPercent: number;
  };
};

export type MyOrderItem = { planName: string; quantity: number };

export type MyOrder = {
  orderNumber: string;
  status: string;
  vndPrice: number;
  createdAt: string;
  commissionVnd: number | null;
  commissionStatus: 'pending' | 'credited' | 'reversed' | null;
  linkCode: string | null;
  esimCount: number;
  items: MyOrderItem[];
};

export type MyTicket = {
  id: number;
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
