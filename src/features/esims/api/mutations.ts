import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { importEsimsExcel } from './service';
import { esimKeys } from './queries';
import type { ImportEsimsExcelPayload } from './types';

const invalidateEsims = () => {
  getQueryClient().invalidateQueries({ queryKey: esimKeys.all });
};

export const importEsimsExcelMutation = mutationOptions({
  mutationFn: (data: ImportEsimsExcelPayload) => importEsimsExcel(data),
  onSettled: invalidateEsims
});
