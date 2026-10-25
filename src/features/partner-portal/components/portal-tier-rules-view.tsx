'use client';

/**
 * Tier rules: what counts, when it is locked, and how a tier changes.
 *
 * The threshold table is filled from the live tier list, so this page and the
 * tier page can never disagree.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';

import { myProfileQueryOptions, myTiersQueryOptions } from '../api/queries';
import { tierThresholdLabel } from './tier-threshold';

const PRINCIPLES = [
  {
    icon: Icons.order,
    title: 'Đơn hợp lệ',
    description:
      'Chỉ tính đơn đã thanh toán, ghi nhận đúng nguồn đối tác và hoàn tất thời gian xác minh.'
  },
  {
    icon: Icons.clock,
    title: 'Kỳ đánh giá',
    description:
      'Xét theo từng tháng: tổng doanh số hợp lệ của tháng này quyết định hạng của tháng sau. Hạng được cập nhật ngày 1 hằng tháng — có thể lên hoặc xuống hạng.'
  },
  {
    icon: Icons.badgeCheck,
    title: 'Chất lượng hoạt động',
    description:
      'Đơn gian lận, đơn hoàn tiền và nguồn quảng bá vi phạm quy định không được tính vào kết quả.'
  }
];

const STEPS = [
  {
    step: 1,
    title: 'Khoá dữ liệu',
    description: 'Cuối tháng, tổng hợp doanh số các đơn hợp lệ trong tháng.'
  },
  { step: 2, title: 'Loại trừ rủi ro', description: 'Bỏ đơn hoàn tiền, gian lận hoặc sai nguồn.' },
  { step: 3, title: 'Xác định hạng', description: 'Đối chiếu ngưỡng và quyền lợi tương ứng.' },
  {
    step: 4,
    title: 'Áp dụng tháng mới',
    description: 'Ngày 1 tháng sau, hạng mới có hiệu lực cho cả tháng đó.'
  }
];

export function PortalTierRulesView() {
  const { data: tiers } = useQuery(myTiersQueryOptions());
  const { data: me } = useQuery(myProfileQueryOptions());
  const isDistribution = me?.partnerType === 'distribution';
  const sorted = useMemo(
    () => [...(tiers ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [tiers]
  );

  return (
    <div className='grid min-w-0 flex-1 grid-cols-1 gap-4'>
      <div className='grid gap-4 md:grid-cols-3'>
        {PRINCIPLES.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardHeader>
                <div className='bg-muted text-foreground flex size-9 items-center justify-center rounded-lg'>
                  <Icon className='size-4' />
                </div>
                <CardTitle className='mt-3 text-base'>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex flex-wrap items-center gap-2'>
            Điều kiện theo từng hạng
            <Badge variant='outline'>{sorted.length} hạng</Badge>
          </CardTitle>
          <CardDescription>
            Các ngưỡng dưới đây áp dụng trên doanh số hợp lệ của một tháng.
          </CardDescription>
          <CardAction>
            <Button asChild size='sm' variant='outline'>
              <Link href='/dashboard/portal/tier'>Xem hạng của tôi</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto rounded-lg border'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead>Hạng</TableHead>
                  <TableHead>
                    {isDistribution ? 'Điều kiện doanh số / ký quỹ' : 'Điều kiện doanh số'}
                  </TableHead>
                  {!isDistribution && <TableHead className='text-right'>Hoa hồng</TableHead>}
                  <TableHead className='text-right'>Giảm giá tối đa</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isDistribution ? 4 : 5}
                      className='text-muted-foreground h-24 text-center'
                    >
                      Chưa có cấu hình hạng nào.
                    </TableCell>
                  </TableRow>
                )}
                {sorted.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className='font-medium'>{t.tierName}</TableCell>
                    <TableCell data-testid='tier-rule-threshold'>
                      {tierThresholdLabel(t, isDistribution)}
                    </TableCell>
                    {!isDistribution && (
                      <TableCell className='text-right tabular-nums'>
                        {Number(t.commissionPercent)}%
                      </TableCell>
                    )}
                    <TableCell className='text-right tabular-nums'>
                      {Number(t.maxDiscountPercent)}%
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.isActive ? 'default' : 'secondary'}>
                        {t.isActive ? 'Đang áp dụng' : 'Ngừng áp dụng'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quy trình cập nhật hạng</CardTitle>
          <CardDescription>
            Hệ thống chạy tự động, sau đó đội vận hành kiểm tra các trường hợp bất thường.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {STEPS.map((item) => (
              <div key={item.step} className='rounded-lg border p-4'>
                <div className='bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums'>
                  {item.step}
                </div>
                <p className='mt-3 text-sm font-medium'>{item.title}</p>
                <p className='text-muted-foreground mt-1 text-xs'>{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
