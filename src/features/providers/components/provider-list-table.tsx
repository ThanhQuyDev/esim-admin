'use client';

import { useState } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { PROVIDER_CODE_LABELS, providerLabel } from '@/features/overview/api/constants';
import { providerSalesStatusesQueryOptions } from '../api/queries';
import {
  createProviderMutation,
  deleteProviderMutation,
  updateProviderMutation
} from '../api/mutations';
import type { ProviderSalesStatus } from '../api/types';

/** Its name: the one set here, else the one the CMS always used. */
export function providerName(row: ProviderSalesStatus): string {
  return row.displayName || providerLabel(row.provider);
}

/** Its overview code: the one set here, else the built-in one. */
export function providerCode(row: ProviderSalesStatus): string {
  return row.shortCode || PROVIDER_CODE_LABELS[row.provider] || '—';
}

/** Why "Xoá" is off for this supplier, or null when it can go. */
function deleteBlocker(row: ProviderSalesStatus): string | null {
  if (row.isApi) return 'Nhà cung cấp kết nối bằng API, chỉ tắt bán được, không xoá được.';
  if (!row.isManual) return 'Nhà cung cấp có sẵn trong hệ thống, chỉ tắt bán được.';
  if (row.planCount > 0 || row.esimCount > 0) {
    return `Còn ${row.planCount} gói và ${row.esimCount} eSIM (đã bán hoặc trong kho). Hãy tắt bán thay vì xoá.`;
  }
  return null;
}

/**
 * "+ Thêm nhà cung cấp" and "Cập nhật" (vande-1411 #024). A new one is a domestic
 * supplier imported by file: its system name gets "-noidia", the provider the
 * import gives a domestic file's plans.
 */
