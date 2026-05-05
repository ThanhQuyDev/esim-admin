import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createTopBar, updateTopBar, deleteTopBar } from './service';
import { topBarKeys } from './queries';
import type { CreateTopBarPayload, UpdateTopBarPayload } from './types';

const invalidate = () => {
  getQueryClient().invalidateQueries({ queryKey: topBarKeys.all });
};

export const createTopBarMutation = mutationOptions({
  mutationFn: (data: CreateTopBarPayload) => createTopBar(data),
  onSettled: invalidate
});

export const updateTopBarMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: string; values: UpdateTopBarPayload }) =>
    updateTopBar(id, values),
  onSettled: invalidate
});

export const deleteTopBarMutation = mutationOptions({
  mutationFn: (id: string) => deleteTopBar(id),
  onSettled: invalidate
});
