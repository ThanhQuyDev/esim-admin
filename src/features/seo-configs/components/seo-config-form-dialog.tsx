'use client';

import { useState, useRef } from 'react';
import { useAppForm } from '@/components/ui/tanstack-form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createSeoConfigMutation, updateSeoConfigMutation } from '../api/mutations';
import { getDestinations } from '@/features/destinations/api/service';
import { uploadToCloudinary } from '@/features/destinations/api/service';
import { getRegions } from '@/features/regions/api/service';
import type { SeoConfig, CreateSeoConfigPayload, UpdateSeoConfigPayload } from '../api/types';
import type { Destination } from '@/features/destinations/api/types';
import type { Region } from '@/features/regions/api/types';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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

function ImageUploadField({
  label,
  currentUrl,
  onFileSelect,
  file
}: {
  label: string;
  currentUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  file: File | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : currentUrl;

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium'>{label}</label>
      <div className='flex items-center gap-3'>
        {previewUrl && (
          <div className='relative h-20 w-32 overflow-hidden rounded-lg border-2 border-border/50 shadow-sm'>
            <img src={previewUrl} alt={label} className='h-full w-full object-cover' />
          </div>
        )}
        <Button type='button' variant='outline' size='sm' onClick={() => inputRef.current?.click()}>
          <Icons.upload className='mr-2 h-4 w-4' />
          {previewUrl ? 'Thay đổi' : 'Tải lên'}
        </Button>
        {file && (
          <Button type='button' variant='ghost' size='sm' onClick={() => onFileSelect(null)}>
            <Icons.close className='h-4 w-4' />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(e) => {
          const selected = e.target.files?.[0] ?? null;
          onFileSelect(selected);
          e.target.value = '';
        }}
      />
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
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);

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
      setOgImageFile(null);
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
      ogImage: '',
      ogTitle: '',
      ogDescription: '',
      destinationId: null as number | null,
      regionId: null as number | null,
      planId: null as number | null,
      isActive: true
    },
    onSubmit: async ({ value }) => {
      let ogImageUrl = value.ogImage;

      if (ogImageFile) {
        try {
          ogImageUrl = await uploadToCloudinary(ogImageFile);
        } catch {
          toast.error('Upload ảnh OG thất bại');
          return;
        }
      }

      const payload: CreateSeoConfigPayload = {
        url: value.url,
        metaTitle: value.metaTitle,
        metaDescription: value.metaDescription || undefined,
        metaKeywords: value.metaKeywords || undefined,
        ogImage: ogImageUrl || undefined,
        ogTitle: value.ogTitle || undefined,
        ogDescription: value.ogDescription || undefined,
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

          {/* Destination Selector */}
          {urlSource === 'destination' && (
            <div className='space-y-2'>
              <Label>Điểm đến</Label>
              <Select onValueChange={handleDestinationSelect}>
                <SelectTrigger>
                  <SelectValue placeholder='Chọn điểm đến...' />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((d: Destination) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name} ({d.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Region Selector */}
          {urlSource === 'region' && (
            <div className='space-y-2'>
              <Label>Khu vực</Label>
              <Select onValueChange={handleRegionSelect}>
                <SelectTrigger>
                  <SelectValue placeholder='Chọn khu vực...' />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r: Region) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name} ({r.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          <form.AppField name='ogTitle'>
            {(field) => <field.TextField label='OG Title' placeholder='Open Graph title' />}
          </form.AppField>

          <form.AppField name='ogDescription'>
            {(field) => (
              <field.TextareaField label='OG Description' placeholder='Open Graph description' />
            )}
          </form.AppField>

          <ImageUploadField label='OG Image' onFileSelect={setOgImageFile} file={ogImageFile} />

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
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);

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
      setOgImageFile(null);
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
      ogImage: seoConfig.ogImage || '',
      ogTitle: seoConfig.ogTitle || '',
      ogDescription: seoConfig.ogDescription || '',
      destinationId: seoConfig.destinationId,
      regionId: seoConfig.regionId,
      planId: seoConfig.planId,
      isActive: seoConfig.isActive
    },
    onSubmit: async ({ value }) => {
      let ogImageUrl = value.ogImage;

      if (ogImageFile) {
        try {
          ogImageUrl = await uploadToCloudinary(ogImageFile);
        } catch {
          toast.error('Upload ảnh OG thất bại');
          return;
        }
      }

      const payload: UpdateSeoConfigPayload = {
        url: value.url,
        metaTitle: value.metaTitle,
        metaDescription: value.metaDescription || undefined,
        metaKeywords: value.metaKeywords || undefined,
        ogImage: ogImageUrl || undefined,
        ogTitle: value.ogTitle || undefined,
        ogDescription: value.ogDescription || undefined,
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

          {/* Destination Selector */}
          {urlSource === 'destination' && (
            <div className='space-y-2'>
              <Label>Điểm đến</Label>
              <Select
                onValueChange={handleDestinationSelect}
                defaultValue={seoConfig.destinationId ? String(seoConfig.destinationId) : undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Chọn điểm đến...' />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((d: Destination) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name} ({d.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Region Selector */}
          {urlSource === 'region' && (
            <div className='space-y-2'>
              <Label>Khu vực</Label>
              <Select
                onValueChange={handleRegionSelect}
                defaultValue={seoConfig.regionId ? String(seoConfig.regionId) : undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Chọn khu vực...' />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r: Region) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name} ({r.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          <form.AppField name='ogTitle'>
            {(field) => <field.TextField label='OG Title' placeholder='Open Graph title' />}
          </form.AppField>

          <form.AppField name='ogDescription'>
            {(field) => (
              <field.TextareaField label='OG Description' placeholder='Open Graph description' />
            )}
          </form.AppField>

          <ImageUploadField
            label='OG Image'
            currentUrl={seoConfig.ogImage}
            onFileSelect={setOgImageFile}
            file={ogImageFile}
          />

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
