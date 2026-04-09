import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createDestination, updateDestination, deleteDestination } from './service';
import { destinationKeys } from './queries';
import type { CreateDestinationPayload, UpdateDestinationPayload } from './types';

const invalidateDestinations = () => {
  getQueryClient().invalidateQueries({ queryKey: destinationKeys.all });
};

export const createDestinationMutation = mutationOptions({
  mutationFn: (data: CreateDestinationPayload) => createDestination(data),
  onSettled: invalidateDestinations
});

export const updateDestinationMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateDestinationPayload }) =>
    updateDestination(id, values),
  onSettled: invalidateDestinations
});

export const deleteDestinationMutation = mutationOptions({
  mutationFn: (id: number) => deleteDestination(id),
  onSettled: invalidateDestinations
});
