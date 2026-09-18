'use client';

/**
 * Commissions — `#view-commissions` in cong-doi-tac-phan-phoi-hoan-chinh-v29.html.
 *
 * Four stat cards, the 30-day chart beside the "how a commission is confirmed"
 * steps, then the per-order transaction table.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { myOrdersQueryOptions, mySummaryQueryOptions } from '../api/queries';
import { formatDong, formatPercentVn, toMillions } from '../lib/portal-format';
import { formatDateVn } from '@/lib/format';
import { PortalIcon } from './portal-icon-sprite';
import { PortalLineChart, type ChartConfig } from './portal-chart';
import type { MyOrder } from '../api/types';

const DAYS = 30;

/** Commission raised vs commission credited, per day, in millions. */
function buildCommissionChart(orders: MyOrder[]): ChartConfig {
  const today = new Date();
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (DAYS - 1 - i));
    return d;
  });
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const raised = new Map<string, number>();
  const credited = new Map<string, number>();
  for (const order of orders) {
    if (order.commissionVnd == null) continue;
    const k = key(new Date(order.createdAt));
    raised.set(k, (raised.get(k) ?? 0) + order.commissionVnd);
    if (order.commissionStatus === 'credited') {
      credited.set(k, (credited.get(k) ?? 0) + order.commissionVnd);
    }
  }

  return {
    unit: 'triệu đồng',
    format: 'moneyM',
    showLegend: false,
    labels: days.map(
      (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    ),
    series: [
      {
        name: 'Phát sinh',
        color: '#4f46e5',
        area: true,
        data: days.map((d) => toMillions(raised.get(key(d)) ?? 0))
      },
      {
        name: 'Đã duyệt',
        color: '#0f9f8f',
        data: days.map((d) => toMillions(credited.get(key(d)) ?? 0))
      }
    ]
  };
}

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  credited: { cls: 'b-success', label: 'Có thể rút' },
  pending: { cls: 'b-warning', label: 'Chờ xác nhận' },
  reversed: { cls: 'b-danger', label: 'Hoàn tiền' }
};

