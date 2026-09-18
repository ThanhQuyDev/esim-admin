'use client';

/**
 * Attributed orders — `#view-orders` in cong-doi-tac-phan-phoi-hoan-chinh-v29.html.
 *
 * Toolbar, the filter card, the order table, and the right-hand drawer with the
 * attribution timeline. Filtering happens on the loaded rows, as in the mockup.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { myOrdersQueryOptions } from '../api/queries';
import { formatDateTimeVn, formatDateVn } from '@/lib/format';
import { formatDong } from '../lib/portal-format';
import { PortalIcon } from './portal-icon-sprite';
import type { MyOrder } from '../api/types';

const COMMISSION_STATUS: Record<string, { cls: string; label: string }> = {
  credited: { cls: 'b-success', label: 'Đã duyệt' },
  pending: { cls: 'b-warning', label: 'Chờ xác nhận' },
  reversed: { cls: 'b-danger', label: 'Hoàn tiền' }
};

/** Which touchpoint earned the order: a tracking link, or the partner's code. */
function sourceOf(order: MyOrder): { label: string; detail: string } {
  return order.linkCode
    ? { label: 'Liên kết', detail: order.linkCode }
    : { label: 'Mã đối tác', detail: '—' };
}

export function PortalOrdersView() {
  const { data: orders, isLoading } = useQuery(myOrdersQueryOptions());

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');
  const [selected, setSelected] = useState<MyOrder | null>(null);

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return (orders ?? []).filter((o) => {
      const haystack = `${o.orderNumber} ${o.items.map((i) => i.planName).join(' ')}`.toLowerCase();
      const matchesQuery = haystack.includes(q);
      const matchesStatus =
        status === 'all' ||
        (status === 'approved' && o.commissionStatus === 'credited') ||
        (status === 'pending' && o.commissionStatus === 'pending') ||
        (status === 'reversed' && o.commissionStatus === 'reversed');
      const matchesSource =
        source === 'all' ||
        (source === 'Link' && Boolean(o.linkCode)) ||
        (source === 'Mã' && !o.linkCode);
      return matchesQuery && matchesStatus && matchesSource;
    });
  }, [orders, search, status, source]);

  const exportCsv = () => {
    const header = ['Đơn', 'Sản phẩm', 'Giá trị', 'Nguồn', 'eSIM', 'Hoa hồng', 'Trạng thái'];
    const body = rows.map((o) => [
      o.orderNumber,
      o.items.map((i) => i.planName).join(' + '),
      String(o.vndPrice),
      sourceOf(o).detail,
      String(o.esimCount),
      String(o.commissionVnd ?? 0),
      COMMISSION_STATUS[o.commissionStatus ?? '']?.label ?? '—'
    ]);
    const csv = [header, ...body].map((line) => line.map((c) => `"${c}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'partner-orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className='view active'>
      <div className='toolbar'>
        <div>
          <h2 className='card-title'>Đơn hàng &amp; ghi nhận nguồn giới thiệu</h2>
          <p className='card-sub'>Theo dõi nguồn ghi nhận, trạng thái eSIM và vòng đời hoa hồng</p>
        </div>
        <div className='actions'>
          <button className='btn' type='button' onClick={exportCsv}>
            <PortalIcon id='i-download' />
            Xuất CSV
          </button>
        </div>
      </div>

      <article className='card compact'>
        <div className='filters'>
          <input
            placeholder='Tìm mã đơn hoặc sản phẩm'
            style={{ maxWidth: '16.25rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            style={{ maxWidth: '11.25rem' }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value='all'>Tất cả trạng thái</option>
            <option value='approved'>Đã duyệt</option>
            <option value='pending'>Chờ xác nhận</option>
            <option value='reversed'>Hoàn tiền</option>
          </select>
          <select
            style={{ maxWidth: '11.25rem' }}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value='all'>Mọi nguồn</option>
            <option value='Link'>Liên kết</option>
            <option value='Mã'>Mã đối tác</option>
          </select>
        </div>
      </article>

      <div className='table-wrap' style={{ marginTop: '0.75rem' }}>
        <table className='table'>
          <thead>
            <tr>
              <th>Đơn</th>
              <th>Sản phẩm</th>
              <th>Giá trị</th>
              <th>Nguồn ghi nhận</th>
              <th>eSIM</th>
              <th>Hoa hồng</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8}>
                  <div className='empty'>Đang tải đơn hàng…</div>
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className='empty'>Không có đơn phù hợp</div>
                </td>
              </tr>
            )}
            {rows.map((o) => {
              const src = sourceOf(o);
              const badge = COMMISSION_STATUS[o.commissionStatus ?? ''] ?? {
                cls: 'b-gray',
                label: o.status
              };
              return (
                <tr key={o.orderNumber}>
                  <td className='mono'>#{o.orderNumber}</td>
                  <td>
                    <strong>{o.items.map((i) => i.planName).join(' + ') || '—'}</strong>
                    <div className='card-sub'>{formatDateVn(o.createdAt)}</div>
                  </td>
                  <td>{formatDong(o.vndPrice)}</td>
                  <td>
                    <span className='badge b-gray'>{src.label}</span>
                    <div className='card-sub mono'>{src.detail}</div>
                  </td>
                  <td>{o.esimCount}</td>
                  <td>
                    <strong>{formatDong(o.commissionVnd)}</strong>
                  </td>
                  <td>
                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                  </td>
                  <td>
                    <button className='btn btn-sm' type='button' onClick={() => setSelected(o)}>
                      Xem
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        className={`drawer-backdrop${selected ? ' open' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelected(null);
        }}
      >
        <aside className='drawer'>
          <div className='drawer-head'>
            <div>
              <h2 style={{ fontSize: '1.0625rem' }}>
                Chi tiết đơn <span>{selected ? `#${selected.orderNumber}` : ''}</span>
              </h2>
              <p className='card-sub'>Lịch sử ghi nhận nguồn giới thiệu và trạng thái hoa hồng</p>
            </div>
            <button className='btn btn-icon' type='button' onClick={() => setSelected(null)}>
              <PortalIcon id='i-x' />
            </button>
          </div>
          <div className='drawer-body'>
            {selected && (
              <>
                <div className='detail-list'>
                  <div className='detail-item'>
                    <span>Sản phẩm</span>
                    <strong>{selected.items.map((i) => i.planName).join(' + ') || '—'}</strong>
                  </div>
                  <div className='detail-item'>
                    <span>Giá trị</span>
                    <strong>{formatDong(selected.vndPrice)}</strong>
                  </div>
                  <div className='detail-item'>
                    <span>Hoa hồng</span>
                    <strong>{formatDong(selected.commissionVnd)}</strong>
                  </div>
                  <div className='detail-item'>
                    <span>Trạng thái</span>
                    <strong>
                      {COMMISSION_STATUS[selected.commissionStatus ?? '']?.label ?? selected.status}
                    </strong>
                  </div>
                </div>

                <div className='section-head'>
                  <h2>Lịch sử ghi nhận nguồn giới thiệu</h2>
                </div>
                <div className='timeline'>
                  <div className='timeline-item'>
                    <span className='timeline-dot' />
                    <div>
                      <strong>Lượt nhấp hoặc nguồn giới thiệu</strong>
                      <p className='card-sub'>
                        {sourceOf(selected).label}: {sourceOf(selected).detail}
                      </p>
                    </div>
                    <span className='timeline-time' />
                  </div>
                  <div className='timeline-item'>
                    <span className='timeline-dot' />
                    <div>
                      <strong>Đặt hàng</strong>
                      <p className='card-sub'>Trạng thái đơn: {selected.status}</p>
                    </div>
                    <span className='timeline-time'>{formatDateTimeVn(selected.createdAt)}</span>
                  </div>
                  <div className='timeline-item'>
                    <span className='timeline-dot' />
                    <div>
                      <strong>Trạng thái eSIM</strong>
                      <p className='card-sub'>{selected.esimCount} eSIM đã cấp</p>
                    </div>
                    <span className='timeline-time' />
                  </div>
                  <div className='timeline-item'>
                    <span className='timeline-dot' />
                    <div>
                      <strong>Hoa hồng khả dụng</strong>
                      <p className='card-sub'>
                        {selected.commissionStatus === 'credited'
                          ? 'Đã chuyển sang số dư khả dụng.'
                          : 'Khả dụng sau khi đơn qua thời gian đối soát.'}
                      </p>
                    </div>
                    <span className='timeline-time' />
                  </div>
                </div>

                <div className='callout'>
                  <strong>Quy tắc áp dụng</strong>
                  <p className='card-sub'>
                    Một đơn chỉ ghi nhận cho một đối tác. Mã đối tác nhập tại trang thanh toán được
                    ưu tiên hơn lượt nhấp hợp lệ gần nhất.
                  </p>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
