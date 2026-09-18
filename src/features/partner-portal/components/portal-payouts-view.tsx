'use client';

/**
 * Withdrawals — `#view-payout` in cong-doi-tac-phan-phoi-hoan-chinh-v29.html.
 *
 * The request card sits beside the saved payout account, with the request
 * history below. The mockup confirms through a modal; the same confirmation is
 * kept here as the v29 `.modal-backdrop` dialog.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';

import { createPayoutRequestMutation } from '../api/mutations';
import {
  myPayoutsQueryOptions,
  myProfileQueryOptions,
  mySummaryQueryOptions
} from '../api/queries';
import { formatDateVn } from '@/lib/format';
import { formatDong } from '../lib/portal-format';
import { VIEW_ROUTES } from '../lib/portal-nav';
import { PortalIcon } from './portal-icon-sprite';
import { usePortalToast } from './portal-toast';

const MIN_PAYOUT_VND = 100_000;

const PAYOUT_STATUS: Record<string, { cls: string; label: string }> = {
  pending: { cls: 'b-warning', label: 'Chờ duyệt' },
  approved: { cls: 'b-info', label: 'Đã duyệt' },
  paid: { cls: 'b-success', label: 'Đã hoàn tất' },
  rejected: { cls: 'b-danger', label: 'Bị từ chối' }
};

/** "•••• 1234" — the masked account the mockup shows. */
function maskAccount(accountNumber: string | null | undefined): string {
  if (!accountNumber) return 'Chưa cập nhật';
  return `•••• ${accountNumber.slice(-4)}`;
}

