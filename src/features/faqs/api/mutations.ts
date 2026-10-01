import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createFaq, updateFaq, deleteFaq, bulkSetFaqsActive, bulkDeleteFaqs } from './service';
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

/** Bulk activate / deactivate from the list's row selection (#051). */
export const bulkSetFaqsActiveMutation = mutationOptions({
  mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
    bulkSetFaqsActive(ids, isActive),
  onSettled: invalidate
});

/** Bulk delete from the list's row selection (#051). */
export const bulkDeleteFaqsMutation = mutationOptions({
  mutationFn: (ids: string[]) => bulkDeleteFaqs(ids),
  onSettled: invalidate
});
