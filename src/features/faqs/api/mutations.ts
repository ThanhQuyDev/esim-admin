import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createFaq, updateFaq, deleteFaq } from './service';
import { faqKeys } from './queries';
import type { CreateFaqPayload, UpdateFaqPayload } from './types';

const invalidate = () => {
  getQueryClient().invalidateQueries({ queryKey: faqKeys.all });
};

export const createFaqMutation = mutationOptions({
  mutationFn: (data: CreateFaqPayload) => createFaq(data),
  onSettled: invalidate
});

export const updateFaqMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateFaqPayload }) => updateFaq(id, values),
  onSettled: invalidate
});

export const deleteFaqMutation = mutationOptions({
  mutationFn: (id: number) => deleteFaq(id),
  onSettled: invalidate
});
