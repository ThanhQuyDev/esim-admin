'use client';

/**
 * "Nạp tiền thủ công" for a partner who pays from a company bank account
 * (vande #068/#069). SePay and OnePay never see that money, so the partner
 * reports the transfer — the amount, the memo, the proof — and esim.vn
 * confirms it in "Tài chính". The request cannot be edited afterwards; a
 * mistake is a new request.
 */

import { useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { formatDateTimeVn, formatVnd } from '@/lib/format';

import { createManualDepositRequestMutation } from '../api/mutations';
import { myProfileQueryOptions } from '../api/queries';
import type { DepositProofFile, MyDepositRequest } from '../api/types';

const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf';

export const DEPOSIT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: 'Chuyển khoản',
  card: 'Thẻ tín dụng',
  manual_transfer: 'Chuyển khoản thủ công'
};

/** The partner's own bank account, to check the transfer against. */
function PartnerBankBox() {
  const { data: me } = useQuery(myProfileQueryOptions());
  return (
    <div className='bg-muted/40 space-y-1 rounded-lg border p-3 text-sm'>
      <p className='text-muted-foreground text-xs'>
        Tài khoản ngân hàng của bạn trên hệ thống (để đối chiếu)
      </p>
      {me?.bankName || me?.bankAccountNumber ? (
        <>
          <p>
            <span className='text-muted-foreground'>Ngân hàng: </span>
            {me?.bankName ?? '—'}
          </p>
          <p>
            <span className='text-muted-foreground'>Số tài khoản: </span>
            <span className='tabular-nums'>{me?.bankAccountNumber ?? '—'}</span>
          </p>
          <p>
            <span className='text-muted-foreground'>Chủ tài khoản: </span>
            {me?.bankAccountHolder ?? '—'}
          </p>
        </>
      ) : (
        <p className='text-muted-foreground'>
          Bạn chưa khai báo tài khoản ngân hàng — cập nhật ở trang Hồ sơ để esim.vn đối chiếu nhanh
          hơn.
        </p>
      )}
    </div>
  );
}

