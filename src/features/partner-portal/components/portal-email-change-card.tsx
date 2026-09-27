'use client';

/**
 * Changing the address a partner signs in with (#031).
 *
 * A partner is identified by their partner id, not their email, so the address
 * is theirs to change like any customer's. It takes two codes: one to the
 * address on file, proving they still hold it, and one to the new address,
 * proving it reaches them — otherwise a hijacked session could quietly move the
 * account somewhere its owner cannot follow.
 */

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  confirmEmailChange,
  getPendingEmailChange,
  requestEmailChange,
  verifyCurrentEmailCode
} from '@/features/auth/api/service';
import { partnerPortalKeys } from '../api/queries';

type Step = 'idle' | 'current' | 'new';

interface PortalEmailChangeCardProps {
  currentEmail: string | null | undefined;
}

export function PortalEmailChangeCard({ currentEmail }: PortalEmailChangeCardProps) {
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('idle');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // A half-finished change survives a reload: the codes were already emailed,
  // so dropping back to step one would make the partner ask for new ones.
  useEffect(() => {
    let cancelled = false;
    void getPendingEmailChange().then((pending) => {
      if (cancelled || !pending?.email) return;
      setEmail(pending.email);
      setStep(pending.stage === 'new' ? 'new' : 'current');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const reset = () => {
    setStep('idle');
    setEmail('');
    setCode('');
    setError(null);
  };

  const start = useMutation({
    mutationFn: () => requestEmailChange(email.trim()),
    onSuccess: () => {
      setCode('');
      setError(null);
      setStep('current');
      toast.success(`Đã gửi mã xác nhận tới ${currentEmail ?? 'email hiện tại'}.`);
    },
    onError: (e: Error) => setError(e.message)
  });

  const verifyCurrent = useMutation({
    mutationFn: () => verifyCurrentEmailCode(code.trim()),
    onSuccess: () => {
      setCode('');
      setError(null);
      setStep('new');
      toast.success(`Đã gửi mã xác nhận tới ${email.trim()}.`);
    },
    onError: (e: Error) => setError(e.message)
  });

  const confirm = useMutation({
    mutationFn: () => confirmEmailChange(email.trim(), code.trim()),
    onSuccess: () => {
      toast.success('Đã đổi email đăng nhập. Lần sau hãy đăng nhập bằng địa chỉ mới.');
      reset();
      void queryClient.invalidateQueries({ queryKey: partnerPortalKeys.all });
    },
    onError: (e: Error) => setError(e.message)
  });

  const pending = start.isPending || verifyCurrent.isPending || confirm.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email đăng nhập</CardTitle>
        <CardDescription>
          Đang dùng <span className='text-foreground font-medium'>{currentEmail ?? '—'}</span>. Đổi
          email cần xác nhận hai lần: một mã gửi về email hiện tại, một mã gửi về email mới.
        </CardDescription>
      </CardHeader>

      <CardContent className='grid gap-4 md:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='newEmail'>Email mới</Label>
          <Input
            id='newEmail'
            type='email'
            placeholder='ban@congty.com'
            value={email}
            disabled={step !== 'idle'}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
          />
        </div>

        {step !== 'idle' && (
          <div className='space-y-2'>
            <Label htmlFor='emailCode'>
              {step === 'current'
                ? `Mã gửi tới ${currentEmail ?? 'email hiện tại'}`
                : `Mã gửi tới ${email}`}
            </Label>
            <Input
              id='emailCode'
              inputMode='numeric'
              maxLength={6}
              placeholder='6 chữ số'
              className='tracking-[0.4em]'
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ''));
                if (error) setError(null);
              }}
            />
          </div>
        )}

        {error && <p className='text-destructive text-sm md:col-span-2'>{error}</p>}
      </CardContent>

      <CardFooter className='flex-wrap gap-2'>
        {step === 'idle' && (
          <Button
            isLoading={start.isPending}
            disabled={!email.trim() || email.trim() === currentEmail}
            onClick={() => start.mutate()}
          >
            Gửi mã xác nhận
          </Button>
        )}

        {step === 'current' && (
          <Button
            isLoading={verifyCurrent.isPending}
            disabled={code.length !== 6}
            onClick={() => verifyCurrent.mutate()}
          >
            Xác nhận email hiện tại
          </Button>
        )}

        {step === 'new' && (
          <Button
            isLoading={confirm.isPending}
            disabled={code.length !== 6}
            onClick={() => confirm.mutate()}
          >
            Đổi sang email mới
          </Button>
        )}

        {step !== 'idle' && (
          <Button variant='ghost' disabled={pending} onClick={reset}>
            Hủy
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
