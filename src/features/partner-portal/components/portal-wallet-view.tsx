'use client';

/**
 * Escrow wallet for distribution partners.
 *
 * Not one of the eleven v29 views — the mockup folds the wallet into
 * "Thanh toán" for distribution partners — but it is a route the portal serves,
 * so it wears the same stat cards, tables and badges as the rest of the portal
 * rather than the admin console's components.
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { createDepositRequestMutation } from '../api/mutations';
import {
  myDepositRequestsQueryOptions,
  myWalletQueryOptions,
  myWalletTransactionsQueryOptions
} from '../api/queries';
import { formatDateTimeVn, formatDateVn } from '@/lib/format';
import { formatDong } from '../lib/portal-format';
import { PortalIcon } from './portal-icon-sprite';
import { usePortalToast } from './portal-toast';

const MIN_DEPOSIT_VND = 100_000;

const DEPOSIT_STATUS: Record<string, { cls: string; label: string }> = {
  pending: { cls: 'b-warning', label: 'Chờ xác nhận' },
  confirmed: { cls: 'b-success', label: 'Đã xác nhận' },
  cancelled: { cls: 'b-danger', label: 'Đã hủy' }
};

export function PortalWalletView() {
  const toast = usePortalToast();
  const { data: wallet, isLoading: walletLoading } = useQuery(myWalletQueryOptions());
  const { data: transactions = [], isLoading: txLoading } = useQuery(
    myWalletTransactionsQueryOptions()
  );
  const { data: depositRequests = [] } = useQuery(myDepositRequestsQueryOptions());

  const [depositOpen, setDepositOpen] = useState(false);
  const [amount, setAmount] = useState('');

  const createDeposit = useMutation({
    ...createDepositRequestMutation,
    onSuccess: () => {
      setDepositOpen(false);
      setAmount('');
      toast('Đã tạo yêu cầu nạp ký quỹ. Vui lòng chuyển khoản theo hướng dẫn.');
    },
    onError: () => toast('Tạo yêu cầu thất bại, vui lòng thử lại')
  });

  const submitDeposit = () => {
    const value = Number(amount || 0);
    if (value < MIN_DEPOSIT_VND) {
      toast(`Số tiền tối thiểu là ${formatDong(MIN_DEPOSIT_VND)}`);
      return;
    }
    createDeposit.mutate({ amountVnd: value });
  };

  return (
    <section className='view active'>
      <div className='grid grid-3'>
        <article className='card stat'>
          <div className='stat-label'>Số dư ký quỹ</div>
          <div className='stat-value'>{walletLoading ? '—' : formatDong(wallet?.balanceVnd)}</div>
          <div className='stat-note'>Tổng số dư trên ví đối tác</div>
        </article>
        <article className='card stat'>
          <div className='stat-label'>Khả dụng</div>
          <div className='stat-value'>
            {walletLoading ? '—' : formatDong(wallet?.availableBalanceVnd)}
          </div>
          <div className='stat-note'>Có thể dùng để tạo đơn hoặc rút</div>
        </article>
        <article className='card stat'>
          <div className='stat-label'>Đang chờ rút</div>
          <div className='stat-value'>
            {walletLoading ? '—' : formatDong(wallet?.pendingPayoutVnd)}
          </div>
          <div className='stat-note'>Đã gửi yêu cầu, chờ duyệt</div>
        </article>
      </div>

      <div className='section-head'>
        <div>
          <h2>Yêu cầu nạp ký quỹ</h2>
          <p className='card-sub'>Các yêu cầu gần đây và trạng thái đối chiếu.</p>
        </div>
        <button className='btn btn-primary' type='button' onClick={() => setDepositOpen(true)}>
          <PortalIcon id='i-plus' />
          Tạo yêu cầu nạp
        </button>
      </div>
      <div className='table-wrap'>
        <table className='table'>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Số tiền</th>
              <th>Mã chuyển khoản</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {depositRequests.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className='empty'>Chưa có yêu cầu nạp nào.</div>
                </td>
              </tr>
            )}
            {depositRequests.map((req) => {
              const badge = DEPOSIT_STATUS[req.status] ?? {
                cls: 'b-gray',
                label: req.status
              };
              return (
                <tr key={req.id}>
                  <td>{formatDateVn(req.createdAt)}</td>
                  <td>
                    <strong>{formatDong(req.amountVnd)}</strong>
                  </td>
                  <td className='mono'>{req.bankTransferCode}</td>
                  <td>
                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className='section-head'>
        <div>
          <h2>Lịch sử giao dịch</h2>
          <p className='card-sub'>Mọi khoản ghi có và ghi nợ trên ví ký quỹ.</p>
        </div>
      </div>
      <div className='table-wrap'>
        <table className='table'>
          <thead>
            <tr>
              <th>Thời điểm</th>
              <th>Nội dung</th>
              <th>Số tiền</th>
              <th>Số dư sau giao dịch</th>
            </tr>
          </thead>
          <tbody>
            {txLoading && (
              <tr>
                <td colSpan={4}>
                  <div className='empty'>Đang tải giao dịch…</div>
                </td>
              </tr>
            )}
            {!txLoading && transactions.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className='empty'>Chưa có giao dịch nào.</div>
                </td>
              </tr>
            )}
            {transactions.map((tx) => {
              const isCredit = tx.amountVnd > 0;
              return (
                <tr key={tx.id}>
                  <td>{formatDateTimeVn(tx.createdAt)}</td>
                  <td>{tx.reason || tx.type}</td>
                  <td>
                    <span className={`badge ${isCredit ? 'b-success' : 'b-danger'}`}>
                      {isCredit ? '+' : ''}
                      {formatDong(tx.amountVnd)}
                    </span>
                  </td>
                  <td>{formatDong(tx.balanceAfterVnd)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        aria-labelledby='depositTitle'
        aria-modal='true'
        className={`modal-backdrop${depositOpen ? ' open' : ''}`}
        role='dialog'
        onClick={(e) => {
          if (e.target === e.currentTarget) setDepositOpen(false);
        }}
      >
        <div className='modal'>
          <div className='modal-head'>
            <div>
              <h2 id='depositTitle' style={{ fontSize: '1.0625rem' }}>
                Tạo yêu cầu nạp ký quỹ
              </h2>
              <p className='card-sub'>Hệ thống sẽ cấp mã chuyển khoản để đối chiếu.</p>
            </div>
            <button className='btn btn-icon' type='button' onClick={() => setDepositOpen(false)}>
              <PortalIcon id='i-x' />
            </button>
          </div>
          <div className='modal-body'>
            <div className='field'>
              <label htmlFor='depositAmount'>Số tiền muốn nạp</label>
              <input
                id='depositAmount'
                type='number'
                min={MIN_DEPOSIT_VND}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={String(MIN_DEPOSIT_VND)}
              />
              <span className='field-hint'>Tối thiểu {formatDong(MIN_DEPOSIT_VND)}.</span>
            </div>
          </div>
          <div className='modal-foot'>
            <button className='btn' type='button' onClick={() => setDepositOpen(false)}>
              Hủy
            </button>
            <button
              className='btn btn-primary'
              type='button'
              disabled={createDeposit.isPending}
              onClick={submitDeposit}
            >
              {createDeposit.isPending ? 'Đang tạo…' : 'Tạo yêu cầu'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
