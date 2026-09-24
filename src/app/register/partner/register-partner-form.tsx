'use client';

/**
 * Partner application form.
 *
 * Six sections in the admin console's form idiom: Card per section, shadcn
 * inputs, and the error for a field sitting under that field and wired through
 * `aria-describedby`. Fields that only apply to one partner type or payment
 * method stay hidden until they apply, so the form opens short.
 */

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
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
  API_EXPERIENCE,
  AUDIENCE_SIZES,
  CONTENT_CATEGORIES,
  COUNTRIES,
  CUSTOMER_SEGMENTS,
  DISTRIBUTION_MODELS,
  INTEGRATION_TIMELINES,
  MONTHLY_ORDER_RANGES,
  PARTNER_CONFIGS,
  REFERRAL_SOURCES,
  toApiPartnerType,
  type ApplyPartnerType
} from '@/features/partner-portal/lib/register-config';

const MIN_PASSWORD_LENGTH = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{8,15}$/;

type Form = {
  partnerType: ApplyPartnerType | '';
  legalType: 'individual' | 'company' | '';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  position: string;
  organizationName: string;
  taxCode: string;
  website: string;
  monthlyOrders: string;
  primaryChannel: string;
  audienceSize: string;
  contentCategory: string;
  distributionModel: string;
  customerSegment: string;
  technicalEmail: string;
  apiExperience: string;
  integrationTimeline: string;
  address: string;
  address2: string;
  country: string;
  city: string;
  paymentMethod: 'bank' | 'paypal' | '';
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankBranch: string;
  swiftCode: string;
  paypalEmail: string;
  referralSource: string;
  cooperationPlan: string;
  terms: boolean;
};

const EMPTY: Form = {
  partnerType: '',
  legalType: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  position: '',
  organizationName: '',
  taxCode: '',
  website: '',
  monthlyOrders: '',
  primaryChannel: '',
  audienceSize: '',
  contentCategory: '',
  distributionModel: '',
  customerSegment: '',
  technicalEmail: '',
  apiExperience: '',
  integrationTimeline: '',
  address: '',
  address2: '',
  country: '',
  city: '',
  paymentMethod: '',
  bankName: '',
  accountName: '',
  accountNumber: '',
  bankBranch: '',
  swiftCode: '',
  paypalEmail: '',
  referralSource: '',
  cooperationPlan: '',
  terms: false
};

const PARTNER_TYPE_CHOICES: { value: ApplyPartnerType; title: string; description: string }[] = [
  {
    value: 'marketing',
    title: 'Đối tác tiếp thị',
    description: 'Quảng bá bằng liên kết hoặc mã giảm giá và nhận hoa hồng trên đơn hợp lệ.'
  },
  {
    value: 'distribution',
    title: 'Đối tác phân phối',
    description: 'Bán hoặc phân phối eSIM theo chính sách giá và sản lượng riêng.'
  },
  {
    value: 'api',
    title: 'Đối tác tích hợp API',
    description: 'Tích hợp kho sản phẩm, đặt hàng và quản lý eSIM trong hệ thống của bạn.'
  }
];

