'use client';

/**
 * Partner tier — `#view-tier` in cong-doi-tac-phan-phoi-hoan-chinh-v29.html.
 *
 * Hero + progress card, the clickable tier selector, the benefit comparison
 * table and the evaluation history. The mockup hard-codes four tiers; here the
 * tiers come from the API and the design's colour and icon per tier code are
 * kept in `TIER_STYLE`.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import {
  myTierEvaluationsQueryOptions,
  myTiersQueryOptions,
  mySummaryQueryOptions
} from '../api/queries';
import { formatDateVn } from '@/lib/format';
import { formatCount, formatDong, formatPercentVn } from '../lib/portal-format';
import { VIEW_ROUTES } from '../lib/portal-nav';
import type { PartnerTier } from '../api/types';

/** The v29 tier colours and flat icons, keyed by tier code. */
const TIER_STYLE: Record<string, { color: string; icon: React.ReactNode }> = {
  bronze: {
    color: '#a16207',
    icon: (
      <>
        <path d='M7 4h10v5a5 5 0 01-10 0V4z' />
        <path d='M9 15h6M10 15v4h4v-4M8 21h8' />
        <path d='M7 6H4a3 3 0 003 3M17 6h3a3 3 0 01-3 3' />
      </>
    )
  },
  silver: {
    color: '#64748b',
    icon: (
      <>
        <path d='M8 4h8l2 5-6 4-6-4 2-5z' />
        <circle cx='12' cy='16.5' r='3.5' />
        <path d='M10 13l-1.5 7M14 13l1.5 7' />
      </>
    )
  },
  gold: {
    color: '#f59e0b',
    icon: (
      <>
        <path d='M12 3l2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8L5 8.1l4.8-.7L12 3z' />
        <path d='M8 20h8' />
      </>
    )
  },
  platinum: {
    color: '#4f46e5',
    icon: (
      <>
        <path d='M5 8l3-4h8l3 4-7 12L5 8z' />
        <path d='M5 8h14M8 4l4 4 4-4M8 8l4 12 4-12' />
      </>
    )
  }
};

const FALLBACK_STYLE = {
  color: '#4f46e5',
  icon: <path d='M12 3l7 4v10l-7 4-7-4V7z' />
};

function styleFor(tierCode: string) {
  return TIER_STYLE[tierCode.toLowerCase()] ?? FALLBACK_STYLE;
}

