import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createFooter, updateFooter, deleteFooter } from './service';
import { footerKeys } from './queries';
import type { CreateFooterPayload, UpdateFooterPayload } from './types';

const invalidate = () => {
  getQueryClient().invalidateQueries({ queryKey: footerKeys.all });
};

export const createFooterMutation = mutationOptions({
  mutationFn: (data: CreateFooterPayload) => createFooter(data),
  onSettled: invalidate
});

export const updateFooterMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: string; values: UpdateFooterPayload }) =>
    updateFooter(id, values),
  onSettled: invalidate
});

export const deleteFooterMutation = mutationOptions({
  mutationFn: (id: string) => deleteFooter(id),
  onSettled: invalidate
});