/** Every rule the form enforces, in one place. */
function validate(form: Form): Record<string, string> {
  const e: Record<string, string> = {};

  if (!form.partnerType) e.partnerType = 'Chọn loại hình hợp tác.';
  if (!form.legalType) e.legalType = 'Chọn tư cách đăng ký.';
  if (!form.firstName.trim()) e.firstName = 'Nhập tên.';
  if (!form.lastName.trim()) e.lastName = 'Nhập họ và tên đệm.';
  if (!EMAIL_RE.test(form.email.trim())) e.email = 'Nhập email hợp lệ.';
  if (!PHONE_RE.test(form.phone.replace(/\D/g, ''))) e.phone = 'Số điện thoại cần 8–15 chữ số.';
  if (form.password.length < MIN_PASSWORD_LENGTH) {
    e.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  }
  if (!form.organizationName.trim()) e.organizationName = 'Nhập tên thương hiệu hoặc đơn vị.';
  if (form.legalType === 'company' && !form.taxCode.trim()) e.taxCode = 'Nhập mã số thuế.';
  if (!/^https?:\/\/.+/.test(form.website.trim())) {
    e.website = 'Đường dẫn cần bắt đầu bằng http:// hoặc https://.';
  }
  if (!form.monthlyOrders) e.monthlyOrders = 'Chọn sản lượng ước tính.';
  if (!form.primaryChannel) e.primaryChannel = 'Chọn kênh hoạt động chính.';

  if (form.partnerType === 'marketing') {
    if (!form.audienceSize) e.audienceSize = 'Chọn quy mô tiếp cận.';
    if (!form.contentCategory) e.contentCategory = 'Chọn chủ đề nội dung.';
  }
  if (form.partnerType === 'distribution') {
    if (!form.distributionModel) e.distributionModel = 'Chọn mô hình phân phối.';
    if (!form.customerSegment) e.customerSegment = 'Chọn nhóm khách hàng.';
  }
  if (form.partnerType === 'api') {
    if (!EMAIL_RE.test(form.technicalEmail.trim()))
      e.technicalEmail = 'Nhập email kỹ thuật hợp lệ.';
    if (!form.apiExperience) e.apiExperience = 'Chọn năng lực tích hợp.';
    if (!form.integrationTimeline) e.integrationTimeline = 'Chọn thời gian dự kiến.';
  }

  if (!form.address.trim()) e.address = 'Nhập địa chỉ.';
  if (!form.country) e.country = 'Chọn quốc gia.';
  if (!form.city.trim()) e.city = 'Nhập tỉnh hoặc thành phố.';

  if (!form.paymentMethod) e.paymentMethod = 'Chọn phương thức thanh toán.';
  if (form.paymentMethod === 'bank') {
    if (!form.bankName.trim()) e.bankName = 'Nhập tên ngân hàng.';
    if (!form.accountName.trim()) e.accountName = 'Nhập tên chủ tài khoản.';
    if (!form.accountNumber.trim()) e.accountNumber = 'Nhập số tài khoản.';
  }
  if (form.paymentMethod === 'paypal' && !EMAIL_RE.test(form.paypalEmail.trim())) {
    e.paypalEmail = 'Nhập email PayPal hợp lệ.';
  }

  if (!form.referralSource) e.referralSource = 'Chọn nguồn bạn biết đến chương trình.';
  if (!form.cooperationPlan.trim()) e.cooperationPlan = 'Mô tả kế hoạch hợp tác.';
  if (!form.terms) e.terms = 'Bạn cần đồng ý với điều khoản trước khi gửi.';

  return e;
}

