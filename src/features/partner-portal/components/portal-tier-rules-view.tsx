'use client';

/**
 * Tier rules — `#view-tier-rules` in cong-doi-tac-phan-phoi-hoan-chinh-v29.html.
 *
 * The screen the previous portal never had. Explanatory copy is the design's,
 * verbatim; the threshold table is filled from the live tier list so the rules
 * page and the tier page can never disagree.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { myTiersQueryOptions } from '../api/queries';
import { formatDong, formatPercentVn } from '../lib/portal-format';
import { VIEW_ROUTES } from '../lib/portal-nav';
import { PortalIcon } from './portal-icon-sprite';

export function PortalTierRulesView() {
  const { data: tiers } = useQuery(myTiersQueryOptions());
  const sorted = useMemo(
    () => [...(tiers ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [tiers]
  );

  return (
    <section className='view active'>
      <div className='toolbar'>
        <div>
          <h2 className='card-title'>Quy định xét hạng đối tác tiếp thị</h2>
          <p className='card-sub'>
            Giải thích dữ liệu được tính, thời điểm khóa kỳ và nguyên tắc nâng hoặc hạ hạng.
          </p>
        </div>
        <Link className='btn' href={VIEW_ROUTES.tier}>
          <PortalIcon id='i-x' />
          Quay lại Hạng đối tác
        </Link>
      </div>

      <div className='grid grid-3 tier-rule-grid'>
        <article className='card'>
          <div className='stat-icon'>
            <PortalIcon id='i-cart' />
          </div>
          <h3 className='card-title' style={{ marginTop: '.75rem' }}>
            Đơn hợp lệ
          </h3>
          <p className='card-sub'>
            Chỉ tính đơn đã thanh toán, ghi nhận đúng nguồn đối tác và hoàn tất thời gian xác minh.
          </p>
        </article>
        <article className='card'>
          <div className='stat-icon'>
            <PortalIcon id='i-chart' />
          </div>
          <h3 className='card-title' style={{ marginTop: '.75rem' }}>
            Kỳ đánh giá
          </h3>
          <p className='card-sub'>
            Dữ liệu được khóa vào cuối tháng. Quyền lợi mới áp dụng từ kỳ kế tiếp sau khi kết quả
            được xác nhận.
          </p>
        </article>
        <article className='card'>
          <div className='stat-icon'>
            <PortalIcon id='i-shield' />
          </div>
          <h3 className='card-title' style={{ marginTop: '.75rem' }}>
            Chất lượng hoạt động
          </h3>
          <p className='card-sub'>
            Đơn gian lận, đơn hoàn tiền và nguồn quảng bá vi phạm quy định không được tính vào kết
            quả.
          </p>
        </article>
      </div>

      <div className='section-head'>
        <div>
          <h2>Điều kiện theo từng hạng</h2>
          <p>Các ngưỡng dưới đây được áp dụng trên dữ liệu đã xác nhận trong kỳ đánh giá.</p>
        </div>
      </div>
      <div className='table-wrap'>
        <table className='table'>
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Điều kiện doanh số</th>
              <th>Hoa hồng</th>
              <th>Giảm giá tối đa</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className='empty'>Chưa có cấu hình hạng nào.</div>
                </td>
              </tr>
            )}
            {sorted.map((t) => (
              <tr key={t.id}>
                <td>{t.tierName}</td>
                <td>
                  {Number(t.minVolumeVnd) > 0
                    ? `Từ ${formatDong(Number(t.minVolumeVnd))}`
                    : 'Mặc định khi được duyệt'}
                </td>
                <td>{formatPercentVn(Number(t.commissionPercent))}</td>
                <td>{formatPercentVn(Number(t.maxDiscountPercent))}</td>
                <td>
                  <span className={`badge ${t.isActive ? 'b-success' : 'b-gray'}`}>
                    {t.isActive ? 'Đang áp dụng' : 'Ngừng áp dụng'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='section-head'>
        <div>
          <h2>Quy trình cập nhật hạng</h2>
          <p>Hệ thống thực hiện tự động, sau đó đội vận hành kiểm tra các trường hợp bất thường.</p>
        </div>
      </div>
      <div className='grid grid-4'>
        <article className='card compact'>
          <span className='badge b-gray'>Bước 1</span>
          <h3 className='card-title' style={{ marginTop: '.625rem' }}>
            Khóa dữ liệu
          </h3>
          <p className='card-sub'>Tổng hợp đơn đã xác nhận trong kỳ.</p>
        </article>
        <article className='card compact'>
          <span className='badge b-gray'>Bước 2</span>
          <h3 className='card-title' style={{ marginTop: '.625rem' }}>
            Loại trừ rủi ro
          </h3>
          <p className='card-sub'>Bỏ đơn hoàn tiền, gian lận hoặc sai nguồn.</p>
        </article>
        <article className='card compact'>
          <span className='badge b-gray'>Bước 3</span>
          <h3 className='card-title' style={{ marginTop: '.625rem' }}>
            Xác định hạng
          </h3>
          <p className='card-sub'>Đối chiếu ngưỡng và quyền lợi tương ứng.</p>
        </article>
        <article className='card compact'>
          <span className='badge b-success'>Bước 4</span>
          <h3 className='card-title' style={{ marginTop: '.625rem' }}>
            Áp dụng kỳ mới
          </h3>
          <p className='card-sub'>Cập nhật hạng và thông báo cho đối tác.</p>
        </article>
      </div>
    </section>
  );
}
