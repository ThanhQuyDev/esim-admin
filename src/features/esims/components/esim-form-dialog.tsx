'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createEsimMutation, updateEsimMutation } from '../api/mutations';
import type { Esim, CreateEsimPayload, UpdateEsimPayload } from '../api/types';
import { toast } from 'sonner';

interface EsimFormDialogProps {
  esim?: Esim;
  trigger?: React.ReactNode;
}

const STATUS_OPTIONS = ['available', 'active', 'expired', 'deactivated'];

export function EsimFormDialog({ esim, trigger }: EsimFormDialogProps) {
  const isEdit = !!esim;
  const [open, setOpen] = useState(false);

  const [iccid, setIccid] = useState(esim?.iccid ?? '');
  const [smdpAddress, setSmdpAddress] = useState(esim?.smdpAddress ?? '');
  const [activationCode, setActivationCode] = useState(esim?.activationCode ?? '');
  const [lpa, setLpa] = useState(esim?.lpa ?? '');
  const [matchId, setMatchId] = useState(esim?.matchId ?? '');
  const [apnValue, setApnValue] = useState(esim?.apnValue ?? '');
  const [isRoaming, setIsRoaming] = useState(esim?.isRoaming ?? false);
  const [status, setStatus] = useState(esim?.status ?? 'available');
  const [provider, setProvider] = useState(esim?.provider ?? '');
  const [phoneNumber, setPhoneNumber] = useState(esim?.phoneNumber ?? '');
  const [dataTotal, setDataTotal] = useState(esim?.dataTotal ?? '');

  const createMutation = useMutation({
    ...createEsimMutation,
    onSuccess: () => {
      toast.success('Tạo eSIM thành công');
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Tạo eSIM thất bại');
    }
  });

  const editMutation = useMutation({
    ...updateEsimMutation,
    onSuccess: () => {
      toast.success('Cập nhật eSIM thành công');
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Cập nhật eSIM thất bại');
    }
  });

  const isPending = createMutation.isPending || editMutation.isPending;

  function handleSubmit() {
    if (!iccid.trim()) {
      toast.error('ICCID là bắt buộc');
      return;
    }

    if (isEdit) {
      const values: UpdateEsimPayload = {
        iccid: iccid.trim(),
        smdpAddress: smdpAddress.trim(),
        activationCode: activationCode.trim(),
        lpa: lpa.trim(),
        matchId: matchId.trim(),
        apnValue: apnValue.trim(),
        isRoaming,
        status,
        provider: provider.trim(),
        phoneNumber: phoneNumber.trim(),
        dataTotal: dataTotal.trim()
      };
      editMutation.mutate({ id: esim.id, values });
    } else {
      const data: CreateEsimPayload = {
        iccid: iccid.trim(),
        smdpAddress: smdpAddress.trim(),
        activationCode: activationCode.trim(),
        lpa: lpa.trim(),
        matchId: matchId.trim(),
        apnValue: apnValue.trim(),
        isRoaming,
        status,
        provider: provider.trim(),
        phoneNumber: phoneNumber.trim(),
        dataTotal: dataTotal.trim()
      };
      createMutation.mutate(data);
    }
  }

  function handleOpenChange(v: boolean) {
    if (v && esim) {
      setIccid(esim.iccid ?? '');
      setSmdpAddress(esim.smdpAddress ?? '');
      setActivationCode(esim.activationCode ?? '');
      setLpa(esim.lpa ?? '');
      setMatchId(esim.matchId ?? '');
      setApnValue(esim.apnValue ?? '');
      setIsRoaming(esim.isRoaming ?? false);
      setStatus(esim.status ?? 'available');
      setProvider(esim.provider ?? '');
      setPhoneNumber(esim.phoneNumber ?? '');
      setDataTotal(esim.dataTotal ?? '');
    }
    setOpen(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size='sm'>
            <Icons.add className='mr-2 h-4 w-4' />
            Thêm eSIM
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa eSIM' : 'Thêm eSIM mới'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Cập nhật thông tin eSIM.' : 'Điền thông tin để tạo eSIM mới.'}
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='esim-iccid'>
              ICCID <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='esim-iccid'
              placeholder='Nhập ICCID'
              value={iccid}
              onChange={(e) => setIccid(e.target.value)}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='esim-provider'>Provider</Label>
              <Input
                id='esim-provider'
                placeholder='Nhập provider'
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='esim-status'>Trạng thái</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id='esim-status'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='esim-phone'>Số điện thoại</Label>
              <Input
                id='esim-phone'
                placeholder='Nhập số điện thoại'
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='esim-data-total'>Tổng dữ liệu</Label>
              <Input
                id='esim-data-total'
                placeholder='VD: 5GB'
                value={dataTotal}
                onChange={(e) => setDataTotal(e.target.value)}
              />
            </div>
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='esim-smdp'>SMDP Address</Label>
            <Input
              id='esim-smdp'
              placeholder='Nhập SMDP address'
              value={smdpAddress}
              onChange={(e) => setSmdpAddress(e.target.value)}
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='esim-activation-code'>Activation Code</Label>
            <Input
              id='esim-activation-code'
              placeholder='Nhập activation code'
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value)}
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='esim-lpa'>LPA</Label>
            <Input
              id='esim-lpa'
              placeholder='Nhập LPA'
              value={lpa}
              onChange={(e) => setLpa(e.target.value)}
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='esim-match-id'>Match ID</Label>
            <Input
              id='esim-match-id'
              placeholder='Nhập match ID'
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='esim-apn'>APN Value</Label>
            <Input
              id='esim-apn'
              placeholder='Nhập APN'
              value={apnValue}
              onChange={(e) => setApnValue(e.target.value)}
            />
          </div>

          <div className='flex items-center gap-3'>
            <Switch id='esim-roaming' checked={isRoaming} onCheckedChange={setIsRoaming} />
            <Label htmlFor='esim-roaming'>Roaming</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)} disabled={isPending}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending}>
            {isEdit ? 'Cập nhật' : 'Tạo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
