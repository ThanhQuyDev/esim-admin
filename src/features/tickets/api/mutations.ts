import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { deleteTicket, updateTicketStatus } from './service';
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
