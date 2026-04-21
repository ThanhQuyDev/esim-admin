export type Coupon = {
  id: number;
  code: string;
  discountPercent: number;
  maxUsage: number;
  maxUsagePerUser: number;
  minOrderAmount: number;
  expiresAt: string;
  isActive: boolean;
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
};

export type CreateCouponPayload = {
  code: string;
  discountPercent: number;
  maxUsage: number;
  maxUsagePerUser: number;
  minOrderAmount: number;
  expiresAt: string;
  isActive?: boolean;
};

export type UpdateCouponPayload = {
  code?: string;
  discountPercent?: number;
  maxUsage?: number;
  maxUsagePerUser?: number;
  minOrderAmount?: number;
  expiresAt?: string;
  isActive?: boolean;
};