export function RegisterPartnerForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [applicationCode, setApplicationCode] = useState<string | null>(null);

  const config = form.partnerType ? PARTNER_CONFIGS[form.partnerType] : null;
  const errors = useMemo(() => validate(form), [form]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const markTouched = (key: string) => setTouched((t) => ({ ...t, [key]: true }));

  /** An error only surfaces once the partner has left that field, or submitted. */
  const errorFor = (key: string) => (submitted || touched[key] ? errors[key] : undefined);

  const apply = useMutation({
    ...applyAsPartnerMutation,
    onSuccess: () => {
      setApplicationCode(`${config?.prefix ?? 'PTN'}-${Date.now().toString().slice(-8)}`);
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

    // Anything the application endpoint has no column for travels in
    // `channelInfo`, so nothing the partner filled in is dropped.
    const channelInfo: Record<string, unknown> = {
      model: form.partnerType,
      website: form.website.trim(),
      primaryChannel: form.primaryChannel,
      monthlyOrders: form.monthlyOrders,
      paymentMethod: form.paymentMethod,
      referralSource: form.referralSource,
      cooperationPlan: form.cooperationPlan.trim(),
      country: form.country,
      city: form.city.trim(),
      ...(form.position.trim() ? { position: form.position.trim() } : {}),
      ...(form.partnerType === 'marketing'
        ? { audienceSize: form.audienceSize, contentCategory: form.contentCategory }
        : {}),
      ...(form.partnerType === 'distribution'
        ? { distributionModel: form.distributionModel, customerSegment: form.customerSegment }
        : {}),
      ...(form.partnerType === 'api'
        ? {
            integrationType: 'api',
            technicalEmail: form.technicalEmail.trim(),
            apiExperience: form.apiExperience,
            integrationTimeline: form.integrationTimeline
          }
        : {}),
      ...(form.paymentMethod === 'bank'
        ? {
            bankName: form.bankName.trim(),
            accountName: form.accountName.trim(),
            accountNumber: form.accountNumber.trim(),
            bankBranch: form.bankBranch.trim() || undefined,
            swiftCode: form.swiftCode.trim() || undefined
          }
        : { paypalEmail: form.paypalEmail.trim() })
    };

    apply.mutate({
      partnerType: toApiPartnerType(form.partnerType as ApplyPartnerType),
      legalType: form.legalType as 'individual' | 'company',
      contactName: `${form.lastName.trim()} ${form.firstName.trim()}`.trim(),
      contactPhone: form.phone.trim(),
      contactEmail: form.email.trim(),
      password: form.password,
      companyName: form.organizationName.trim(),
      businessAddress: [form.address.trim(), form.address2.trim(), form.city.trim()]
        .filter(Boolean)
        .join(', '),
      ...(form.taxCode.trim() ? { taxCode: form.taxCode.trim() } : {}),
      channelInfo
    });
  };

  /** One labelled text field with its inline error. */
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
    'aria-invalid': Boolean(errorFor(name)),
    'aria-describedby': `${name}-error`,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(name, e.target.value as Form[typeof name]),
    onBlur: () => markTouched(name)
  });

  if (applicationCode) {
    return (
      <Card className='mx-auto max-w-2xl text-center'>
        <CardHeader>
          <div className='bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full'>
            <Icons.check className='size-6' />
          </div>
          <CardTitle className='mt-4 text-2xl'>Hồ sơ đã được gửi</CardTitle>
          <CardDescription>
            {config?.success ??
              'Cảm ơn bạn đã đăng ký chương trình đối tác esim.vn. Chúng tôi sẽ phản hồi qua thông tin liên hệ bạn đã cung cấp.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-xs'>Mã hồ sơ của bạn</p>
          <p className='mt-1 font-mono text-lg font-semibold'>{applicationCode}</p>
        </CardContent>
        <CardFooter className='justify-center'>
          <Button
            variant='outline'
            onClick={() => {
              setForm(EMPTY);
              setTouched({});
              setSubmitted(false);
              setApplicationCode(null);
            }}
          >
            Tạo hồ sơ mới
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} noValidate className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>1. Loại hình hợp tác</CardTitle>
          <CardDescription>Chọn mô hình kinh doanh và tư cách pháp nhân phù hợp.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-3'>
            <Label>
              Bạn muốn đăng ký theo hình thức nào?<span className='text-destructive'> *</span>
            </Label>
            <RadioGroup
              value={form.partnerType}
              onValueChange={(v) => {
                set('partnerType', v as ApplyPartnerType);
                // The channel list is per-type; a stale pick would be invalid.
                set('primaryChannel', '');
                markTouched('partnerType');
              }}
              className='grid gap-3 md:grid-cols-3'
            >
              {PARTNER_TYPE_CHOICES.map((choice) => (
                <Label
                  key={choice.value}
                  htmlFor={`partnerType-${choice.value}`}
                  className={cn(
                    'hover:bg-accent flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                    form.partnerType === choice.value && 'border-primary bg-primary/5'
                  )}
                >
                  <RadioGroupItem
                    id={`partnerType-${choice.value}`}
                    value={choice.value}
                    className='mt-0.5'
                  />
                  <span className='space-y-1'>
                    <span className='block text-sm font-medium'>{choice.title}</span>
                    <span className='text-muted-foreground block text-xs'>
                      {choice.description}
                    </span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
            {errorFor('partnerType') && (
              <p className='text-destructive text-xs'>{errorFor('partnerType')}</p>
            )}
            {config && (
              <div className='bg-muted/40 flex gap-3 rounded-lg border p-3'>
                <Icons.info className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                <p className='text-muted-foreground text-xs'>{config.note}</p>
              </div>
            )}
          </div>

          <div className='space-y-3'>
            <Label>
              Tư cách đăng ký<span className='text-destructive'> *</span>
            </Label>
            <RadioGroup
              value={form.legalType}
              onValueChange={(v) => {
                set('legalType', v as 'individual' | 'company');
                markTouched('legalType');
              }}
              className='grid gap-3 md:grid-cols-2'
            >
              {(
                [
                  ['individual', 'Cá nhân', 'Nhận thanh toán theo hồ sơ cá nhân.'],
                  ['company', 'Doanh nghiệp', 'Công ty, hộ kinh doanh hoặc tổ chức có pháp nhân.']
                ] as const
              ).map(([value, title, description]) => (
                <Label
                  key={value}
                  htmlFor={`legalType-${value}`}
                  className={cn(
                    'hover:bg-accent flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                    form.legalType === value && 'border-primary bg-primary/5'
                  )}
                >
                  <RadioGroupItem id={`legalType-${value}`} value={value} className='mt-0.5' />
                  <span className='space-y-1'>
                    <span className='block text-sm font-medium'>{title}</span>
                    <span className='text-muted-foreground block text-xs'>{description}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
            {errorFor('legalType') && (
              <p className='text-destructive text-xs'>{errorFor('legalType')}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Thông tin liên hệ</CardTitle>
          <CardDescription>Người đại diện để esim.vn liên hệ và xác minh hồ sơ.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <Field name='firstName' label='Tên' required>
            <Input
              placeholder='Ví dụ: Minh'
              autoComplete='given-name'
              {...textProps('firstName')}
            />
          </Field>
          <Field name='lastName' label='Họ và tên đệm' required>
            <Input
              placeholder='Ví dụ: Trần Hoàng'
              autoComplete='family-name'
              {...textProps('lastName')}
            />
          </Field>
          <Field name='email' label='Email' required>
            <Input
              type='email'
              autoComplete='email'
              placeholder='tenban@example.com'
              {...textProps('email')}
            />
          </Field>
          <Field name='phone' label='Số điện thoại' required>
            <Input
              type='tel'
              inputMode='tel'
              autoComplete='tel'
              placeholder='0901234567'
              {...textProps('phone')}
            />
          </Field>
          <Field
            name='password'
            label='Mật khẩu đăng nhập cổng đối tác'
            required
            help={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`}
          >
            <Input type='password' autoComplete='new-password' {...textProps('password')} />
          </Field>
          {form.legalType === 'company' && (
            <Field name='position' label='Chức vụ'>
              <Input placeholder='Giám đốc, quản lý kinh doanh…' {...textProps('position')} />
            </Field>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Thông tin hoạt động</CardTitle>
          <CardDescription>
            {config?.business ?? 'Giúp chúng tôi đánh giá quy mô và đề xuất chính sách phù hợp.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <Field name='organizationName' label='Tên thương hiệu hoặc đơn vị' required>
            <Input placeholder='Ví dụ: Kênh du lịch cùng tôi' {...textProps('organizationName')} />
          </Field>
          {form.legalType === 'company' && (
            <Field name='taxCode' label='Mã số thuế' required>
              <Input inputMode='numeric' {...textProps('taxCode')} />
            </Field>
          )}
          <div className='md:col-span-2'>
            <Field
              name='website'
              label={config?.websiteLabel ?? 'Website hoặc kênh hoạt động chính'}
              required
            >
              <Input
                type='url'
                placeholder={config?.websitePlaceholder ?? 'https://website.com'}
                {...textProps('website')}
              />
            </Field>
          </div>
          <Field
            name='monthlyOrders'
            label={config?.monthlyLabel ?? 'Sản lượng ước tính mỗi tháng'}
            required
          >
            <Select
              value={form.monthlyOrders}
              onValueChange={(v) => {
                set('monthlyOrders', v);
                markTouched('monthlyOrders');
              }}
            >
              <SelectTrigger
                id='monthlyOrders'
                className='w-full'
                aria-invalid={Boolean(errorFor('monthlyOrders'))}
              >
                <SelectValue placeholder='Chọn sản lượng ước tính' />
              </SelectTrigger>
              <SelectContent>
                {MONTHLY_ORDER_RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            name='primaryChannel'
            label={config?.channelLabel ?? 'Kênh hoạt động chính'}
            required
            help={config ? undefined : 'Chọn loại hình hợp tác trước.'}
          >
            <Select
              value={form.primaryChannel}
              disabled={!config}
              onValueChange={(v) => {
                set('primaryChannel', v);
                markTouched('primaryChannel');
              }}
            >
              <SelectTrigger
                id='primaryChannel'
                className='w-full'
                aria-invalid={Boolean(errorFor('primaryChannel'))}
              >
                <SelectValue placeholder={config ? 'Chọn kênh' : 'Chọn loại hình trước'} />
              </SelectTrigger>
              <SelectContent>
                {(config?.channels ?? []).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {form.partnerType === 'marketing' && (
            <>
              <Field name='audienceSize' label='Quy mô tiếp cận mỗi tháng' required>
                <Select
                  value={form.audienceSize}
                  onValueChange={(v) => {
                    set('audienceSize', v);
                    markTouched('audienceSize');
                  }}
                >
                  <SelectTrigger
                    id='audienceSize'
                    className='w-full'
                    aria-invalid={Boolean(errorFor('audienceSize'))}
                  >
                    <SelectValue placeholder='Chọn quy mô' />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_SIZES.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field name='contentCategory' label='Chủ đề nội dung chính' required>
                <Select
                  value={form.contentCategory}
                  onValueChange={(v) => {
                    set('contentCategory', v);
                    markTouched('contentCategory');
                  }}
                >
                  <SelectTrigger
                    id='contentCategory'
                    className='w-full'
                    aria-invalid={Boolean(errorFor('contentCategory'))}
                  >
                    <SelectValue placeholder='Chọn chủ đề' />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}

          {form.partnerType === 'distribution' && (
            <>
              <Field name='distributionModel' label='Mô hình phân phối' required>
                <Select
                  value={form.distributionModel}
                  onValueChange={(v) => {
                    set('distributionModel', v);
                    markTouched('distributionModel');
                  }}
                >
                  <SelectTrigger
                    id='distributionModel'
                    className='w-full'
                    aria-invalid={Boolean(errorFor('distributionModel'))}
                  >
                    <SelectValue placeholder='Chọn mô hình' />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTRIBUTION_MODELS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field name='customerSegment' label='Nhóm khách hàng chính' required>
                <Select
                  value={form.customerSegment}
                  onValueChange={(v) => {
                    set('customerSegment', v);
                    markTouched('customerSegment');
                  }}
                >
                  <SelectTrigger
                    id='customerSegment'
                    className='w-full'
                    aria-invalid={Boolean(errorFor('customerSegment'))}
                  >
                    <SelectValue placeholder='Chọn nhóm khách hàng' />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOMER_SEGMENTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}

          {form.partnerType === 'api' && (
            <>
              <Field name='technicalEmail' label='Email đầu mối kỹ thuật' required>
                <Input
                  type='email'
                  placeholder='tech@example.com'
                  {...textProps('technicalEmail')}
                />
              </Field>
              <Field name='apiExperience' label='Năng lực tích hợp hiện tại' required>
                <Select
                  value={form.apiExperience}
                  onValueChange={(v) => {
                    set('apiExperience', v);
                    markTouched('apiExperience');
                  }}
                >
                  <SelectTrigger
                    id='apiExperience'
                    className='w-full'
                    aria-invalid={Boolean(errorFor('apiExperience'))}
                  >
                    <SelectValue placeholder='Chọn năng lực' />
                  </SelectTrigger>
                  <SelectContent>
                    {API_EXPERIENCE.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className='md:col-span-2'>
                <Field name='integrationTimeline' label='Thời gian dự kiến triển khai' required>
                  <Select
                    value={form.integrationTimeline}
                    onValueChange={(v) => {
                      set('integrationTimeline', v);
                      markTouched('integrationTimeline');
                    }}
                  >
                    <SelectTrigger
                      id='integrationTimeline'
                      className='w-full'
                      aria-invalid={Boolean(errorFor('integrationTimeline'))}
                    >
                      <SelectValue placeholder='Chọn thời gian' />
                    </SelectTrigger>
                    <SelectContent>
                      {INTEGRATION_TIMELINES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Địa chỉ</CardTitle>
          <CardDescription>Địa chỉ cá nhân hoặc trụ sở kinh doanh.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <div className='md:col-span-2'>
            <Field name='address' label='Địa chỉ' required>
              <Input
                autoComplete='street-address'
                placeholder='Số nhà, tên đường, phường/xã'
                {...textProps('address')}
              />
            </Field>
          </div>
          <div className='md:col-span-2'>
            <Field name='address2' label='Tầng, toà nhà hoặc thông tin bổ sung'>
              <Input placeholder='Không bắt buộc' {...textProps('address2')} />
            </Field>
          </div>
          <Field name='country' label='Quốc gia' required>
            <Select
              value={form.country}
              onValueChange={(v) => {
                set('country', v);
                markTouched('country');
              }}
            >
              <SelectTrigger
                id='country'
                className='w-full'
                aria-invalid={Boolean(errorFor('country'))}
              >
                <SelectValue placeholder='Chọn quốc gia' />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field name='city' label='Tỉnh, thành phố' required>
            <Input
              autoComplete='address-level2'
              placeholder='Thành phố Hồ Chí Minh'
              {...textProps('city')}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Thanh toán</CardTitle>
          <CardDescription>
            {config?.payment ?? 'Phương thức nhận hoa hồng hoặc khoản thanh toán phát sinh.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-3'>
            <Label>
              Phương thức thanh toán<span className='text-destructive'> *</span>
            </Label>
            <RadioGroup
              value={form.paymentMethod}
              onValueChange={(v) => {
                set('paymentMethod', v as 'bank' | 'paypal');
                markTouched('paymentMethod');
              }}
              className='grid gap-3 md:grid-cols-2'
            >
              {(
                [
                  ['bank', 'Tài khoản ngân hàng', 'Nhận thanh toán bằng chuyển khoản.'],
                  ['paypal', 'PayPal', 'Nhận thanh toán qua email PayPal.']
                ] as const
              ).map(([value, title, description]) => (
                <Label
                  key={value}
                  htmlFor={`payment-${value}`}
                  className={cn(
                    'hover:bg-accent flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                    form.paymentMethod === value && 'border-primary bg-primary/5'
                  )}
                >
                  <RadioGroupItem id={`payment-${value}`} value={value} className='mt-0.5' />
                  <span className='space-y-1'>
                    <span className='block text-sm font-medium'>{title}</span>
                    <span className='text-muted-foreground block text-xs'>{description}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
            {errorFor('paymentMethod') && (
              <p className='text-destructive text-xs'>{errorFor('paymentMethod')}</p>
            )}
          </div>

          {form.paymentMethod === 'bank' && (
            <div className='grid gap-4 md:grid-cols-2'>
              <Field name='bankName' label='Tên ngân hàng' required>
                <Input placeholder='Vietcombank' {...textProps('bankName')} />
              </Field>
              <Field name='accountName' label='Tên chủ tài khoản' required>
                <Input {...textProps('accountName')} />
              </Field>
              <Field name='accountNumber' label='Số tài khoản' required>
                <Input inputMode='numeric' {...textProps('accountNumber')} />
              </Field>
              <Field name='bankBranch' label='Chi nhánh'>
                <Input placeholder='Không bắt buộc' {...textProps('bankBranch')} />
              </Field>
              <Field name='swiftCode' label='Mã SWIFT' help='Chỉ cần cho chuyển khoản quốc tế.'>
                <Input {...textProps('swiftCode')} />
              </Field>
            </div>
          )}

          {form.paymentMethod === 'paypal' && (
            <Field name='paypalEmail' label='Email PayPal' required>
              <Input type='email' placeholder='paypal@example.com' {...textProps('paypalEmail')} />
            </Field>
          )}

          <p className='text-muted-foreground text-xs'>
            Thông tin thanh toán chỉ được dùng sau khi hồ sơ được duyệt. Bạn có thể cập nhật lại
            trong cổng đối tác trước giao dịch đầu tiên.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Thông tin bổ sung</CardTitle>
          <CardDescription>
            {config?.additional ?? 'Giúp đội ngũ esim.vn hiểu nhu cầu và kế hoạch của bạn.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Field name='referralSource' label='Bạn biết đến chương trình qua đâu?' required>
            <Select
              value={form.referralSource}
              onValueChange={(v) => {
                set('referralSource', v);
                markTouched('referralSource');
              }}
            >
              <SelectTrigger
                id='referralSource'
                className='w-full'
                aria-invalid={Boolean(errorFor('referralSource'))}
              >
                <SelectValue placeholder='Chọn một nguồn' />
              </SelectTrigger>
              <SelectContent>
                {REFERRAL_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            name='cooperationPlan'
            label={config?.planLabel ?? 'Bạn dự định hợp tác như thế nào?'}
            required
          >
            <Textarea
              rows={5}
              placeholder={config?.planPlaceholder ?? 'Mô tả mục tiêu và cách triển khai.'}
              {...textProps('cooperationPlan')}
            />
          </Field>

          <div className='space-y-2'>
            <div className='flex items-start gap-3 rounded-lg border p-4'>
              <Checkbox
                id='terms'
                checked={form.terms}
                aria-invalid={Boolean(errorFor('terms'))}
                onCheckedChange={(checked) => {
                  set('terms', checked === true);
                  markTouched('terms');
                }}
                className='mt-0.5'
              />
              <Label htmlFor='terms' className='cursor-pointer font-normal'>
                <span className='block text-sm font-medium'>
                  Tôi đồng ý với điều khoản của chương trình đối tác.
                </span>
                <span className='text-muted-foreground mt-1 block text-xs'>
                  Tôi xác nhận thông tin đã cung cấp là chính xác và đồng ý tuân thủ{' '}
                  <a href='/terms-of-service' className='underline underline-offset-2'>
                    Điều khoản chương trình
                  </a>{' '}
                  cùng{' '}
                  <a href='/privacy-policy' className='underline underline-offset-2'>
                    Chính sách quyền riêng tư
                  </a>
                  .
                </span>
              </Label>
            </div>
            {errorFor('terms') && <p className='text-destructive text-xs'>{errorFor('terms')}</p>}
          </div>
        </CardContent>
        <CardFooter className='flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <p className='text-muted-foreground text-xs'>
            Hồ sơ được xem xét thủ công. Chúng tôi có thể liên hệ để yêu cầu bổ sung thông tin.
          </p>
          <div className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setForm(EMPTY);
                setTouched({});
                setSubmitted(false);
              }}
            >
              Nhập lại
            </Button>
            <Button type='submit' isLoading={apply.isPending}>
              Gửi hồ sơ đăng ký
            </Button>
          </div>
        </CardFooter>
      </Card>

      {apply.isError && (
        <Card className='border-destructive'>
          <CardHeader>
            <CardTitle className='text-destructive flex items-center gap-2 text-base'>
              <Icons.alertCircle className='size-4' />
              Không gửi được hồ sơ
            </CardTitle>
            <CardDescription>
              Email có thể đã được đăng ký. Kiểm tra lại hoặc thử lại sau ít phút.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {submitted && Object.keys(errors).length > 0 && (
        <Badge variant='destructive'>
          Còn {Object.keys(errors).length} trường cần kiểm tra lại
        </Badge>
      )}
    </form>
  );
}
