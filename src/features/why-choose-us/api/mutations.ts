import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createWhyChooseUs, updateWhyChooseUs, deleteWhyChooseUs } from './service';
import { wcuKeys } from './queries';
import type { CreateWhyChooseUsPayload, UpdateWhyChooseUsPayload } from './types';

const invalidate = () => {
  getQueryClient().invalidateQueries({ queryKey: wcuKeys.all });
};

export const createWcuMutation = mutationOptions({
  mutationFn: (data: CreateWhyChooseUsPayload) => createWhyChooseUs(data),
  onSettled: invalidate
});

export const updateWcuMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateWhyChooseUsPayload }) =>
    updateWhyChooseUs(id, values),
  onSettled: invalidate
});

export const deleteWcuMutation = mutationOptions({
  mutationFn: (id: number) => deleteWhyChooseUs(id),
  onSettled: invalidate
});