export function ProviderFormDialog({
  row,
  open,
  onOpenChange
}: {
  row?: ProviderSalesStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const editing = !!row;
  const [displayName, setDisplayName] = useState(row ? providerName(row) : '');
  const [slug, setSlug] = useState('');
  const [shortCode, setShortCode] = useState(row ? (row.shortCode ?? providerCode(row)) : '');

  const create = useMutation({
    ...createProviderMutation,
    onSuccess: (res) => {
      toast.success(`Đã thêm nhà cung cấp ${res.data.displayName ?? res.data.provider}.`);
      onOpenChange(false);
      setDisplayName('');
      setSlug('');
      setShortCode('');
    },
    onError: (error) => toast.error(error.message || 'Thêm nhà cung cấp thất bại')
  });
  const update = useMutation({
    ...updateProviderMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật nhà cung cấp.');
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message || 'Cập nhật thất bại')
  });

  const cleanSlug = slug
    .trim()
    .toLowerCase()
    .replace(/-noidia$/, '');
  const slugOk = /^[a-z0-9][a-z0-9_-]{0,56}$/.test(cleanSlug);
  const canSave = displayName.trim() && shortCode.trim() && (editing || slugOk);
  const pending = create.isPending || update.isPending;

  const submit = () => {
    if (!canSave) return;
    if (row) {
      update.mutate({
        provider: row.provider,
        values: {
          displayName: displayName.trim(),
          shortCode: shortCode.trim()
        }
      });
    } else {
      create.mutate({
        displayName: displayName.trim(),
        provider: cleanSlug,
        shortCode: shortCode.trim()
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid='provider-form-dialog'>
        <DialogHeader>
          <DialogTitle>
            {editing ? `Cập nhật ${providerName(row)}` : 'Thêm nhà cung cấp'}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? 'Đổi tên gọi và tên viết tắt hiện ở trang tổng quan. Tên hệ thống không đổi được vì gói, eSIM và đơn hàng đang dùng tên này.'
              : 'Chỉ dành cho nhà cung cấp eSIM nội địa nhập bằng file (không có API). Nhà cung cấp kết nối API cần lập trình viên tích hợp, không thêm ở đây.'}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='provider-display-name'>Tên gọi</Label>
            <Input
              id='provider-display-name'
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder='VD: Vietnamobile'
              maxLength={120}
            />
          </div>
          {editing ? (
            <div className='space-y-2'>
              <Label>Tên hệ thống</Label>
              <div className='text-muted-foreground font-mono text-sm'>{row.provider}</div>
            </div>
          ) : (
            <div className='space-y-2'>
              <Label htmlFor='provider-slug'>Tên hệ thống</Label>
              <Input
                id='provider-slug'
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder='VD: vietnamobile'
                maxLength={64}
              />
              <p className='text-muted-foreground text-xs'>
                Chữ thường không dấu, số, &quot;-&quot;. Hệ thống lưu thành{' '}
                <span className='font-mono'>{cleanSlug || 'vietnamobile'}-noidia</span>. Cột
                Provider trong file import eSIM nội địa ghi{' '}
                <span className='font-mono'>{cleanSlug || 'vietnamobile'}</span> và eSIM Type là{' '}
                <span className='font-mono'>Local</span>.
              </p>
              {slug && !slugOk ? (
                <p className='text-destructive text-xs'>Tên hệ thống chưa đúng định dạng.</p>
              ) : null}
            </div>
          )}
          <div className='space-y-2'>
            <Label htmlFor='provider-short-code'>Tên viết tắt (hiện ở trang tổng quan)</Label>
            <Input
              id='provider-short-code'
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value.toUpperCase())}
              placeholder='VD: VNM-ND'
              maxLength={16}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={!canSave || pending} data-testid='provider-form-save'>
            {pending ? <Icons.spinner className='size-4 animate-spin' /> : null}
            {editing ? 'Cập nhật' : 'Thêm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** "+ Thêm nhà cung cấp", above the list. */
export function AddProviderButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} data-testid='provider-add'>
        <Icons.add className='size-4' /> Thêm nhà cung cấp
      </Button>
      {open ? <ProviderFormDialog open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}

function ProviderRow({ row }: { row: ProviderSalesStatus }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const blocker = deleteBlocker(row);
  const remove = useMutation({
    ...deleteProviderMutation,
    onSuccess: () => toast.success(`Đã xoá nhà cung cấp ${providerName(row)}.`),
    onError: (error) => toast.error(error.message || 'Xoá thất bại')
  });

  return (
    <TableRow data-testid={`provider-row-${row.provider}`}>
      <TableCell className='font-medium'>
        {providerName(row)}
        {row.isApi ? (
          <Badge variant='outline' className='ml-2'>
            API
          </Badge>
        ) : null}
      </TableCell>
      <TableCell className='font-mono text-sm'>{row.provider}</TableCell>
      <TableCell className='font-mono text-sm'>{providerCode(row)}</TableCell>
      <TableCell>
        {/* Follows the "Bật/tắt bán" tab. */}
        {row.isEnabled ? (
          <Badge variant='default'>Hoạt động</Badge>
        ) : (
          <Badge variant='destructive'>Không hoạt động</Badge>
        )}
      </TableCell>
      <TableCell className='text-right'>
        <div className='flex justify-end gap-2'>
          <Button size='sm' variant='outline' onClick={() => setEditOpen(true)}>
            Cập nhật
          </Button>
          <Button
            size='sm'
            variant='outline'
            className='text-destructive'
            onClick={() => setDeleteOpen(true)}
            data-testid={`provider-delete-${row.provider}`}
          >
            Xoá
          </Button>
        </div>
        {editOpen ? (
          <ProviderFormDialog row={row} open={editOpen} onOpenChange={setEditOpen} />
        ) : null}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {blocker ? `Không xoá được ${providerName(row)}` : `Xoá ${providerName(row)}?`}
              </AlertDialogTitle>
              <AlertDialogDescription data-testid='provider-delete-reason'>
                {blocker ??
                  'Nhà cung cấp này chưa có gói hay eSIM nào. Xoá sẽ bỏ nó khỏi danh sách; thao tác không hoàn tác được.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{blocker ? 'Đóng' : 'Huỷ'}</AlertDialogCancel>
              {blocker ? null : (
                <AlertDialogAction onClick={() => remove.mutate(row.provider)}>
                  Xoá
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

/**
 * "Danh sách Nhà cung cấp" (vande-1411 #024): name, system name, the code the
 * overview shows, and whether it is on sale (from "Bật/tắt bán").
 */
export function ProviderListTable() {
  const { data } = useSuspenseQuery(providerSalesStatusesQueryOptions());
  const rows = data.data;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách nhà cung cấp</CardTitle>
        <CardDescription>
          Trạng thái theo tab <strong>Bật/tắt bán</strong>. &quot;+ Thêm nhà cung cấp&quot; chỉ dành
          cho nhà cung cấp eSIM nội địa nhập bằng file, không có API. Nhà cung cấp kết nối API hoặc
          đã có gói, eSIM, đơn hàng thì không xoá được, chỉ tắt bán.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên gọi</TableHead>
                <TableHead>Tên hệ thống</TableHead>
                <TableHead>Tên viết tắt</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className='text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='text-muted-foreground py-10 text-center'>
                    Chưa có nhà cung cấp nào.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => <ProviderRow key={row.provider} row={row} />)
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
