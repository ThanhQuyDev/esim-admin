export type Coupon = {
  id: number;
  code: string;
  discountPercent: number;
  maxUsage: number;
  maxUsagePerUser: number;
  minOrderAmount: number;
  expiresAt: string;
  isActive: boolean;
  isPopular: boolean;
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
  maxUsage: number;
  maxUsagePerUser: number;
  minOrderAmount: number;
  expiresAt: string;
  isActive?: boolean;
  isPopular?: boolean;
};

export type UpdateCouponPayload = {
  code?: string;
  discountPercent?: number;
  maxUsage?: number;
  maxUsagePerUser?: number;
  minOrderAmount?: number;
  expiresAt?: string;
  isActive?: boolean;
  isPopular?: boolean;
};