export function PortalTierView() {
  const { data: summary } = useQuery(mySummaryQueryOptions());
  const { data: tiers } = useQuery(myTiersQueryOptions());
  const { data: evaluations } = useQuery(myTierEvaluationsQueryOptions());

  const sorted = useMemo(
    () => [...(tiers ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [tiers]
  );

  const currentCode = summary?.tier.current?.tierCode ?? null;
  const [viewing, setViewing] = useState<string | null>(null);

  // Land on the partner's own tier once the summary arrives.
  useEffect(() => {
    if (!viewing && currentCode) setViewing(currentCode);
  }, [currentCode, viewing]);

  const shown: PartnerTier | undefined =
    sorted.find((t) => t.tierCode === viewing) ?? summary?.tier.current ?? sorted[0];

  const progress = Math.max(0, Math.min(100, Math.round(summary?.tier.progressPercent ?? 0)));

  return (
    <section className='view active'>
      <div className='grid grid-2'>
        <article className='card hero tier-hero'>
          <div className='hero-label'>Đang xem quyền lợi hạng</div>
          <div className='hero-value' style={{ fontSize: '2.375rem' }}>
            {shown ? `Hạng ${shown.tierName}` : 'Chưa gán hạng'}
          </div>
          <div className='hero-meta'>
            <span className='trend'>
              {shown ? `Từ ${formatDong(Number(shown.minVolumeVnd))} doanh số` : '—'}
            </span>
            <span>
              {shown && shown.tierCode === currentCode
                ? 'Hạng hiện tại của bạn'
                : 'Quyền lợi khi đạt hạng này'}
            </span>
          </div>
          <div className='tier-summary-grid'>
            <div className='tier-summary-item'>
              <span>Hoa hồng</span>
              <strong>{shown ? formatPercentVn(Number(shown.commissionPercent)) : '—'}</strong>
            </div>
            <div className='tier-summary-item'>
              <span>Giảm giá tối đa</span>
              <strong>{shown ? formatPercentVn(Number(shown.maxDiscountPercent)) : '—'}</strong>
            </div>
            <div className='tier-summary-item'>
              <span>Điều kiện doanh số</span>
              <strong>{shown ? formatDong(Number(shown.minVolumeVnd)) : '—'}</strong>
            </div>
            <div className='tier-summary-item'>
              <span>Trạng thái</span>
              <strong>{shown?.isActive ? 'Đang áp dụng' : 'Ngừng áp dụng'}</strong>
            </div>
          </div>
          <div className='hero-actions'>
            <Link className='btn btn-primary' href={VIEW_ROUTES['tier-rules']}>
              Xem quy định xét hạng
            </Link>
            <Link className='btn btn-light-outline' href={VIEW_ROUTES.commissions}>
              Xem hoa hồng chi tiết
            </Link>
          </div>
        </article>

        <article className='card'>
          <h2 className='card-title'>Tiến độ hạng hiện tại</h2>
          <p className='card-sub'>Dữ liệu được tính từ các đơn hợp lệ đã qua thời gian xác minh.</p>
          <div className='detail-list' style={{ marginTop: '1rem' }}>
            <div className='detail-item'>
              <span>Đơn hợp lệ 30 ngày</span>
              <strong>{formatCount(summary?.performance30d.orders)}</strong>
            </div>
            <div className='detail-item'>
              <span>Doanh số hợp lệ</span>
              <strong>{formatDong(summary?.lifetime.revenueVnd)}</strong>
            </div>
            <div className='detail-item'>
              <span>Hạng hiện tại</span>
              <strong>
                {summary?.tier.current ? `Hạng ${summary.tier.current.tierName}` : 'Chưa gán hạng'}
              </strong>
            </div>
            <div className='detail-item'>
              <span>Hạng kế tiếp</span>
              <strong>
                {summary?.tier.next ? `Hạng ${summary.tier.next.tierName}` : 'Cao nhất'}
              </strong>
            </div>
          </div>
          <div className='progress' style={{ marginTop: '1rem' }}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className='card-sub' style={{ marginTop: '0.5rem' }}>
            {summary?.tier.next
              ? `Còn ${formatDong(summary.tier.toNextTierVnd)} doanh số để đạt Hạng ${summary.tier.next.tierName}.`
              : 'Bạn đang ở hạng cao nhất.'}
          </p>
        </article>
      </div>

      <div className='section-head'>
        <div>
          <h2>Chọn hạng để xem quyền lợi</h2>
          <p>Bấm vào từng hạng để xem màu đại diện, điều kiện và quyền lợi tương ứng.</p>
        </div>
      </div>
      <div className='tier-selector-grid'>
        {sorted.map((t) => {
          const style = styleFor(t.tierCode);
          return (
            <button
              className={`tier-select-card${viewing === t.tierCode ? ' active' : ''}`}
              style={{ ['--tier-color' as string]: style.color }}
              type='button'
              key={t.id}
              onClick={() => setViewing(t.tierCode)}
            >
              <div className='tier-flat-icon'>
                <svg className='icon' viewBox='0 0 24 24'>
                  {style.icon}
                </svg>
              </div>
              <h3>Hạng {t.tierName}</h3>
              <p>
                {Number(t.minVolumeVnd) > 0
                  ? `Từ ${formatDong(Number(t.minVolumeVnd))} doanh số`
                  : 'Mặc định khi tài khoản được duyệt'}
              </p>
              <div className='tier-benefit-lines'>
                <div className='tier-benefit-line'>
                  Hoa hồng {formatPercentVn(Number(t.commissionPercent))}
                </div>
                <div className='tier-benefit-line'>
                  Giảm tối đa {formatPercentVn(Number(t.maxDiscountPercent))}
                </div>
                <div className='tier-benefit-line'>
                  {t.isActive ? 'Đang áp dụng' : 'Ngừng áp dụng'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className='section-head'>
        <div>
          <h2>So sánh quyền lợi theo hạng</h2>
          <p>Quyền lợi được áp dụng từ kỳ tiếp theo sau khi kết quả được khóa.</p>
        </div>
      </div>
      <div className='table-wrap'>
        <table className='table'>
          <thead>
            <tr>
              <th>Quyền lợi</th>
              {sorted.map((t) => (
                <th key={t.id}>{t.tierName}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Hoa hồng</td>
              {sorted.map((t) => (
                <td key={t.id}>{formatPercentVn(Number(t.commissionPercent))}</td>
              ))}
            </tr>
            <tr>
              <td>Giảm giá tối đa</td>
              {sorted.map((t) => (
                <td key={t.id}>{formatPercentVn(Number(t.maxDiscountPercent))}</td>
              ))}
            </tr>
            <tr>
              <td>Điều kiện doanh số</td>
              {sorted.map((t) => (
                <td key={t.id}>
                  {Number(t.minVolumeVnd) > 0 ? formatDong(Number(t.minVolumeVnd)) : 'Mặc định'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className='section-head'>
        <div>
          <h2>Lịch sử đánh giá hạng</h2>
          <p>Hạng được cập nhật dựa trên dữ liệu đã xác nhận.</p>
        </div>
      </div>
      <div className='table-wrap'>
        <table className='table'>
          <thead>
            <tr>
              <th>Kỳ đánh giá</th>
              <th>Hạng trước</th>
              <th>Hạng sau đánh giá</th>
              <th>Đơn hợp lệ</th>
              <th>Doanh số hợp lệ</th>
              <th>Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {(evaluations ?? []).length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className='empty'>Chưa có kỳ đánh giá nào.</div>
                </td>
              </tr>
            )}
            {(evaluations ?? []).map((e) => (
              <tr key={e.id}>
                <td>{formatDateVn(e.evaluatedAt)}</td>
                <td>{e.tierBefore ? `Hạng ${e.tierBefore}` : '—'}</td>
                <td>
                  <strong>{e.tierAfter ? `Hạng ${e.tierAfter}` : '—'}</strong>
                </td>
                <td>{formatCount(e.validOrders)} đơn</td>
                <td>{formatDong(Number(e.revenueVnd))}</td>
                <td>
                  <span className={`badge ${e.result === 'promoted' ? 'b-info' : 'b-success'}`}>
                    {e.result === 'promoted' ? 'Đã nâng hạng' : 'Duy trì hạng'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
