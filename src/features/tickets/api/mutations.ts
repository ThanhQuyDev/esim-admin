import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { deleteTicket, replyToTicket, updateTicketStatus } from './service';
import { ticketKeys } from './queries';
import type { UpdateTicketStatusPayload } from './types';

const invalidate = () => {
  getQueryClient().invalidateQueries({ queryKey: ticketKeys.all });
};

export const updateTicketStatusMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateTicketStatusPayload }) =>
    updateTicketStatus(id, values),
  onSettled: invalidate
});

export const deleteTicketMutation = mutationOptions({
  mutationFn: (id: number) => deleteTicket(id),
  onSettled: invalidate
});

/**
 * Post an admin reply (#059). The backend emails it to the customer, so this is
 * the trigger for the email as well as for the thread.
 */
export const replyToTicketMutation = mutationOptions({
  mutationFn: ({ id, body }: { id: number; body: string }) => replyToTicket(id, body),
  onSettled: invalidate
});
