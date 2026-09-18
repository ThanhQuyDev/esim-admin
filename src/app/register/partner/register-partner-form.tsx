'use client';

/**
 * Partner application form, ported from dang-ky-doi-tac-esim.html.
 *
 * Six sections, the conditional panels that open per partner type and payment
 * method, inline `.error` messages that only show once a field has been touched
 * or the form submitted, and the success panel that replaces the form. Markup
 * and class names are the design file's; `partner-register.css` styles them.
 */

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{8,15}$/;

/** Every rule the mockup enforces, in one place so the panels stay in sync. */
function validate(form: Form): Record<string, boolean> {
  const invalid: Record<string, boolean> = {};

  if (!form.partnerType) invalid.partnerType = true;
  if (!form.legalType) invalid.legalType = true;
  if (!form.firstName.trim()) invalid.firstName = true;
  if (!form.lastName.trim()) invalid.lastName = true;
  if (!EMAIL_RE.test(form.email.trim())) invalid.email = true;
  if (!PHONE_RE.test(form.phone.replace(/\D/g, ''))) invalid.phone = true;
  if (form.password.length < MIN_PASSWORD_LENGTH) invalid.password = true;
  if (!form.organizationName.trim()) invalid.organizationName = true;
  if (form.legalType === 'company' && !form.taxCode.trim()) invalid.taxCode = true;
  if (!/^https?:\/\/.+/.test(form.website.trim())) invalid.website = true;
  if (!form.monthlyOrders) invalid.monthlyOrders = true;
  if (!form.primaryChannel) invalid.primaryChannel = true;

  if (form.partnerType === 'marketing') {
    if (!form.audienceSize) invalid.audienceSize = true;
    if (!form.contentCategory) invalid.contentCategory = true;
  }
  if (form.partnerType === 'distribution') {
    if (!form.distributionModel) invalid.distributionModel = true;
    if (!form.customerSegment) invalid.customerSegment = true;
  }
  if (form.partnerType === 'api') {
    if (!EMAIL_RE.test(form.technicalEmail.trim())) invalid.technicalEmail = true;
    if (!form.apiExperience) invalid.apiExperience = true;
    if (!form.integrationTimeline) invalid.integrationTimeline = true;
  }

  if (!form.address.trim()) invalid.address = true;
  if (!form.country) invalid.country = true;
  if (!form.city.trim()) invalid.city = true;

  if (!form.paymentMethod) invalid.paymentMethod = true;
  if (form.paymentMethod === 'bank') {
    if (!form.bankName.trim()) invalid.bankName = true;
    if (!form.accountName.trim()) invalid.accountName = true;
    if (!form.accountNumber.trim()) invalid.accountNumber = true;
  }
  if (form.paymentMethod === 'paypal' && !EMAIL_RE.test(form.paypalEmail.trim())) {
    invalid.paypalEmail = true;
  }

  if (!form.referralSource) invalid.referralSource = true;
  if (!form.cooperationPlan.trim()) invalid.cooperationPlan = true;
  if (!form.terms) invalid.terms = true;

  return invalid;
}

