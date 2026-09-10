import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  updateMyPartnerProfile,
  createMyDepositRequest,
  createMyLink,
  updateMyLink,
  createMyPayout,
  applyAsPartner,
  createMyTicket
} from './service';
import { partnerPortalKeys } from './queries';
import type {
  UpdateMyProfilePayload,
  CreateDepositRequestPayload,
  CreateLinkPayload,
  UpdateLinkPayload,
  CreatePayoutPayload,
  PartnerApplyPayload,
  CreateTicketPayload
} from './types';

const invalidateAll = () => getQueryClient().invalidateQueries({ queryKey: partnerPortalKeys.all });

export const updateMyProfileMutation = mutationOptions({
  mutationFn: (data: UpdateMyProfilePayload) => updateMyPartnerProfile(data),
  onSettled: invalidateAll
});

export const createDepositRequestMutation = mutationOptions({
  mutationFn: (data: CreateDepositRequestPayload) => createMyDepositRequest(data),
  onSettled: invalidateAll
});

export const createLinkMutation = mutationOptions({
  mutationFn: (data: CreateLinkPayload) => createMyLink(data),
  onSettled: invalidateAll
});

export const updateLinkMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: UpdateLinkPayload }) => updateMyLink(id, data),
  onSettled: invalidateAll
});

export const createPayoutRequestMutation = mutationOptions({
  mutationFn: (data: CreatePayoutPayload) => createMyPayout(data),
  onSettled: invalidateAll
});

export const applyAsPartnerMutation = mutationOptions({
  mutationFn: (data: PartnerApplyPayload) => applyAsPartner(data)
});

export const createTicketMutation = mutationOptions({
  mutationFn: (data: CreateTicketPayload) => createMyTicket(data),
  onSettled: invalidateAll
});
