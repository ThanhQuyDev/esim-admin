'use client';

/**
 * Compose an announcement to partners, and see what has been sent (#079).
 *
 * The bell is the delivery that always happens; the email is an extra the
 * admin opts into, because most announcements do not warrant one and a
 * partner's inbox is not ours to fill.
 *
 * Test round of 14/10 (doitac-1410 #062): the body is written in the full
 * rich-text editor; a priority sets the banner's colour; "nổi bật" puts it at
 * the top of every partner's page until it is unticked; and each sent one can
 * be viewed, edited (no second email) or deleted.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Icons } from '@/components/icons';
import { TiptapEditor } from '@/components/tiptap-editor';
import { toneOf } from '@/components/notice-banner';
import { uploadToCloudinary } from '@/features/blogs/api/service';
import { formatDateTimeVn } from '@/lib/format';
import { NOTICE_PRIORITIES, noticePreview } from '@/lib/notice-banner';
import { cn } from '@/lib/utils';

import { createNotificationMutation } from '../api/mutations';
import { notificationsQueryOptions } from '../api/queries';
import { deleteNotification, updateNotification } from '../api/service';
import type { PartnerNotification } from '../api/types';
import { SentNotificationDialog } from './admin-notification-bell';

const AUDIENCES = [
  { value: 'all', label: 'Toàn bộ đối tác' },
  { value: 'kol', label: 'Đối tác tiếp thị' },
  { value: 'distribution', label: 'Đối tác phân phối' }
];

const AUDIENCE_LABEL: Record<string, string> = Object.fromEntries(
  AUDIENCES.map((a) => [a.value, a.label])
);
const PRIORITY_LABEL: Record<string, string> = Object.fromEntries(
  NOTICE_PRIORITIES.map((p) => [p.value, p.label])
);

const TITLE_LIMIT = 200;

type FormValue = {
  title: string;
  body: string;
  audience: string;
  priority: string;
  isFeatured: boolean;
  sendEmail: boolean;
};

const EMPTY: FormValue = {
  title: '',
  body: '',
  audience: 'all',
  priority: 'normal',
  isFeatured: false,
  sendEmail: false
};

/** The fields of an announcement — composing one, or editing one sent. */
function NotificationFields({
  value,
  onChange,
  editing
}: {
  value: FormValue;
  onChange: (next: FormValue) => void;
  editing?: boolean;
}) {
  const set = (patch: Partial<FormValue>) => onChange({ ...value, ...patch });
  return (
    <div className='space-y-4'>
      <div className='space-y-1.5'>
        <Label htmlFor={editing ? 'edit-notification-title' : 'notification-title'}>Tiêu đề</Label>
        <Input
          id={editing ? 'edit-notification-title' : 'notification-title'}
          value={value.title}
          maxLength={TITLE_LIMIT}
          placeholder='VD: Bảo trì hệ thống ngày 05/10'
          onChange={(e) => set({ title: e.target.value })}
        />
        <p className='text-muted-foreground text-right text-xs'>
          {value.title.length}/{TITLE_LIMIT}
        </p>
      </div>

      <div className='space-y-1.5'>
        <Label>Nội dung</Label>
        <div data-testid={editing ? 'edit-notification-body' : 'notification-body'}>
          <TiptapEditor
            content={value.body}
            onChange={(html) => set({ body: html })}
            placeholder='Nội dung đầy đủ đối tác sẽ đọc khi bấm xem chi tiết.'
            onImageUpload={uploadToCloudinary}
          />
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label htmlFor={editing ? 'edit-notification-audience' : 'notification-audience'}>
            Gửi tới
          </Label>
          <Select value={value.audience} onValueChange={(audience) => set({ audience })}>
            <SelectTrigger id={editing ? 'edit-notification-audience' : 'notification-audience'}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIENCES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className='text-muted-foreground text-xs'>
            Chỉ gửi tới các đối tác đang hoạt động — tài khoản bị khoá không nhận thông báo.
          </p>
        </div>

        <div className='space-y-1.5'>
          <Label>Mức độ ưu tiên</Label>
          <div className='flex flex-wrap gap-2' role='radiogroup' aria-label='Mức độ ưu tiên'>
            {NOTICE_PRIORITIES.map((option) => {
              const tone = toneOf(option.value);
              const active = value.priority === option.value;
              return (
                <button
                  key={option.value}
                  type='button'
                  role='radio'
                  aria-checked={active}
                  onClick={() => set({ priority: option.value })}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm font-medium transition',
                    tone.box,
                    active ? 'ring-2 ring-current ring-offset-1' : 'opacity-70 hover:opacity-100'
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className='text-muted-foreground text-xs'>
            Màu của thông báo ở đầu trang: xanh dương, vàng cam hoặc đỏ.
          </p>
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor={editing ? 'edit-notification-featured' : 'notification-featured'}>
            Nổi bật (hiện ở đầu trang)
          </Label>
          <div className='flex h-9 items-center'>
            <Switch
              id={editing ? 'edit-notification-featured' : 'notification-featured'}
              checked={value.isFeatured}
              onCheckedChange={(isFeatured) => set({ isFeatured })}
            />
          </div>
          <p className='text-muted-foreground text-xs'>
            Hiện ở đầu trang của đối tác (và của admin) cho tới khi bỏ tích. Đối tác tắt hoặc xem
            thì ẩn trong phiên đăng nhập đó, lần đăng nhập sau lại hiện.
          </p>
        </div>

        {!editing && (
          <div className='space-y-1.5'>
            <Label htmlFor='notification-email'>Gửi kèm email</Label>
            <div className='flex h-9 items-center'>
              <Switch
                id='notification-email'
                checked={value.sendEmail}
                onCheckedChange={(sendEmail) => set({ sendEmail })}
              />
            </div>
            <p className='text-muted-foreground text-xs'>
              Thông báo luôn hiện ở chuông trong ứng dụng. Bật thêm mục này nếu tin quan trọng tới
              mức cần vào hộp thư của đối tác.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const canSave = (v: FormValue) => v.title.trim().length > 0 && noticePreview(v.body).length > 0;

export function PartnerNotificationsView() {
  const [form, setForm] = useState<FormValue>(EMPTY);
  // The editor takes its content once; a new key starts it empty again.
  const [formKey, setFormKey] = useState(0);
  const [viewing, setViewing] = useState<PartnerNotification | null>(null);
  const [editing, setEditing] = useState<PartnerNotification | null>(null);
  const [deleting, setDeleting] = useState<PartnerNotification | null>(null);

  const queryClient = useQueryClient();
  const { data: sent = [], isLoading } = useQuery(notificationsQueryOptions());

  const send = useMutation({
    ...createNotificationMutation,
    onSuccess: (created) => {
      toast.success(
        created.sendEmail ? `Đã gửi thông báo và ${created.emailsSent} email.` : 'Đã gửi thông báo.'
      );
      setForm(EMPTY);
      setFormKey((k) => k + 1);
      void queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message || 'Gửi thông báo thất bại')
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteNotification(id),
    onSuccess: () => {
      toast.success('Đã xóa thông báo.');
      setDeleting(null);
      void queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message || 'Xóa thông báo thất bại')
  });

  return (
    <div className='grid min-w-0 grid-cols-1 gap-6'>
      <div className='space-y-4 rounded-lg border p-4'>
        <p className='text-sm font-medium'>Soạn thông báo</p>
        <NotificationFields key={formKey} value={form} onChange={setForm} />
        <div className='flex justify-end'>
          <Button disabled={!canSave(form) || send.isPending} onClick={() => send.mutate(form)}>
            {send.isPending ? 'Đang gửi…' : 'Gửi thông báo'}
          </Button>
        </div>
      </div>

      <div>
        <p className='mb-3 text-sm font-medium'>Đã gửi</p>
        {isLoading ? (
          <div className='flex justify-center py-12'>
            <Icons.spinner className='h-6 w-6 animate-spin' />
          </div>
        ) : sent.length === 0 ? (
          <p className='text-muted-foreground py-12 text-center text-sm'>Chưa gửi thông báo nào.</p>
        ) : (
          <div className='space-y-3' data-testid='sent-notifications'>
            {sent.map((item) => (
              <div key={item.id} className='rounded-lg border p-4' data-testid='sent-notification'>
                <div className='flex flex-wrap items-start justify-between gap-2'>
                  <div className='flex min-w-0 flex-wrap items-center gap-2'>
                    <span className='font-medium'>{item.title}</span>
                    <Badge variant='outline'>
                      {AUDIENCE_LABEL[item.audience] ?? item.audience}
                    </Badge>
                    <span
                      className={cn(
                        'rounded-md border px-2 py-0.5 text-xs font-medium',
                        toneOf(item.priority).box
                      )}
                    >
                      {PRIORITY_LABEL[item.priority ?? 'normal'] ?? 'Bình thường'}
                    </span>
                    {item.isFeatured && <Badge>Nổi bật</Badge>}
                    {item.sendEmail && (
                      <Badge variant='secondary'>{item.emailsSent} email đã gửi</Badge>
                    )}
                  </div>
                  <div className='flex gap-2'>
                    <Button size='sm' variant='outline' onClick={() => setViewing(item)}>
                      <Icons.eye className='mr-1 h-4 w-4' /> Xem
                    </Button>
                    <Button size='sm' variant='outline' onClick={() => setEditing(item)}>
                      <Icons.edit className='mr-1 h-4 w-4' /> Sửa
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      className='text-destructive'
                      onClick={() => setDeleting(item)}
                    >
                      <Icons.trash className='mr-1 h-4 w-4' /> Xóa
                    </Button>
                  </div>
                </div>
                <p className='text-muted-foreground mt-1 line-clamp-2 text-sm'>
                  {noticePreview(item.body)}
                </p>
                <p className='text-muted-foreground mt-2 text-xs'>
                  {formatDateTimeVn(item.createdAt)}
                  {item.updatedAt ? ` · sửa ${formatDateTimeVn(item.updatedAt)}` : ''} ·{' '}
                  {item.readCount}/{item.recipients} đối tác đã đọc
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewing && (
        <SentNotificationDialog notification={viewing} onClose={() => setViewing(null)} />
      )}
      {editing && (
        <EditNotificationDialog notification={editing} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <Dialog open onOpenChange={(open) => !open && setDeleting(null)}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Xóa thông báo?</DialogTitle>
              <DialogDescription>
                “{deleting.title}” sẽ biến mất khỏi chuông và đầu trang của mọi đối tác. Email đã
                gửi thì không thu hồi được.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant='outline' onClick={() => setDeleting(null)}>
                Hủy
              </Button>
              <Button
                variant='destructive'
                disabled={remove.isPending}
                onClick={() => remove.mutate(deleting.id)}
              >
                {remove.isPending ? 'Đang xóa…' : 'Xóa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/** "Sửa": the new text shows on every bell at once; no email goes again. */
function EditNotificationDialog({
  notification,
  onClose
}: {
  notification: PartnerNotification;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState<FormValue>({
    title: notification.title,
    body: notification.body,
    audience: notification.audience,
    priority: notification.priority ?? 'normal',
    isFeatured: Boolean(notification.isFeatured),
    sendEmail: false
  });
  const save = useMutation({
    mutationFn: () =>
      updateNotification(notification.id, {
        title: value.title,
        body: value.body,
        audience: value.audience,
        priority: value.priority,
        isFeatured: value.isFeatured
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật thông báo.');
      void queryClient.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || 'Cập nhật thất bại')
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>Sửa thông báo</DialogTitle>
          <DialogDescription>
            Nội dung mới hiện ngay ở chuông và đầu trang của đối tác. Email không được gửi lại.
          </DialogDescription>
        </DialogHeader>
        <NotificationFields value={value} onChange={setValue} editing />
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Hủy
          </Button>
          <Button disabled={!canSave(value) || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
