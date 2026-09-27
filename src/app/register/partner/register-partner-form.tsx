'use client';

/**
 * Partner application form (#002).
 *
 * The first version asked for six cards' worth of survey answers — monthly
 * order ranges, audience size, content category, integration timeline, bank
 * account, referral source — before anyone could apply. None of it is needed to
 * decide an application, and the API has no column for most of it. This asks
 * for exactly what the public affiliate form asks for (/affiliate/dang-ky):
 * who you are, how to reach you, and which channel you sell on.
 */

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { applyAsPartnerMutation } from '@/features/partner-portal/api/mutations';
import {
  toApiPartnerType,
  type ApplyPartnerType
} from '@/features/partner-portal/lib/register-config';

const MIN_PASSWORD_LENGTH = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Vietnamese mobile or landline, with or without the +84 form. */
const PHONE_RE = /^(?:\+?84|0)\d{8,10}$/;
const URL_RE = /^https?:\/\/\S+$/i;

type Form = {
  partnerType: ApplyPartnerType | '';
  legalType: 'individual' | 'company' | '';
  contactName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  taxCode: string;
  businessAddress: string;
  channel: string;
  channelUrl: string;
  followers: string;
  notes: string;
  terms: boolean;
};

const EMPTY: Form = {
  partnerType: '',
  legalType: 'individual',
  contactName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  taxCode: '',
  businessAddress: '',
  channel: '',
  channelUrl: '',
  followers: '',
  notes: '',
  terms: false
};

const PARTNER_TYPE_CHOICES: { value: ApplyPartnerType; title: string; description: string }[] = [
  {
    value: 'marketing',
    title: 'Đối tác tiếp thị',
    description: 'Giới thiệu bằng liên kết hoặc mã giảm giá và nhận hoa hồng trên đơn hợp lệ.'
  },
  {
    value: 'distribution',
    title: 'Đối tác phân phối',
    description: 'Mua eSIM theo giá đối tác và bán lại cho khách hàng của bạn.'
  },
  {
    value: 'api',
    title: 'Đối tác tích hợp API',
    description: 'Đưa sản phẩm esim.vn vào website hoặc ứng dụng của bạn qua API.'
  }
];

const CHANNELS = [
  { value: 'website', label: 'Website hoặc blog' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'store', label: 'Cửa hàng hoặc điểm bán' },
  { value: 'travel', label: 'Công ty du lịch / đại lý vé' },
  { value: 'other', label: 'Kênh khác' }
];

/** Every rule the form enforces, in one place. */
function validate(form: Form): Record<string, string> {
  const e: Record<string, string> = {};

  if (!form.partnerType) e.partnerType = 'Chọn loại hình hợp tác.';
  if (!form.legalType) e.legalType = 'Chọn tư cách đăng ký.';
  if (!form.contactName.trim()) e.contactName = 'Nhập họ và tên người liên hệ.';
  if (!EMAIL_RE.test(form.email.trim())) e.email = 'Nhập email hợp lệ.';
  if (!PHONE_RE.test(form.phone.replace(/[\s.]/g, ''))) {
    e.phone = 'Nhập số điện thoại Việt Nam hợp lệ.';
  }
  if (form.password.length < MIN_PASSWORD_LENGTH) {
    e.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  }
  if (form.confirmPassword !== form.password) {
    e.confirmPassword = 'Mật khẩu nhập lại không khớp.';
  }

  if (form.legalType === 'company') {
    if (!form.companyName.trim()) e.companyName = 'Nhập tên công ty.';
    if (!form.taxCode.trim()) e.taxCode = 'Nhập mã số thuế.';
  }

  if (!form.channel) e.channel = 'Chọn kênh bán chính.';
  if (form.channelUrl.trim() && !URL_RE.test(form.channelUrl.trim())) {
    e.channelUrl = 'Đường dẫn cần bắt đầu bằng http:// hoặc https://.';
  }
  if (form.followers.trim() && !/^\d{1,12}$/.test(form.followers.trim())) {
    e.followers = 'Số người theo dõi chỉ gồm chữ số.';
  }
  if (form.notes.trim().length > 2000) e.notes = 'Ghi chú tối đa 2000 ký tự.';
  if (!form.terms) e.terms = 'Bạn cần đồng ý với điều khoản trước khi gửi.';

  return e;
}

