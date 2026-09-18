'use client';

/**
 * Support — `#view-support` in cong-doi-tac-phan-phoi-hoan-chinh-v29.html.
 *
 * Two tabs: raise a request, and track the partner's own tickets. The topic
 * picker swaps the hint card the way the mockup's `updateSupportHint` does.
 */

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { createTicketMutation } from '../api/mutations';
import { myProfileQueryOptions, myTicketsQueryOptions } from '../api/queries';
import { formatDateTimeVn } from '@/lib/format';
import { PortalIcon, type PortalIconId } from './portal-icon-sprite';
import { usePortalToast } from './portal-toast';

/** Topic → what to include, copied from the mockup's `supportHints`. */
const TOPICS: {
  value: string;
  label: string;
  text: string;
  icon: PortalIconId;
}[] = [
  {
    value: 'missing',
    label: 'Đơn hàng chưa được ghi nhận',
    text: 'Gửi mã đơn, thời điểm mua và link hoặc mã đã sử dụng.',
    icon: 'i-cart'
  },
  {
    value: 'commission',
    label: 'Hoa hồng',
    text: 'Gửi mã đơn và mức hoa hồng cần kiểm tra.',
    icon: 'i-chart'
  },
  {
    value: 'payout',
    label: 'Rút tiền',
    text: 'Gửi mã yêu cầu rút tiền, số tiền và ngày tạo yêu cầu.',
    icon: 'i-wallet'
  },
  {
    value: 'link',
    label: 'Link hoặc mã giảm giá',
    text: 'Gửi link hoặc mã gặp lỗi cùng thiết bị đã thử.',
    icon: 'i-link'
  },
  {
    value: 'sample',
    label: 'eSIM trải nghiệm',
    text: 'Ghi rõ điểm đến, mục đích và thời gian cần eSIM trải nghiệm.',
    icon: 'i-gift'
  },
  {
    value: 'account',
    label: 'Tài khoản',
    text: 'Mô tả vấn đề đăng nhập hoặc thông tin hồ sơ cần thay đổi.',
    icon: 'i-user'
  }
];

const TICKET_STATUS: Record<string, { cls: string; label: string }> = {
  open: { cls: 'b-warning', label: 'Chờ xử lý' },
  pending: { cls: 'b-warning', label: 'Chờ đối tác phản hồi' },
  processing: { cls: 'b-info', label: 'Đang xử lý' },
  resolved: { cls: 'b-success', label: 'Đã xử lý' },
  closed: { cls: 'b-gray', label: 'Đã đóng' }
};

