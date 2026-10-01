import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { importApnExcel } from './service';
import { apnSupportKeys } from './queries';

export const importApnExcelMutation = mutationOptions({
  mutationFn: (file: File) => importApnExcel(file),
  onSettled: () => {
    getQueryClient().invalidateQueries({ queryKey: apnSupportKeys.all });
  }
});
