'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { applyAsPartnerMutation } from '@/features/partner-portal/api/mutations';
import type { PartnerLegalType, PartnerType } from '@/features/partner-portal/api/types';

type FormState = {
  partnerType: PartnerType;
  legalType: PartnerLegalType;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  password: string;
  companyName: string;
  taxCode: string;
  businessAddress: string;
  channelUrl: string;
  channelFollowers: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  partnerType: 'kol',
  legalType: 'individual',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  password: '',
  companyName: '',
  taxCode: '',
  businessAddress: '',
  channelUrl: '',
  channelFollowers: '',
  notes: ''
};

const PHONE_REGEX = /^\+?\d{8,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterPartnerForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    ...applyAsPartnerMutation,
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.contactName.trim()) next.contactName = 'Vui lòng nhập họ tên';
    if (!PHONE_REGEX.test(form.contactPhone.trim()))
      next.contactPhone = 'Số điện thoại không hợp lệ';
    if (!EMAIL_REGEX.test(form.contactEmail.trim())) next.contactEmail = 'Email không hợp lệ';
    if (form.password.length < 6) next.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (form.legalType === 'company' && !form.companyName.trim()) {
      next.companyName = 'Vui lòng nhập tên công ty';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const channelInfo: Record<string, unknown> = {};
    if (form.channelUrl.trim()) channelInfo.url = form.channelUrl.trim();
    if (form.channelFollowers.trim()) channelInfo.followers = Number(form.channelFollowers) || 0;

    mutation.mutate({
      partnerType: form.partnerType,
      legalType: form.legalType,
      contactName: form.contactName.trim(),
      contactPhone: form.contactPhone.trim(),
      contactEmail: form.contactEmail.trim(),
      password: form.password,
      ...(form.legalType === 'company' && {
        companyName: form.companyName.trim(),
        taxCode: form.taxCode.trim() || undefined,
        businessAddress: form.businessAddress.trim() || undefined
      }),
      ...(Object.keys(channelInfo).length > 0 && { channelInfo }),
      ...(form.notes.trim() && { notes: form.notes.trim() })
    });
  }

  if (submitted) {
    return (
      <div className='rounded-lg border bg-background p-8 text-center'>
        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
          <Icons.check className='h-6 w-6 text-green-600' />
        </div>
        <h2 className='text-lg font-semibold'>Đăng ký thành công!</h2>
        <p className='text-muted-foreground mt-2 text-sm'>
          Hồ sơ của bạn đã được gửi và đang chờ esim.vn xét duyệt. Chúng tôi sẽ liên hệ qua email{' '}
          <span className='font-medium'>{form.contactEmail}</span> trong thời gian sớm nhất.
        </p>
        <Button className='mt-6' onClick={() => router.push('/')}>
          Về trang chủ
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6 rounded-lg border bg-background p-6'>
      <div className='space-y-3'>
        <Label>Bạn muốn đăng ký làm</Label>
        <RadioGroup
          value={form.partnerType}
          onValueChange={(v) => update('partnerType', v as PartnerType)}
          className='grid gap-3 sm:grid-cols-2'
        >
          <label
            className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-colors ${
              form.partnerType === 'kol' ? 'border-primary bg-primary/5' : ''
            }`}
          >
            <div className='flex items-center gap-2'>
              <RadioGroupItem value='kol' id='type-kol' />
              <span className='font-medium'>KOL / Tiếp thị</span>
            </div>
            <p className='text-muted-foreground text-xs'>
              Bán hộ eSIM esim.vn qua link tiếp thị riêng, nhận hoa hồng theo % đơn hàng. Không cần
              ký quỹ.
            </p>
          </label>
          <label
            className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-colors ${
              form.partnerType === 'distribution' ? 'border-primary bg-primary/5' : ''
            }`}
          >
            <div className='flex items-center gap-2'>
              <RadioGroupItem value='distribution' id='type-distribution' />
              <span className='font-medium'>Đối tác phân phối</span>
            </div>
            <p className='text-muted-foreground text-xs'>
              Nạp ký quỹ, mua eSIM ở giá vốn và tự bán lại theo giá bạn quyết định.
            </p>
          </label>
        </RadioGroup>
      </div>

      <div className='space-y-3'>
        <Label>Loại hình</Label>
        <RadioGroup
          value={form.legalType}
          onValueChange={(v) => update('legalType', v as PartnerLegalType)}
          className='flex gap-6'
        >
          <div className='flex items-center gap-2'>
            <RadioGroupItem value='individual' id='legal-individual' />
            <Label htmlFor='legal-individual' className='cursor-pointer font-normal'>
              Cá nhân
            </Label>
          </div>
          <div className='flex items-center gap-2'>
            <RadioGroupItem value='company' id='legal-company' />
            <Label htmlFor='legal-company' className='cursor-pointer font-normal'>
              Doanh nghiệp
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='contactName'>Họ và tên *</Label>
          <Input
            id='contactName'
            value={form.contactName}
            onChange={(e) => update('contactName', e.target.value)}
          />
          {errors.contactName && <p className='text-destructive text-xs'>{errors.contactName}</p>}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='contactPhone'>Số điện thoại *</Label>
          <Input
            id='contactPhone'
            value={form.contactPhone}
            onChange={(e) => update('contactPhone', e.target.value)}
            placeholder='+84901234567'
          />
          {errors.contactPhone && <p className='text-destructive text-xs'>{errors.contactPhone}</p>}
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='contactEmail'>Email *</Label>
        <Input
          id='contactEmail'
          type='email'
          value={form.contactEmail}
          onChange={(e) => update('contactEmail', e.target.value)}
        />
        {errors.contactEmail && <p className='text-destructive text-xs'>{errors.contactEmail}</p>}
        <p className='text-muted-foreground text-xs'>
          Dùng để đăng nhập vào cổng đối tác sau khi được duyệt.
        </p>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='password'>Mật khẩu *</Label>
        <Input
          id='password'
          type='password'
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          placeholder='Ít nhất 6 ký tự'
        />
        {errors.password && <p className='text-destructive text-xs'>{errors.password}</p>}
      </div>

      {form.legalType === 'company' && (
        <div className='space-y-4 rounded-lg border p-4'>
          <div className='space-y-2'>
            <Label htmlFor='companyName'>Tên công ty *</Label>
            <Input
              id='companyName'
              value={form.companyName}
              onChange={(e) => update('companyName', e.target.value)}
            />
            {errors.companyName && <p className='text-destructive text-xs'>{errors.companyName}</p>}
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='taxCode'>Mã số thuế</Label>
              <Input
                id='taxCode'
                value={form.taxCode}
                onChange={(e) => update('taxCode', e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='businessAddress'>Địa chỉ kinh doanh</Label>
              <Input
                id='businessAddress'
                value={form.businessAddress}
                onChange={(e) => update('businessAddress', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className='space-y-4 rounded-lg border p-4'>
        <p className='text-sm font-medium'>
          {form.partnerType === 'kol' ? 'Thông tin kênh tiếp thị' : 'Thông tin kênh phân phối'}
        </p>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='channelUrl'>Link kênh (TikTok, Facebook, website...)</Label>
            <Input
              id='channelUrl'
              value={form.channelUrl}
              onChange={(e) => update('channelUrl', e.target.value)}
              placeholder='https://...'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='channelFollowers'>Số lượng người theo dõi / khách hàng</Label>
            <Input
              id='channelFollowers'
              type='number'
              value={form.channelFollowers}
              onChange={(e) => update('channelFollowers', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='notes'>Ghi chú thêm</Label>
        <Textarea
          id='notes'
          rows={3}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder='Chia sẻ thêm về kế hoạch hợp tác của bạn (không bắt buộc)'
        />
      </div>

      <Button type='submit' className='w-full' isLoading={mutation.isPending}>
        Gửi đăng ký
      </Button>
    </form>
  );
}
