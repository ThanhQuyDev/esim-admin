import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createProfitMarginTier, updateProfitMarginTier, deleteProfitMarginTier } from './service';
import { profitMarginTierKeys } from './queries';
import type { CreateProfitMarginTierPayload, UpdateProfitMarginTierPayload } from './types';

const invalidate = () => {
  getQueryClient().invalidateQueries({ queryKey: profitMarginTierKeys.all });
};

export const createProfitMarginTierMutation = mutationOptions({
  mutationFn: (data: CreateProfitMarginTierPayload) => createProfitMarginTier(data),
  onSettled: invalidate
});

export const updateProfitMarginTierMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateProfitMarginTierPayload }) =>
    updateProfitMarginTier(id, values),
  onSettled: invalidate
});

export const deleteProfitMarginTierMutation = mutationOptions({
  mutationFn: (id: number) => deleteProfitMarginTier(id),
  onSettled: invalidate
});
