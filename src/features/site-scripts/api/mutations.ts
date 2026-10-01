import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createSiteScript, updateSiteScript, deleteSiteScript } from './service';
import { siteScriptKeys } from './queries';
import type { CreateSiteScriptPayload, UpdateSiteScriptPayload } from './types';

const invalidate = () => {
  getQueryClient().invalidateQueries({ queryKey: siteScriptKeys.all });
};

export const createSiteScriptMutation = mutationOptions({
  mutationFn: (data: CreateSiteScriptPayload) => createSiteScript(data),
  onSettled: invalidate
});

export const updateSiteScriptMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: string; values: UpdateSiteScriptPayload }) =>
    updateSiteScript(id, values),
  onSettled: invalidate
});

export const deleteSiteScriptMutation = mutationOptions({
  mutationFn: (id: string) => deleteSiteScript(id),
  onSettled: invalidate
});
