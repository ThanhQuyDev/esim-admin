import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  approvePartner,
  rejectPartner,
  updatePartnerStatus,
  assignPartnerTier,
  adjustPartnerWallet,
  confirmDepositRequest,
  approvePayout,
  rejectPayout,
  markPayoutPaid,
  createTier,
  updateTier
} from './service';
import { partnerKeys } from './queries';
import type {
  RejectPartnerPayload,
  UpdatePartnerStatusPayload,
  AssignTierPayload,
  AdjustWalletPayload,
  ProcessPayoutPayload,
  CreateTierPayload,
  UpdateTierPayload
} from './types';

const invalidateAll = () => getQueryClient().invalidateQueries({ queryKey: partnerKeys.all });

export const approvePartnerMutation = mutationOptions({
  mutationFn: (id: number) => approvePartner(id),
  onSettled: invalidateAll
});

export const rejectPartnerMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: RejectPartnerPayload }) => rejectPartner(id, data),
  onSettled: invalidateAll
});

export const updatePartnerStatusMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: UpdatePartnerStatusPayload }) =>
    updatePartnerStatus(id, data),
  onSettled: invalidateAll
});

export const assignPartnerTierMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: AssignTierPayload }) =>
    assignPartnerTier(id, data),
  onSettled: invalidateAll
});

export const adjustPartnerWalletMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: AdjustWalletPayload }) =>
    adjustPartnerWallet(id, data),
  onSettled: invalidateAll
});

export const confirmDepositRequestMutation = mutationOptions({
  mutationFn: (id: number) => confirmDepositRequest(id),
  onSettled: invalidateAll
});

export const approvePayoutMutation = mutationOptions({
  mutationFn: (id: number) => approvePayout(id),
  onSettled: invalidateAll
});

export const rejectPayoutMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: ProcessPayoutPayload }) => rejectPayout(id, data),
  onSettled: invalidateAll
});

export const markPayoutPaidMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: ProcessPayoutPayload }) =>
    markPayoutPaid(id, data),
  onSettled: invalidateAll
});

export const createTierMutation = mutationOptions({
  mutationFn: (data: CreateTierPayload) => createTier(data),
  onSettled: invalidateAll
});

export const updateTierMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: UpdateTierPayload }) => updateTier(id, data),
  onSettled: invalidateAll
});
