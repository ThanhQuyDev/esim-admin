export type CouponDiscountType = 'percent' | 'fixed';

export type Coupon = {
  id: number;
  code: string;
  discountPercent: number;
  /** 'percent' = % off, 'fixed' = a flat VND amount off (#082). */
  discountType: CouponDiscountType;
  /** Flat VND off, used when `discountType` is 'fixed'. */
  discountAmount: number;
  /** Ceiling for a percentage code — "15% off, up to 50k"; null = uncapped. */
  maxDiscountAmount: number | null;
  maxUsage: number;
  maxUsagePerUser: number;
  /** How many times the code has been redeemed (#083). */
  usageCount: number;
  minOrderAmount: number;
  expiresAt: string;
  isActive: boolean;
  isPopular: boolean;
  /** Listed on the cart page; a private code still works when typed in (#081). */
  isPublic: boolean;
  /** Partner (KOL) owning this code; null for house-wide coupons. */
  partnerId: number | null;
  /** Owner's contact name, joined by the API for display. */
  partnerName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CouponFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
};

export type CouponsResponse = {
  data: Coupon[];
  hasNextPage: boolean;
  totalCount: number;
};

export type CreateCouponPayload = {
  code: string;
  discountPercent: number;
  discountType?: CouponDiscountType;
  discountAmount?: number;
  maxDiscountAmount?: number | null;
  maxUsage: number;
  maxUsagePerUser: number;
  minOrderAmount: number;
  expiresAt: string;
  isActive?: boolean;
  isPopular?: boolean;
  isPublic?: boolean;
  partnerId?: number | null;
};

export type UpdateCouponPayload = {
  code?: string;
  discountPercent?: number;
  discountType?: CouponDiscountType;
  discountAmount?: number;
  maxDiscountAmount?: number | null;
  maxUsage?: number;
  maxUsagePerUser?: number;
  minOrderAmount?: number;
  expiresAt?: string;
  isActive?: boolean;
  isPopular?: boolean;
  isPublic?: boolean;
  partnerId?: number | null;
};
