import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { updateAuthPageSetting } from './service';
import { authPageKeys } from './queries';
import type { UpdateAuthPageSettingPayload } from './types';

export const updateAuthPageSettingMutation = mutationOptions({
  mutationFn: ({ mode, values }: { mode: string; values: UpdateAuthPageSettingPayload }) =>
    updateAuthPageSetting(mode, values),
  onSettled: () => {
    getQueryClient().invalidateQueries({ queryKey: authPageKeys.all });
  }
});
