import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createMiniTag, updateMiniTag, deleteMiniTag } from './service';
import { miniTagKeys } from './queries';
import type { CreateMiniTagPayload, UpdateMiniTagPayload } from './types';

const invalidateMiniTags = () => {
  getQueryClient().invalidateQueries({ queryKey: miniTagKeys.all });
};

export const createMiniTagMutation = mutationOptions({
  mutationFn: (data: CreateMiniTagPayload) => createMiniTag(data),
  onSettled: invalidateMiniTags
});

export const updateMiniTagMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateMiniTagPayload }) =>
    updateMiniTag(id, values),
  onSettled: invalidateMiniTags
});

export const deleteMiniTagMutation = mutationOptions({
  mutationFn: (id: number) => deleteMiniTag(id),
  onSettled: invalidateMiniTags
});
