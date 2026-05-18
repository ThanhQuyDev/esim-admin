'use client';

import { useState } from 'react';
import { useAppForm } from '@/components/ui/tanstack-form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createSeoConfigMutation, updateSeoConfigMutation } from '../api/mutations';
import { getDestinations } from '@/features/destinations/api/service';
import { getRegions } from '@/features/regions/api/service';
import type { SeoConfig, CreateSeoConfigPayload, UpdateSeoConfigPayload } from '../api/types';
import type { Destination } from '@/features/destinations/api/types';
import type { Region } from '@/features/regions/api/types';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface SeoConfigFormDialogProps {
  seoConfig?: SeoConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SeoConfigFormDialog({ seoConfig, open, onOpenChange }: SeoConfigFormDialogProps) {
  const isEdit = !!seoConfig;

  return isEdit ? (
    <EditSeoConfigDialog
      key={seoConfig.id}
      seoConfig={seoConfig}
      open={open}
      onOpenChange={onOpenChange}
    />
  ) : (
    <CreateSeoConfigDialog open={open} onOpenChange={onOpenChange} />
  );
}

const FORM_ID = 'seo-config-form-dialog';

function SearchableSelect<T extends { id: number; name: string; slug: string }>({
  label,
  items,
  value,
  onSelect,
  placeholder
}: {
  label: string;
  items: T[];
  value?: number | null;
  onSelect: (id: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => item.id === value);

  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='w-full justify-between'
          >
            {selected ? `${selected.name} (${selected.slug})` : placeholder}
            <Icons.chevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-full p-0' align='start'>
          <Command>
            <CommandInput placeholder='Tìm kiếm...' />
            <CommandList>
              <CommandEmpty>Không tìm thấy.</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => {
                      onSelect(String(item.id));
                      setOpen(false);
                    }}
                  >
                    <Icons.check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === item.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {item.name} ({item.slug})
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function CreateSeoConfigDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [urlSource, setUrlSource] = useState<'manual' | 'destination' | 'region'>('manual');

  const { data: destinationsData } = useQuery({
    queryKey: ['destinations', 'all-for-seo'],
    queryFn: () => getDestinations({ limit: 200 }),
    enabled: open
  });

  const { data: regionsData } = useQuery({
    queryKey: ['regions', 'all-for-seo'],
    queryFn: () => getRegions({ limit: 200 }),
    enabled: open
  });

  const destinations = destinationsData?.data ?? [];
  const regions = regionsData?.data ?? [];

  const mutation = useMutation({
    ...createSeoConfigMutation,
    onSuccess: () => {
      toast.success('Tạo cấu hình SEO thành công');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Tạo cấu hình SEO thất bại');
    }
  });

  const form = useAppForm({
    defaultValues: {
      url: '',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      destinationId: null as number | null,
      regionId: null as number | null,
      planId: null as number | null,
      isActive: true
    },
    onSubmit: async ({ value }) => {
      const payload: CreateSeoConfigPayload = {
        url: value.url,
        metaTitle: value.metaTitle,
        metaDescription: value.metaDescription || undefined,
        metaKeywords: value.metaKeywords || undefined,
        destinationId: value.destinationId,
        regionId: value.regionId,
        planId: value.planId,
        isActive: value.isActive
      };
      mutation.mutate(payload);
    }
  });

  const handleDestinationSelect = (destId: string) => {
    const id = Number(destId);
    const dest = destinations.find((d: Destination) => d.id === id);
    if (dest) {
      form.setFieldValue('destinationId', id);
      form.setFieldValue('regionId', null);
      form.setFieldValue('url', `/destinations/${dest.slug}`);
    }
  };

  const handleRegionSelect = (regionId: string) => {
    const id = Number(regionId);
    const region = regions.find((r: Region) => r.id === id);
    if (region) {
      form.setFieldValue('regionId', id);
      form.setFieldValue('destinationId', null);
      form.setFieldValue('url', `/regions/${region.slug}`);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Tạo cấu hình SEO'
      description='Thêm cấu hình SEO mới cho một trang.'
      formId={FORM_ID}
      isLoading={mutation.isPending}
      submitLabel='Tạo mới'
    >
      <form.AppForm>
        <form.Form id={FORM_ID} className='space-y-4'>
          {/* URL Source Selector */}
          <div className='space-y-2'>
            <Label>Nguồn URL</Label>
            <div className='flex gap-2'>
              <Button
                type='button'
                size='sm'
                variant={urlSource === 'manual' ? 'default' : 'outline'}
                onClick={() => setUrlSource('manual')}
              >
                Nhập thủ công
              </Button>
              <Button
                type='button'
                size='sm'
                variant={urlSource === 'destination' ? 'default' : 'outline'}
                onClick={() => setUrlSource('destination')}
              >
                Chọn Destination
              </Button>
              <Button
                type='button'
                size='sm'
                variant={urlSource === 'region' ? 'default' : 'outline'}
                onClick={() => setUrlSource('region')}
              >
                Chọn Region
              </Button>
            </div>
          </div>

          {/* Destination Selector with Search */}
          {urlSource === 'destination' && (
            <SearchableSelect
              label='Điểm đến'
              items={destinations}
              value={form.getFieldValue('destinationId')}
              onSelect={handleDestinationSelect}
              placeholder='Chọn điểm đến...'
            />
          )}

          {/* Region Selector with Search */}
          {urlSource === 'region' && (
            <SearchableSelect
              label='Khu vực'
              items={regions}
              value={form.getFieldValue('regionId')}
              onSelect={handleRegionSelect}
              placeholder='Chọn khu vực...'
            />
          )}

          <form.AppField name='url'>
            {(field) => <field.TextField label='URL' placeholder='/destinations/japan' />}
          </form.AppField>

          <form.AppField name='metaTitle'>
            {(field) => (
              <field.TextField label='Meta Title' placeholder='Buy Japan eSIM - Best Plans' />
            )}
          </form.AppField>

          <form.AppField name='metaDescription'>
            {(field) => <field.TextareaField label='Meta Description' placeholder='Mô tả SEO...' />}
          </form.AppField>

          <form.AppField name='metaKeywords'>
            {(field) => (
              <field.TextField label='Meta Keywords' placeholder='esim, japan, travel...' />
            )}
          </form.AppField>

          <form.AppField name='isActive'>
            {(field) => <field.SwitchField label='Hoạt động' />}
          </form.AppField>
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

function EditSeoConfigDialog({
  seoConfig,
  open,
  onOpenChange
}: {
  seoConfig: SeoConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [urlSource, setUrlSource] = useState<'manual' | 'destination' | 'region'>('manual');

  const { data: destinationsData } = useQuery({
    queryKey: ['destinations', 'all-for-seo'],
    queryFn: () => getDestinations({ limit: 200 }),
    enabled: open
  });

  const { data: regionsData } = useQuery({
    queryKey: ['regions', 'all-for-seo'],
    queryFn: () => getRegions({ limit: 200 }),
    enabled: open
  });

  const destinations = destinationsData?.data ?? [];
  const regions = regionsData?.data ?? [];

  const mutation = useMutation({
    ...updateSeoConfigMutation,
    onSuccess: () => {
      toast.success('Cập nhật cấu hình SEO thành công');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Cập nhật cấu hình SEO thất bại');
    }
  });

  const form = useAppForm({
    defaultValues: {
      url: seoConfig.url,
      metaTitle: seoConfig.metaTitle,
      metaDescription: seoConfig.metaDescription || '',
      metaKeywords: seoConfig.metaKeywords || '',
      destinationId: seoConfig.destinationId,
      regionId: seoConfig.regionId,
      planId: seoConfig.planId,
      isActive: seoConfig.isActive
    },
    onSubmit: async ({ value }) => {
      const payload: UpdateSeoConfigPayload = {
        url: value.url,
        metaTitle: value.metaTitle,
        metaDescription: value.metaDescription || undefined,
        metaKeywords: value.metaKeywords || undefined,
        destinationId: value.destinationId,
        regionId: value.regionId,
        planId: value.planId,
        isActive: value.isActive
      };
      mutation.mutate({ id: seoConfig.id, values: payload });
    }
  });

  const handleDestinationSelect = (destId: string) => {
    const id = Number(destId);
    const dest = destinations.find((d: Destination) => d.id === id);
    if (dest) {
      form.setFieldValue('destinationId', id);
      form.setFieldValue('regionId', null);
      form.setFieldValue('url', `/destinations/${dest.slug}`);
    }
  };

  const handleRegionSelect = (regionId: string) => {
    const id = Number(regionId);
    const region = regions.find((r: Region) => r.id === id);
    if (region) {
      form.setFieldValue('regionId', id);
      form.setFieldValue('destinationId', null);
      form.setFieldValue('url', `/regions/${region.slug}`);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Cập nhật cấu hình SEO'
      description={`Chỉnh sửa cấu hình SEO cho ${seoConfig.url}`}
      formId={FORM_ID}
      isLoading={mutation.isPending}
      submitLabel='Cập nhật'
    >
      <form.AppForm>
        <form.Form id={FORM_ID} className='space-y-4'>
          {/* URL Source Selector */}
          <div className='space-y-2'>
            <Label>Nguồn URL</Label>
            <div className='flex gap-2'>
              <Button
                type='button'
                size='sm'
                variant={urlSource === 'manual' ? 'default' : 'outline'}
                onClick={() => setUrlSource('manual')}
              >
                Nhập thủ công
              </Button>
              <Button
                type='button'
                size='sm'
                variant={urlSource === 'destination' ? 'default' : 'outline'}
                onClick={() => setUrlSource('destination')}
              >
                Chọn Destination
              </Button>
              <Button
                type='button'
                size='sm'
                variant={urlSource === 'region' ? 'default' : 'outline'}
                onClick={() => setUrlSource('region')}
              >
                Chọn Region
              </Button>
            </div>
          </div>

          {/* Destination Selector with Search */}
          {urlSource === 'destination' && (
            <SearchableSelect
              label='Điểm đến'
              items={destinations}
              value={form.getFieldValue('destinationId')}
              onSelect={handleDestinationSelect}
              placeholder='Chọn điểm đến...'
            />
          )}

          {/* Region Selector with Search */}
          {urlSource === 'region' && (
            <SearchableSelect
              label='Khu vực'
              items={regions}
              value={form.getFieldValue('regionId')}
              onSelect={handleRegionSelect}
              placeholder='Chọn khu vực...'
            />
          )}

          <form.AppField name='url'>
            {(field) => <field.TextField label='URL' placeholder='/destinations/japan' />}
          </form.AppField>

          <form.AppField name='metaTitle'>
            {(field) => (
              <field.TextField label='Meta Title' placeholder='Buy Japan eSIM - Best Plans' />
            )}
          </form.AppField>

          <form.AppField name='metaDescription'>
            {(field) => <field.TextareaField label='Meta Description' placeholder='Mô tả SEO...' />}
          </form.AppField>

          <form.AppField name='metaKeywords'>
            {(field) => (
              <field.TextField label='Meta Keywords' placeholder='esim, japan, travel...' />
            )}
          </form.AppField>

          <form.AppField name='isActive'>
            {(field) => <field.SwitchField label='Hoạt động' />}
          </form.AppField>
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

// Trigger button for creating new SEO config
export function SeoConfigFormDialogTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm cấu hình SEO
      </Button>
      <SeoConfigFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
