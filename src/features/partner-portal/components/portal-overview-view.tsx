'use client';

/**
 * Partner dashboard — `#view-dashboard` in cong-doi-tac-phan-phoi-hoan-chinh-v29.html.
 *
 * The markup is the mockup's, class for class. What differs is the source of
 * the numbers: the mockup hard-codes them, this reads the partner's own
 * summary, orders and tickets. Where the API has no equivalent of a mocked
 * figure (period-over-period deltas, "khách mới"), the element keeps its place
 * and carries a real number instead of an invented one.
 */

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  myOrdersQueryOptions,
  myProfileQueryOptions,
  mySummaryQueryOptions,
  myTicketsQueryOptions
} from '../api/queries';
import { VIEW_ROUTES } from '../lib/portal-nav';
import {
  formatCompactDong,
  formatCount,
  formatDong,
  formatPercentVn,
  toMillions
} from '../lib/portal-format';
import { PortalIcon } from './portal-icon-sprite';
import { PortalLineChart, type ChartConfig } from './portal-chart';
import type { MyOrder } from '../api/types';

const DAYS = 30;

/**
 * Daily revenue and commission for the last 30 days, in millions.
 *
 * The summary endpoint returns only totals, so the series is bucketed from the
 * partner's own orders — the same rows the orders screen lists.
 */
function buildPerformanceChart(orders: MyOrder[]): ChartConfig {
  const today = new Date();
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (DAYS - 1 - i));
    return d;
  });

  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const revenue = new Map<string, number>();
  const commission = new Map<string, number>();

  for (const order of orders) {
    const created = new Date(order.createdAt);
    const k = key(created);
    revenue.set(k, (revenue.get(k) ?? 0) + (order.vndPrice ?? 0));
    if (order.commissionStatus === 'credited') {
      commission.set(k, (commission.get(k) ?? 0) + (order.commissionVnd ?? 0));
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
        name: 'Doanh số',
        color: '#4f46e5',
        area: true,
        data: days.map((d) => toMillions(revenue.get(key(d)) ?? 0))
      },
      {
        name: 'Hoa hồng đã duyệt',
        color: '#0f9f8f',
        data: days.map((d) => toMillions(commission.get(key(d)) ?? 0))
      }
    ]
  };
}

/** Relative time in the wording the mockup's `.notice-time` uses. */
function noticeAge(iso: string | undefined): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return 'Vừa xong';
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Hôm qua' : `${days} ngày`;
}