/** "Nhập thông tin chuyển khoản" (vande #069). */
export function ManualDepositDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [amount, setAmount] = useState('');
  const [content, setContent] = useState('');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const reset = () => {
    setAmount('');
    setContent('');
    setNote('');
    setFiles([]);
    setError(null);
  };

  const submitMutation = useMutation({
    ...createManualDepositRequestMutation,
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu ký quỹ. esim.vn sẽ đối chiếu và duyệt sớm.');
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) => setError(e.message)
  });

  const value = Number(amount || 0);

  const validate = (): string | null => {
    if (!amount.trim() || !(value > 0) || !Number.isInteger(value)) {
      return 'Nhập số tiền đã thanh toán.';
    }
    if (content.trim().length < 2) return 'Nhập nội dung chuyển tiền.';
    if (files.length === 0) return 'Đính kèm bằng chứng chuyển tiền (ảnh hoặc ủy nhiệm chi).';
    return null;
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    // A fresh pick answers "đính kèm bằng chứng"; a problem below sets its own.
    setError(null);
    const picked = [...files];
    for (const file of Array.from(list)) {
      if (file.size > MAX_BYTES) {
        setError(`File "${file.name}" lớn hơn 5MB.`);
        continue;
      }
      if (picked.length >= MAX_FILES) {
        setError(`Tối đa ${MAX_FILES} file bằng chứng.`);
        break;
      }
      picked.push(file);
    }
    setFiles(picked);
  };

  const submit = () => {
    const problem = validate();
    setError(problem);
    if (problem) return;
    submitMutation.mutate({
      amountVnd: value,
      transferContent: content.trim(),
      note: note.trim() || undefined,
      files
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        className='max-h-[90vh] overflow-y-auto sm:max-w-[560px]'
        data-testid='manual-deposit-dialog'
      >
        <DialogHeader>
          <DialogTitle>Nhập thông tin chuyển khoản</DialogTitle>
          <DialogDescription>
            Tài khoản của bạn nạp ký quỹ thủ công: chuyển khoản từ tài khoản công ty, rồi gửi thông
            tin bên dưới để esim.vn đối chiếu. Số dư được cộng khi esim.vn duyệt.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='manualAmount'>
              Số tiền đã thanh toán (VND) <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='manualAmount'
              type='number'
              inputMode='numeric'
              min={1}
              value={amount}
              placeholder='VD: 50000000'
              onChange={(e) => setAmount(e.target.value)}
            />
            {value > 0 && <p className='text-muted-foreground text-xs'>{formatVnd(value)}</p>}
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='manualContent'>
              Nội dung chuyển tiền <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='manualContent'
              maxLength={200}
              value={content}
              placeholder='Nội dung bạn đã ghi trên lệnh chuyển khoản'
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <PartnerBankBox />

          <div className='space-y-1.5'>
            <Label htmlFor='manualProof'>
              Bằng chứng chuyển tiền <span className='text-destructive'>*</span>
            </Label>
            <input
              ref={fileInput}
              id='manualProof'
              type='file'
              accept={ACCEPT}
              multiple
              className='hidden'
              data-testid='manual-proof-input'
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <div className='flex flex-wrap items-center gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => fileInput.current?.click()}
              >
                <Icons.upload className='mr-2 size-4' /> Tải ảnh / file lên
              </Button>
              <span className='text-muted-foreground text-xs'>
                JPG, PNG, WEBP hoặc PDF, tối đa {MAX_FILES} file, mỗi file 5MB
              </span>
            </div>
            {files.length > 0 && (
              <ul className='space-y-1 text-sm' data-testid='manual-proof-list'>
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className='flex items-center justify-between gap-2 rounded border px-2 py-1'
                  >
                    <span className='min-w-0 truncate'>{file.name}</span>
                    <Button
                      type='button'
                      size='icon'
                      variant='ghost'
                      className='size-7 shrink-0'
                      aria-label={`Bỏ ${file.name}`}
                      onClick={() => setFiles((c) => c.filter((_, i) => i !== index))}
                    >
                      <Icons.close className='size-4' />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className='rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'>
              Lưu ý: Việc cung cấp bằng chứng chuyển tiền có thể giúp đẩy nhanh quá trình phê duyệt
              tài chính.
            </p>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='manualNote'>Ghi chú</Label>
            <Textarea
              id='manualNote'
              rows={2}
              maxLength={1000}
              value={note}
              placeholder='Không bắt buộc'
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && (
            <p className='text-destructive text-sm' data-testid='manual-deposit-error'>
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={submit}
            disabled={submitMutation.isPending}
            isLoading={submitMutation.isPending}
            data-testid='manual-deposit-submit'
          >
            Gửi yêu cầu ký quỹ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A proof file as a thumbnail (an image) or a link (a PDF). */
export function ProofFiles({
  files,
  hrefFor
}: {
  files: DepositProofFile[];
  hrefFor: (file: DepositProofFile) => string;
}) {
  return (
    <div className='grid grid-cols-2 gap-2 sm:grid-cols-3' data-testid='deposit-proofs'>
      {files.map((file) => (
        <a
          key={file.id}
          href={hrefFor(file)}
          target='_blank'
          rel='noreferrer'
          className='hover:bg-muted block overflow-hidden rounded-md border'
          title={file.name}
        >
          {file.mimeType.startsWith('image/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hrefFor(file)}
              alt={file.name}
              className='bg-muted h-28 w-full object-cover'
            />
          ) : (
            <div className='bg-muted flex h-28 items-center justify-center'>
              <Icons.page className='text-muted-foreground size-8' />
            </div>
          )}
          <p className='truncate px-2 py-1 text-xs'>{file.name}</p>
        </a>
      ))}
    </div>
  );
}

/**
 * "Xem chi tiết" of one top-up in "Lịch sử nạp tiền" (vande #069): what was
 * sent and the proof, to look at — not to change.
 */
export function DepositDetailDialog({
  request,
  statusLabel,
  onClose
}: {
  request: MyDepositRequest;
  statusLabel: string;
  onClose: () => void;
}) {
  const proofs = request.proofFiles ?? [];
  const settledAt = request.confirmedAt ?? request.rejectedAt;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className='max-h-[90vh] overflow-y-auto sm:max-w-lg'
        data-testid='deposit-detail-dialog'
      >
        <DialogHeader>
          <DialogTitle>Chi tiết yêu cầu nạp ký quỹ</DialogTitle>
          <DialogDescription>
            Yêu cầu đã gửi không sửa hoặc xoá được — nếu có sai sót, hãy tạo yêu cầu mới.
          </DialogDescription>
        </DialogHeader>

        <dl className='grid grid-cols-2 gap-3 text-sm'>
          <div>
            <dt className='text-muted-foreground text-xs'>Mã yêu cầu</dt>
            <dd className='font-mono'>{request.bankTransferCode}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground text-xs'>Trạng thái</dt>
            <dd>
              <Badge variant='outline'>{statusLabel}</Badge>
            </dd>
          </div>
          <div>
            <dt className='text-muted-foreground text-xs'>Số tiền</dt>
            <dd className='font-semibold tabular-nums'>{formatVnd(request.amountVnd)}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground text-xs'>Cộng vào ví</dt>
            <dd className='tabular-nums'>{formatVnd(request.creditedVnd ?? request.amountVnd)}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground text-xs'>Hình thức</dt>
            <dd>{DEPOSIT_METHOD_LABEL[request.method ?? 'bank_transfer'] ?? request.method}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground text-xs'>Ngày gửi</dt>
            <dd>{formatDateTimeVn(request.createdAt)}</dd>
          </div>
          {request.transferContent && (
            <div className='col-span-2'>
              <dt className='text-muted-foreground text-xs'>Nội dung chuyển tiền</dt>
              <dd className='break-words'>{request.transferContent}</dd>
            </div>
          )}
          {request.partnerNote && (
            <div className='col-span-2'>
              <dt className='text-muted-foreground text-xs'>Ghi chú</dt>
              <dd className='break-words whitespace-pre-line'>{request.partnerNote}</dd>
            </div>
          )}
          {request.status === 'rejected' && request.rejectionReason && (
            <div className='col-span-2'>
              <dt className='text-muted-foreground text-xs'>Lý do từ chối</dt>
              <dd className='text-destructive'>{request.rejectionReason}</dd>
            </div>
          )}
        </dl>

        {proofs.length > 0 && (
          <div className='space-y-1.5'>
            <p className='text-muted-foreground text-xs'>Bằng chứng chuyển tiền đã gửi</p>
            <ProofFiles
              files={proofs}
              hrefFor={(file) =>
                `/api/partner-portal/wallet/deposit-requests/${request.id}/proofs/${encodeURIComponent(file.id)}`
              }
            />
          </div>
        )}

        {settledAt && (
          <p className='text-muted-foreground text-xs'>
            Đã xử lý ngày {formatDateTimeVn(settledAt)}.
          </p>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
