'use client';

import { Badge } from '@/components/ui/badge';

/**
 * The variables the storefront substitutes into a SEO record (#047).
 *
 * They matter most on the shared `/destination` and `/region` records, where one
 * text serves every country: `"eSIM ${name} chỉ từ ${fromPrice}"` stays correct
 * as prices move, instead of an admin having to write (and re-check) a record
 * per country.
 */
const VARS: { name: string; description: string; example: string }[] = [
  {
    name: '${name}',
    description: 'Tên quốc gia / khu vực đang xem',
    example: 'Nhật Bản'
  },
  {
    name: '${fromPrice}',
    description: 'Giá gói rẻ nhất của trang đó, đã format',
    example: '120.000đ'
  },
  {
    name: '${fromPriceK}',
    description: 'Giá rẻ nhất rút gọn theo K (bản tiếng Anh hiện USD, vd $2.07)',
    example: '58K'
  },
  {
    name: '${fromPriceNumber}',
    description: 'Giá rẻ nhất dạng số thuần — dùng cho schema "price"',
    example: '120000'
  },
  {
    name: '${currency}',
    description: 'Đơn vị tiền cho schema "priceCurrency"',
    example: 'VND'
  },
  {
    name: '${planCount}',
    description: 'Số gói đang bán cho trang đó',
    example: '12'
  },
  {
    name: '${dataRange}',
    description: 'Khoảng dung lượng của các gói',
    example: '1GB – 20GB'
  },
  {
    name: '${dayRange}',
    description: 'Khoảng thời hạn của các gói',
    example: '3 – 30 ngày'
  }
];

export function SeoTemplateVarsHint() {
  return (
    <div className='bg-muted/40 space-y-2 rounded-md border p-3'>
      <p className='text-sm font-medium'>Biến có thể dùng trong nội dung SEO</p>
      <p className='text-muted-foreground text-xs'>
        Gõ trực tiếp vào Meta Title / Description / Keywords / Schema. Website sẽ tự thay bằng dữ
        liệu thật của quốc gia hoặc khu vực đang xem.
      </p>
      <ul className='grid gap-1.5 sm:grid-cols-2'>
        {VARS.map((v) => (
          <li key={v.name} className='flex flex-wrap items-center gap-1.5 text-xs'>
            <Badge variant='secondary' className='font-mono'>
              {v.name}
            </Badge>
            <span className='text-muted-foreground'>
              {v.description} — vd: <span className='font-medium'>{v.example}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className='text-muted-foreground text-xs'>
        Với Schema (JSON-LD), luôn đặt biến trong dấu ngoặc kép — ví dụ{' '}
        <span className='font-mono'>&quot;price&quot;: &quot;${'{fromPriceNumber}'}&quot;</span> —
        để JSON vẫn hợp lệ khi trang đó chưa có gói cước nào.
      </p>
      <p className='text-muted-foreground text-xs'>
        Trang không phải quốc gia / khu vực (vd <span className='font-mono'>/blog</span>) không có
        các biến giá, nên đừng dùng chúng ở đó.
      </p>
    </div>
  );
}
