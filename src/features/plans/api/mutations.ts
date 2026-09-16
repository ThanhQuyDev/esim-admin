import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createPlan,
  updatePlan,
  deletePlan,
  importPlansExcel,
  importGadgetKoreaExcel,
  batchDiscount
} from './service';
import { planKeys } from './queries';
import type {
  CreatePlanPayload,
  UpdatePlanPayload,
  ImportPlansExcelPayload,
  ImportGadgetKoreaExcelPayload,
  BatchDiscountPayload
} from './types';

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

export const importPlansExcelMutation = mutationOptions({
  mutationFn: (data: ImportPlansExcelPayload) => importPlansExcel(data),
  onSettled: invalidatePlans
});

export const importGadgetKoreaExcelMutation = mutationOptions({
  mutationFn: (data: ImportGadgetKoreaExcelPayload) => importGadgetKoreaExcel(data),
  onSettled: invalidatePlans
});

export const batchDiscountMutation = mutationOptions({
  mutationFn: (data: BatchDiscountPayload) => batchDiscount(data),
  onSettled: invalidatePlans
});
