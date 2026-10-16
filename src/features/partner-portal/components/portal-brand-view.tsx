'use client';

/**
 * "Cấu hình thương hiệu" of a distribution partner (doitac-1410 #044).
 *
 * Ported from the "Tùy chỉnh thương hiệu" card of
 * cong-doi-tac-phan-phoi-hoan-chinh-v29.html — same markup and class names,
 * its stylesheet scoped in `portal-brand-port.css`. On the left the brand
 * (logo and its position, name, slogan, website, support email, main colour,
 * and whether the email shows "Kiểm tra dung lượng & ưu đãi của eSIM" and
 * "Hướng dẫn cài đặt eSIM"); on the right a live preview of the eSIM email the
 * partner's customers receive. The email itself is rendered by the backend
 * from the same settings.
 */

import './portal-brand-port.css';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';

import { updateMyProfileMutation } from '../api/mutations';
import { myProfileQueryOptions } from '../api/queries';
import { uploadAttachment } from '../api/service';
import type { PartnerBrandInfo } from '../api/types';

/** esim.vn's own logo — what the email shows when the partner has none. */
const DEFAULT_LOGO =
  'https://res.cloudinary.com/drozbviwb/image/upload/v1780067058/logo_esimvn_zycejk.png';

type Position = 'left' | 'center' | 'right';

type BrandForm = {
  logoUrl: string;
  logoPosition: Position;
  displayName: string;
  tagline: string;
  website: string;
  supportEmail: string;
  primaryColor: string;
  showUsageCheck: boolean;
  showInstallGuide: boolean;
};

const EMPTY: BrandForm = {
  logoUrl: '',
  logoPosition: 'center',
  displayName: '',
  tagline: '',
  website: '',
  supportEmail: '',
  primaryColor: '#000000',
  showUsageCheck: true,
  showInstallGuide: true
};

const str = (v: unknown) => (typeof v === 'string' ? v : '');

function readBrand(info: Record<string, unknown> | null | undefined): BrandForm {
  const position = info?.logoPosition;
  return {
    logoUrl: str(info?.logoUrl),
    logoPosition: position === 'left' || position === 'right' ? position : 'center',
    displayName: str(info?.displayName),
    tagline: str(info?.tagline),
    website: str(info?.website),
    supportEmail: str(info?.supportEmail),
    primaryColor: /^#[0-9a-f]{6}$/i.test(str(info?.primaryColor))
      ? str(info?.primaryColor)
      : '#000000',
    showUsageCheck: info?.showUsageCheck !== false,
    showInstallGuide: info?.showInstallGuide !== false
  };
}

