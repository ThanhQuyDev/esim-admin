'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import type { AttributionTrace } from '../api/types';

/**
 * "Các click và mã đã xét" (doitac-3010 #022, rule 6): every signal weighed
 * for the order's partner, which one won, and the rule that decided — so an
 * admin can answer "why did this partner get the order" from the order alone.
 */

const RULE_LABEL: Record<string, string> = {
  none: 'Không có nguồn đối tác nào hợp lệ.',
  link_click: 'Ghi nhận theo click đã ký của trình duyệt này.',
  link_cookie_code: 'Ghi nhận theo mã link trong cookie, có click thật từ thiết bị này.',
  link_account: 'Ghi nhận theo link đã gắn với tài khoản khách.',
  link_device: 'Ghi nhận theo click gần nhất từ cùng thiết bị.',
  coupon_only: 'Chỉ có mã giảm giá của đối tác, không có link nào.',
  same_partner: 'Mã giảm giá và link cùng một đối tác.',
  public_code_no_override:
    'Mã chung (công khai cho mọi khách) không ghi đè link khách đã bấm — link thắng.',
  recent_link_beats_coupon:
    'Khách bấm link nội dung chưa tới 30 phút trước khi nhập mã — mã không ghi đè, link thắng.',
  coupon_beats_link: 'Mã riêng của đối tác do khách tự nhập thắng link bấm từ trước đó.'
};

const SOURCE_LABEL: Record<string, string> = {
  coupon: 'Mã giảm giá',
  click: 'Click đã ký',
  cookie_code: 'Mã link trong cookie',
  account: 'Gắn với tài khoản',
  device: 'Cùng thiết bị',
  device_click: 'Click khác của thiết bị'
};

const OUTCOME: Record<string, { label: string; className: string }> = {
  won: { label: 'Thắng', className: 'border-emerald-300 text-emerald-700' },
  lost: { label: 'Thua', className: 'text-muted-foreground' },
  rejected: { label: 'Bị loại', className: 'border-red-300 text-red-700' },
  considered: { label: 'Đã xét', className: 'text-muted-foreground' }
};

const NOTE_LABEL: Record<string, string> = {
  forged_signature: 'chữ ký sai (cookie bị sửa/giả)',
  malformed_click: 'mã click sai định dạng',
  unknown_click: 'không có trong bảng clicks',
  unsigned_claim: 'mã trần không có chữ ký',
  link_inactive: 'link không còn hoạt động',
  partner_inactive: 'đối tác không còn hoạt động',
  window_expired: 'quá cửa sổ ghi nhận',
  code_not_attributable: 'mã link không ghi nhận được',
  no_click_from_device: 'thiết bị này chưa từng bấm link'
};

function formatTime(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh'
  });
}

export function AttributionTraceCard({ trace }: { trace?: AttributionTrace | null }) {
  if (!trace?.candidates?.length) return null;

  return (
    <Card data-testid='attribution-trace'>
      <CardHeader>
        <CardTitle>Các click và mã đã xét</CardTitle>
        <CardDescription>{RULE_LABEL[trace.rule] ?? trace.rule}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nguồn</TableHead>
              <TableHead>Link / mã</TableHead>
              <TableHead>Đối tác</TableHead>
              <TableHead>Thời điểm click</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead className='text-right'>Kết quả</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trace.candidates.map((c, i) => {
              const outcome = OUTCOME[c.outcome] ?? OUTCOME.considered;
              const notes = [
                c.isPublic ? 'mã chung' : null,
                c.confirmed ? 'click hợp lệ' : null,
                c.botScore ? `điểm bot ${c.botScore}` : null,
                c.note ? (NOTE_LABEL[c.note] ?? c.note) : null
              ].filter(Boolean);
              return (
                <TableRow key={`${c.source}-${c.clickId ?? i}`}>
                  <TableCell>{SOURCE_LABEL[c.source] ?? c.source}</TableCell>
                  <TableCell className='font-mono text-xs'>{c.code || '—'}</TableCell>
                  <TableCell>{c.partnerId ? `#${c.partnerId}` : '—'}</TableCell>
                  <TableCell className='text-xs whitespace-nowrap'>
                    {formatTime(c.clickedAt)}
                  </TableCell>
                  <TableCell className='text-muted-foreground text-xs'>
                    {notes.join(' · ') || '—'}
                  </TableCell>
                  <TableCell className='text-right'>
                    <Badge variant='outline' className={outcome.className}>
                      {outcome.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
