'use client';

/**
 * "Khuyến mãi nạp ký quỹ" (doitac-1410 #015).
 *
 * The admin sets up promotions ahead of time: top up at least X between two
 * dates and the wallet gets Y% more, up to a ceiling. Several may exist; when
 * two run at once the partner gets whichever gives more. The bonus is a line
 * of its own in the wallet history, so nobody mistakes it for the deposit.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { formatDateTimeVn, formatVnd } from '@/lib/format';

import { depositPromotionsQueryOptions } from '../api/queries';
import { deleteDepositPromotion, saveDepositPromotion } from '../api/service';
import type { DepositPromotion } from '../api/types';

type Draft = {
  name: string;
  bonusPercent: string;
  minDepositVnd: string;
  maxBonusVnd: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

/** `datetime-local` wants the admin's own clock, not UTC. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EMPTY: Draft = {
  name: '',
  bonusPercent: '',
  minDepositVnd: '',
  maxBonusVnd: '',
  startsAt: '',
  endsAt: '',
  isActive: true
};

function stateOf(p: DepositPromotion): {
  label: string;
  variant: 'default' | 'secondary' | 'outline';
} {
  const now = Date.now();
  if (!p.isActive) return { label: 'Đã tắt', variant: 'secondary' };
  if (new Date(p.endsAt).getTime() < now) return { label: 'Đã kết thúc', variant: 'secondary' };
  if (new Date(p.startsAt).getTime() > now) return { label: 'Sắp diễn ra', variant: 'outline' };
  return { label: 'Đang chạy', variant: 'default' };
}

export function DepositPromotionsCard() {
  const queryClient = useQueryClient();
  const { data: promotions = [], isLoading } = useQuery(depositPromotionsQueryOptions());
  const [editing, setEditing] = useState<{ id: number | null; draft: Draft } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: depositPromotionsQueryOptions().queryKey });

  const save = useMutation({
    mutationFn: ({ id, draft }: { id: number | null; draft: Draft }) =>
      saveDepositPromotion(id, {
        name: draft.name.trim(),
        bonusPercent: Number(draft.bonusPercent),
        minDepositVnd: Math.round(Number(draft.minDepositVnd)),
        maxBonusVnd: draft.maxBonusVnd.trim() ? Math.round(Number(draft.maxBonusVnd)) : null,
        startsAt: new Date(draft.startsAt).toISOString(),
        endsAt: new Date(draft.endsAt).toISOString(),
        isActive: draft.isActive
      }),
    onSuccess: () => {
      toast.success('Đã lưu chương trình khuyến mãi.');
      setEditing(null);
      refresh();
    },
    onError: (e: Error) => setError(e.message || 'Lưu thất bại')
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteDepositPromotion(id),
    onSuccess: () => {
      toast.success('Đã xoá chương trình khuyến mãi.');
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || 'Xoá thất bại')
  });

  const open = (p?: DepositPromotion) => {
    setError(null);
    setEditing(
      p
        ? {
            id: p.id,
            draft: {
              name: p.name,
              bonusPercent: String(Number(p.bonusPercent)),
              minDepositVnd: String(Number(p.minDepositVnd)),
              maxBonusVnd: p.maxBonusVnd != null ? String(Number(p.maxBonusVnd)) : '',
              startsAt: toLocalInput(p.startsAt),
              endsAt: toLocalInput(p.endsAt),
              isActive: p.isActive
            }
          }
        : { id: null, draft: { ...EMPTY } }
    );
  };

  const draft = editing?.draft;
  const set = (patch: Partial<Draft>) =>
    setEditing((e) => (e ? { ...e, draft: { ...e.draft, ...patch } } : e));

  const draftProblem = (() => {
    if (!draft) return null;
    if (!draft.name.trim()) return 'Nhập tên chương trình.';
    const pct = Number(draft.bonusPercent);
    if (!(pct > 0 && pct <= 100)) return '% tặng phải từ 0,01 đến 100.';
    if (!(Number(draft.minDepositVnd) >= 0) || draft.minDepositVnd === '')
      return 'Nhập mức nạp tối thiểu.';
    if (!draft.startsAt || !draft.endsAt) return 'Chọn thời gian bắt đầu và kết thúc.';
    if (new Date(draft.endsAt) <= new Date(draft.startsAt))
      return 'Thời gian kết thúc phải sau thời gian bắt đầu.';
    return null;
  })();

  const example =
    draft && Number(draft.minDepositVnd) > 0 && Number(draft.bonusPercent) > 0
      ? (() => {
          const amount = Number(draft.minDepositVnd);
          const raw = Math.floor((amount * Number(draft.bonusPercent)) / 100);
          const cap = draft.maxBonusVnd.trim() ? Number(draft.maxBonusVnd) : null;
          return `Ví dụ: nạp ${formatVnd(amount)} → tặng ${formatVnd(cap != null ? Math.min(raw, cap) : raw)}.`;
        })()
      : null;

  return (
    <Card data-testid='deposit-promotions'>
      <CardHeader className='flex flex-row items-start justify-between gap-4'>
        <div>
          <CardTitle>Khuyến mãi nạp ký quỹ</CardTitle>
          <CardDescription>
            Tặng thêm % số dư khi đối tác phân phối nạp ký quỹ từ mức tối thiểu, trong thời gian
            chương trình. Phần tặng hiện thành một dòng riêng trong lịch sử giao dịch của đối tác.
          </CardDescription>
        </div>
        <Button size='sm' onClick={() => open()}>
          <Icons.add className='mr-2 size-4' /> Thêm khuyến mãi
        </Button>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader className='bg-muted'>
              <TableRow>
                <TableHead>Chương trình</TableHead>
                <TableHead className='text-right'>Tặng</TableHead>
                <TableHead className='text-right'>Nạp từ</TableHead>
                <TableHead className='text-right'>Tặng tối đa</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className='text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className='text-muted-foreground h-16 text-center'>
                    Đang tải…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && promotions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className='text-muted-foreground h-16 text-center'>
                    Chưa có chương trình khuyến mãi nào.
                  </TableCell>
                </TableRow>
              )}
              {promotions.map((p) => {
                const state = stateOf(p);
                return (
                  <TableRow key={p.id}>
                    <TableCell className='font-medium'>{p.name}</TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {Number(p.bonusPercent)}%
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {formatVnd(Number(p.minDepositVnd))}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {p.maxBonusVnd != null ? formatVnd(Number(p.maxBonusVnd)) : 'Không giới hạn'}
                    </TableCell>
                    <TableCell className='text-xs whitespace-nowrap'>
                      {formatDateTimeVn(p.startsAt)}
                      <br />→ {formatDateTimeVn(p.endsAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={state.variant}>{state.label}</Badge>
                    </TableCell>
                    <TableCell className='text-right whitespace-nowrap'>
                      <Button size='sm' variant='ghost' onClick={() => open(p)}>
                        <Icons.edit className='size-4' /> Sửa
                      </Button>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='text-destructive hover:text-destructive'
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(p.id)}
                      >
                        <Icons.trash className='size-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? 'Sửa khuyến mãi nạp ký quỹ' : 'Thêm khuyến mãi nạp ký quỹ'}
            </DialogTitle>
            <DialogDescription>
              Áp dụng cho các lần nạp được xác nhận trong khoảng thời gian dưới đây.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-1 sm:col-span-2'>
                <Label htmlFor='promo-name'>Tên chương trình</Label>
                <Input
                  id='promo-name'
                  placeholder='VD: Tặng 5% tháng 11'
                  value={draft.name}
                  onChange={(e) => set({ name: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='promo-percent'>% tặng thêm</Label>
                <Input
                  id='promo-percent'
                  type='number'
                  min={0.01}
                  max={100}
                  step={0.01}
                  value={draft.bonusPercent}
                  onChange={(e) => set({ bonusPercent: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='promo-min'>Nạp tối thiểu (VND)</Label>
                <Input
                  id='promo-min'
                  type='number'
                  min={0}
                  value={draft.minDepositVnd}
                  onChange={(e) => set({ minDepositVnd: e.target.value })}
                />
              </div>
              <div className='space-y-1 sm:col-span-2'>
                <Label htmlFor='promo-cap'>Tặng tối đa mỗi lần nạp (VND)</Label>
                <Input
                  id='promo-cap'
                  type='number'
                  min={1}
                  placeholder='Để trống: không giới hạn'
                  value={draft.maxBonusVnd}
                  onChange={(e) => set({ maxBonusVnd: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='promo-start'>Bắt đầu</Label>
                <Input
                  id='promo-start'
                  type='datetime-local'
                  value={draft.startsAt}
                  onChange={(e) => set({ startsAt: e.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='promo-end'>Kết thúc</Label>
                <Input
                  id='promo-end'
                  type='datetime-local'
                  value={draft.endsAt}
                  onChange={(e) => set({ endsAt: e.target.value })}
                />
              </div>
              <div className='flex items-center justify-between rounded-lg border p-3 sm:col-span-2'>
                <Label htmlFor='promo-active'>Bật chương trình</Label>
                <Switch
                  id='promo-active'
                  checked={draft.isActive}
                  onCheckedChange={(v) => set({ isActive: v })}
                />
              </div>
              {example && <p className='text-muted-foreground text-xs sm:col-span-2'>{example}</p>}
              {/* The problem is named once the admin has started typing, not at the empty form. */}
              {(error || (draft.name && draftProblem)) && (
                <p className='text-destructive text-sm sm:col-span-2' role='alert'>
                  {error ?? draftProblem}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditing(null)}>
              Huỷ
            </Button>
            <Button
              disabled={Boolean(draftProblem)}
              isLoading={save.isPending}
              onClick={() => editing && save.mutate(editing)}
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
