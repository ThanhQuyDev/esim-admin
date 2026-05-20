import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createInvoiceForOrder,
  refundOrder,
  resendEsimEmail,
  submitManualOrder,
  updateInvoiceStatus
} from './service';
import { orderKeys } from './queries';
import type {
  CreateInvoiceForOrderPayload,
  InvoiceStatus,
  RefundOrderRequest,
  SubmitManualOrderPayload
} from './types';

const invalidateOrders = () => {
  getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
};

export const refundOrderMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: RefundOrderRequest }) => refundOrder(id, data),
  onSettled: invalidateOrders
});

export const resendEsimEmailMutation = mutationOptions({
  mutationFn: (orderId: number) => resendEsimEmail(orderId)
});

export const createInvoiceForOrderMutation = mutationOptions({
  mutationFn: ({ orderId, data }: { orderId: number; data: CreateInvoiceForOrderPayload }) =>
    createInvoiceForOrder(orderId, data),
  onSettled: invalidateOrders
});

export const submitManualOrderMutation = mutationOptions({
  mutationFn: (data: SubmitManualOrderPayload) => submitManualOrder(data),
  onSettled: invalidateOrders
});

export const updateInvoiceStatusMutation = mutationOptions({
  mutationFn: ({ invoiceId, status }: { invoiceId: string; status: InvoiceStatus }) =>
    updateInvoiceStatus(invoiceId, status),
  onSettled: invalidateOrders
});
