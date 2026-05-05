import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createHeroBanner, updateHeroBanner, deleteHeroBanner } from './service';
import { heroBannerKeys } from './queries';
import type { CreateHeroBannerPayload, UpdateHeroBannerPayload } from './types';

const invalidate = () => {
  getQueryClient().invalidateQueries({ queryKey: heroBannerKeys.all });
};

export const createHeroBannerMutation = mutationOptions({
  mutationFn: (data: CreateHeroBannerPayload) => createHeroBanner(data),
  onSettled: invalidate
});

export const updateHeroBannerMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: string; values: UpdateHeroBannerPayload }) =>
    updateHeroBanner(id, values),
  onSettled: invalidate
});

export const deleteHeroBannerMutation = mutationOptions({
  mutationFn: (id: string) => deleteHeroBanner(id),
  onSettled: invalidate
});