export function PortalBrandView() {
  const { data: partner, isLoading } = useQuery(myProfileQueryOptions());
  const [form, setForm] = useState<BrandForm>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Seed once: `partner` is refetched on window focus and after each save, and
  // re-seeding then would discard edits the partner had not saved yet.
  const seededFor = useRef<number | null>(null);
  useEffect(() => {
    if (!partner || seededFor.current === partner.id) return;
    seededFor.current = partner.id;
    setForm(readBrand(partner.brandInfo));
  }, [partner]);

  const update = useMutation({
    ...updateMyProfileMutation,
    onSuccess: () => toast.success('Đã lưu cấu hình thương hiệu.'),
    onError: (e: Error) => toast.error(e.message || 'Lưu thất bại.')
  });

  if (isLoading || !partner) {
    return <Skeleton className='h-[40rem] w-full' />;
  }

  const set = <K extends keyof BrandForm>(key: K, value: BrandForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      toast.error('Chỉ hỗ trợ tệp PNG hoặc JPG');
      return;
    }
    setUploading(true);
    try {
      set('logoUrl', await uploadAttachment(file));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    const brandInfo: PartnerBrandInfo = {
      displayName: form.displayName.trim() || undefined,
      logoUrl: form.logoUrl || undefined,
      logoPosition: form.logoPosition,
      tagline: form.tagline.trim() || undefined,
      website: form.website.trim() || undefined,
      supportEmail: form.supportEmail.trim() || undefined,
      primaryColor: form.primaryColor,
      showUsageCheck: form.showUsageCheck,
      showInstallGuide: form.showInstallGuide
    };
    update.mutate({ brandInfo });
  };

  const logo = form.logoUrl || DEFAULT_LOGO;
  const name = form.displayName.trim() || 'ESIM.VN';
  const website = form.website.trim() || 'https://esim.vn';
  const support = form.supportEmail.trim() || 'support@esim.vn';
  const color = form.primaryColor;

  return (
    <div className='brand-port brand-settings-page' data-testid='brand-settings'>
      <section className='brand-ref-card'>
        <h2 className='brand-custom-title'>Tùy chỉnh thương hiệu</h2>
        <div className='brand-custom-grid'>
          <form
            className='brand-custom-form'
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div className='brand-form-row brand-logo-row'>
              <label className='brand-form-label'>Logo:</label>
              <div className='brand-logo-control'>
                <div>
                  <button
                    className='btn brand-select-file'
                    type='button'
                    disabled={uploading}
                    onClick={() => fileInput.current?.click()}
                  >
                    {uploading ? 'Đang tải…' : 'Chọn tệp'}
                  </button>
                  <input
                    ref={fileInput}
                    id='brandLogoFile'
                    type='file'
                    accept='image/jpg,.jpg,.jpeg,image/png'
                    hidden
                    onChange={onLogo}
                  />
                </div>
                <div className='brand-logo-thumb'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img id='brandLogoThumb' src={logo} alt='Xem trước logo' />
                  {form.logoUrl && (
                    <button
                      className='brand-logo-delete'
                      type='button'
                      title='Xóa tệp'
                      onClick={() => set('logoUrl', '')}
                    >
                      <Icons.close className='icon' />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className='brand-form-row'>
              <label className='brand-form-label'>Vị trí logo:</label>
              <div className='brand-position-group'>
                {(['left', 'center', 'right'] as Position[]).map((position) => (
                  <button
                    key={position}
                    className={`brand-position-option${form.logoPosition === position ? ' active' : ''}`}
                    data-brand-position={position}
                    type='button'
                    aria-label={
                      position === 'left' ? 'Trái' : position === 'center' ? 'Giữa' : 'Phải'
                    }
                    aria-pressed={form.logoPosition === position}
                    onClick={() => set('logoPosition', position)}
                  >
                    <span className='brand-position-radio' />
                    <span className={`brand-position-glyph ${position}`}>
                      <i />
                      <i />
                      <i />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className='brand-form-row'>
              <label className='brand-form-label' htmlFor='brandNameInput'>
                Tên thương hiệu:
              </label>
              <input
                id='brandNameInput'
                type='text'
                placeholder='Tên thương hiệu'
                maxLength={120}
                value={form.displayName}
                onChange={(e) => set('displayName', e.target.value)}
              />
            </div>
            <div className='brand-form-row'>
              <label className='brand-form-label' htmlFor='brandSloganInput'>
                Khẩu hiệu thương hiệu:
              </label>
              <input
                id='brandSloganInput'
                type='text'
                placeholder='Khẩu hiệu thương hiệu'
                maxLength={200}
                value={form.tagline}
                onChange={(e) => set('tagline', e.target.value)}
              />
            </div>
            <div className='brand-form-row'>
              <label className='brand-form-label' htmlFor='brandWebsiteInput'>
                Trang web chính thức:
              </label>
              <input
                id='brandWebsiteInput'
                type='url'
                placeholder='Trang web chính thức'
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
              />
            </div>
            <div className='brand-form-row'>
              <label className='brand-form-label' htmlFor='brandSupportInput'>
                Email hỗ trợ:
              </label>
              <input
                id='brandSupportInput'
                type='email'
                placeholder='Email hỗ trợ'
                value={form.supportEmail}
                onChange={(e) => set('supportEmail', e.target.value)}
              />
            </div>
            <div className='brand-form-row'>
              <label className='brand-form-label' htmlFor='brandPrimaryColor'>
                Màu chủ đạo:
              </label>
              <div className='brand-color-wrap'>
                <input
                  className='brand-color-picker'
                  id='brandPrimaryColor'
                  type='color'
                  value={color}
                  onChange={(e) => set('primaryColor', e.target.value)}
                />
              </div>
            </div>
            <div className='brand-form-row'>
              <label className='brand-form-label' htmlFor='brandShowUsage'>
                Nội dung email:
              </label>
              <div className='brand-pref-content' style={{ margin: 0, gap: '.5rem' }}>
                <label className='brand-pref-line'>
                  <input
                    className='brand-check'
                    id='brandShowUsage'
                    type='checkbox'
                    checked={form.showUsageCheck}
                    onChange={(e) => set('showUsageCheck', e.target.checked)}
                  />
                  <span>Hiển thị “Kiểm tra dung lượng &amp; ưu đãi của eSIM”</span>
                </label>
                <label className='brand-pref-line'>
                  <input
                    className='brand-check'
                    id='brandShowGuide'
                    type='checkbox'
                    checked={form.showInstallGuide}
                    onChange={(e) => set('showInstallGuide', e.target.checked)}
                  />
                  <span>Hiển thị “Hướng dẫn cài đặt eSIM”</span>
                </label>
              </div>
            </div>
            <div className='brand-info-note'>
              <Icons.help className='icon' />
              <span>
                Các trường không bắt buộc sẽ dùng giá trị mặc định của hệ thống nếu để trống.
              </span>
            </div>
            <div className='brand-form-actions'>
              <button className='btn' type='button' onClick={() => setForm(EMPTY)}>
                Đặt lại
              </button>
              <button
                className='btn btn-primary'
                type='submit'
                disabled={update.isPending || uploading}
              >
                {update.isPending ? 'Đang lưu…' : 'Lưu'}
              </button>
            </div>
          </form>

          <div className='brand-preview-card'>
            <div className='brand-preview-tabs'>
              <button className='brand-preview-tab active' type='button'>
                Email
              </button>
            </div>
            <div className='brand-preview-pane active' data-testid='brand-email-preview'>
              <div className='brand-email-preview'>
                <div className={`brand-preview-logo-line ${form.logoPosition}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className='brand-preview-logo' src={logo} alt='Logo thương hiệu' />
                </div>
                <p>Kính gửi quý khách,</p>
                <p style={{ marginTop: '.5rem' }}>
                  Cảm ơn quý khách đã đặt hàng! Dưới đây là thông tin eSIM. Quý khách có thể quét mã
                  QR để kích hoạt gói trên thiết bị.
                </p>
                <p className='brand-preview-link' style={{ marginTop: '.75rem', color }}>
                  Quét mã QR:
                </p>
                <div className='brand-preview-spacer' />
                <div className='brand-preview-box'>
                  <div className='brand-preview-kv'>
                    <strong>Mã đơn hàng (Batch ID):</strong>
                    <span>XXXXXXXXXXXXXX</span>
                  </div>
                  <div className='brand-preview-kv'>
                    <strong>Mã giao dịch eSIM:</strong>
                    <span>XXXXXXXXXXXXXX</span>
                  </div>
                  <div className='brand-preview-kv'>
                    <strong>Tên gói dữ liệu:</strong>
                    <span>XXXXXXXXXXXXXX</span>
                  </div>
                  <div className='brand-preview-kv'>
                    <strong>Kích hoạt trước:</strong>
                    <span>YYYY-MM-DD hh:mm:ss UTC</span>
                  </div>
                </div>
                <div className='brand-preview-box'>
                  <div className='brand-preview-kv'>
                    <strong>Chuỗi mã kích hoạt:</strong>
                    <span>XXXXXXXXXXXXXX</span>
                  </div>
                  <div className='brand-preview-kv'>
                    <strong>Địa chỉ SM-DP+:</strong>
                    <span>XXXXXXXXXXXXXX</span>
                  </div>
                  <div className='brand-preview-kv'>
                    <strong>Mã kích hoạt:</strong>
                    <span>XXXXXXXXXXXXXX</span>
                  </div>
                  <div className='brand-preview-kv'>
                    <strong>APN:</strong>
                    <span>XXXXXXXXXXXXXX</span>
                  </div>
                </div>
                <div className='brand-preview-box'>
                  <strong style={{ color: '#929bb6', fontSize: '.75rem' }}>
                    Cài đặt nhanh bằng điện thoại:
                  </strong>
                  <div className='brand-preview-install' style={{ marginTop: '.5rem' }}>
                    <span className='brand-preview-pill' style={{ backgroundColor: color }}>
                      iOS (17.4+)
                    </span>
                    <span className='brand-preview-pill' style={{ backgroundColor: color }}>
                      Android (10+)
                    </span>
                  </div>
                </div>
                {form.showUsageCheck && (
                  <div className='brand-preview-box' data-testid='preview-usage'>
                    <strong style={{ color: '#35416f', fontSize: '.8125rem' }}>
                      Kiểm tra dung lượng &amp; ưu đãi của eSIM
                    </strong>
                    <span style={{ fontSize: '.75rem' }}>
                      Theo dõi dung lượng còn lại và ngày hết hạn bất cứ lúc nào — không cần đăng
                      nhập.
                    </span>
                    <span className='brand-preview-link' style={{ color }}>
                      XXXXXXXXXXXXXX
                    </span>
                  </div>
                )}
                {form.showInstallGuide && (
                  <div className='brand-preview-box' data-testid='preview-guide'>
                    <strong style={{ color: '#35416f', fontSize: '.8125rem' }}>
                      Hướng dẫn cài đặt eSIM
                    </strong>
                    <span style={{ fontSize: '.75rem' }}>
                      Các bước cài đặt và kích hoạt eSIM trên iPhone và Android.
                    </span>
                    <span className='brand-preview-link' style={{ color }}>
                      Xem hướng dẫn
                    </span>
                  </div>
                )}
                <div className='brand-preview-signature' data-testid='preview-signature'>
                  <span>Trân trọng,</span>
                  <span>{name}</span>
                  <span className='brand-preview-signature-line'>
                    <Icons.link className='icon' />
                    <span>{website}</span>
                  </span>
                  <span className='brand-preview-signature-line'>
                    <Icons.help className='icon' />
                    <span>{support}</span>
                  </span>
                  {form.tagline.trim() && <span>{form.tagline.trim()}</span>}
                </div>
                <div className='brand-system-note'>
                  *** Đây là thư được hệ thống tạo tự động, vui lòng không trả lời địa chỉ này. ***
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
