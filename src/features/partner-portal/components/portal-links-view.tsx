'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { myLinksQueryOptions } from '../api/queries';
import { createLinkMutation, updateLinkMutation } from '../api/mutations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';
import { toast } from 'sonner';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateLinkModal } from './create-link-modal';

export function PortalLinksView() {
  const [createOpen, setCreateOpen] = useState(false);
  /** Link whose QR is being shown — offline channels need a scannable code. */
  const [qrCode, setQrCode] = useState<string | null>(null);
  const { data: links = [], isLoading, refetch } = useQuery(myLinksQueryOptions());

  const createMutation = useMutation({
    ...createLinkMutation,
    onSuccess: () => {
      toast.success('Đã tạo link tiếp thị.');
      setCreateOpen(false);
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Tạo link thất bại')
  });

  const toggleMutation = useMutation({
    ...updateLinkMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật link.');
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Cập nhật thất bại')
  });

  const publicOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://esim.vn';

  function copyLink(code: string) {
    const url = `${publicOrigin}/go/${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép link.');
  }

  const qrUrl = qrCode ? `${publicOrigin}/go/${qrCode}` : '';

  return (
    <div className='space-y-4'>
      <Dialog open={!!qrCode} onOpenChange={(o) => !o && setQrCode(null)}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Mã QR cho liên kết</DialogTitle>
          </DialogHeader>
          <div className='flex flex-col items-center gap-3 py-2'>
            {qrCode && <QRCodeSVG value={qrUrl} size={200} includeMargin />}
            <p className='text-muted-foreground font-mono text-xs break-all'>{qrUrl}</p>
            <p className='text-muted-foreground text-center text-xs'>
              Dùng cho standee, tờ rơi hoặc màn hình tại điểm bán — mọi lượt quét đều được ghi nhận
              về liên kết này.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <CreateLinkModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
      />

      <div className='flex justify-end'>
        <Button size='sm' onClick={() => setCreateOpen(true)}>
          <Icons.add className='mr-2 h-4 w-4' /> Tạo link mới
        </Button>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : links.length === 0 ? (
        <p className='text-muted-foreground py-12 text-center text-sm'>
          Chưa có link tiếp thị nào. Tạo link để bắt đầu nhận hoa hồng.
        </p>
      ) : (
        <div className='space-y-3'>
          {links.map((link) => (
            <div key={link.id} className='rounded-lg border p-4'>
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>{link.label}</span>
                    <Badge variant={link.status === 'active' ? 'default' : 'secondary'}>
                      {link.status === 'active' ? 'Đang hoạt động' : 'Đã tắt'}
                    </Badge>
                  </div>
                  <p className='text-muted-foreground mt-1 font-mono text-xs'>
                    {publicOrigin}/go/{link.code}
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' onClick={() => copyLink(link.code)}>
                    <Icons.copy className='mr-2 h-4 w-4' /> Sao chép
                  </Button>
                  <Button variant='outline' size='sm' onClick={() => setQrCode(link.code)}>
                    <Icons.media className='mr-2 h-4 w-4' /> Mã QR
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      toggleMutation.mutate({
                        id: link.id,
                        data: { isActive: link.status !== 'active' }
                      })
                    }
                  >
                    {link.status === 'active' ? 'Tắt' : 'Kích hoạt'}
                  </Button>
                </div>
              </div>
              <div className='mt-3 grid grid-cols-3 gap-3 text-sm'>
                <div>
                  <p className='text-muted-foreground text-xs'>Lượt click</p>
                  <p className='font-medium'>{link.clickCount}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-xs'>Đơn hàng</p>
                  <p className='font-medium'>{link.conversionCount}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-xs'>Hoa hồng đã nhận</p>
                  <p className='font-medium'>{formatVnd(link.totalCommissionVnd)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
