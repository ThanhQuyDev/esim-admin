import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { updateProfitMargin } from './service';
import { profitMarginKeys } from './queries';
import type { SaveProfitMarginPayload } from './types';

const invalidate = () => {
  getQueryClient().invalidateQueries({ queryKey: profitMarginKeys.all });
};

export const updateProfitMarginMutation = mutationOptions({
  mutationFn: (data: SaveProfitMarginPayload) => updateProfitMargin(data),
  onSettled: invalidate
});
