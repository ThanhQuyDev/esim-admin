'use client';

import { useRef } from 'react';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { brandQrLogoSettings } from '@/lib/qr-branding';
import type { CustomPaymentLink } from '../api/types';

const QR_SIZE = 240;

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

interface PaymentLinkQrDialogProps {
  /** The order to show a code for; `null` closes the dialog. */
  link: CustomPaymentLink | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * QR code for a payment order (#085).
 *
 * Admins were handing customers a long OnePay URL to type or paste, which is
 * exactly the kind of thing that gets mistyped over the phone. Scanning the
 * code opens the same payment page on the customer's own phone.
 *
 * Rendered on a canvas rather than as SVG so it can be saved as a PNG and
 * pasted into Zalo, an email or a printed slip.
 */
export function PaymentLinkQrDialog({ link, onOpenChange }: PaymentLinkQrDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleCopy() {
    if (!link) return;
    navigator.clipboard
      .writeText(link.paymentUrl)
      .then(() => toast.success('Đã copy link vào clipboard'))
      .catch(() => toast.error('Copy link thất bại'));
  }

  function handleDownload() {
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas || !link) {
      toast.error('Chưa tạo được ảnh mã QR');
      return;
    }
    try {
      const url = canvas.toDataURL('image/png');
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `qr-${link.virtualOrderId}.png`;
      anchor.click();
    } catch {
      toast.error('Tải ảnh mã QR thất bại');
    }
  }

  return (
    <Dialog open={!!link} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Mã QR thanh toán</DialogTitle>
        </DialogHeader>

        {link && (
          <div className='flex flex-col items-center gap-3 py-2'>
            <div ref={containerRef} className='rounded-lg border bg-white p-4'>
              <QRCodeCanvas
                value={link.paymentUrl}
                size={QR_SIZE}
                // Level H tolerates ~30% loss, which is what makes room for the
                // wordmark in the middle.
                level='H'
                marginSize={2}
                imageSettings={brandQrLogoSettings(QR_SIZE)}
                data-testid='payment-link-qr'
              />
            </div>

            <div className='text-center'>
              <p className='text-sm font-medium'>{formatVnd(link.amount)}</p>
              <p className='text-muted-foreground text-xs'>{link.description}</p>
              <p className='text-muted-foreground font-mono text-xs'>{link.virtualOrderId}</p>
            </div>

            <p className='text-muted-foreground max-w-[18rem] text-center text-xs'>
              Khách quét mã bằng camera điện thoại để mở thẳng trang thanh toán OnePay.
            </p>

            <div className='flex w-full gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='flex-1'
                onClick={handleCopy}
              >
                <Icons.copy className='mr-2 h-4 w-4' />
                Copy link
              </Button>
              <Button type='button' size='sm' className='flex-1' onClick={handleDownload}>
                <Icons.download className='mr-2 h-4 w-4' />
                Tải ảnh QR
              </Button>
            </div>

            <p className='text-muted-foreground w-full font-mono text-[0.7rem] break-all'>
              {link.paymentUrl}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