export function PortalOverviewView() {
  const { data: summary, isLoading } = useQuery(mySummaryQueryOptions());
  const { data: orders } = useQuery(myOrdersQueryOptions());
  const { data: me } = useQuery(myProfileQueryOptions());
  const { data: tickets } = useQuery(myTicketsQueryOptions());

  const chart = useMemo(() => buildPerformanceChart(orders ?? []), [orders]);

  if (isLoading || !summary) {
    return (
      <section className='view active'>
        <article className='card'>
          <div className='empty'>Đang tải dữ liệu…</div>
        </article>
      </section>
    );
  }

  const { performance30d: p30, wallet, tier } = summary;
  const conversionRate = p30.clicks > 0 ? (p30.orders / p30.clicks) * 100 : 0;
  const avgOrderVnd = p30.orders > 0 ? Math.round(p30.revenueVnd / p30.orders) : 0;
  const progress = Math.max(0, Math.min(100, Math.round(tier.progressPercent)));

  // Notices are derived from the partner's real state, in the mockup's order:
  // something to fix, something that went through, something in progress.
  const openTicket = (tickets ?? []).find((t) => t.status !== 'closed');
  const missingBank = !me?.bankAccountNumber;
  const creditedOrder = (orders ?? []).find((o) => o.commissionStatus === 'credited');

  return (
    <section className='view active'>
      <div className='grid grid-2'>
        <article className='card hero'>
          <div className='hero-label'>Khả dụng để thanh toán</div>
          <div className='hero-value'>{formatDong(wallet.availableBalanceVnd)}</div>
          <div className='hero-meta'>
            <span className='trend'>{formatDong(summary.commissionPendingVnd)}</span>
            <span>đang chờ xác minh</span>
          </div>
          <div className='hero-actions'>
            <Link className='btn btn-primary' href={VIEW_ROUTES.payout}>
              <PortalIcon id='i-wallet' />
              Yêu cầu thanh toán
            </Link>
            <Link className='btn btn-light-outline' href={VIEW_ROUTES.commissions}>
              Xem hoa hồng
            </Link>
          </div>
        </article>

        <article
          className='card tier-card'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            gap: '1.125rem'
          }}
        >
          <div
            className='donut'
            style={{
              background: `conic-gradient(var(--accent) 0 ${progress}%,#e7eaf0 ${progress}%)`
            }}
          >
            <strong>{progress}%</strong>
          </div>
          <div>
            <span className='badge b-yellow'>
              {tier.current ? `Hạng ${tier.current.tierName}` : 'Chưa gán hạng'}
            </span>
            <h2 style={{ fontSize: '1.0625rem', marginTop: '0.625rem' }}>
              {tier.next
                ? `Còn ${formatDong(tier.toNextTierVnd)} để lên hạng ${tier.next.tierName}`
                : 'Bạn đang ở hạng cao nhất'}
            </h2>
            <p className='card-sub'>
              {tier.current
                ? `Hoa hồng cơ bản ${formatPercentVn(Number(tier.current.commissionPercent))} · quyền lợi theo hạng hiện tại`
                : 'Hạng được xét theo doanh số tích luỹ của bạn'}
            </p>
            <div className='progress' style={{ marginTop: '1rem' }}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <Link className='btn btn-sm' href={VIEW_ROUTES.tier} style={{ marginTop: '0.75rem' }}>
              Xem hạng đối tác
            </Link>
          </div>
        </article>
      </div>

      <div className='grid dashboard-kpis' style={{ marginTop: '0.875rem' }}>
        <article className='card stat'>
          <div className='stat-top'>
            <div className='stat-icon'>
              <PortalIcon id='i-eye' />
            </div>
            <span className='badge b-gray'>30 ngày</span>
          </div>
          <div className='stat-label'>Lượt nhấp</div>
          <div className='stat-value'>{formatCount(p30.clicks)}</div>
          <div className='stat-note'>{formatCount(summary.lifetime.clicks)} lượt nhấp tích luỹ</div>
        </article>

        <article className='card stat'>
          <div className='stat-top'>
            <div className='stat-icon'>
              <PortalIcon id='i-cart' />
            </div>
            <span className='badge b-info'>{formatPercentVn(conversionRate)}</span>
          </div>
          <div className='stat-label'>Đơn hợp lệ</div>
          <div className='stat-value'>{formatCount(p30.orders)}</div>
          <div className='stat-note'>Tỷ lệ chuyển đổi {formatPercentVn(conversionRate)}</div>
        </article>

        <article className='card stat'>
          <div className='stat-top'>
            <div className='stat-icon'>
              <PortalIcon id='i-wallet' />
            </div>
            <span className='badge b-gray'>30 ngày</span>
          </div>
          <div className='stat-label'>Doanh số</div>
          <div className='stat-value'>{formatCompactDong(p30.revenueVnd)}</div>
          <div className='stat-note'>Giá trị trung bình mỗi đơn {formatDong(avgOrderVnd)}</div>
        </article>

        <article className='card stat'>
          <div className='stat-top'>
            <div className='stat-icon'>
              <PortalIcon id='i-chart' />
            </div>
            <span className='badge b-success'>Đã duyệt</span>
          </div>
          <div className='stat-label'>Hoa hồng</div>
          <div className='stat-value'>{formatCompactDong(p30.commissionVnd)}</div>
          <div className='stat-note'>
            {formatDong(summary.commissionPendingVnd)} đang chờ xác minh
          </div>
        </article>
      </div>

      <div className='grid grid-2' style={{ marginTop: '0.875rem' }}>
        <article className='card'>
          <div className='toolbar'>
            <div>
              <h2 className='card-title'>Hiệu suất 30 ngày</h2>
              <p className='card-sub'>Doanh số và hoa hồng đã duyệt</p>
            </div>
            <div className='actions'>
              <span className='badge b-gray'>Doanh số</span>
              <span className='badge b-yellow'>Hoa hồng</span>
            </div>
          </div>
          <PortalLineChart cfg={chart} ariaLabel='Hiệu suất 30 ngày' />
        </article>

        <article className='card'>
          <h2 className='card-title'>Thông báo quan trọng</h2>
          <p className='card-sub'>
            Các cập nhật mới liên quan đến tài khoản, đơn hàng và hoa hồng.
          </p>
          <div className='notice-list'>
            {missingBank && (
              <Link className='notice-item' href={VIEW_ROUTES.profile}>
                <span className='notice-icon warning'>
                  <PortalIcon id='i-user' />
                </span>
                <span className='notice-copy'>
                  <strong>Bổ sung tài khoản ngân hàng để nhận thanh toán</strong>
                  <p>Yêu cầu rút tiền chỉ được duyệt khi hồ sơ có tài khoản nhận tiền.</p>
                </span>
                <span className='notice-time'>Cần xử lý</span>
              </Link>
            )}

            {creditedOrder && (
              <Link className='notice-item' href={VIEW_ROUTES.commissions}>
                <span className='notice-icon success'>
                  <PortalIcon id='i-check' />
                </span>
                <span className='notice-copy'>
                  <strong>Đơn #{creditedOrder.orderNumber} đã được duyệt</strong>
                  <p>Hoa hồng {formatDong(creditedOrder.commissionVnd)} đã được ghi nhận.</p>
                </span>
                <span className='notice-time'>{noticeAge(creditedOrder.createdAt)}</span>
              </Link>
            )}

            {openTicket && (
              <Link className='notice-item' href={VIEW_ROUTES.support}>
                <span className='notice-icon info'>
                  <PortalIcon id='i-help' />
                </span>
                <span className='notice-copy'>
                  <strong>Yêu cầu hỗ trợ #{openTicket.id} đang được xử lý</strong>
                  <p>{openTicket.subject}</p>
                </span>
                <span className='notice-time'>{noticeAge(openTicket.updatedAt)}</span>
              </Link>
            )}

            {!missingBank && !creditedOrder && !openTicket && (
              <div className='empty'>Chưa có thông báo mới.</div>
            )}
          </div>
        </article>
      </div>

      <div className='section-head'>
        <h2>Thao tác thường dùng</h2>
      </div>
      <div className='quick-actions quick-actions-3'>
        <article className='quick-action-card'>
          <div className='quick-head'>
            <div className='quick-icon'>
              <PortalIcon id='i-link' />
            </div>
            <span className='badge b-gray'>Liên kết</span>
          </div>
          <h3>Tạo liên kết giới thiệu</h3>
          <p>Dán đường dẫn sản phẩm để tạo liên kết có mã theo dõi.</p>
          <Link className='btn btn-primary btn-sm' href={VIEW_ROUTES.links}>
            Tạo liên kết
          </Link>
        </article>

        <article className='quick-action-card'>
          <div className='quick-head'>
            <div className='quick-icon'>
              <PortalIcon id='i-chart' />
            </div>
            <span className='badge b-gray'>Thu nhập</span>
          </div>
          <h3>Xem hoa hồng</h3>
          <p>Kiểm tra khoản chờ duyệt và khoản đã được ghi nhận.</p>
          <Link className='btn btn-sm' href={VIEW_ROUTES.commissions}>
            Xem chi tiết
          </Link>
        </article>

        <article className='quick-action-card'>
          <div className='quick-head'>
            <div className='quick-icon'>
              <PortalIcon id='i-wallet' />
            </div>
            <span className={`badge ${missingBank ? 'b-warning' : 'b-success'}`}>
              {missingBank ? 'Chưa xác minh' : 'Đã xác minh'}
            </span>
          </div>
          <h3>Yêu cầu rút tiền</h3>
          <p>Gửi yêu cầu về tài khoản ngân hàng đã xác minh.</p>
          <Link className='btn btn-sm' href={VIEW_ROUTES.payout}>
            Rút tiền
          </Link>
        </article>
      </div>
    </section>
  );
}
