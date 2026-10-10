import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createApnSupport,
  deleteApnSupport,
  importApnExcel,
  syncApnFromPlans,
  updateApnSupport
} from './service';
import { apnSupportKeys } from './queries';
import type { SaveApnSupportPayload } from './types';

const refresh = () => getQueryClient().invalidateQueries({ queryKey: apnSupportKeys.all });

export const importApnExcelMutation = mutationOptions({
  mutationFn: (file: File) => importApnExcel(file),
  onSettled: refresh
});

export const createApnSupportMutation = mutationOptions({
  mutationFn: (data: SaveApnSupportPayload) => createApnSupport(data),
  onSettled: refresh
});

export const updateApnSupportMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: Partial<SaveApnSupportPayload> }) =>
    updateApnSupport(id, data),
  onSettled: refresh
});

export const deleteApnSupportMutation = mutationOptions({
  mutationFn: (id: string) => deleteApnSupport(id),
  onSettled: refresh
});

export const syncApnFromPlansMutation = mutationOptions({
  mutationFn: () => syncApnFromPlans(),
  onSettled: refresh
});
