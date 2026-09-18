'use client';

/**
 * Marketing links — `#view-links` in cong-doi-tac-phan-phoi-hoan-chinh-v29.html.
 *
 * Three blocks, in the mockup's order and markup: the link builder, the QR card
 * beside it, and the list of existing links. The mockup's QR is a decorative
 * grid of spans; here it is a real QR for the link, drawn into the same shell.
 */

import { useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createLinkMutation, updateLinkMutation } from '../api/mutations';
import { myLinksQueryOptions, partnerPortalKeys } from '../api/queries';
import { formatCount, formatDong } from '../lib/portal-format';
import { PortalIcon } from './portal-icon-sprite';
import { usePortalToast } from './portal-toast';
import type { MyLink } from '../api/types';

const CHANNELS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'website', label: 'Trang web' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'threads', label: 'Threads' },
  { value: 'other', label: 'Kênh khác' }
];

const EMPTY_FORM = {
  landing: '',
  linkName: '',
  channel: 'youtube',
  subid: ''
};

/** Public short link for a code, as the table's "Link rút gọn" column shows it. */
function shortLinkOf(code: string): string {
  return `esim.vn/r/${code}`;
}

/**
 * Fold the promotion channel and sub-id into the destination so the click still
 * carries them: the links API stores a label and a target path, nothing else.
 */
function buildTargetPath(landing: string, channel: string, subid: string): string | undefined {
  const trimmed = landing.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed, 'https://esim.vn');
    if (channel) url.searchParams.set('utm_source', channel);
    if (subid.trim()) url.searchParams.set('subid', subid.trim());
    return `${url.pathname}${url.search}`;
  } catch {
    return trimmed;
  }
}

/** Read the promotion channel back out of the target path's `utm_source`. */
function channelOf(targetPath: string | null): string {
  if (!targetPath) return '—';
  const source = new URLSearchParams(targetPath.split('?')[1] ?? '').get('utm_source');
  return CHANNELS.find((c) => c.value === source)?.label ?? source ?? '—';
}

