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
  markAllMyNotificationsRead,
  createPurchase,
  cancelPurchase,
  reportEsimFault
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
  CreateCouponPayload,
  CreatePurchasePayload,
  ReportEsimFaultPayload
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

/**
 * Đặt mua và trừ ví (#046).
 *
 * `invalidateAll` vì một lần mua đổi cả số dư ví, danh sách đơn, tồn kho eSIM
 * và bảng giá (số dư quyết định gói nào còn mua được).
 */
export const createPurchaseMutation = mutationOptions({
  mutationFn: (data: CreatePurchasePayload) => createPurchase(data),
  onSettled: invalidateAll
});

export const cancelPurchaseMutation = mutationOptions({
  mutationFn: (orderNumber: string) => cancelPurchase(orderNumber),
  onSettled: invalidateAll
});

/**
 * Báo một eSIM đã mua bị lỗi (#046, A4).
 *
 * Không hoàn tiền ngay — phiếu nằm chờ esim.vn duyệt, nên chỉ cần làm mới
 * danh sách phiếu chứ không phải cả ví.
 */
export const reportEsimFaultMutation = mutationOptions({
  mutationFn: (data: ReportEsimFaultPayload) => reportEsimFault(data),
  onSettled: invalidateAll
});
