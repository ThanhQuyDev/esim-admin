import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createPlan, updatePlan, deletePlan } from './service';
import { planKeys } from './queries';
import type { CreatePlanPayload, UpdatePlanPayload } from './types';

const invalidatePlans = () => {
  getQueryClient().invalidateQueries({ queryKey: planKeys.all });
};

export const createPlanMutation = mutationOptions({
  mutationFn: (data: CreatePlanPayload) => createPlan(data),
  onSettled: invalidatePlans
});

export const updatePlanMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdatePlanPayload }) => updatePlan(id, values),
  onSettled: invalidatePlans
});

export const deletePlanMutation = mutationOptions({
  mutationFn: (id: number) => deletePlan(id),
  onSettled: invalidatePlans
});
