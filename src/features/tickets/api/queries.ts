import { queryOptions } from '@tanstack/react-query';
import { getOpenTicketCount, getTicketById, getTickets } from './service';
import type { Ticket, TicketFilters } from './types';

export type { Ticket };

export const ticketKeys = {
  all: ['tickets'] as const,
  list: (filters: TicketFilters) => [...ticketKeys.all, 'list', filters] as const,
  detail: (id: number) => [...ticketKeys.all, 'detail', id] as const,
  openCount: () => [...ticketKeys.all, 'open-count'] as const
};

export const ticketsQueryOptions = (filters: TicketFilters) =>
  queryOptions({
    queryKey: ticketKeys.list(filters),
    queryFn: () => getTickets(filters)
  });

export const ticketByIdQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ticketKeys.detail(id),
    queryFn: () => getTicketById(id)
  });

export const openTicketCountQueryOptions = queryOptions({
  queryKey: ticketKeys.openCount(),
  queryFn: () => getOpenTicketCount(),
  staleTime: 60_000
});
