import { apiClient } from '@/lib/api-client';
import type {
  Coupon,
  CouponFilters,
  CouponsResponse,
  CreateCouponPayload,
  UpdateCouponPayload
} from './types';

export async function getCoupons(filters: CouponFilters): Promise<CouponsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);

  const query = params.toString();
  return apiClient<CouponsResponse>(`/coupons${query ? `?${query}` : ''}`);
}

export async function getCoupon(id: number): Promise<Coupon> {
  return apiClient<Coupon>(`/coupons/${id}`);
}

export async function createCoupon(data: CreateCouponPayload): Promise<Coupon> {
  return apiClient<Coupon>('/coupons', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateCoupon(id: number, data: UpdateCouponPayload): Promise<Coupon> {
  return apiClient<Coupon>(`/coupons/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteCoupon(id: number): Promise<void> {
  await apiClient(`/coupons/${id}`, {
    method: 'DELETE'
  });
}
