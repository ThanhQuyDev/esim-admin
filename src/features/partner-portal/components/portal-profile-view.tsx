'use client';

/**
 * Profile — `#view-profile` in cong-doi-tac-phan-phoi-hoan-chinh-v29.html.
 *
 * Four tabs beside the completion aside, in the design's layout. Each tab saves
 * only its own fields, so a partner editing their bank details cannot overwrite
 * the channels they last saved from another tab.
 */

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { changePassword } from '@/features/auth/api/service';

import { updateMyProfileMutation } from '../api/mutations';
import { myProfileQueryOptions, mySummaryQueryOptions } from '../api/queries';
import { usePortalToast } from './portal-toast';
import type { UpdateMyProfilePayload } from '../api/types';

const TABS = [
  { id: 'profile-basic', label: 'Thông tin cơ bản' },
  { id: 'profile-channels', label: 'Kênh tiếp thị' },
  { id: 'profile-payment', label: 'Thanh toán' },
  { id: 'profile-security', label: 'Bảo mật' }
] as const;

const MIN_PASSWORD_LENGTH = 8;

type TabId = (typeof TABS)[number]['id'];

/** Channel links live in the free-form `channelInfo` blob on the partner. */
type Channels = {
  youtube: string;
  tiktok: string;
  website: string;
  facebook: string;
  other: string;
};

const EMPTY_CHANNELS: Channels = {
  youtube: '',
  tiktok: '',
  website: '',
  facebook: '',
  other: ''
};

function initialsOf(name: string | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ĐT';
  return (parts[0]![0]! + (parts.length > 1 ? parts[parts.length - 1]![0]! : '')).toUpperCase();
}

