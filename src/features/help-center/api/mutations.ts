import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createHelpCenterArticle,
  updateHelpCenterArticle,
  deleteHelpCenterArticle
} from './service';
import { helpCenterKeys } from './queries';
import type { CreateHelpCenterPayload, UpdateHelpCenterPayload } from './types';

const invalidate = () => {
  getQueryClient().invalidateQueries({ queryKey: helpCenterKeys.all });
};

export const createHelpCenterMutation = mutationOptions({
  mutationFn: (data: CreateHelpCenterPayload) => createHelpCenterArticle(data),
  onSettled: invalidate
});

export const updateHelpCenterMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: string; values: UpdateHelpCenterPayload }) =>
    updateHelpCenterArticle(id, values),
  onSettled: invalidate
});

export const deleteHelpCenterMutation = mutationOptions({
  mutationFn: (id: string) => deleteHelpCenterArticle(id),
  onSettled: invalidate
});
