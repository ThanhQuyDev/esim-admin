import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createSeoConfig, updateSeoConfig, deleteSeoConfig } from './service';
import { seoConfigKeys } from './queries';
import type { CreateSeoConfigPayload, UpdateSeoConfigPayload } from './types';

const invalidateSeoConfigs = () => {
  getQueryClient().invalidateQueries({ queryKey: seoConfigKeys.all });
};

export const createSeoConfigMutation = mutationOptions({
  mutationFn: (data: CreateSeoConfigPayload) => createSeoConfig(data),
  onSettled: invalidateSeoConfigs
});

export const updateSeoConfigMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateSeoConfigPayload }) =>
    updateSeoConfig(id, values),
  onSettled: invalidateSeoConfigs
});

export const deleteSeoConfigMutation = mutationOptions({
  mutationFn: (id: number) => deleteSeoConfig(id),
  onSettled: invalidateSeoConfigs
});
