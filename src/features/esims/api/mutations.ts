import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createEsim, updateEsim, deleteEsim, importEsimsExcel } from './service';
import { esimKeys } from './queries';
import type { CreateEsimPayload, UpdateEsimPayload, ImportEsimsExcelPayload } from './types';

const invalidateEsims = () => {
  getQueryClient().invalidateQueries({ queryKey: esimKeys.all });
};

export const createEsimMutation = mutationOptions({
  mutationFn: (data: CreateEsimPayload) => createEsim(data),
  onSettled: invalidateEsims
});

export const updateEsimMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateEsimPayload }) => updateEsim(id, values),
  onSettled: invalidateEsims
});

export const deleteEsimMutation = mutationOptions({
  mutationFn: (id: number) => deleteEsim(id),
  onSettled: invalidateEsims
});

export const importEsimsExcelMutation = mutationOptions({
  mutationFn: (data: ImportEsimsExcelPayload) => importEsimsExcel(data),
  onSettled: invalidateEsims
});