export function PortalLinksView() {
  const toast = usePortalToast();
  const queryClient = useQueryClient();
  const { data: links, isLoading } = useQuery(myLinksQueryOptions());

  const [form, setForm] = useState(EMPTY_FORM);
  const [qrLink, setQrLink] = useState('');

  const createLink = useMutation({
    ...createLinkMutation,
    onSuccess: (created: MyLink) => {
      queryClient.invalidateQueries({ queryKey: partnerPortalKeys.links() });
      setQrLink(`https://${shortLinkOf(created.code)}`);
      toast('Đã tạo liên kết tiếp thị');
    },
    onError: () => toast('Không tạo được liên kết, vui lòng thử lại')
  });

  const deactivateLink = useMutation({
    ...updateLinkMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerPortalKeys.links() });
      toast('Đã tắt liên kết');
    },
    onError: () => toast('Không tắt được liên kết')
  });

  const rows = useMemo(() => links ?? [], [links]);

  // The QR card follows the newest link until the partner types another one.
  const qrValue = qrLink || (rows[0] ? `https://${shortLinkOf(rows[0].code)}` : '');

  const submit = () => {
    if (!form.linkName.trim()) {
      toast('Nhập tên liên kết trước khi tạo');
      return;
    }
    createLink.mutate({
      label: form.linkName.trim(),
      targetPath: buildTargetPath(form.landing, form.channel, form.subid)
    });
  };

  const copy = (text: string, message: string) => {
    navigator.clipboard?.writeText(text);
    toast(message);
  };

  const exportCsv = () => {
    const header = ['Tên liên kết', 'Link rút gọn', 'Nhấp', 'Đơn', 'Hoa hồng'];
    const body = rows.map((r) => [
      r.label,
      shortLinkOf(r.code),
      String(r.clickCount),
      String(r.conversionCount),
      String(r.totalCommissionVnd)
    ]);
    const csv = [header, ...body].map((line) => line.map((c) => `"${c}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'partner-links.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className='view active'>
      <div className='link-workspace'>
        <article className='card link-card'>
          <div className='card-heading'>
            <div>
              <h2 className='card-title'>Tạo liên kết tiếp thị</h2>
              <p className='card-sub'>
                Dán đường dẫn sản phẩm để tạo liên kết có mã theo dõi cho từng nội dung hoặc kênh
                quảng bá.
              </p>
            </div>
            <div className='card-heading-icon'>
              <PortalIcon id='i-link' />
            </div>
          </div>
          <div className='link-form'>
            <div className='link-form-grid'>
              <div className='field field-full'>
                <label htmlFor='landing'>Đường dẫn sản phẩm trên esim.vn</label>
                <input
                  id='landing'
                  type='url'
                  placeholder='https://esim.vn/esim/...'
                  value={form.landing}
                  onChange={(e) => setForm({ ...form, landing: e.target.value })}
                />
              </div>
              <div className='field'>
                <label htmlFor='linkName'>Tên liên kết</label>
                <input
                  id='linkName'
                  placeholder='Ví dụ: Video Nhật Bản tháng 8'
                  value={form.linkName}
                  onChange={(e) => setForm({ ...form, linkName: e.target.value })}
                />
              </div>
              <div className='field'>
                <label htmlFor='channel'>Kênh quảng bá</label>
                <select
                  id='channel'
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                >
                  {CHANNELS.map((c) => (
                    <option value={c.value} key={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className='field'>
                <label htmlFor='subid'>Mã phân biệt nguồn — Không bắt buộc</label>
                <input
                  id='subid'
                  maxLength={60}
                  placeholder='Ví dụ: youtube_nhatban_01'
                  value={form.subid}
                  onChange={(e) => setForm({ ...form, subid: e.target.value })}
                />
              </div>
              <div className='field'>
                <label htmlFor='trackingDuration'>Thời hạn theo dõi</label>
                <select id='trackingDuration' defaultValue='30'>
                  <option value='30'>30 ngày</option>
                </select>
              </div>
            </div>
            <div className='link-form-actions'>
              <button className='btn' type='button' onClick={() => setForm(EMPTY_FORM)}>
                Đặt lại
              </button>
              <button
                className='btn btn-primary'
                type='button'
                onClick={submit}
                disabled={createLink.isPending}
              >
                <PortalIcon id='i-plus' />
                {createLink.isPending ? 'Đang tạo…' : 'Tạo liên kết'}
              </button>
            </div>
          </div>
        </article>

        <article className='card link-card'>
          <div className='card-heading'>
            <div>
              <h2 className='card-title'>Tạo mã QR từ liên kết</h2>
              <p className='card-sub'>
                Biến liên kết tiếp thị thành mã QR để dùng trên video, hình ảnh, quầy tư vấn hoặc
                tài liệu in.
              </p>
            </div>
            <div className='card-heading-icon'>
              <PortalIcon id='i-qr' />
            </div>
          </div>
          <div className='qr-card-layout'>
            <div>
              <div className='field'>
                <label htmlFor='qrLink'>Liên kết cần tạo mã QR</label>
                <input
                  id='qrLink'
                  value={qrValue}
                  onChange={(e) => setQrLink(e.target.value)}
                  placeholder='https://esim.vn/r/...'
                />
                <span className='field-help'>
                  Dán hoặc chọn một link tiếp thị đã tạo để chuyển thành mã QR.
                </span>
              </div>
              <div className='qr-note'>
                <strong>Ghi nhận giống liên kết gốc</strong>
                <p>
                  Mọi đơn hàng phát sinh sau khi khách quét QR vẫn được ghi nhận có cùng tài khoản
                  và mã phân biệt nguồn của liên kết.
                </p>
              </div>
              <div className='qr-actions'>
                <button
                  className='btn btn-sm'
                  type='button'
                  onClick={() => copy(qrValue, 'Đã sao chép liên kết')}
                >
                  <PortalIcon id='i-copy' />
                  Sao chép liên kết
                </button>
                <button
                  className='btn btn-primary btn-sm'
                  type='button'
                  onClick={() => {
                    const canvas = document.querySelector<HTMLCanvasElement>('#portalQrCanvas');
                    if (!canvas) return;
                    const a = document.createElement('a');
                    a.href = canvas.toDataURL('image/png');
                    a.download = 'partner-qr.png';
                    a.click();
                    toast('Đã chuẩn bị tệp QR PNG');
                  }}
                >
                  <PortalIcon id='i-download' />
                  Tải mã QR
                </button>
              </div>
            </div>
            <div className='qr-preview-shell'>
              {qrValue ? (
                <QRCodeCanvas id='portalQrCanvas' value={qrValue} size={168} level='M' />
              ) : (
                <div className='qr-preview-grid' />
              )}
              <span className='badge b-info qr-badge'>QR theo dõi tiếp thị</span>
              <p className='qr-caption'>Quét thử bằng camera điện thoại trước khi đăng hoặc in.</p>
            </div>
          </div>
        </article>
      </div>

      <div className='link-list-section'>
        <div className='link-list-title'>
          <div>
            <h2>Danh sách link</h2>
            <p>Hiệu suất theo từng link và kênh quảng bá.</p>
          </div>
          <button className='btn btn-sm' type='button' onClick={exportCsv}>
            <PortalIcon id='i-download' />
            Xuất CSV
          </button>
        </div>
        <div className='table-wrap'>
          <table className='table link-list-table'>
            <thead>
              <tr>
                <th>Tên liên kết</th>
                <th>Link rút gọn</th>
                <th>Kênh</th>
                <th>Nhấp</th>
                <th>Đơn</th>
                <th>Hoa hồng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7}>
                    <div className='empty'>Đang tải liên kết…</div>
                  </td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className='empty'>Chưa có liên kết tiếp thị nào.</div>
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.label}</strong>
                  </td>
                  <td>
                    <span className='link-short'>{shortLinkOf(r.code)}</span>
                  </td>
                  <td>{channelOf(r.targetPath)}</td>
                  <td>{formatCount(r.clickCount)}</td>
                  <td>{formatCount(r.conversionCount)}</td>
                  <td>{formatDong(r.totalCommissionVnd)}</td>
                  <td>
                    <div className='actions'>
                      <button
                        className='btn btn-sm'
                        type='button'
                        onClick={() => copy(`https://${shortLinkOf(r.code)}`, 'Đã sao chép link')}
                      >
                        <PortalIcon id='i-copy' />
                        Sao chép
                      </button>
                      {r.status === 'active' && (
                        <button
                          className='btn btn-sm btn-danger'
                          type='button'
                          onClick={() =>
                            deactivateLink.mutate({
                              id: r.id,
                              data: { isActive: false }
                            })
                          }
                        >
                          <PortalIcon id='i-x' />
                          Tắt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
