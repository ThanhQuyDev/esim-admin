import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  updateMyPartnerProfile,
  createMyDepositRequest,
  createMyLink,
  updateMyLink,
  deleteMyLink,
  createMyCoupon,
  setMyCouponActive,
  createMyPayout,
  applyAsPartner,
  createMyTicket,
  requestBankAccountChange,
  confirmBankAccountChange,
  markMyNotificationRead,
  markAllMyNotificationsRead
} from './service';
import { partnerPortalKeys } from './queries';
import type {
  UpdateMyProfilePayload,
  CreateDepositRequestPayload,
  CreateLinkPayload,
  UpdateLinkPayload,
  CreatePayoutPayload,
  PartnerApplyPayload,
  CreateTicketPayload,
  BankAccountChangePayload,
  CreateCouponPayload
} from './types';

const invalidateAll = () => getQueryClient().invalidateQueries({ queryKey: partnerPortalKeys.all });

export const updateMyProfileMutation = mutationOptions({
  mutationFn: (data: UpdateMyProfilePayload) => updateMyPartnerProfile(data),
  onSettled: invalidateAll
});

export const requestBankAccountChangeMutation = mutationOptions({
  mutationFn: (data: BankAccountChangePayload) => requestBankAccountChange(data)
});

export const confirmBankAccountChangeMutation = mutationOptions({
  mutationFn: (otp: string) => confirmBankAccountChange(otp),
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

export const deleteLinkMutation = mutationOptions({
  mutationFn: (id: number) => deleteMyLink(id),
  onSettled: invalidateAll
});

export const createCouponMutation = mutationOptions({
  mutationFn: (data: CreateCouponPayload) => createMyCoupon(data),
  onSettled: invalidateAll
});

export const setCouponActiveMutation = mutationOptions({
  mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
    setMyCouponActive(id, isActive),
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

/** Opening an announcement clears its dot (#079). */
export const markNotificationReadMutation = mutationOptions({
  mutationFn: (id: number) => markMyNotificationRead(id),
  onSettled: () =>
    getQueryClient().invalidateQueries({ queryKey: partnerPortalKeys.notifications() })
});

export const markAllNotificationsReadMutation = mutationOptions({
  mutationFn: () => markAllMyNotificationsRead(),
  onSettled: () =>
    getQueryClient().invalidateQueries({ queryKey: partnerPortalKeys.notifications() })
});
