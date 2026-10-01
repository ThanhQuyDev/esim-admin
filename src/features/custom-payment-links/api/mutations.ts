import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { confirmCustomPaymentLink, createCustomPaymentLink } from './service';
import { customPaymentLinkKeys } from './queries';
import type { CreateCustomPaymentLinkPayload } from './types';

export const createCustomPaymentLinkMutation = mutationOptions({
  mutationFn: (data: CreateCustomPaymentLinkPayload) => createCustomPaymentLink(data)
});

/** Admin confirms a pending link as paid or failed (#056). */
export const confirmCustomPaymentLinkMutation = mutationOptions({
  mutationFn: ({ id, isPaid }: { id: string; isPaid: boolean }) =>
    confirmCustomPaymentLink(id, isPaid),
  onSettled: () => {
    // The tab counts move with the status, so the whole list is refetched.
    void getQueryClient().invalidateQueries({ queryKey: customPaymentLinkKeys.all });
  }
});
