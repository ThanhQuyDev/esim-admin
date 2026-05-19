'use client';

import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FormDialog } from '@/components/ui/form-dialog';
import { Icons } from '@/components/icons';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createInvoiceForOrderMutation } from '../api/mutations';
import { createInvoiceSchema, type CreateInvoiceFormValues } from '../schemas/admin';
import type { CreateInvoiceForOrderPayload } from '../api/types';

interface CreateInvoiceDialogProps {
  orderId: number;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

export function CreateInvoiceDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
  defaultEmail
}: CreateInvoiceDialogProps) {
  const mutation = useMutation({
    ...createInvoiceForOrderMutation,
    onSuccess: () => {
      toast.success(`Đã tạo hóa đơn cho đơn hàng ${orderNumber}`);
      onOpenChange(false);
    },
    onError: (e) => {
      // 409: đã có hóa đơn
      if (/409|already|đã có hóa/i.test(e.message)) {
        toast.error('Đơn hàng này đã có hóa đơn rồi');
        return;
      }
      toast.error(e.message || 'Tạo hóa đơn thất bại');
    }
  });

  const form = useAppForm({
    defaultValues: {
      companyName: '',
      taxCode: '',
      address: '',
      invoiceEmail: defaultEmail ?? ''
    } as CreateInvoiceFormValues,
    validators: { onSubmit: createInvoiceSchema },
    onSubmit: async ({ value }) => {
      const payload: CreateInvoiceForOrderPayload = {
        companyName: value.companyName.trim(),
        taxCode: value.taxCode.trim(),
        address: value.address.trim(),
        invoiceEmail: value.invoiceEmail.trim()
      };
      await mutation.mutateAsync({ orderId, data: payload });
    }
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const { FormTextField, FormTextareaField } = useFormFields<CreateInvoiceFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Xuất hóa đơn'
      description={`Tạo hóa đơn cho đơn hàng ${orderNumber}`}
      formId='create-invoice-form'
      isLoading={mutation.isPending}
      submitLabel='Tạo hóa đơn'
      metaInfo={
        <>
          <Icons.fileTypePdf className='h-4 w-4' />
          <span>Hóa đơn điện tử</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='create-invoice-form' className='space-y-6'>
          <Alert>
            <Icons.info className='h-4 w-4' />
            <AlertDescription>
              Hóa đơn sẽ được tạo ở trạng thái <strong>PENDING</strong>. Hệ thống chỉ cho phép 1 hóa
              đơn / đơn hàng.
            </AlertDescription>
          </Alert>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <FormTextField
              name='companyName'
              label='Tên công ty'
              required
              placeholder='Công ty TNHH ABC'
            />
            <FormTextField name='taxCode' label='Mã số thuế' required placeholder='0312345678' />
          </div>
          <FormTextField
            name='invoiceEmail'
            label='Email nhận hóa đơn'
            required
            type='email'
            placeholder='finance@example.com'
          />
          <FormTextareaField
            name='address'
            label='Địa chỉ công ty'
            required
            placeholder='123 Nguyễn Huệ, Quận 1, TP.HCM'
            rows={3}
          />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}