export function PortalPayoutsView() {
  const toast = usePortalToast();
  const { data: summary } = useQuery(mySummaryQueryOptions());
  const { data: me } = useQuery(myProfileQueryOptions());
  const { data: payouts } = useQuery(myPayoutsQueryOptions());

  const available = summary?.wallet.availableBalanceVnd ?? 0;
  const [amount, setAmount] = useState('');
  const [confirming, setConfirming] = useState(false);

  const hasBank = Boolean(me?.bankAccountNumber);
  const requested = Number(amount || 0);

  const createPayout = useMutation({
    ...createPayoutRequestMutation,
    onSuccess: () => {
      setConfirming(false);
      setAmount('');
      toast('Đã gửi yêu cầu rút tiền');
    },
    onError: () => {
      setConfirming(false);
      toast('Không gửi được yêu cầu, vui lòng thử lại');
    }
  });

  const openConfirm = () => {
    if (!hasBank) {
      toast('Cập nhật tài khoản ngân hàng trong Hồ sơ trước khi rút tiền');
      return;
    }
    if (requested < MIN_PAYOUT_VND) {
      toast(`Số tiền tối thiểu là ${formatDong(MIN_PAYOUT_VND)}`);
      return;
    }
    if (requested > available) {
      toast('Số tiền vượt quá số dư khả dụng');
      return;
    }
    setConfirming(true);
  };

  const bankLabel = me
    ? `${me.bankName ?? 'Ngân hàng'} · ${maskAccount(me.bankAccountNumber)} · ${
        me.bankAccountHolder ?? ''
      }`.trim()
    : 'Chưa cập nhật';

  return (
    <section className='view active'>
      <div className='payout-grid'>
        <article className='card'>
          <div className='payout-balance-label'>Số dư có thể rút</div>
          <div className='payout-balance'>{formatDong(available)}</div>
          <div className='field' style={{ marginTop: '1rem' }}>
            <label htmlFor='payoutAmount'>Số tiền muốn rút</label>
            <input
              id='payoutAmount'
              max={available}
              min={MIN_PAYOUT_VND}
              step={1000}
              type='number'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(MIN_PAYOUT_VND)}
            />
          </div>
          <div className='field' style={{ marginTop: '0.75rem' }}>
            <label htmlFor='payoutMethod'>Tài khoản nhận</label>
            <select id='payoutMethod' disabled>
              <option>{bankLabel}</option>
            </select>
          </div>
          <p className='card-sub' style={{ marginTop: '0.75rem' }}>
            Ngưỡng tối thiểu {formatDong(MIN_PAYOUT_VND)}. Yêu cầu thường được xử lý trong 1–3 ngày
            làm việc.
          </p>
          <button
            className='btn btn-primary'
            type='button'
            onClick={openConfirm}
            style={{ marginTop: '0.75rem' }}
            disabled={createPayout.isPending}
          >
            Yêu cầu rút tiền
          </button>
        </article>

        <article className='card'>
          <h2 className='card-title'>Tài khoản thanh toán</h2>
          <div className='payment-account-list'>
            <div className='payment-account-item'>
              <span>Ngân hàng</span>
              <strong>{me?.bankName ?? 'Chưa cập nhật'}</strong>
            </div>
            <div className='payment-account-item'>
              <span>Chủ tài khoản</span>
              <strong>{me?.bankAccountHolder ?? 'Chưa cập nhật'}</strong>
            </div>
            <div className='payment-account-item'>
              <span>Số tài khoản</span>
              <strong>{maskAccount(me?.bankAccountNumber)}</strong>
            </div>
          </div>
          <span
            className={`badge ${hasBank ? 'b-success' : 'b-warning'}`}
            style={{ marginTop: '0.875rem' }}
          >
            {hasBank ? 'Đã xác minh' : 'Chưa cập nhật'}
          </span>
          <div>
            <Link className='btn' href={VIEW_ROUTES.profile} style={{ marginTop: '0.875rem' }}>
              Cập nhật trong Hồ sơ
            </Link>
          </div>
        </article>
      </div>

      <div className='payout-history'>
        <div className='section-head' style={{ marginTop: 0 }}>
          <div>
            <h2>Lịch sử thanh toán</h2>
            <p className='card-sub'>Các yêu cầu gần đây và trạng thái xử lý.</p>
          </div>
        </div>
        <div className='table-wrap'>
          <table className='table'>
            <thead>
              <tr>
                <th>Mã yêu cầu</th>
                <th>Ngày</th>
                <th>Loại</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {(payouts ?? []).length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className='empty'>Chưa có yêu cầu rút tiền nào.</div>
                  </td>
                </tr>
              )}
              {(payouts ?? []).map((p) => {
                const badge = PAYOUT_STATUS[p.status] ?? {
                  cls: 'b-gray',
                  label: p.status
                };
                return (
                  <tr key={p.id}>
                    <td className='mono'>WD-{String(p.id).padStart(6, '0')}</td>
                    <td>{formatDateVn(p.createdAt)}</td>
                    <td>Rút tiền</td>
                    <td>{formatDong(p.amountVnd)}</td>
                    <td>Ngân hàng</td>
                    <td>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div
        aria-labelledby='payoutTitle'
        aria-modal='true'
        className={`modal-backdrop${confirming ? ' open' : ''}`}
        role='dialog'
        onClick={(e) => {
          if (e.target === e.currentTarget) setConfirming(false);
        }}
      >
        <div className='modal'>
          <div className='modal-head'>
            <div>
              <h2 id='payoutTitle' style={{ fontSize: '1.0625rem' }}>
                Xác nhận thanh toán
              </h2>
              <p className='card-sub'>Kiểm tra kỹ thông tin trước khi gửi</p>
            </div>
            <button className='btn btn-icon' type='button' onClick={() => setConfirming(false)}>
              <PortalIcon id='i-x' />
            </button>
          </div>
          <div className='modal-body'>
            <div className='detail-list'>
              <div className='detail-item'>
                <span>Số tiền</span>
                <strong>{formatDong(requested)}</strong>
              </div>
              <div className='detail-item'>
                <span>Số dư sau khi rút</span>
                <strong>{formatDong(available - requested)}</strong>
              </div>
              <div className='detail-item'>
                <span>Tài khoản nhận</span>
                <strong>{me?.bankName ?? '—'}</strong>
              </div>
              <div className='detail-item'>
                <span>Số tài khoản</span>
                <strong>{maskAccount(me?.bankAccountNumber)}</strong>
              </div>
            </div>
          </div>
          <div className='modal-foot'>
            <button className='btn' type='button' onClick={() => setConfirming(false)}>
              Hủy
            </button>
            <button
              className='btn btn-primary'
              type='button'
              disabled={createPayout.isPending}
              onClick={() =>
                createPayout.mutate({
                  amountVnd: requested,
                  bankAccountInfo: bankLabel
                })
              }
            >
              {createPayout.isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
