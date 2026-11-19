'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { apiClient } from '@/lib/api-client';
import { esimKeys } from '../api/queries';

/**
 * "Lấy lại thông tin eSIM" (vande-2011 #004): an eSIM the supplier delivered
 * but whose LPA / QR did not reach us. Rebuilds the LPA from what is stored,
 * or reads it again from the supplier (a read: nothing is bought or changed).
 */
export function EsimRefetchInfoButton({ esimId }: { esimId: number }) {
  const queryClient = useQueryClient();
  const refetch = useMutation({
    mutationFn: () =>
      apiClient<{ lpa: string | null }>(`/esims/${esimId}/refetch-info`, { method: 'POST' }),
    onSuccess: ({ lpa }) => {
      if (lpa) toast.success('Đã lấy lại thông tin eSIM, mã QR đã có.');
      else toast.error('Nhà cung cấp chưa trả LPA cho eSIM này. Thử lại sau ít phút.');
      void queryClient.invalidateQueries({ queryKey: esimKeys.detail(esimId) });
    },
    onError: (e: Error) => toast.error(e.message || 'Không lấy lại được thông tin eSIM')
  });
  return (
    <Button
      variant='outline'
      disabled={refetch.isPending}
      onClick={() => refetch.mutate()}
      data-testid='esim-refetch-info'
    >
      <Icons.refresh className='mr-2 h-4 w-4' />
      {refetch.isPending ? 'Đang lấy…' : 'Lấy lại thông tin eSIM'}
    </Button>
  );
}
