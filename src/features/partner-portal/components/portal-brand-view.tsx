'use client';

/**
 * Brand settings — `#view-brand` in cong-doi-tac-phan-phoi-hoan-chinh-v29.html.
 *
 * The mockup leaves this screen empty for the affiliate role and fills it only
 * for distribution partners, so the nav hides it for affiliates. The form keeps
 * the design's card, field and preview markup.
 */

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { updateMyProfileMutation } from '../api/mutations';
import { myProfileQueryOptions } from '../api/queries';
import { usePortalToast } from './portal-toast';
import type { PartnerBrandInfo } from '../api/types';

function readBrand(info: Record<string, unknown> | null): PartnerBrandInfo {
  return {
    displayName: typeof info?.displayName === 'string' ? info.displayName : '',
    logoUrl: typeof info?.logoUrl === 'string' ? info.logoUrl : '',
    tagline: typeof info?.tagline === 'string' ? info.tagline : ''
  };
}

export function PortalBrandView() {
  const toast = usePortalToast();
  const { data: partner, isLoading } = useQuery(myProfileQueryOptions());
  const [form, setForm] = useState<PartnerBrandInfo>({
    displayName: '',
    logoUrl: '',
    tagline: ''
  });

  // Seed once: `partner` is refetched on window focus and after each save, and
  // re-seeding then would discard edits the partner had not saved yet.
  const seededFor = useRef<number | null>(null);
  useEffect(() => {
    if (!partner || seededFor.current === partner.id) return;
    seededFor.current = partner.id;
    setForm(readBrand(partner.brandInfo ?? null));
  }, [partner]);

  const update = useMutation({
    ...updateMyProfileMutation,
    onSuccess: () => toast('Đã lưu cấu hình thương hiệu'),
    onError: () => toast('Lưu thất bại, vui lòng thử lại')
  });

  if (isLoading || !partner) {
    return (
      <section className='view active'>
        <article className='card'>
          <div className='empty'>Đang tải dữ liệu…</div>
        </article>
      </section>
    );
  }

  // Falls back to the contact name so the preview always shows something real.
  const previewName = form.displayName?.trim() || partner.contactName;

  return (
    <section className='view active'>
      <div className='grid grid-2'>
        <article className='card'>
          <div className='card-heading'>
            <div>
              <h2 className='card-title'>Nhận diện thương hiệu</h2>
              <p className='card-sub'>
                Tùy chỉnh tên, logo và câu giới thiệu hiển thị với khách hàng của bạn.
              </p>
            </div>
          </div>
          <div className='form-grid-2' style={{ marginTop: '1rem' }}>
            <div className='field field-full'>
              <label htmlFor='displayName'>Tên hiển thị</label>
              <input
                id='displayName'
                value={form.displayName}
                placeholder={partner.contactName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              />
              <span className='field-hint'>
                Tên khách nhìn thấy thay cho tên trên hồ sơ pháp lý.
              </span>
            </div>
            <div className='field field-full'>
              <label htmlFor='logoUrl'>Đường dẫn logo</label>
              <input
                id='logoUrl'
                value={form.logoUrl}
                placeholder='https://…/logo.png'
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
              />
            </div>
            <div className='field field-full'>
              <label htmlFor='tagline'>Câu giới thiệu ngắn</label>
              <input
                id='tagline'
                value={form.tagline}
                placeholder='Ví dụ: eSIM du lịch giá tốt cùng Minh Trần'
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              />
            </div>
          </div>
          <div className='form-actions'>
            <button
              className='btn btn-primary'
              type='button'
              disabled={update.isPending}
              onClick={() =>
                update.mutate({
                  brandInfo: {
                    displayName: form.displayName?.trim() || undefined,
                    logoUrl: form.logoUrl?.trim() || undefined,
                    tagline: form.tagline?.trim() || undefined
                  }
                })
              }
            >
              Lưu thay đổi
            </button>
          </div>
        </article>

        <article className='card'>
          <h2 className='card-title'>Xem trước</h2>
          <p className='card-sub'>Đây là cách khách hàng nhìn thấy thương hiệu của bạn.</p>
          <div className='card compact' style={{ marginTop: '1rem' }}>
            <div className='account' style={{ background: 'transparent', border: 0, padding: 0 }}>
              {form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.logoUrl}
                  alt=''
                  style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div className='avatar' style={{ width: '3rem', height: '3rem' }}>
                  {previewName.trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className='product-name'>{previewName}</div>
                <div className='product-meta'>{form.tagline || 'Đối tác của esim.vn'}</div>
              </div>
            </div>
          </div>
          <div className='callout' style={{ marginTop: '0.875rem' }}>
            <strong>Phạm vi áp dụng</strong>
            <p className='card-sub'>
              Cấu hình này áp dụng cho trang đối tác của bạn. Nếu muốn hiển thị luôn trên trang đích
              mà link tiếp thị trỏ tới, cần bật thêm ở phía website bán hàng.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