export function RegisterPartnerForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [showErrors, setShowErrors] = useState(false);
  const [applicationCode, setApplicationCode] = useState<string | null>(null);

  const config = form.partnerType ? PARTNER_CONFIGS[form.partnerType] : null;
  const invalid = useMemo(() => validate(form), [form]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const apply = useMutation({
    ...applyAsPartnerMutation,
    onSuccess: () => {
      const prefix = config?.prefix ?? 'PTN';
      setApplicationCode(`${prefix}-${Date.now().toString().slice(-8)}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    if (Object.keys(invalid).length > 0) {
      document.querySelector('.field.invalid')?.scrollIntoView({ block: 'center' });
      return;
    }

    // Everything the application endpoint has no column for travels in
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
        ? {
            audienceSize: form.audienceSize,
            contentCategory: form.contentCategory
          }
        : {}),
      ...(form.partnerType === 'distribution'
        ? {
            distributionModel: form.distributionModel,
            customerSegment: form.customerSegment
          }
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

    const address = [form.address.trim(), form.address2.trim(), form.city.trim()]
      .filter(Boolean)
      .join(', ');

    apply.mutate({
      partnerType: toApiPartnerType(form.partnerType as ApplyPartnerType),
      legalType: form.legalType as 'individual' | 'company',
      contactName: `${form.lastName.trim()} ${form.firstName.trim()}`.trim(),
      contactPhone: form.phone.trim(),
      contactEmail: form.email.trim(),
      password: form.password,
      companyName: form.organizationName.trim(),
      businessAddress: address,
      ...(form.taxCode.trim() ? { taxCode: form.taxCode.trim() } : {}),
      channelInfo
    });
  };

  /** A field shows its `.error` only once the partner has tried to submit. */
  const fieldClass = (key: string, extra = '') =>
    `field${extra ? ` ${extra}` : ''}${showErrors && invalid[key] ? ' invalid' : ''}`;

  if (applicationCode) {
    return (
      <form className='form-shell' noValidate>
        <div className='success' role='status' aria-live='polite'>
          <div className='success-icon' aria-hidden='true'>
            ✓
          </div>
          <h2>Hồ sơ đã được gửi thành công</h2>
          <p>
            {config?.success ??
              'Cảm ơn bạn đã đăng ký chương trình đối tác esim.vn. Đội ngũ của chúng tôi sẽ kiểm tra và phản hồi qua thông tin liên hệ bạn đã cung cấp.'}
          </p>
          <div className='code'>{applicationCode}</div>
          <div className='actions'>
            <button
              className='btn btn-primary'
              type='button'
              onClick={() => {
                setForm(EMPTY);
                setShowErrors(false);
                setApplicationCode(null);
              }}
            >
              Tạo hồ sơ mới
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form className='form-shell' noValidate onSubmit={submit}>
      <div className='form-head'>
        <div>
          <h2>Biểu mẫu đăng ký đối tác</h2>
          <p>Vui lòng hoàn thành các thông tin bên dưới. Các trường có dấu * là bắt buộc.</p>
        </div>
        <div className='required-note'>
          <b>*</b> Thông tin bắt buộc
        </div>
      </div>

      <div className='form-body'>
        <section className='section'>
          <div className='section-head'>
            <div className='section-title'>1. Loại hình hợp tác</div>
            <div className='section-desc'>
              Lựa chọn mô hình kinh doanh và tư cách pháp nhân phù hợp.
            </div>
          </div>
          <div className='fields'>
            <div className={fieldClass('partnerType', 'full')}>
              <div id='partnerTypeLabel' className='group-label required'>
                Bạn muốn đăng ký theo hình thức nào?
              </div>
              <div
                className='radio-grid three'
                role='radiogroup'
                aria-labelledby='partnerTypeLabel'
              >
                {(
                  [
                    [
                      'marketing',
                      'Đối tác tiếp thị',
                      'Quảng bá bằng liên kết hoặc mã giảm giá và nhận hoa hồng trên đơn hàng hợp lệ.'
                    ],
                    [
                      'distribution',
                      'Đối tác phân phối',
                      'Bán hoặc phân phối eSIM cho khách hàng theo chính sách giá và sản lượng riêng.'
                    ],
                    [
                      'api',
                      'Đối tác tích hợp API',
                      'Tích hợp kho sản phẩm, đặt hàng và quản lý eSIM trong website hoặc ứng dụng.'
                    ]
                  ] as const
                ).map(([value, title, desc]) => (
                  <label
                    className={`radio-card${form.partnerType === value ? ' selected' : ''}`}
                    key={value}
                  >
                    <input
                      type='radio'
                      name='partnerType'
                      value={value}
                      checked={form.partnerType === value}
                      onChange={() => set('partnerType', value)}
                    />
                    <span>
                      <strong>{title}</strong>
                      <span>{desc}</span>
                    </span>
                  </label>
                ))}
              </div>
              <span className='error'>Vui lòng chọn loại hình hợp tác.</span>
              <div className='inline-note'>
                {config?.note ??
                  'Hãy chọn một loại hình để chúng tôi đề xuất chính sách hợp tác phù hợp.'}
              </div>
            </div>

            <div className={fieldClass('legalType', 'full')}>
              <div id='legalTypeLabel' className='group-label required'>
                Tư cách đăng ký
              </div>
              <div className='radio-grid' role='radiogroup' aria-labelledby='legalTypeLabel'>
                {(
                  [
                    [
                      'individual',
                      'Cá nhân',
                      'Đăng ký bằng thông tin cá nhân và nhận thanh toán theo hồ sơ cá nhân.'
                    ],
                    [
                      'company',
                      'Doanh nghiệp',
                      'Đăng ký dưới tên công ty, hộ kinh doanh hoặc tổ chức có tư cách pháp lý.'
                    ]
                  ] as const
                ).map(([value, title, desc]) => (
                  <label
                    className={`radio-card${form.legalType === value ? ' selected' : ''}`}
                    key={value}
                  >
                    <input
                      type='radio'
                      name='legalType'
                      value={value}
                      checked={form.legalType === value}
                      onChange={() => set('legalType', value)}
                    />
                    <span>
                      <strong>{title}</strong>
                      <span>{desc}</span>
                    </span>
                  </label>
                ))}
              </div>
              <span className='error'>Vui lòng chọn tư cách đăng ký.</span>
            </div>
          </div>
        </section>

        <section className='section'>
          <div className='section-head'>
            <div className='section-title'>2. Thông tin liên hệ</div>
            <div className='section-desc'>
              Thông tin người đại diện chính để esim.vn liên hệ và xác minh hồ sơ.
            </div>
          </div>
          <div className='fields'>
            <div className={fieldClass('firstName')}>
              <label className='required' htmlFor='firstName'>
                Tên
              </label>
              <input
                id='firstName'
                autoComplete='given-name'
                placeholder='Ví dụ: Minh'
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
              />
              <span className='error'>Vui lòng nhập tên.</span>
            </div>
            <div className={fieldClass('lastName')}>
              <label className='required' htmlFor='lastName'>
                Họ và tên đệm
              </label>
              <input
                id='lastName'
                autoComplete='family-name'
                placeholder='Ví dụ: Trần Hoàng'
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
              />
              <span className='error'>Vui lòng nhập họ và tên đệm.</span>
            </div>
            <div className={fieldClass('email')}>
              <label className='required' htmlFor='email'>
                Email
              </label>
              <input
                id='email'
                type='email'
                autoComplete='email'
                placeholder='tenban@example.com'
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
              <span className='error'>Vui lòng nhập email hợp lệ.</span>
            </div>
            <div className={fieldClass('phone')}>
              <label className='required' htmlFor='phone'>
                Số điện thoại
              </label>
              <input
                id='phone'
                type='tel'
                autoComplete='tel'
                inputMode='tel'
                placeholder='Ví dụ: 0901234567'
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
              <span className='error'>Vui lòng nhập số điện thoại hợp lệ từ 8–15 chữ số.</span>
            </div>
            <div className={fieldClass('password')}>
              <label className='required' htmlFor='password'>
                Mật khẩu đăng nhập cổng đối tác
              </label>
              <input
                id='password'
                type='password'
                autoComplete='new-password'
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
              />
              <span className='error'>Mật khẩu cần ít nhất {MIN_PASSWORD_LENGTH} ký tự.</span>
            </div>
            {form.legalType === 'company' && (
              <div className='field'>
                <label htmlFor='position'>Chức vụ hoặc vai trò</label>
                <input
                  id='position'
                  placeholder='Ví dụ: Giám đốc, quản lý kinh doanh'
                  value={form.position}
                  onChange={(e) => set('position', e.target.value)}
                />
              </div>
            )}
          </div>
        </section>

        <section className='section'>
          <div className='section-head'>
            <div className='section-title'>3. Thông tin hoạt động</div>
            <div className='section-desc'>
              {config?.business ??
                'Thông tin giúp chúng tôi đánh giá quy mô và đề xuất chính sách hợp tác phù hợp.'}
            </div>
          </div>
          <div className='fields'>
            <div className={fieldClass('organizationName')}>
              <label className='required' htmlFor='organizationName'>
                Tên thương hiệu hoặc đơn vị hoạt động
              </label>
              <input
                id='organizationName'
                placeholder='Ví dụ: Kênh du lịch cùng tôi'
                value={form.organizationName}
                onChange={(e) => set('organizationName', e.target.value)}
              />
              <span className='error'>
                Vui lòng nhập tên thương hiệu, doanh nghiệp hoặc đơn vị hoạt động.
              </span>
            </div>
            {form.legalType === 'company' && (
              <div className={fieldClass('taxCode')}>
                <label className='required' htmlFor='taxCode'>
                  Mã số thuế
                </label>
                <input
                  id='taxCode'
                  inputMode='numeric'
                  placeholder='Nhập mã số thuế doanh nghiệp'
                  value={form.taxCode}
                  onChange={(e) => set('taxCode', e.target.value)}
                />
                <span className='error'>Vui lòng nhập mã số thuế.</span>
              </div>
            )}
            <div className={fieldClass('website', 'full')}>
              <label className='required' htmlFor='website'>
                {config?.websiteLabel ?? 'Website hoặc kênh hoạt động chính'}
              </label>
              <input
                id='website'
                type='url'
                placeholder={config?.websitePlaceholder ?? 'https://website.com'}
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
              />
              <span className='error'>
                Vui lòng nhập một đường dẫn hợp lệ, bắt đầu bằng http:// hoặc https://.
              </span>
            </div>
            <div className={fieldClass('monthlyOrders')}>
              <label className='required' htmlFor='monthlyOrders'>
                {config?.monthlyLabel ?? 'Ước tính số lượng đơn hàng mỗi tháng'}
              </label>
              <select
                id='monthlyOrders'
                value={form.monthlyOrders}
                onChange={(e) => set('monthlyOrders', e.target.value)}
              >
                <option value=''>Chọn số lượng ước tính</option>
                {MONTHLY_ORDER_RANGES.map((r) => (
                  <option value={r.value} key={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <span className='error'>Vui lòng chọn sản lượng ước tính.</span>
            </div>
            <div className={fieldClass('primaryChannel')}>
              <label className='required' htmlFor='primaryChannel'>
                {config?.channelLabel ?? 'Kênh hoạt động chính'}
              </label>
              <select
                id='primaryChannel'
                value={form.primaryChannel}
                onChange={(e) => set('primaryChannel', e.target.value)}
                disabled={!config}
              >
                <option value=''>
                  {config
                    ? `Chọn ${config.channelLabel.toLowerCase()}`
                    : 'Chọn loại hình hợp tác trước'}
                </option>
                {(config?.channels ?? []).map((c) => (
                  <option value={c} key={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className='error'>Vui lòng chọn kênh hoạt động chính.</span>
            </div>
          </div>

          {form.partnerType === 'marketing' && (
            <div className='conditional-panel active'>
              <div className='fields'>
                <div className={fieldClass('audienceSize')}>
                  <label className='required' htmlFor='audienceSize'>
                    Quy mô lượt tiếp cận mỗi tháng
                  </label>
                  <select
                    id='audienceSize'
                    value={form.audienceSize}
                    onChange={(e) => set('audienceSize', e.target.value)}
                  >
                    <option value=''>Chọn quy mô</option>
                    {AUDIENCE_SIZES.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                  <span className='error'>Vui lòng chọn quy mô tiếp cận.</span>
                </div>
                <div className={fieldClass('contentCategory')}>
                  <label className='required' htmlFor='contentCategory'>
                    Chủ đề nội dung chính
                  </label>
                  <select
                    id='contentCategory'
                    value={form.contentCategory}
                    onChange={(e) => set('contentCategory', e.target.value)}
                  >
                    <option value=''>Chọn chủ đề</option>
                    {CONTENT_CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <span className='error'>Vui lòng chọn chủ đề nội dung.</span>
                </div>
              </div>
            </div>
          )}

          {form.partnerType === 'distribution' && (
            <div className='conditional-panel active'>
              <div className='fields'>
                <div className={fieldClass('distributionModel')}>
                  <label className='required' htmlFor='distributionModel'>
                    Mô hình phân phối
                  </label>
                  <select
                    id='distributionModel'
                    value={form.distributionModel}
                    onChange={(e) => set('distributionModel', e.target.value)}
                  >
                    <option value=''>Chọn mô hình</option>
                    {DISTRIBUTION_MODELS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                  <span className='error'>Vui lòng chọn mô hình phân phối.</span>
                </div>
                <div className={fieldClass('customerSegment')}>
                  <label className='required' htmlFor='customerSegment'>
                    Nhóm khách hàng chính
                  </label>
                  <select
                    id='customerSegment'
                    value={form.customerSegment}
                    onChange={(e) => set('customerSegment', e.target.value)}
                  >
                    <option value=''>Chọn nhóm khách hàng</option>
                    {CUSTOMER_SEGMENTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <span className='error'>Vui lòng chọn nhóm khách hàng.</span>
                </div>
              </div>
            </div>
          )}

          {form.partnerType === 'api' && (
            <div className='conditional-panel active'>
              <div className='fields'>
                <div className={fieldClass('technicalEmail')}>
                  <label className='required' htmlFor='technicalEmail'>
                    Email đầu mối kỹ thuật
                  </label>
                  <input
                    id='technicalEmail'
                    type='email'
                    placeholder='tech@example.com'
                    value={form.technicalEmail}
                    onChange={(e) => set('technicalEmail', e.target.value)}
                  />
                  <span className='error'>Vui lòng nhập email kỹ thuật hợp lệ.</span>
                </div>
                <div className={fieldClass('apiExperience')}>
                  <label className='required' htmlFor='apiExperience'>
                    Năng lực tích hợp hiện tại
                  </label>
                  <select
                    id='apiExperience'
                    value={form.apiExperience}
                    onChange={(e) => set('apiExperience', e.target.value)}
                  >
                    <option value=''>Chọn năng lực</option>
                    {API_EXPERIENCE.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                  <span className='error'>Vui lòng chọn năng lực tích hợp.</span>
                </div>
                <div className={fieldClass('integrationTimeline', 'full')}>
                  <label className='required' htmlFor='integrationTimeline'>
                    Thời gian dự kiến triển khai
                  </label>
                  <select
                    id='integrationTimeline'
                    value={form.integrationTimeline}
                    onChange={(e) => set('integrationTimeline', e.target.value)}
                  >
                    <option value=''>Chọn thời gian</option>
                    {INTEGRATION_TIMELINES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <span className='error'>Vui lòng chọn thời gian dự kiến.</span>
                </div>
              </div>
              <div className='inline-note'>
                Sau khi hồ sơ được duyệt, đội ngũ esim.vn sẽ trao đổi về tài liệu API, môi trường
                thử nghiệm, luồng đặt hàng và đầu mối hỗ trợ kỹ thuật.
              </div>
            </div>
          )}
        </section>

        <section className='section'>
          <div className='section-head'>
            <div className='section-title'>4. Địa chỉ</div>
            <div className='section-desc'>Địa chỉ liên hệ của cá nhân hoặc trụ sở kinh doanh.</div>
          </div>
          <div className='fields'>
            <div className={fieldClass('address', 'full')}>
              <label className='required' htmlFor='address'>
                Địa chỉ
              </label>
              <input
                id='address'
                autoComplete='street-address'
                placeholder='Số nhà, tên đường, phường/xã'
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
              />
              <span className='error'>Vui lòng nhập địa chỉ.</span>
            </div>
            <div className='field full'>
              <label htmlFor='address2'>Tầng, tòa nhà hoặc thông tin bổ sung</label>
              <input
                id='address2'
                placeholder='Không bắt buộc'
                value={form.address2}
                onChange={(e) => set('address2', e.target.value)}
              />
            </div>
            <div className={fieldClass('country')}>
              <label className='required' htmlFor='country'>
                Quốc gia
              </label>
              <select
                id='country'
                value={form.country}
                onChange={(e) => set('country', e.target.value)}
              >
                <option value=''>Chọn quốc gia</option>
                {COUNTRIES.map((c) => (
                  <option value={c.value} key={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <span className='error'>Vui lòng chọn quốc gia.</span>
            </div>
            <div className={fieldClass('city')}>
              <label className='required' htmlFor='city'>
                Tỉnh, thành phố
              </label>
              <input
                id='city'
                autoComplete='address-level2'
                placeholder='Ví dụ: Thành phố Hồ Chí Minh'
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
              <span className='error'>Vui lòng nhập tỉnh hoặc thành phố.</span>
            </div>
          </div>
        </section>

        <section className='section'>
          <div className='section-head'>
            <div className='section-title'>5. Thanh toán</div>
            <div className='section-desc'>
              {config?.payment ??
                'Chọn phương thức nhận hoa hồng hoặc khoản thanh toán phát sinh từ chương trình.'}
            </div>
          </div>
          <div className={fieldClass('paymentMethod', 'full')}>
            <div id='paymentMethodLabel' className='group-label required'>
              Phương thức thanh toán
            </div>
            <div className='radio-grid' role='radiogroup' aria-labelledby='paymentMethodLabel'>
              {(
                [
                  ['bank', 'Tài khoản ngân hàng', 'Nhận thanh toán bằng chuyển khoản ngân hàng.'],
                  ['paypal', 'PayPal', 'Nhận thanh toán qua địa chỉ email PayPal.']
                ] as const
              ).map(([value, title, desc]) => (
                <label
                  className={`radio-card${form.paymentMethod === value ? ' selected' : ''}`}
                  key={value}
                >
                  <input
                    type='radio'
                    name='paymentMethod'
                    value={value}
                    checked={form.paymentMethod === value}
                    onChange={() => set('paymentMethod', value)}
                  />
                  <span>
                    <strong>{title}</strong>
                    <span>{desc}</span>
                  </span>
                </label>
              ))}
            </div>
            <span className='error'>Vui lòng chọn phương thức thanh toán.</span>
          </div>

          {form.paymentMethod === 'bank' && (
            <div className='conditional-panel active'>
              <div className='fields'>
                <div className={fieldClass('bankName')}>
                  <label className='required' htmlFor='bankName'>
                    Tên ngân hàng
                  </label>
                  <input
                    id='bankName'
                    placeholder='Ví dụ: Vietcombank'
                    value={form.bankName}
                    onChange={(e) => set('bankName', e.target.value)}
                  />
                  <span className='error'>Vui lòng nhập tên ngân hàng.</span>
                </div>
                <div className={fieldClass('accountName')}>
                  <label className='required' htmlFor='accountName'>
                    Tên chủ tài khoản
                  </label>
                  <input
                    id='accountName'
                    value={form.accountName}
                    onChange={(e) => set('accountName', e.target.value)}
                  />
                  <span className='error'>Vui lòng nhập tên chủ tài khoản.</span>
                </div>
                <div className={fieldClass('accountNumber')}>
                  <label className='required' htmlFor='accountNumber'>
                    Số tài khoản
                  </label>
                  <input
                    id='accountNumber'
                    inputMode='numeric'
                    value={form.accountNumber}
                    onChange={(e) => set('accountNumber', e.target.value)}
                  />
                  <span className='error'>Vui lòng nhập số tài khoản.</span>
                </div>
                <div className='field'>
                  <label htmlFor='bankBranch'>Chi nhánh ngân hàng</label>
                  <input
                    id='bankBranch'
                    placeholder='Không bắt buộc'
                    value={form.bankBranch}
                    onChange={(e) => set('bankBranch', e.target.value)}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='swiftCode'>Mã SWIFT</label>
                  <input
                    id='swiftCode'
                    placeholder='Chỉ cần cho chuyển khoản quốc tế'
                    value={form.swiftCode}
                    onChange={(e) => set('swiftCode', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {form.paymentMethod === 'paypal' && (
            <div className='conditional-panel active'>
              <div className='fields'>
                <div className={fieldClass('paypalEmail')}>
                  <label className='required' htmlFor='paypalEmail'>
                    Email PayPal
                  </label>
                  <input
                    id='paypalEmail'
                    type='email'
                    placeholder='paypal@example.com'
                    value={form.paypalEmail}
                    onChange={(e) => set('paypalEmail', e.target.value)}
                  />
                  <span className='error'>Vui lòng nhập email PayPal hợp lệ.</span>
                </div>
              </div>
            </div>
          )}

          <div className='notice'>
            Thông tin thanh toán chỉ được sử dụng sau khi hồ sơ được duyệt. Bạn có thể cập nhật lại
            trong cổng đối tác trước giao dịch đầu tiên.
          </div>
        </section>

        <section className='section'>
          <div className='section-head'>
            <div className='section-title'>6. Thông tin bổ sung</div>
            <div className='section-desc'>
              {config?.additional ??
                'Giúp đội ngũ esim.vn hiểu thêm về nhu cầu và kế hoạch hợp tác của bạn.'}
            </div>
          </div>
          <div className='fields'>
            <div className={fieldClass('referralSource', 'full')}>
              <label className='required' htmlFor='referralSource'>
                Bạn biết đến chương trình đối tác của chúng tôi qua đâu?
              </label>
              <select
                id='referralSource'
                value={form.referralSource}
                onChange={(e) => set('referralSource', e.target.value)}
              >
                <option value=''>Chọn một nguồn</option>
                {REFERRAL_SOURCES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <span className='error'>Vui lòng chọn nguồn bạn biết đến chương trình.</span>
            </div>
            <div className={fieldClass('cooperationPlan', 'full')}>
              <label className='required' htmlFor='cooperationPlan'>
                {config?.planLabel ?? 'Bạn dự định hợp tác với esim.vn như thế nào?'}
              </label>
              <textarea
                id='cooperationPlan'
                placeholder={
                  config?.planPlaceholder ??
                  'Mô tả mục tiêu, cách triển khai và kết quả bạn kỳ vọng.'
                }
                value={form.cooperationPlan}
                onChange={(e) => set('cooperationPlan', e.target.value)}
              />
              <span className='error'>Vui lòng mô tả kế hoạch hợp tác.</span>
            </div>
            <div className={fieldClass('terms', 'full')}>
              <div className='terms'>
                <input
                  id='terms'
                  type='checkbox'
                  checked={form.terms}
                  aria-describedby='termsDescription'
                  onChange={(e) => set('terms', e.target.checked)}
                />
                <div>
                  <label htmlFor='terms'>
                    <strong>Tôi đồng ý với điều khoản của chương trình đối tác.</strong>
                  </label>
                  <p id='termsDescription'>
                    Tôi xác nhận thông tin đã cung cấp là chính xác và đồng ý tuân thủ{' '}
                    <a href='/terms-of-service'>Điều khoản chương trình</a> cùng{' '}
                    <a href='/privacy-policy'>Chính sách quyền riêng tư</a>.
                  </p>
                </div>
              </div>
              <span className='error'>Bạn cần đồng ý với điều khoản trước khi gửi hồ sơ.</span>
            </div>
          </div>
        </section>
      </div>

      <div className='form-footer'>
        <div className='privacy'>
          Hồ sơ sẽ được đội ngũ esim.vn xem xét thủ công. Chúng tôi có thể liên hệ qua email hoặc số
          điện thoại để yêu cầu bổ sung thông tin.
        </div>
        <div className='actions'>
          <button
            className='btn'
            type='button'
            onClick={() => {
              setForm(EMPTY);
              setShowErrors(false);
            }}
          >
            Nhập lại
          </button>
          <button className='btn btn-primary' type='submit' disabled={apply.isPending}>
            {apply.isPending ? 'Đang gửi…' : 'Gửi hồ sơ đăng ký'}
          </button>
        </div>
      </div>

      {apply.isError && (
        <div className='notice' role='alert'>
          Không gửi được hồ sơ. Email có thể đã được đăng ký, vui lòng kiểm tra lại hoặc thử lại
          sau.
        </div>
      )}
    </form>
  );
}
