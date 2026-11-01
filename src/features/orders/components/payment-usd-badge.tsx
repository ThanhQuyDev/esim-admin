import { Badge } from '@/components/ui/badge';

/**
 * "payment $" (doitac-3010 #043): the buyer checked out on the English site,
 * where prices read in $, but every gateway charges VND — and the order was
 * never paid. Counted to judge whether a USD gateway is worth adding.
 */
export function PaymentUsdBadge() {
  return (
    <Badge
      variant='outline'
      className='border-amber-500 text-amber-700 dark:text-amber-400'
      title='Khách đặt ở bản tiếng Anh (giá hiển thị $), cổng thanh toán thu VNĐ — đơn chưa thanh toán được'
      data-testid='payment-usd'
    >
      payment $
    </Badge>
  );
}
