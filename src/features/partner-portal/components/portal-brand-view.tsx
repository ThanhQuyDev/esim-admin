'use client';

/**
 * "Cấu hình thương hiệu" of a distribution partner (doitac-1410 #044).
 *
 * Ported from the "Tùy chỉnh thương hiệu" card of
 * cong-doi-tac-phan-phoi-hoan-chinh-v29.html — same markup and class names,
 * its stylesheet scoped in `portal-brand-port.css`. On the left the brand
 * (logo and its position, name, slogan, website, support email, main colour,
 * and whether the email shows "Kiểm tra dung lượng & ưu đãi của eSIM" and
 * "Hướng dẫn cài đặt eSIM"); on the right the eSIM email the partner's
 * customers receive — the real one, built by the backend from the stock
 * template and the form as it stands, not a drawing of it (doitac-3010 #004).
 */

import './portal-brand-port.css';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';

import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';

import { updateMyProfileMutation } from '../api/mutations';
import { myProfileQueryOptions } from '../api/queries';
import { previewBrandEmail, uploadAttachment } from '../api/service';
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

/** What is saved, and what the preview is built from. */
function toBrandInfo(form: BrandForm): PartnerBrandInfo {
  return {
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

  // Rebuilt a moment after the partner stops typing.
  const previewBrand = useDebounce(JSON.stringify(toBrandInfo(form)), 400);
  const preview = useQuery({
    queryKey: ['partner-portal', 'brand-email-preview', previewBrand],
    queryFn: () => previewBrandEmail(JSON.parse(previewBrand) as PartnerBrandInfo),
    enabled: Boolean(partner),
    placeholderData: (previous) => previous
  });

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

  const save = () => update.mutate({ brandInfo: toBrandInfo(form) });

  const logo = form.logoUrl || DEFAULT_LOGO;

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
                  value={form.primaryColor}
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
              {preview.data?.html ? (
                <>
                  <p className='brand-preview-subject' data-testid='brand-email-subject'>
                    <strong>Tiêu đề:</strong> {preview.data.subject}
                    <br />
                    <strong>Người gửi:</strong> {form.displayName.trim() || 'esim.vn'}{' '}
                    &lt;order@esim.com.vn&gt;
                  </p>
                  <iframe
                    className='brand-preview-frame'
                    title='Xem trước email eSIM'
                    srcDoc={preview.data.html}
                    sandbox=''
                    data-testid='brand-email-frame'
                  />
                </>
              ) : preview.isError ? (
                <p className='brand-preview-subject'>Chưa tải được bản xem trước email.</p>
              ) : (
                <Skeleton className='h-[40rem] w-full' />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
