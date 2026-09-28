'use client';

/**
 * "Thêm đối tác" — an account an admin creates by hand (#059).
 *
 * Some partners are signed over the phone and cannot be asked to fill in the
 * public form and wait in the approval queue. The admin supplies what the form
 * asks for, with one deliberate omission: the password. Choosing somebody
 * else's password would mean knowing it, so the system mints one, emails it,
 * and makes the partner replace it at their first sign-in — the dialog says so
 * before the admin commits.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { adminCreatePartnerMutation } from '../api/mutations';
import type { AdminCreatePartnerPayload, PartnerType } from '../api/types';

type LegalType = 'individual' | 'company';

const EMPTY = {
  partnerType: 'kol' as PartnerType,
  legalType: 'individual' as LegalType,
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  companyName: '',
  taxCode: '',
  businessAddress: '',
  mainChannel: '',
  notes: ''
};

export function AddPartnerModal({
  open,
  onOpenChange,
  onCreated
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    ...adminCreatePartnerMutation,
    onSuccess: () => {
      toast.success('Đã tạo tài khoản đối tác. Hệ thống đã gửi email mật khẩu tạm thời.');
      setForm(EMPTY);
      setError(null);
      onOpenChange(false);
      onCreated?.();
    },
    onError: (e: Error) => toast.error(e.message || 'Tạo đối tác thất bại')
  });

  const validate = (): string | null => {
    if (!form.contactName.trim()) return 'Nhập tên người liên hệ.';
    if (!form.contactEmail.trim()) return 'Nhập email — đây cũng là tài khoản đăng nhập.';
    if (!form.contactPhone.trim()) return 'Nhập số điện thoại.';
    if (form.legalType === 'company' && !form.companyName.trim())
      return 'Đối tác là công ty thì cần tên công ty.';
    return null;
  };

  const submit = () => {
    const next = validate();
    setError(next);
    if (next) return;

    const payload: AdminCreatePartnerPayload = {
      partnerType: form.partnerType,
      legalType: form.legalType,
      contactName: form.contactName.trim(),
      contactPhone: form.contactPhone.trim(),
      contactEmail: form.contactEmail.trim(),
      ...(form.companyName.trim() && { companyName: form.companyName.trim() }),
      ...(form.taxCode.trim() && { taxCode: form.taxCode.trim() }),
      ...(form.businessAddress.trim() && { businessAddress: form.businessAddress.trim() }),
      ...(form.mainChannel.trim() && {
        channelInfo: { 'Kênh bán chính': form.mainChannel.trim() }
      }),
      ...(form.notes.trim() && { notes: form.notes.trim() })
    };
    createMutation.mutate(payload);
  };

  const set = (key: keyof typeof EMPTY, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (error) setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle>Thêm đối tác</DialogTitle>
          <DialogDescription>
            Tài khoản được tạo và kích hoạt ngay, không phải chờ duyệt. Hệ thống tự sinh mật khẩu
            ngẫu nhiên và gửi email cho đối tác; lần đăng nhập đầu tiên họ sẽ được yêu cầu đổi mật
            khẩu.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label>Loại đối tác</Label>
            <Select value={form.partnerType} onValueChange={(value) => set('partnerType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='kol'>Đối tác tiếp thị (KOL)</SelectItem>
                <SelectItem value='distribution'>Đối tác phân phối</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Pháp nhân</Label>
            <Select value={form.legalType} onValueChange={(value) => set('legalType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='individual'>Cá nhân</SelectItem>
                <SelectItem value='company'>Công ty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='contactName'>
              Tên người liên hệ <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='contactName'
              value={form.contactName}
              onChange={(e) => set('contactName', e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='contactPhone'>
              Số điện thoại <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='contactPhone'
              value={form.contactPhone}
              onChange={(e) => set('contactPhone', e.target.value)}
            />
          </div>

          <div className='space-y-2 sm:col-span-2'>
            <Label htmlFor='contactEmail'>
              Email <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='contactEmail'
              type='email'
              value={form.contactEmail}
              onChange={(e) => set('contactEmail', e.target.value)}
            />
            <p className='text-muted-foreground text-xs'>
              Đây cũng là tài khoản đăng nhập, và là nơi nhận mật khẩu tạm thời.
            </p>
          </div>

          {form.legalType === 'company' && (
            <>
              <div className='space-y-2'>
                <Label htmlFor='companyName'>
                  Tên công ty <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='companyName'
                  value={form.companyName}
                  onChange={(e) => set('companyName', e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='taxCode'>Mã số thuế</Label>
                <Input
                  id='taxCode'
                  value={form.taxCode}
                  onChange={(e) => set('taxCode', e.target.value)}
                />
              </div>
              <div className='space-y-2 sm:col-span-2'>
                <Label htmlFor='businessAddress'>Địa chỉ</Label>
                <Input
                  id='businessAddress'
                  value={form.businessAddress}
                  onChange={(e) => set('businessAddress', e.target.value)}
                />
              </div>
            </>
          )}

          <div className='space-y-2 sm:col-span-2'>
            <Label htmlFor='mainChannel'>Kênh bán chính</Label>
            <Input
              id='mainChannel'
              placeholder='Ví dụ: TikTok @kenhdulich, 250k follower'
              value={form.mainChannel}
              onChange={(e) => set('mainChannel', e.target.value)}
            />
          </div>

          <div className='space-y-2 sm:col-span-2'>
            <Label htmlFor='notes'>Ghi chú</Label>
            <Textarea
              id='notes'
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </div>

        {error && <p className='text-destructive text-sm'>{error}</p>}

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button isLoading={createMutation.isPending} onClick={submit}>
            Tạo tài khoản & gửi email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
