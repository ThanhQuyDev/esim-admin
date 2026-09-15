'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormDialog } from '@/components/ui/form-dialog';
import { Icons } from '@/components/icons';
import {
  saveSupportedDeviceOrderingMutation,
  supportedDeviceKeys,
  supportedDeviceOrderingQueryOptions
} from '../api/queries';
import {
  buildOrderingChanges,
  filterBrands,
  parsePosition,
  type OrderingDrafts
} from '../utils/ordering';

const TYPE_LABELS: Record<string, string> = {
  'Smart Phones': 'Điện thoại',
  'Smart Watches': 'Đồng hồ',
  Tablets: 'Máy tính bảng',
  Laptops: 'Laptop'
};

/** 0 = not numbered, shown as an empty box. */
function positionText(position: number): string {
  return position ? String(position) : '';
}

const FORM_ID = 'supported-device-ordering-form';

/**
 * Order the supported-devices list brand by brand (#047).
 *
 * 340 devices in one list were too hard to order. A brand's position is set
 * once here and applies to all its models; opening a brand lists just its
 * models to position inside it. New models added later take their brand's
 * position automatically.
 */
export function SupportedDeviceOrderingDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const {
    data: brands = [],
    isLoading,
    isError
  } = useQuery({ ...supportedDeviceOrderingQueryOptions(), enabled: open });

  const [brandDrafts, setBrandDrafts] = useState<OrderingDrafts>({});
  const [deviceDrafts, setDeviceDrafts] = useState<OrderingDrafts>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const visibleBrands = useMemo(() => filterBrands(brands, search), [brands, search]);
  const changes = useMemo(
    () => buildOrderingChanges(brands, brandDrafts, deviceDrafts),
    [brands, brandDrafts, deviceDrafts]
  );

  const reset = () => {
    setBrandDrafts({});
    setDeviceDrafts({});
    setExpanded(null);
    setSearch('');
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const mutation = useMutation({
    ...saveSupportedDeviceOrderingMutation,
    onSuccess: (fresh, payload) => {
      const saved = (payload.manufacturers?.length ?? 0) + (payload.devices?.length ?? 0);
      queryClient.setQueryData(supportedDeviceKeys.ordering(), fresh);
      queryClient.invalidateQueries({ queryKey: supportedDeviceKeys.all });
      toast.success(`Đã lưu ${saved} thay đổi thứ tự`);
      handleOpenChange(false);
    },
    onError: (error) => toast.error(error.message || 'Lưu thứ tự thất bại')
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (changes.invalid.length > 0) {
      toast.error(
        `Thứ tự phải là số nguyên từ 0 trở lên: ${changes.invalid.slice(0, 3).join(', ')}`
      );
      return;
    }
    if (changes.changeCount === 0) {
      toast.info('Chưa có thay đổi nào để lưu');
      return;
    }
    mutation.mutate(changes.payload);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title='Sắp xếp thứ tự hiển thị'
      description='Đặt thứ tự cho từng hãng một lần, rồi mở hãng để xếp các model bên trong. Ô trống = xếp sau các mục đã đánh số (theo A–Z).'
      formId={FORM_ID}
      isLoading={mutation.isPending}
      submitLabel={changes.changeCount > 0 ? `Lưu ${changes.changeCount} thay đổi` : 'Lưu thứ tự'}
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className='space-y-4'>
        <div className='relative'>
          <Icons.search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Tìm hãng hoặc model...'
            className='pl-9'
            aria-label='Tìm hãng hoặc model'
          />
        </div>

        {isLoading ? (
          <p className='text-muted-foreground text-sm'>Đang tải danh sách thiết bị...</p>
        ) : isError ? (
          <p className='text-destructive text-sm'>Không tải được danh sách thiết bị.</p>
        ) : visibleBrands.length === 0 ? (
          <p className='text-muted-foreground text-sm'>Không tìm thấy hãng nào.</p>
        ) : (
          <ul className='divide-y rounded-lg border'>
            {visibleBrands.map((brand) => {
              const isOpen = expanded === brand.manufacturer;
              const brandValue =
                brandDrafts[brand.manufacturer] ?? positionText(brand.manufacturerOrder);
              return (
                <li key={brand.manufacturer} data-testid='ordering-brand'>
                  <div className='flex items-center gap-3 px-3 py-2'>
                    <button
                      type='button'
                      onClick={() => setExpanded(isOpen ? null : brand.manufacturer)}
                      className='flex min-w-0 flex-1 items-center gap-2 text-left'
                      aria-expanded={isOpen}
                    >
                      {isOpen ? (
                        <Icons.chevronDown className='h-4 w-4 shrink-0' />
                      ) : (
                        <Icons.chevronRight className='h-4 w-4 shrink-0' />
                      )}
                      <span className='truncate font-medium'>{brand.manufacturer}</span>
                      <span className='text-muted-foreground shrink-0 text-xs'>
                        {brand.devices.length} thiết bị
                      </span>
                    </button>
                    <span className='text-muted-foreground hidden text-xs sm:inline'>
                      Thứ tự hãng
                    </span>
                    <Input
                      type='number'
                      min={0}
                      step={1}
                      inputMode='numeric'
                      placeholder='—'
                      className='h-8 w-20'
                      aria-label={`Thứ tự hãng ${brand.manufacturer}`}
                      aria-invalid={parsePosition(brandValue) === null}
                      value={brandValue}
                      onChange={(event) =>
                        setBrandDrafts((drafts) => ({
                          ...drafts,
                          [brand.manufacturer]: event.target.value
                        }))
                      }
                    />
                  </div>

                  {isOpen && (
                    <ul className='bg-muted/30 space-y-1 border-t py-2 pr-3 pl-9'>
                      {brand.devices.map((device) => {
                        const deviceValue =
                          deviceDrafts[device.id] ?? positionText(device.sortOrder);
                        return (
                          <li key={device.id} className='flex items-center gap-3'>
                            <span className='min-w-0 flex-1 truncate text-sm'>{device.device}</span>
                            <span className='text-muted-foreground shrink-0 text-xs'>
                              {TYPE_LABELS[device.type] ?? device.type}
                            </span>
                            <Input
                              type='number'
                              min={0}
                              step={1}
                              inputMode='numeric'
                              placeholder='—'
                              className='h-8 w-20'
                              aria-label={`Thứ tự ${device.device}`}
                              aria-invalid={parsePosition(deviceValue) === null}
                              value={deviceValue}
                              onChange={(event) =>
                                setDeviceDrafts((drafts) => ({
                                  ...drafts,
                                  [device.id]: event.target.value
                                }))
                              }
                            />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </form>
    </FormDialog>
  );
}

export function SupportedDeviceOrderingTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant='outline' size='sm' onClick={() => setOpen(true)}>
        <Icons.chevronsUpDown className='mr-2 h-4 w-4' /> Sắp xếp thứ tự
      </Button>
      <SupportedDeviceOrderingDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
