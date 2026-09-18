'use client';

/**
 * Discount codes — `#view-coupons` in cong-doi-tac-phan-phoi-hoan-chinh-v29.html.
 *
 * The explainer aside, then the grid of active codes. "Đề nghị mã mới" opens the
 * mockup's request modal, which here files a support ticket — the portal has no
 * self-serve coupon creation, an admin issues the code.
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { createTicketMutation } from '../api/mutations';
import { myCouponsQueryOptions, myProfileQueryOptions } from '../api/queries';
import { formatDateVn } from '@/lib/format';
import { formatCount } from '../lib/portal-format';
import { PortalIcon } from './portal-icon-sprite';
import { usePortalToast } from './portal-toast';

/** Codes inside this window get the mockup's "Sắp hết hạn" badge. */
const EXPIRING_SOON_DAYS = 30;

function expiryState(expiresAt: string | null, isActive: boolean) {
  if (!isActive) return { cls: 'b-gray', label: 'Ngừng hoạt động' };
  if (!expiresAt) return { cls: 'b-success', label: 'Hoạt động' };
  const days = (new Date(expiresAt).getTime() - Date.now()) / 86_400_000;
  if (days < 0) return { cls: 'b-danger', label: 'Đã hết hạn' };
  if (days <= EXPIRING_SOON_DAYS) return { cls: 'b-warning', label: 'Sắp hết hạn' };
  return { cls: 'b-success', label: 'Hoạt động' };
}

export function PortalCouponsView() {
  const toast = usePortalToast();
  const { data: coupons, isLoading } = useQuery(myCouponsQueryOptions());
  const { data: me } = useQuery(myProfileQueryOptions());

  const [requesting, setRequesting] = useState(false);
  const [note, setNote] = useState('');

  const requestCoupon = useMutation({
    ...createTicketMutation,
    onSuccess: () => {
      setRequesting(false);
      setNote('');
      toast('Đã gửi đề nghị mã giảm giá');
    },
    onError: () => toast('Không gửi được đề nghị, vui lòng thử lại')
  });

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code);
    toast('Đã sao chép mã');
  };

  return (
    <section className='view active'>
      <aside className='coupon-note' aria-label='Thông tin về mã giảm giá'>
        <div className='coupon-note-icon'>
          <PortalIcon id='i-help' />
        </div>
        <div>
          <h3>Lưu ý về mã giảm giá</h3>
          <div className='coupon-note-list'>
            <p className='coupon-note-item'>
              Mã giúp ghi nhận đơn hàng khi khách không bấm liên kết tiếp thị hoặc mua trên thiết bị
              khác.
            </p>
            <p className='coupon-note-item'>
              Hoa hồng được tính trên doanh thu sau giảm giá. Mức giảm phải nằm trong quyền hạn mà
              quản trị viên cấp.
            </p>
          </div>
        </div>
      </aside>

      <div className='coupon-section-head'>
        <div>
          <h2>Mã đang hoạt động</h2>
          <p>Theo dõi lượt sử dụng và doanh số từ từng mã.</p>
        </div>
        <button className='btn' type='button' onClick={() => setRequesting(true)}>
          <PortalIcon id='i-plus' />
          Đề nghị mã mới
        </button>
      </div>

      <div className='coupon-grid'>
        {isLoading && <div className='empty'>Đang tải mã giảm giá…</div>}
        {!isLoading && (coupons ?? []).length === 0 && (
          <div className='empty'>Chưa có mã giảm giá nào được cấp.</div>
        )}
        {(coupons ?? []).map((c) => {
          const state = expiryState(c.expiresAt, c.isActive);
          return (
            <article className='coupon-card' key={c.id}>
              <div className='coupon-card-top'>
                <span className='coupon-code'>{c.code}</span>
                <span className={`badge ${state.cls}`}>{state.label}</span>
              </div>
              <div className='coupon-value'>{c.discountPercent}%</div>
              <div className='coupon-meta'>
                {formatCount(c.usageCount)} lượt dùng
                {c.expiresAt ? ` · hết hạn ${formatDateVn(c.expiresAt)}` : ' · không giới hạn'}
              </div>
              <button className='btn btn-sm' type='button' onClick={() => copy(c.code)}>
                <PortalIcon id='i-copy' />
                Sao chép mã
              </button>
            </article>
          );
        })}
      </div>

      <div
        aria-labelledby='couponRequestTitle'
        aria-modal='true'
        className={`modal-backdrop${requesting ? ' open' : ''}`}
        role='dialog'
        onClick={(e) => {
          if (e.target === e.currentTarget) setRequesting(false);
        }}
      >
        <div className='modal'>
          <div className='modal-head'>
            <div>
              <h2 id='couponRequestTitle' style={{ fontSize: '1.0625rem' }}>
                Đề nghị mã giảm giá
              </h2>
              <p className='card-sub'>Mã sẽ được quản trị viên cấp sau khi duyệt.</p>
            </div>
            <button className='btn btn-icon' type='button' onClick={() => setRequesting(false)}>
              <PortalIcon id='i-x' />
            </button>
          </div>
          <div className='modal-body'>
            <div className='field'>
              <label htmlFor='couponNote'>Nội dung đề nghị</label>
              <textarea
                id='couponNote'
                placeholder='Ví dụ: mã giảm 10% cho chiến dịch Nhật Bản tháng 8, dự kiến 200 lượt dùng.'
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <span className='field-hint'>
                Nêu rõ mức giảm mong muốn, thời hạn và kênh sẽ sử dụng mã.
              </span>
            </div>
          </div>
          <div className='modal-foot'>
            <button className='btn' type='button' onClick={() => setRequesting(false)}>
              Hủy
            </button>
            <button
              className='btn btn-primary'
              type='button'
              disabled={requestCoupon.isPending || !note.trim()}
              onClick={() =>
                requestCoupon.mutate({
                  customerEmail: me?.contactEmail ?? '',
                  subject: 'Đề nghị cấp mã giảm giá',
                  description: note.trim()
                })
              }
            >
              {requestCoupon.isPending ? 'Đang gửi…' : 'Gửi đề nghị'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
