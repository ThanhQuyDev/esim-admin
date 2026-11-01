import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createInvoiceForOrder,
  refundOrder,
  resendEsimEmail,
  retryOrderProvisioning,
  submitManualOrder,
  updateInvoiceStatus,
  issueConsumerInvoice
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
  mutationFn: ({
    invoiceId,
    status,
    invoiceNumber
  }: {
    invoiceId: string;
    status: InvoiceStatus;
    invoiceNumber?: string;
  }) => updateInvoiceStatus(invoiceId, status, invoiceNumber),
  onSettled: invalidateOrders
});

/** "Số hóa đơn VAT" for an order without an invoice (doitac-3010 #044). */
export const issueConsumerInvoiceMutation = mutationOptions({
  mutationFn: ({ orderId, invoiceNumber }: { orderId: number; invoiceNumber: string }) =>
    issueConsumerInvoice(orderId, invoiceNumber),
  onSettled: invalidateOrders
});

export const retryOrderProvisioningMutation = mutationOptions({
  mutationFn: ({ orderId, itemIds }: { orderId: number; itemIds?: number[] }) =>
    retryOrderProvisioning(orderId, itemIds),
  onSettled: () => {
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
    // The eSIMs list gains rows when the supplier answers synchronously.
    getQueryClient().invalidateQueries({ queryKey: ['esims'] });
  }
});