export function RegisterPartnerForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);

  const errors = useMemo(() => validate(form), [form]);
  const isCompany = form.legalType === 'company';

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const markTouched = (key: string) => setTouched((t) => ({ ...t, [key]: true }));

  /** An error only surfaces once the applicant has left that field, or submitted. */
  const errorFor = (key: string) => (submitted || touched[key] ? errors[key] : undefined);

  const apply = useMutation({
    ...applyAsPartnerMutation,
    onSuccess: () => {
      setSent(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ block: 'center' });
      return;
    }

    apply.mutate({
      partnerType: toApiPartnerType(form.partnerType as ApplyPartnerType),
      legalType: form.legalType as 'individual' | 'company',
      contactName: form.contactName.trim(),
      contactPhone: form.phone.trim(),
      contactEmail: form.email.trim(),
      password: form.password,
      ...(isCompany
        ? {
            companyName: form.companyName.trim(),
            taxCode: form.taxCode.trim(),
            ...(form.businessAddress.trim() ? { businessAddress: form.businessAddress.trim() } : {})
          }
        : {}),
      channelInfo: {
        // The portal offers API integration, which the API stores as a
        // distribution partner — keep the applicant's own answer here.
        model: form.partnerType,
        channel: form.channel,
        ...(form.channelUrl.trim() ? { url: form.channelUrl.trim() } : {}),
        ...(form.followers.trim() ? { followers: Number(form.followers.trim()) } : {})
      },
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {})
    });
  };

  /** One labelled field with its inline error. */
  const Field = ({
    name,
    label,
    required,
    children,
    help
  }: {
    name: string;
    label: string;
    required?: boolean;
    children: React.ReactNode;
    help?: string;
  }) => {
    const error = errorFor(name);
    return (
      <div className='space-y-2'>
        <Label htmlFor={name}>
          {label}
          {required && <span className='text-destructive'> *</span>}
        </Label>
        {children}
        {error ? (
          <p id={`${name}-error`} className='text-destructive text-xs'>
            {error}
          </p>
        ) : (
          help && <p className='text-muted-foreground text-xs'>{help}</p>
        )}
      </div>
    );
  };

  const textProps = (name: keyof Form) => ({
    id: name,
    value: form[name] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(name, e.target.value as Form[typeof name]),
    onBlur: () => markTouched(name),
    'aria-invalid': Boolean(errorFor(name)),
    'aria-describedby': errorFor(name) ? `${name}-error` : undefined
  });

  if (sent) {
    return (
      <Card>
        <CardHeader className='items-center text-center'>
          <div className='bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full'>
            <Icons.check className='size-6' />
          </div>
          <CardTitle className='mt-2'>Đã gửi hồ sơ đăng ký</CardTitle>
          <CardDescription>
            Hồ sơ của bạn đang chờ xét duyệt. Kết quả sẽ được gửi qua email{' '}
            <span className='text-foreground font-medium'>{form.email.trim()}</span> trong 1 - 3
            ngày làm việc.
          </CardDescription>
        </CardHeader>
        <CardFooter className='justify-center'>
          <Button asChild variant='outline'>
            <a href='/auth/sign-in'>Về trang đăng nhập</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className='space-y-4' noValidate>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Loại hình hợp tác</CardTitle>
          <CardDescription>Chọn hình thức bạn muốn hợp tác với esim.vn.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-2'>
          <div className='grid gap-3 md:grid-cols-3'>
            {PARTNER_TYPE_CHOICES.map((choice) => (
              <button
                type='button'
                key={choice.value}
                onClick={() => {
                  set('partnerType', choice.value);
                  markTouched('partnerType');
                }}
                aria-pressed={form.partnerType === choice.value}
                className={cn(
                  'rounded-lg border p-4 text-left transition-colors',
                  form.partnerType === choice.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent/50'
                )}
              >
                <p className='text-sm font-medium'>{choice.title}</p>
                <p className='text-muted-foreground mt-1 text-xs'>{choice.description}</p>
              </button>
            ))}
          </div>
          {errorFor('partnerType') && (
            <p className='text-destructive text-xs'>{errorFor('partnerType')}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Thông tin tài khoản</CardTitle>
          <CardDescription>
            Email và mật khẩu này chính là tài khoản đăng nhập trang quản lý đối tác.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Field name='legalType' label='Tư cách đăng ký' required>
            <RadioGroup
              value={form.legalType}
              onValueChange={(v) => set('legalType', v as Form['legalType'])}
              className='flex flex-wrap gap-4'
            >
              <div className='flex items-center gap-2'>
                <RadioGroupItem value='individual' id='legalType-individual' />
                <Label htmlFor='legalType-individual' className='font-normal'>
                  Cá nhân
                </Label>
              </div>
              <div className='flex items-center gap-2'>
                <RadioGroupItem value='company' id='legalType-company' />
                <Label htmlFor='legalType-company' className='font-normal'>
                  Công ty
                </Label>
              </div>
            </RadioGroup>
          </Field>

          <div className='grid gap-4 md:grid-cols-2'>
            <Field name='contactName' label='Họ và tên người liên hệ' required>
              <Input {...textProps('contactName')} placeholder='Nguyễn Văn A' />
            </Field>
            <Field name='phone' label='Số điện thoại' required>
              <Input {...textProps('phone')} inputMode='tel' placeholder='0901234567' />
            </Field>
            <Field
              name='email'
              label='Email'
              required
              help='Dùng để đăng nhập và nhận kết quả xét duyệt.'
            >
              <Input {...textProps('email')} type='email' placeholder='ban@congty.com' />
            </Field>
            <div className='hidden md:block' />
            <Field name='password' label='Mật khẩu' required help='Tối thiểu 6 ký tự.'>
              <Input {...textProps('password')} type='password' placeholder='••••••' />
            </Field>
            <Field name='confirmPassword' label='Nhập lại mật khẩu' required>
              <Input {...textProps('confirmPassword')} type='password' placeholder='••••••' />
            </Field>
          </div>

          {isCompany && (
            <div className='grid gap-4 md:grid-cols-2'>
              <Field name='companyName' label='Tên công ty' required>
                <Input {...textProps('companyName')} placeholder='Công ty TNHH ABC' />
              </Field>
              <Field name='taxCode' label='Mã số thuế' required>
                <Input {...textProps('taxCode')} placeholder='0312345678' />
              </Field>
              <div className='md:col-span-2'>
                <Field name='businessAddress' label='Địa chỉ đăng ký kinh doanh'>
                  <Input
                    {...textProps('businessAddress')}
                    placeholder='123 Nguyễn Huệ, Q1, TPHCM'
                  />
                </Field>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Kênh bán hàng</CardTitle>
          <CardDescription>
            Cho chúng tôi biết bạn giới thiệu hoặc bán eSIM ở đâu để xét duyệt nhanh hơn.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <Field name='channel' label='Kênh bán chính' required>
              <Select
                value={form.channel}
                onValueChange={(v) => {
                  set('channel', v);
                  markTouched('channel');
                }}
              >
                <SelectTrigger
                  id='channel'
                  className='w-full'
                  aria-invalid={Boolean(errorFor('channel'))}
                >
                  <SelectValue placeholder='Chọn kênh' />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((channel) => (
                    <SelectItem key={channel.value} value={channel.value}>
                      {channel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field name='channelUrl' label='Đường dẫn kênh'>
              <Input {...textProps('channelUrl')} placeholder='https://tiktok.com/@kenh-cua-ban' />
            </Field>
            <Field name='followers' label='Số người theo dõi'>
              <Input {...textProps('followers')} inputMode='numeric' placeholder='50000' />
            </Field>
          </div>
          <Field name='notes' label='Ghi chú thêm'>
            <Textarea
              {...textProps('notes')}
              rows={3}
              placeholder='Mong muốn hợp tác, nhóm khách hàng, sản lượng dự kiến...'
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className='space-y-4 pt-6'>
          <div className='flex items-start gap-3'>
            <Checkbox
              id='terms'
              checked={form.terms}
              onCheckedChange={(v) => {
                set('terms', v === true);
                markTouched('terms');
              }}
              aria-invalid={Boolean(errorFor('terms'))}
            />
            <Label htmlFor='terms' className='text-sm leading-relaxed font-normal'>
              Tôi đồng ý với{' '}
              <a href='/terms-of-service' className='underline underline-offset-4'>
                điều khoản chương trình đối tác
              </a>{' '}
              của esim.vn.
            </Label>
          </div>
          {errorFor('terms') && <p className='text-destructive text-xs'>{errorFor('terms')}</p>}

          {apply.isError && (
            <p className='text-destructive text-sm'>
              {(apply.error as Error)?.message || 'Gửi hồ sơ thất bại, vui lòng thử lại.'}
            </p>
          )}

          <Button type='submit' className='w-full' disabled={apply.isPending}>
            {apply.isPending && <Icons.spinner className='animate-spin' />}
            Gửi hồ sơ đăng ký
          </Button>
          <p className='text-muted-foreground text-center text-xs'>
            Hồ sơ được xét duyệt thủ công, kết quả gửi qua email trong 1 - 3 ngày làm việc.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