export function PortalProfileView() {
  const toast = usePortalToast();
  const { data: me } = useQuery(myProfileQueryOptions());
  const { data: summary } = useQuery(mySummaryQueryOptions());

  const [tab, setTab] = useState<TabId>('profile-basic');
  const [basic, setBasic] = useState({
    contactName: '',
    contactPhone: '',
    companyName: '',
    taxCode: '',
    businessAddress: ''
  });
  const [channels, setChannels] = useState<Channels>(EMPTY_CHANNELS);
  const [bank, setBank] = useState({
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: '',
    bankBranch: ''
  });

  // Seed the forms from the partner record exactly once.
  //
  // `me` is refetched on window focus and after every save, and re-seeding on
  // each of those would overwrite whatever the partner had typed since — the
  // save would then post the values that were already on the server.
  const seededFor = useRef<number | null>(null);
  useEffect(() => {
    if (!me || seededFor.current === me.id) return;
    seededFor.current = me.id;
    setBasic({
      contactName: me.contactName ?? '',
      contactPhone: me.contactPhone ?? '',
      companyName: me.companyName ?? '',
      taxCode: me.taxCode ?? '',
      businessAddress: me.businessAddress ?? ''
    });
    const info = (me.channelInfo ?? {}) as Partial<Channels>;
    setChannels({ ...EMPTY_CHANNELS, ...info });
    setBank({
      bankName: me.bankName ?? '',
      bankAccountNumber: me.bankAccountNumber ?? '',
      bankAccountHolder: me.bankAccountHolder ?? '',
      bankBranch: me.bankBranch ?? ''
    });
  }, [me]);

  const save = useMutation({
    ...updateMyProfileMutation,
    onSuccess: () => toast('Đã lưu thay đổi'),
    onError: () => toast('Không lưu được, vui lòng thử lại')
  });

  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: ''
  });

  const updatePassword = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPasswords({ current: '', next: '', confirm: '' });
      toast('Đã cập nhật mật khẩu');
    },
    onError: () => toast('Không đổi được mật khẩu, kiểm tra lại mật khẩu hiện tại')
  });

  const submitPassword = () => {
    if (passwords.next.length < MIN_PASSWORD_LENGTH) {
      toast(`Mật khẩu mới cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự`);
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast('Xác nhận mật khẩu chưa khớp');
      return;
    }
    updatePassword.mutate({
      oldPassword: passwords.current,
      password: passwords.next
    });
  };

  const submit = (payload: UpdateMyProfilePayload) => save.mutate(payload);

  const filledChannels = Object.values(channels).filter(Boolean).length;
  const hasBank = Boolean(bank.bankAccountNumber);
  const completion = Math.round(
    ((basic.contactName && basic.contactPhone ? 1 : 0) +
      (filledChannels > 0 ? 1 : 0) +
      (hasBank ? 1 : 0)) *
      (100 / 3)
  );

  return (
    <section className='view active'>
      <div className='profile-layout'>
        <div>
          <div className='profile-tabs'>
            {TABS.map((t) => (
              <button
                className={`tab${tab === t.id ? ' active' : ''}`}
                type='button'
                key={t.id}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className={`subview${tab === 'profile-basic' ? ' active' : ''}`}>
            <article className='card'>
              <h2 className='card-title'>Thông tin tài khoản đối tác</h2>
              <p className='card-sub'>Thông tin dùng để xác minh và liên hệ vận hành.</p>
              <div className='form-grid-2' style={{ marginTop: '1rem' }}>
                <div className='field'>
                  <label htmlFor='contactName'>Họ và tên</label>
                  <input
                    id='contactName'
                    value={basic.contactName}
                    onChange={(e) => setBasic({ ...basic, contactName: e.target.value })}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='contactEmail'>Email</label>
                  <input id='contactEmail' value={me?.contactEmail ?? ''} disabled />
                </div>
                <div className='field'>
                  <label htmlFor='contactPhone'>Số điện thoại</label>
                  <input
                    id='contactPhone'
                    value={basic.contactPhone}
                    onChange={(e) => setBasic({ ...basic, contactPhone: e.target.value })}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='legalType'>Tư cách pháp nhân</label>
                  <input
                    id='legalType'
                    value={me?.legalType === 'company' ? 'Doanh nghiệp' : 'Cá nhân'}
                    disabled
                  />
                </div>
                <div className='field'>
                  <label htmlFor='companyName'>Tên thương hiệu hoặc kênh</label>
                  <input
                    id='companyName'
                    value={basic.companyName}
                    onChange={(e) => setBasic({ ...basic, companyName: e.target.value })}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='partnerType'>Loại hình hợp tác</label>
                  <input
                    id='partnerType'
                    value={
                      me?.partnerType === 'distribution' ? 'Đối tác phân phối' : 'Đối tác tiếp thị'
                    }
                    disabled
                  />
                </div>
                <div className='field'>
                  <label htmlFor='taxCode'>Mã số thuế</label>
                  <input
                    id='taxCode'
                    value={basic.taxCode}
                    onChange={(e) => setBasic({ ...basic, taxCode: e.target.value })}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='businessAddress'>Địa chỉ</label>
                  <input
                    id='businessAddress'
                    value={basic.businessAddress}
                    onChange={(e) => setBasic({ ...basic, businessAddress: e.target.value })}
                  />
                </div>
              </div>
              <div className='form-actions'>
                <button
                  className='btn btn-primary'
                  type='button'
                  disabled={save.isPending}
                  onClick={() => submit(basic)}
                >
                  Lưu thay đổi
                </button>
              </div>
            </article>
          </div>

          <div className={`subview${tab === 'profile-channels' ? ' active' : ''}`}>
            <article className='card'>
              <h2 className='card-title'>Kênh tiếp thị</h2>
              <p className='card-sub'>Khai báo các kênh bạn đang sử dụng để quảng bá sản phẩm.</p>
              <div className='form-grid-2' style={{ marginTop: '1rem' }}>
                <div className='field'>
                  <label htmlFor='youtube'>YouTube</label>
                  <input
                    id='youtube'
                    value={channels.youtube}
                    placeholder='https://youtube.com/@...'
                    onChange={(e) => setChannels({ ...channels, youtube: e.target.value })}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='tiktok'>TikTok</label>
                  <input
                    id='tiktok'
                    value={channels.tiktok}
                    placeholder='https://tiktok.com/@...'
                    onChange={(e) => setChannels({ ...channels, tiktok: e.target.value })}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='website'>Trang web</label>
                  <input
                    id='website'
                    value={channels.website}
                    placeholder='https://...'
                    onChange={(e) => setChannels({ ...channels, website: e.target.value })}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='facebook'>Facebook</label>
                  <input
                    id='facebook'
                    value={channels.facebook}
                    placeholder='Ví dụ: https://facebook.com/minhtrantravel'
                    onChange={(e) => setChannels({ ...channels, facebook: e.target.value })}
                  />
                </div>
                <div className='field field-full'>
                  <label htmlFor='otherChannel'>Kênh tiếp thị khác</label>
                  <input
                    id='otherChannel'
                    value={channels.other}
                    placeholder='Ví dụ: Instagram, Threads, Telegram, Zalo OA hoặc podcast'
                    onChange={(e) => setChannels({ ...channels, other: e.target.value })}
                  />
                  <span className='field-hint'>
                    Có thể nhập thêm loại kênh không có trong danh sách trên.
                  </span>
                </div>
              </div>
              <div className='form-actions'>
                <button
                  className='btn btn-primary'
                  type='button'
                  disabled={save.isPending}
                  onClick={() => submit({ channelInfo: channels })}
                >
                  Lưu thay đổi
                </button>
              </div>
            </article>
          </div>

          <div className={`subview${tab === 'profile-payment' ? ' active' : ''}`}>
            <article className='card'>
              <h2 className='card-title'>Tài khoản nhận tiền</h2>
              <p className='card-sub'>Thông tin phải trùng với chủ tài khoản đã xác minh.</p>
              <div className='form-grid-2' style={{ marginTop: '1rem' }}>
                <div className='field'>
                  <label htmlFor='bankName'>Ngân hàng</label>
                  <input
                    id='bankName'
                    value={bank.bankName}
                    onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='bankStatus'>Trạng thái</label>
                  <input
                    id='bankStatus'
                    value={hasBank ? 'Đã cập nhật' : 'Chưa cập nhật'}
                    disabled
                  />
                </div>
                <div className='field'>
                  <label htmlFor='bankAccountNumber'>Số tài khoản</label>
                  <input
                    id='bankAccountNumber'
                    value={bank.bankAccountNumber}
                    onChange={(e) => setBank({ ...bank, bankAccountNumber: e.target.value })}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='bankBranch'>Chi nhánh</label>
                  <input
                    id='bankBranch'
                    value={bank.bankBranch}
                    onChange={(e) => setBank({ ...bank, bankBranch: e.target.value })}
                  />
                </div>
                <div className='field field-full'>
                  <label htmlFor='bankAccountHolder'>Chủ tài khoản</label>
                  <input
                    id='bankAccountHolder'
                    value={bank.bankAccountHolder}
                    onChange={(e) => setBank({ ...bank, bankAccountHolder: e.target.value })}
                  />
                </div>
              </div>
              <div className='form-actions'>
                <button
                  className='btn btn-primary'
                  type='button'
                  disabled={save.isPending}
                  onClick={() => submit(bank)}
                >
                  Lưu thay đổi
                </button>
              </div>
            </article>
          </div>
          <div className={`subview${tab === 'profile-security' ? ' active' : ''}`}>
            <article className='card'>
              <h2 className='card-title'>Đổi mật khẩu</h2>
              <p className='card-sub'>Mật khẩu mới cần có ít nhất {MIN_PASSWORD_LENGTH} ký tự.</p>
              <div className='form-grid-2' style={{ marginTop: '1rem' }}>
                <div className='field field-full'>
                  <label htmlFor='currentPassword'>Mật khẩu hiện tại</label>
                  <input
                    id='currentPassword'
                    type='password'
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='newPassword'>Mật khẩu mới</label>
                  <input
                    id='newPassword'
                    type='password'
                    value={passwords.next}
                    onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='confirmPassword'>Xác nhận mật khẩu mới</label>
                  <input
                    id='confirmPassword'
                    type='password'
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                </div>
              </div>
              <div className='form-actions'>
                <button
                  className='btn btn-primary'
                  type='button'
                  disabled={updatePassword.isPending}
                  onClick={submitPassword}
                >
                  Cập nhật mật khẩu
                </button>
              </div>
            </article>
          </div>
        </div>

        <aside className='profile-aside'>
          <article className='card profile-avatar-card'>
            <div className='profile-avatar-large'>{initialsOf(me?.contactName)}</div>
            <h2 className='card-title' style={{ marginTop: '.75rem' }}>
              {me?.contactName ?? 'Đối tác'}
            </h2>
            <p className='card-sub'>
              {me?.partnerType === 'distribution' ? 'Đối tác phân phối' : 'Đối tác tiếp thị'}
              {summary?.tier.current ? ` · Hạng ${summary.tier.current.tierName}` : ''}
            </p>
            <span
              className={`badge ${me?.status === 'active' ? 'b-success' : 'b-warning'}`}
              style={{ marginTop: '.75rem' }}
            >
              {me?.status === 'active' ? 'Tài khoản đã xác minh' : 'Đang chờ duyệt'}
            </span>
          </article>

          <article className='card'>
            <h2 className='card-title'>Mức độ hoàn thiện hồ sơ</h2>
            <div className='progress' style={{ marginTop: '1rem' }}>
              <span style={{ width: `${completion}%` }} />
            </div>
            <div className='profile-status-list'>
              <div className='profile-status-row'>
                <span>Thông tin cá nhân</span>
                <strong>
                  {basic.contactName && basic.contactPhone ? 'Hoàn tất' : 'Còn thiếu'}
                </strong>
              </div>
              <div className='profile-status-row'>
                <span>Kênh tiếp thị</span>
                <strong>{filledChannels > 0 ? 'Hoàn tất' : 'Còn thiếu'}</strong>
              </div>
              <div className='profile-status-row'>
                <span>Thanh toán</span>
                <strong>{hasBank ? 'Đã cập nhật' : 'Còn thiếu'}</strong>
              </div>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}