export function PortalSupportView() {
  const toast = usePortalToast();
  const { data: me } = useQuery(myProfileQueryOptions());
  const { data: tickets } = useQuery(myTicketsQueryOptions());

  const [tab, setTab] = useState<'support-create' | 'support-list'>('support-create');
  const [topic, setTopic] = useState(TOPICS[0]!.value);
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const hint = TOPICS.find((t) => t.value === topic) ?? TOPICS[0]!;

  const waiting = useMemo(
    () => (tickets ?? []).filter((t) => t.status !== 'closed' && t.status !== 'resolved').length,
    [tickets]
  );

  const rows = useMemo(
    () => (tickets ?? []).filter((t) => statusFilter === 'all' || t.status === statusFilter),
    [tickets, statusFilter]
  );

  const createTicket = useMutation({
    ...createTicketMutation,
    onSuccess: () => {
      setMessage('');
      setReference('');
      setTab('support-list');
      toast('Đã gửi yêu cầu hỗ trợ');
    },
    onError: () => toast('Không gửi được yêu cầu, vui lòng thử lại')
  });

  const submit = () => {
    if (!message.trim()) {
      toast('Nhập nội dung cần hỗ trợ');
      return;
    }
    createTicket.mutate({
      customerEmail: me?.contactEmail ?? '',
      subject: hint.label,
      description: message.trim(),
      ...(reference.trim() ? { orderId: reference.trim() } : {})
    });
  };

  return (
    <section className='view active'>
      <div className='support-tabs'>
        <button
          className={`support-tab${tab === 'support-create' ? ' active' : ''}`}
          type='button'
          onClick={() => setTab('support-create')}
        >
          Tạo yêu cầu
        </button>
        <button
          className={`support-tab${tab === 'support-list' ? ' active' : ''}`}
          type='button'
          onClick={() => setTab('support-list')}
        >
          Yêu cầu của tôi
          {waiting > 0 && (
            <span className='badge b-warning' style={{ marginLeft: '.375rem' }}>
              {waiting} đang chờ
            </span>
          )}
        </button>
      </div>

      <div className={`support-panel${tab === 'support-create' ? ' active' : ''}`}>
        <div className='support-layout'>
          <article className='card'>
            <h2 className='card-title'>Tạo yêu cầu hỗ trợ</h2>
            <p className='card-sub'>
              Chọn đúng chủ đề để đội phụ trách tiếp nhận và phản hồi nhanh hơn.
            </p>
            <div className='field' style={{ marginTop: '1rem' }}>
              <label htmlFor='supportTopic'>Chủ đề</label>
              <select id='supportTopic' value={topic} onChange={(e) => setTopic(e.target.value)}>
                {TOPICS.map((t) => (
                  <option value={t.value} key={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className='topic-help'>
                <div className='support-hint-row'>
                  <div className='support-hint-icon'>
                    <PortalIcon id={hint.icon} />
                  </div>
                  <div className='support-hint-copy'>
                    <strong>Thông tin nên cung cấp</strong>
                    <div style={{ marginTop: '.1875rem' }}>{hint.text}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className='field' style={{ marginTop: '.875rem' }}>
              <label htmlFor='supportReference'>Mã đơn hoặc mã yêu cầu</label>
              <input
                id='supportReference'
                placeholder='Không bắt buộc'
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className='field' style={{ marginTop: '.875rem' }}>
              <label htmlFor='supportMessage'>Nội dung</label>
              <textarea
                id='supportMessage'
                placeholder='Mô tả chi tiết vấn đề cần hỗ trợ'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <span className='field-hint'>
                Có thể ghi rõ thời điểm phát sinh, bước đã thực hiện và ảnh chụp lỗi nếu có.
              </span>
            </div>
            <div className='form-actions'>
              <button
                className='btn btn-primary'
                type='button'
                onClick={submit}
                disabled={createTicket.isPending}
              >
                {createTicket.isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}
              </button>
            </div>
          </article>

          <aside>
            <article className='card'>
              <div className='support-highlight'>
                <h3>Kênh hỗ trợ đối tác</h3>
                <p>Mỗi yêu cầu được cấp mã riêng để theo dõi, xem phản hồi và tiếp tục trao đổi.</p>
              </div>
              <div className='support-info-list'>
                <div>
                  <span>Email</span>
                  <strong>partner@esim.vn</strong>
                </div>
                <div>
                  <span>Thời gian phản hồi</span>
                  <strong>Trong 8 giờ làm việc</strong>
                </div>
                <div>
                  <span>Giờ hỗ trợ</span>
                  <strong>08:00–18:00, thứ Hai đến thứ Bảy</strong>
                </div>
              </div>
              <div className='support-cards'>
                <div className='support-mini'>
                  <div className='support-mini-icon'>
                    <PortalIcon id='i-cart' />
                  </div>
                  <div>
                    <strong>Đơn hàng bị thiếu</strong>
                    <p>Chuẩn bị mã đơn, thời gian mua và nguồn giới thiệu.</p>
                  </div>
                </div>
                <div className='support-mini'>
                  <div className='support-mini-icon'>
                    <PortalIcon id='i-wallet' />
                  </div>
                  <div>
                    <strong>Rút tiền</strong>
                    <p>Chuẩn bị mã yêu cầu, số tiền và tài khoản nhận.</p>
                  </div>
                </div>
                <div className='support-mini'>
                  <div className='support-mini-icon'>
                    <PortalIcon id='i-user' />
                  </div>
                  <div>
                    <strong>Vấn đề tài khoản</strong>
                    <p>Mô tả lỗi đăng nhập hoặc thông tin cần cập nhật.</p>
                  </div>
                </div>
              </div>
            </article>
          </aside>
        </div>
      </div>

      <div className={`support-panel${tab === 'support-list' ? ' active' : ''}`}>
        <div className='toolbar'>
          <div>
            <h2 className='card-title'>Yêu cầu hỗ trợ của tôi</h2>
            <p className='card-sub'>Theo dõi trạng thái, xem hội thoại và gửi phản hồi bổ sung.</p>
          </div>
          <div className='support-filter-row'>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value='all'>Tất cả trạng thái</option>
              <option value='open'>Chờ xử lý</option>
              <option value='processing'>Đang xử lý</option>
              <option value='resolved'>Đã xử lý</option>
              <option value='closed'>Đã đóng</option>
            </select>
          </div>
        </div>
        <div className='table-wrap'>
          <table className='table'>
            <thead>
              <tr>
                <th>Mã yêu cầu</th>
                <th>Chủ đề</th>
                <th>Tham chiếu</th>
                <th>Trạng thái</th>
                <th>Cập nhật gần nhất</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className='empty'>Chưa có yêu cầu hỗ trợ nào.</div>
                  </td>
                </tr>
              )}
              {rows.map((t) => {
                const badge = TICKET_STATUS[t.status] ?? {
                  cls: 'b-gray',
                  label: t.status
                };
                return (
                  <tr key={t.id}>
                    <td className='mono'>#{t.id}</td>
                    <td>
                      <strong>{t.subject}</strong>
                      <div className='card-sub'>{t.description}</div>
                    </td>
                    <td className='mono'>{t.orderId ?? '—'}</td>
                    <td>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td>{formatDateTimeVn(t.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
