'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';

import { partnerKeys } from '../api/queries';
import { updatePartnerByAdmin } from '../api/service';

type SepayAccountChoice = {
  key: 'personal' | 'company';
  configured: boolean;
  bankCode: string;
  accountName: string;
  last4: string;
};

const NAME: Record<SepayAccountChoice['key'], string> = {
  personal: 'Sepay cá nhân',
  company: 'Sepay công ty'
};

/**
 * "Sepay cá nhân / Sepay công ty" for one partner (vande-1411 #046), saved on
 * change. A marketing partner's customers who pay by bank transfer, and a
 * distribution partner's automatic deposits, get the QR of this account.
 */
export function PartnerSepayAccountField({
  partnerId,
  value,
  kind
}: {
  partnerId: number;
  value: string | null | undefined;
  kind: 'kol' | 'distribution';
}) {
  const queryClient = useQueryClient();
  const { data: choices = [] } = useQuery({
    queryKey: [...partnerKeys.all, 'sepay-accounts'],
    queryFn: () => apiClient<SepayAccountChoice[]>('/partners/sepay-accounts'),
    staleTime: 5 * 60 * 1000
  });
  const save = useMutation({
    mutationFn: (sepayAccount: string) =>
      updatePartnerByAdmin(partnerId, { sepayAccount: sepayAccount as 'personal' | 'company' }),
    onSuccess: () => {
      toast.success('Đã lưu tài khoản nhận chuyển khoản.');
      void queryClient.invalidateQueries({ queryKey: partnerKeys.detail(partnerId) });
    },
    onError: (e: Error) => toast.error(e.message || 'Không lưu được')
  });

  const current = (value === 'company' ? 'company' : 'personal') as SepayAccountChoice['key'];
  const company = choices.find((c) => c.key === 'company');
  const label = (c: SepayAccountChoice) =>
    c.configured
      ? `${NAME[c.key]} (${c.bankCode} ••${c.last4}${c.accountName ? ` · ${c.accountName}` : ''})`
      : `${NAME[c.key]} (chưa cấu hình)`;

  return (
    <div className='space-y-2' data-testid='partner-sepay-account'>
      <p className='text-sm font-medium'>
        {kind === 'kol'
          ? 'Cho khách hàng của đối tác thanh toán qua'
          : 'Cho đối tác thanh toán tự động qua'}
      </p>
      <Select value={current} onValueChange={(next) => save.mutate(next)} disabled={save.isPending}>
        <SelectTrigger className='w-full max-w-[420px]' data-testid='partner-sepay-account-select'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(choices.length
            ? choices
            : (['personal', 'company'] as const).map((key) => ({
                key,
                configured: true,
                bankCode: '',
                accountName: '',
                last4: ''
              }))
          ).map((c) => (
            <SelectItem key={c.key} value={c.key}>
              {choices.length ? label(c) : NAME[c.key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className='text-muted-foreground text-xs'>
        {kind === 'kol'
          ? 'Khách mua qua link tiếp thị hoặc mã giảm giá của đối tác, chọn chuyển khoản, sẽ nhận mã QR vào tài khoản này.'
          : 'Khi đối tác nạp ký quỹ tự động bằng chuyển khoản, mã QR sẽ vào tài khoản này.'}
        {current === 'company' && company && !company.configured
          ? ' Tài khoản công ty chưa được cấu hình trên máy chủ nên hiện vẫn dùng tài khoản cá nhân.'
          : ''}
      </p>
    </div>
  );
}
