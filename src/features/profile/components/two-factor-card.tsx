'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { apiClient } from '@/lib/api-client';

type Status = { enabled: boolean; channel: 'email'; sentTo: string | null };

const statusKey = ['two-factor'] as const;

/**
 * "Đăng nhập 2 lớp (OTP)" in the profile (vande-1411 #005). On: after the
 * password, a 6-digit code mailed to the account is asked for too. Turning it
 * on needs nothing; turning it off needs a code mailed to the account.
 */
export function TwoFactorCard() {
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: statusKey,
    queryFn: () => apiClient<Status>('/auth/two-factor')
  });
  const [disabling, setDisabling] = useState<string | null>(null);
  const [code, setCode] = useState('');

  const refresh = (s: Status) => queryClient.setQueryData(statusKey, s);

  const enable = useMutation({
    mutationFn: () => apiClient<Status>('/auth/two-factor/enable', { method: 'POST' }),
    onSuccess: (s) => {
      refresh(s);
      toast.success('Đã bật đăng nhập 2 lớp. Lần đăng nhập sau sẽ cần mã gửi qua email.');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const sendCode = useMutation({
    mutationFn: () =>
      apiClient<{ sentTo: string }>('/auth/two-factor/disable/code', { method: 'POST' }),
    onSuccess: (r) => {
      setDisabling(r.sentTo);
      setCode('');
      toast.success(`Đã gửi mã xác nhận tới ${r.sentTo}`);
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const disable = useMutation({
    mutationFn: () =>
      apiClient<Status>('/auth/two-factor/disable', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim() })
      }),
    onSuccess: (s) => {
      refresh(s);
      setDisabling(null);
      setCode('');
      toast.success('Đã tắt đăng nhập 2 lớp.');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const s = status.data;

  return (
    <Card data-testid='two-factor-card'>
      <CardHeader>
        <CardTitle className='flex flex-wrap items-center gap-2'>
          Đăng nhập 2 lớp (OTP)
          {s && (
            <Badge variant={s.enabled ? 'default' : 'secondary'}>
              {s.enabled ? 'Đang bật' : 'Đang tắt'}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Khi bật, sau khi nhập đúng mật khẩu, hệ thống gửi mã 6 số qua email
          {s?.sentTo ? ` (${s.sentTo})` : ''} và chỉ cho vào khi nhập đúng mã. Đăng nhập bằng Google
          hoặc chỉ bằng mã email sẽ không dùng được với tài khoản đã bật.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {s && (
          <div className='flex items-center gap-3'>
            <Switch
              id='two-factor-switch'
              checked={s.enabled}
              disabled={enable.isPending || sendCode.isPending || !!disabling}
              onCheckedChange={(on) => (on ? enable.mutate() : sendCode.mutate())}
              data-testid='two-factor-switch'
            />
            <Label htmlFor='two-factor-switch'>Xác thực OTP khi đăng nhập</Label>
          </div>
        )}
        {disabling && (
          <form
            className='grid max-w-md gap-3'
            onSubmit={(e) => {
              e.preventDefault();
              if (/^\d{6}$/.test(code.trim())) disable.mutate();
            }}
          >
            <div className='space-y-1'>
              <Label htmlFor='two-factor-disable-code'>
                Nhập mã gửi tới {disabling} để tắt đăng nhập 2 lớp
              </Label>
              <Input
                id='two-factor-disable-code'
                inputMode='numeric'
                autoComplete='one-time-code'
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                data-testid='two-factor-disable-code'
              />
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button
                type='submit'
                variant='destructive'
                disabled={!/^\d{6}$/.test(code.trim())}
                isLoading={disable.isPending}
                data-testid='two-factor-disable-submit'
              >
                Tắt đăng nhập 2 lớp
              </Button>
              <Button type='button' variant='ghost' onClick={() => setDisabling(null)}>
                Giữ bật
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
