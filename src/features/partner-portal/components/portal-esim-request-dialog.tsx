'use client';

/**
 * "Báo lỗi" / "Yêu cầu hoàn tiền" on one eSIM (doitac-1410 #038, #039) —
 * shared by the eSIM list and the eSIM's own page. Sending opens a support
 * ticket for esim.vn; nothing is debited or credited until an admin approves.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';

import { reportEsimFault, requestForPurchase } from '../api/service';
import { partnerPortalKeys } from '../api/queries';
import { uploadAttachment } from '../api/service';

/** How the provider's status words read to a partner counting stock. */
export const esimStatusLabel: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  available: { label: 'Chưa kích hoạt', variant: 'outline' },
  // Local stock handed to the partner, not switched on yet (doitac-1410 #038).
  sold: { label: 'Chưa kích hoạt', variant: 'outline' },
  active: { label: 'Đang dùng', variant: 'default' },
  expired: { label: 'Đã hết hạn', variant: 'destructive' },
  deactivated: { label: 'Đã ngừng', variant: 'secondary' },
  refunded: { label: 'Đã hoàn tiền', variant: 'secondary' }
};

/** Provider figures are in MB; a partner reads GB. */
export function formatData(mb: number | null): string {
  if (mb == null) return '—';
  if (mb >= 1024) return `${(mb / 1024).toFixed(1).replace('.0', '')} GB`;
  return `${Math.round(mb)} MB`;
}

export type FaultKind = 'fault' | 'refund';

/** What each request reads as — the subject goes on the support ticket (doitac-1410 #038). */
const FAULT_COPY: Record<FaultKind, { title: string; subject: string; submit: string }> = {
  fault: {
    title: 'Báo lỗi eSIM',
    subject: 'eSIM lỗi hoặc không kích hoạt được',
    submit: 'Gửi báo lỗi'
  },
  refund: {
    title: 'Yêu cầu hoàn tiền',
    subject: 'Hoàn tiền đơn hàng / eSIM lỗi',
    submit: 'Gửi yêu cầu hoàn tiền'
  }
};

const REASON_MAX = 2000;
const MAX_FILES = 5;

/** No ICCID = the request is about the whole order (doitac-1410 #042). */
export type EsimRequestTarget = { iccid?: string; orderNumber: string; kind: FaultKind };

export function EsimRequestDialog({
  target,
  onClose
}: {
  target: EsimRequestTarget | null;
  onClose: () => void;
}) {
  const faulty = target;
  const [reason, setReason] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const closeFault = () => {
    onClose();
    setReason('');
    setAttachments([]);
  };

  const reportFault = useMutation({
    mutationFn: (input: { reason: string; attachments: string[] }): Promise<unknown> =>
      faulty!.iccid
        ? reportEsimFault({
            orderNumber: faulty!.orderNumber,
            iccid: faulty!.iccid,
            kind: faulty!.kind,
            ...input
          })
        : requestForPurchase(faulty!.orderNumber, { kind: faulty!.kind, ...input }),
    onSuccess: () => {
      toast.success(
        faulty?.kind === 'refund'
          ? 'Đã gửi yêu cầu hoàn tiền. esim.vn sẽ kiểm tra và phản hồi qua phiếu hỗ trợ.'
          : 'Đã gửi báo lỗi. esim.vn sẽ kiểm tra và phản hồi qua phiếu hỗ trợ.'
      );
      closeFault();
      void queryClient.invalidateQueries({ queryKey: partnerPortalKeys.all });
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <Dialog open={faulty !== null} onOpenChange={(open) => !open && closeFault()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{FAULT_COPY[faulty?.kind ?? 'fault'].title}</DialogTitle>
          <DialogDescription>
            Yêu cầu được gửi thành phiếu hỗ trợ. esim.vn kiểm tra với nhà cung cấp rồi mới hoàn tiền
            vào ví — phiếu này không trừ hay cộng tiền ngay.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          <div className='space-y-2'>
            <Label htmlFor='fault-subject'>Tiêu đề</Label>
            <Input
              id='fault-subject'
              tabIndex={-1}
              readOnly
              value={FAULT_COPY[faulty?.kind ?? 'fault'].subject}
            />
          </div>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='fault-order'>Mã đơn hàng</Label>
              <Input
                id='fault-order'
                tabIndex={-1}
                readOnly
                className='font-mono'
                value={faulty?.orderNumber ?? ''}
              />
            </div>
            {faulty?.iccid && (
              <div className='space-y-2'>
                <Label htmlFor='fault-iccid'>ICCID</Label>
                <Input
                  id='fault-iccid'
                  tabIndex={-1}
                  readOnly
                  className='font-mono'
                  value={faulty.iccid}
                />
              </div>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='fault-reason'>Mô tả</Label>
            <Textarea
              id='fault-reason'
              rows={4}
              maxLength={REASON_MAX}
              placeholder='Ví dụ: quét QR báo mã đã được dùng'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className='text-muted-foreground text-right text-xs tabular-nums'>
              {reason.length}/{REASON_MAX}
            </p>
          </div>
          <div className='space-y-2'>
            <input
              id='faultAttachment'
              type='file'
              className='hidden'
              accept='image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt'
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                setUploading(true);
                try {
                  const url = await uploadAttachment(file);
                  setAttachments((current) => [...current, { name: file.name, url }]);
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setUploading(false);
                }
              }}
            />
            <div className='flex flex-wrap items-center gap-2'>
              <Button
                size='sm'
                variant='outline'
                asChild
                disabled={uploading || attachments.length >= MAX_FILES}
              >
                <label htmlFor='faultAttachment' className='cursor-pointer'>
                  <Icons.upload className='size-4' />
                  {uploading ? 'Đang tải tệp…' : 'Đính kèm tài liệu'}
                </label>
              </Button>
              <span className='text-muted-foreground text-xs'>
                Ảnh chụp màn hình, video… tối đa {MAX_FILES} tệp
              </span>
            </div>
            {attachments.length > 0 && (
              <ul className='space-y-1 text-xs' data-testid='fault-attachments'>
                {attachments.map((file, index) => (
                  <li key={file.url} className='flex items-center justify-between gap-2'>
                    <span className='truncate'>{file.name}</span>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-auto p-0 text-xs'
                      onClick={() =>
                        setAttachments((current) => current.filter((_, i) => i !== index))
                      }
                    >
                      Bỏ
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={closeFault}>
            Huỷ
          </Button>
          <Button
            disabled={reason.trim().length < 5 || reportFault.isPending || uploading}
            onClick={() =>
              faulty &&
              reportFault.mutate({
                reason: reason.trim(),
                attachments: attachments.map((file) => file.url)
              })
            }
          >
            {reportFault.isPending ? 'Đang gửi…' : FAULT_COPY[faulty?.kind ?? 'fault'].submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
