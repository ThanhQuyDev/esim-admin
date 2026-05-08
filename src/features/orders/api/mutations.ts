import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { refundOrder } from './service';
import { orderKeys } from './queries';
import type { RefundOrderRequest } from './types';

const invalidateOrders = () => {
  getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
};

export const refundOrderMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: RefundOrderRequest }) => refundOrder(id, data),
  onSettled: invalidateOrders
});
