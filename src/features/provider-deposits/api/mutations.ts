import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createProviderDepositEntry,
  deleteProviderDepositEntry,
  updateProviderDepositEntry
} from './service';
import { providerDepositKeys } from './queries';
import type { CreateProviderDepositEntryPayload, UpdateProviderDepositEntryPayload } from './types';

const invalidate = () => {
  getQueryClient().invalidateQueries({ queryKey: providerDepositKeys.all });
};

export const createProviderDepositEntryMutation = mutationOptions({
  mutationFn: (data: CreateProviderDepositEntryPayload) => createProviderDepositEntry(data),
  onSettled: invalidate
});

export const updateProviderDepositEntryMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateProviderDepositEntryPayload }) =>
    updateProviderDepositEntry(id, values),
  onSettled: invalidate
});

export const deleteProviderDepositEntryMutation = mutationOptions({
  mutationFn: (id: number) => deleteProviderDepositEntry(id),
  onSettled: invalidate
});
