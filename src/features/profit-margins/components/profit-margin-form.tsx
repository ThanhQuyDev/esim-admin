'use client';

import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { updateProfitMarginMutation } from '../api/mutations';
import { profitMarginQueryOptions } from '../api/queries';
import { profitMarginSchema, type ProfitMarginFormValues } from '../schemas/profit-margin';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ProfitMarginForm() {
  const { data: existing } = useSuspenseQuery(profitMarginQueryOptions());

  const mutation = useMutation({
    ...updateProfitMarginMutation,
    onSuccess: () => toast.success('Cập nhật profit margin thành công'),
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      name: existing?.name ?? 'Default Margin',
      percentage: existing ? String(parseFloat(existing.percentage)) : '30',
      isActive: existing?.isActive ?? true
    },
    validators: { onSubmit: profitMarginSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        name: value.name,
        percentage: Number(value.percentage),
        isActive: value.isActive
      });
    }
  });

  const { FormTextField, FormSwitchField } = useFormFields<ProfitMarginFormValues>();

  return (
    <Card className='max-w-lg'>
      <CardHeader>
        <CardTitle>Profit Margin</CardTitle>
        <CardDescription>Cập nhật tỷ lệ lợi nhuận.</CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-4'>
            <FormTextField name='name' label='Tên' required placeholder='Default Margin' />
            <FormTextField name='percentage' label='Phần trăm (%)' required placeholder='30' />
            <FormSwitchField name='isActive' label='Kích hoạt' />
            <form.SubmitButton className='w-full'>Cập nhật</form.SubmitButton>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
