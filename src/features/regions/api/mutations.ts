import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createRegion, updateRegion, deleteRegion } from './service';
import { regionKeys } from './queries';
import type { CreateRegionPayload, UpdateRegionPayload } from './types';

const invalidateRegions = () => {
  getQueryClient().invalidateQueries({ queryKey: regionKeys.all });
};

export const createRegionMutation = mutationOptions({
  mutationFn: (data: CreateRegionPayload) => createRegion(data),
  onSettled: invalidateRegions
});

export const updateRegionMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateRegionPayload }) =>
    updateRegion(id, values),
  onSettled: invalidateRegions
});

export const deleteRegionMutation = mutationOptions({
  mutationFn: (id: number) => deleteRegion(id),
  onSettled: invalidateRegions
});
