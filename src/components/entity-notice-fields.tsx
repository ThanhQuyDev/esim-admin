'use client';

import { MinimalTiptapEditor } from '@/components/minimal-tiptap-editor';
import { Label } from '@/components/ui/label';

type NoticeField = 'noticeVi' | 'notice';

interface EntityNoticeFieldsProps {
  /** Initial notes, HTML; the editors keep their own state after that. */
  noticeVi: string;
  notice: string;
  onChange: (field: NoticeField, html: string) => void;
}

/**
 * "Ghi chú" on a destination / region (doitac-1410 #078): shown at the top of
 * its page on the website, e.g. for Turkey, India, China. Bold, italic,
 * underline and links. Left empty, nothing is shown.
 */
export function EntityNoticeFields({ noticeVi, notice, onChange }: EntityNoticeFieldsProps) {
  const fields: Array<{ name: NoticeField; label: string; initial: string; placeholder: string }> =
    [
      {
        name: 'noticeVi',
        label: 'Ghi chú đầu trang (VI)',
        initial: noticeVi,
        placeholder: 'VD: Cần cài đặt eSIM trước khi khởi hành...'
      },
      {
        name: 'notice',
        label: 'Ghi chú đầu trang (EN)',
        initial: notice,
        placeholder: 'Bỏ trống thì bản tiếng Anh hiện ghi chú tiếng Việt'
      }
    ];

  return (
    <div
      className='space-y-3 rounded-lg border border-dashed p-3'
      data-testid='entity-notice-fields'
    >
      <p className='text-muted-foreground text-xs'>
        Hiện ở đầu trang điểm đến / khu vực trên website. Dùng được in đậm, in nghiêng, gạch chân và
        chèn liên kết. Để trống nếu không cần.
      </p>
      {fields.map((field) => (
        <div key={field.name} className='space-y-1.5' data-testid={`entity-${field.name}`}>
          <Label>{field.label}</Label>
          <MinimalTiptapEditor
            content={field.initial}
            onChange={(html) => onChange(field.name, html)}
            placeholder={field.placeholder}
          />
        </div>
      ))}
    </div>
  );
}
