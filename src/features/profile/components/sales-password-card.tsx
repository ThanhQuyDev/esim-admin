'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { apiClient } from '@/lib/api-client';
import { formatDateTimeVn } from '@/lib/format';

type Status = {
  isSet: boolean;
  setAt: string | null;
  lockedUntil: string | null;
  minLength: number;
};

const statusKey = ['sales-password'] as const;

/**
 * "Mật khẩu bán hàng" in the profile (vande-1411 #004): asked before every
 * transaction that moves money. Set the first time and reset with a code
 * mailed to the account; changed with the current one. Must differ from the
 * sign-in password.
 */
export function SalesPasswordCard() {
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: statusKey,
    queryFn: () => apiClient<Status>('/auth/sales-password')
  });
  const [mode, setMode] = useState<'idle' | 'code' | 'change'>('idle');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');

  const reset = () => {
    setMode('idle');
    setSentTo(null);
    setCode('');
    setCurrent('');
    setNext('');
    setAgain('');
  };

  const sendCode = useMutation({
    mutationFn: () =>
      apiClient<{ sentTo: string }>('/auth/sales-password/code', { method: 'POST' }),
    onSuccess: (r) => {
      setSentTo(r.sentTo);
      setMode('code');
      toast.success(`Đã gửi mã xác nhận tới ${r.sentTo}`);
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const save = useMutation({
    mutationFn: () =>
      mode === 'code'
        ? apiClient('/auth/sales-password', {
            method: 'POST',
            body: JSON.stringify({ code: code.trim(), newPassword: next })
          })
        : apiClient('/auth/sales-password/change', {
            method: 'POST',
            body: JSON.stringify({ currentPassword: current, newPassword: next })
          }),
    onSuccess: () => {
      toast.success('Đã lưu mật khẩu bán hàng');
      reset();
      queryClient.invalidateQueries({ queryKey: statusKey });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      queryClient.invalidateQueries({ queryKey: statusKey });
    }
  });

  const s = status.data;
  const minLength = s?.minLength ?? 6;
  const mismatch = again.length > 0 && again !== next;
  const ready =
    next.length >= minLength &&
    next === again &&
    (mode === 'code' ? /^\d{6}$/.test(code.trim()) : current.length > 0);

  return (
    <Card data-testid='sales-password-card'>
      <CardHeader>
        <CardTitle className='flex flex-wrap items-center gap-2'>
          Mật khẩu bán hàng
          {s &&
            (s.isSet ? (
              <Badge variant='secondary'>Đã tạo</Badge>
            ) : (
              <Badge variant='destructive'>Chưa tạo</Badge>
            ))}
        </CardTitle>
        <CardDescription>
          Hệ thống hỏi mật khẩu này trước mọi giao dịch có tiền: đặt đơn hộ, đặt eSIM hàng loạt,
          topup hộ khách, hoàn tiền, điều chỉnh ví, chi trả hoa hồng… Khuyến cáo: không đặt trùng
          mật khẩu đăng nhập (hệ thống không cho phép trùng).
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {s && !s.isSet && (
          <Alert variant='destructive'>
            <Icons.warning className='h-4 w-4' />
            <AlertDescription>
              Chưa có mật khẩu bán hàng thì chưa thực hiện được giao dịch có tiền. Bấm &quot;Tạo mật
              khẩu bán hàng&quot;, nhập mã gửi tới email của tài khoản.
            </AlertDescription>
          </Alert>
        )}
        {s?.setAt && (
          <p className='text-muted-foreground text-sm'>
            Tạo/đổi lần gần nhất: {formatDateTimeVn(s.setAt)}
          </p>
        )}
        {s?.lockedUntil && (
          <p className='text-destructive text-sm' data-testid='sales-password-locked'>
            Đang tạm khoá tới {formatDateTimeVn(s.lockedUntil)} do nhập sai nhiều lần. Có thể đặt
            lại bằng mã gửi qua email.
          </p>
        )}

        {mode === 'idle' && s && (
          <div className='flex flex-wrap gap-2'>
            {s.isSet && (
              <Button
                type='button'
                variant='outline'
                onClick={() => setMode('change')}
                data-testid='sales-password-change'
              >
                Đổi mật khẩu bán hàng
              </Button>
            )}
            <Button
              type='button'
              variant={s.isSet ? 'ghost' : 'default'}
              isLoading={sendCode.isPending}
              onClick={() => sendCode.mutate()}
              data-testid='sales-password-send-code'
            >
              {s.isSet ? 'Quên mật khẩu bán hàng — gửi mã qua email' : 'Tạo mật khẩu bán hàng'}
            </Button>
          </div>
        )}

        {mode !== 'idle' && (
          <form
            className='grid max-w-md gap-3'
            onSubmit={(e) => {
              e.preventDefault();
              if (ready) save.mutate();
            }}
          >
            {mode === 'code' ? (
              <div className='space-y-1'>
                <Label htmlFor='sp-code'>Mã xác nhận (6 số) gửi tới {sentTo}</Label>
                <Input
                  id='sp-code'
                  inputMode='numeric'
                  autoComplete='one-time-code'
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  data-testid='sales-password-code'
                />
              </div>
            ) : (
              <div className='space-y-1'>
                <Label htmlFor='sp-current'>Mật khẩu bán hàng hiện tại</Label>
                <Input
                  id='sp-current'
                  type='password'
                  autoComplete='off'
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  data-testid='sales-password-current'
                />
              </div>
            )}
            <div className='space-y-1'>
              <Label htmlFor='sp-new'>Mật khẩu bán hàng mới (ít nhất {minLength} ký tự)</Label>
              <Input
                id='sp-new'
                type='password'
                autoComplete='new-password'
                value={next}
                onChange={(e) => setNext(e.target.value)}
                data-testid='sales-password-new'
              />
            </div>
            <div className='space-y-1'>
              <Label htmlFor='sp-again'>Nhập lại mật khẩu bán hàng mới</Label>
              <Input
                id='sp-again'
                type='password'
                autoComplete='new-password'
                value={again}
                onChange={(e) => setAgain(e.target.value)}
                data-testid='sales-password-again'
              />
              {mismatch && <p className='text-destructive text-xs'>Hai lần nhập không khớp.</p>}
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button
                type='submit'
                disabled={!ready}
                isLoading={save.isPending}
                data-testid='sales-password-save'
              >
                Lưu mật khẩu bán hàng
              </Button>
              <Button type='button' variant='ghost' onClick={reset}>
                Huỷ
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