export function PortalCommissionsView() {
  const { data: summary, isLoading } = useQuery(mySummaryQueryOptions());
  const { data: orders } = useQuery(myOrdersQueryOptions());

  const chart = useMemo(() => buildCommissionChart(orders ?? []), [orders]);

  const commissionRows = useMemo(
    () => (orders ?? []).filter((o) => o.commissionVnd != null),
    [orders]
  );

  if (isLoading || !summary) {
    return (
      <section className='view active'>
        <article className='card'>
          <div className='empty'>Đang tải dữ liệu…</div>
        </article>
      </section>
    );
  }

  const pendingOrders = commissionRows.filter((o) => o.commissionStatus === 'pending').length;
  const rate = summary.tier.current ? Number(summary.tier.current.commissionPercent) : 0;

  const exportCsv = () => {
    const header = ['Ngày', 'Mã đơn', 'Sản phẩm', 'Doanh thu', 'Hoa hồng', 'Trạng thái'];
    const body = commissionRows.map((o) => [
      formatDateVn(o.createdAt),
      o.orderNumber,
      o.items.map((i) => i.planName).join(' + '),
      String(o.vndPrice),
      String(o.commissionVnd ?? 0),
      STATUS_BADGE[o.commissionStatus ?? '']?.label ?? '—'
    ]);
    const csv = [header, ...body].map((line) => line.map((c) => `"${c}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hoa-hong-doi-tac.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className='view active'>
      <div className='grid grid-4'>
        <article className='card stat'>
          <div className='stat-label'>Chờ xác nhận</div>
          <div className='stat-value'>{formatDong(summary.commissionPendingVnd)}</div>
          <div className='stat-note'>{pendingOrders} đơn đang trong thời gian đối soát</div>
        </article>
        <article className='card stat'>
          <div className='stat-label'>Có thể rút</div>
          <div className='stat-value'>{formatDong(summary.wallet.availableBalanceVnd)}</div>
          <div className='stat-note'>Đã đủ điều kiện thanh toán</div>
        </article>
        <article className='card stat'>
          <div className='stat-label'>Đã nhận lũy kế</div>
          <div className='stat-value'>{formatDong(summary.lifetime.commissionVnd)}</div>
          <div className='stat-note'>Tổng hoa hồng đã ghi nhận</div>
        </article>
        <article className='card stat'>
          <div className='stat-label'>Tỷ lệ hoa hồng hiện tại</div>
          <div className='stat-value'>{formatPercentVn(rate)}</div>
          <div className='stat-note'>
            {summary.tier.current
              ? `Quyền lợi Hạng ${summary.tier.current.tierName}`
              : 'Chưa gán hạng'}
          </div>
        </article>
      </div>

      <div className='grid grid-2' style={{ marginTop: '0.875rem' }}>
        <article className='card'>
          <div className='toolbar'>
            <div>
              <h2 className='card-title'>Hoa hồng 30 ngày</h2>
              <p className='card-sub'>Khoản phát sinh và khoản đã được duyệt</p>
            </div>
            <span className='badge b-success'>
              {formatDong(summary.performance30d.commissionVnd)}
            </span>
          </div>
          <PortalLineChart cfg={chart} ariaLabel='Hoa hồng 30 ngày' />
        </article>

        <article className='card'>
          <h2 className='card-title'>Cách hoa hồng được xác nhận</h2>
          <div className='commission-steps'>
            <div className='commission-step'>
              <span className='commission-step-number'>1</span>
              <div className='commission-step-copy'>
                <strong>Đơn được ghi nhận</strong>
                <p className='card-sub'>Link hoặc mã đối tác được hệ thống xác định hợp lệ.</p>
              </div>
            </div>
            <div className='commission-step'>
              <span className='commission-step-number'>2</span>
              <div className='commission-step-copy'>
                <strong>Chờ đối soát</strong>
                <p className='card-sub'>
                  Đơn đã thanh toán và vượt qua thời gian kiểm tra hoàn tiền.
                </p>
              </div>
            </div>
            <div className='commission-step'>
              <span className='commission-step-number'>3</span>
              <div className='commission-step-copy'>
                <strong>Có thể rút</strong>
                <p className='card-sub'>Khoản hoa hồng được chuyển sang số dư khả dụng.</p>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className='section-head'>
        <div>
          <h2>Giao dịch hoa hồng</h2>
          <p className='card-sub'>Chi tiết theo từng đơn hàng hợp lệ.</p>
        </div>
        <button className='btn' type='button' onClick={exportCsv}>
          <PortalIcon id='i-download' />
          Xuất CSV
        </button>
      </div>
      <div className='table-wrap'>
        <table className='table'>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Mã đơn</th>
              <th>Sản phẩm</th>
              <th>Doanh thu</th>
              <th>Tỷ lệ</th>
              <th>Hoa hồng</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {commissionRows.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className='empty'>Chưa có giao dịch hoa hồng nào.</div>
                </td>
              </tr>
            )}
            {commissionRows.map((o) => {
              const badge = STATUS_BADGE[o.commissionStatus ?? ''] ?? {
                cls: 'b-gray',
                label: '—'
              };
              const effectiveRate =
                o.vndPrice > 0 ? ((o.commissionVnd ?? 0) / o.vndPrice) * 100 : 0;
              return (
                <tr key={o.orderNumber}>
                  <td>{formatDateVn(o.createdAt)}</td>
                  <td className='mono'>#{o.orderNumber}</td>
                  <td>{o.items.map((i) => i.planName).join(' + ') || '—'}</td>
                  <td>{formatDong(o.vndPrice)}</td>
                  <td>{formatPercentVn(effectiveRate)}</td>
                  <td>
                    <strong>{formatDong(o.commissionVnd)}</strong>
                  </td>
                  <td>
                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
