import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createCoupon, updateCoupon, deleteCoupon } from './service';
import { couponKeys } from './queries';
import type { CreateCouponPayload, UpdateCouponPayload } from './types';

const invalidateCoupons = () => {
  getQueryClient().invalidateQueries({ queryKey: couponKeys.all });
};

export const createCouponMutation = mutationOptions({
  mutationFn: (data: CreateCouponPayload) => createCoupon(data),
  onSettled: invalidateCoupons
});

export const updateCouponMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateCouponPayload }) =>
    updateCoupon(id, values),
  onSettled: invalidateCoupons
});

export const deleteCouponMutation = mutationOptions({
  mutationFn: (id: number) => deleteCoupon(id),
  onSettled: invalidateCoupons
});
