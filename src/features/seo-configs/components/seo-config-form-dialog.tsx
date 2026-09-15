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
import { SeoTemplateVarsHint } from './seo-template-vars-hint';

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

/**
 * Every page of a paginated list. One page of 200 silently dropped the rest:
 * there are already 218 countries, so some could never be picked (#015).
 */
async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<{ data: T[]; hasNextPage: boolean }>
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; page <= 50; page++) {
    const res = await fetchPage(page);
    all.push(...res.data);
    if (!res.hasNextPage) break;
  }
  return all;
}

type SeoPageEntity = {
  id: number;
  name: string;
  slug: string;
  slugVi?: string | null;
  title?: string | null;
  titleVi?: string | null;
};

/**
 * The storefront URL of a country/region page, as the SEO lookup asks for it:
 * `/{slugVi || slug}` (Vietnamese pages carry no locale prefix). The form used
 * to store `/destinations/…` / `/regions/…`, which no page ever requests, so a
 * config created this way never applied (#015).
 */
function seoPagePath(entity: Pick<SeoPageEntity, 'slug' | 'slugVi'>): string {
  return `/${entity.slugVi || entity.slug}`;
}

/** What an admin recognises: the Vietnamese title, not the supplier's raw name. */
function seoEntityLabel(entity: SeoPageEntity): string {
  return entity.titleVi || entity.title || entity.name;
}

function SearchableSelect<T extends SeoPageEntity>({
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
            <span className='truncate'>
              {selected ? `${seoEntityLabel(selected)} (${seoPagePath(selected)})` : placeholder}
            </span>
            <Icons.chevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-full p-0' align='start'>
          <Command>
            <CommandInput placeholder='Tìm kiếm...' />
            <CommandList>
              <CommandEmpty>Không tìm thấy.</CommandEmpty>
              <CommandGroup>
                {items.map((item) => {
                  const itemLabel = seoEntityLabel(item);
                  return (
                    <CommandItem
                      key={item.id}
                      // The id keeps same-named regions ("South", "Asia") apart;
                      // the keywords let a Vietnamese title or a slug find it.
                      value={String(item.id)}
                      keywords={[
                        item.name,
                        item.title,
                        item.titleVi,
                        item.slug,
                        item.slugVi
                      ].filter((k): k is string => !!k)}
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
                      <span className='flex min-w-0 flex-col'>
                        <span className='truncate'>{itemLabel}</span>
                        <span className='text-muted-foreground truncate text-xs'>
                          {seoPagePath(item)}
                          {itemLabel !== item.name ? ` · ${item.name}` : ''}
                        </span>
                      </span>
                    </CommandItem>
                  );
                })}
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
    queryKey: ['destinations', 'all-pages-for-seo'],
    queryFn: () => fetchAllPages((page) => getDestinations({ page, limit: 200 })),
    enabled: open
  });

  const { data: regionsData } = useQuery({
    queryKey: ['regions', 'all-pages-for-seo'],
    queryFn: () => fetchAllPages((page) => getRegions({ page, limit: 200 })),
    enabled: open
  });

  const destinations = destinationsData ?? [];
  const regions = regionsData ?? [];

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
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      structuredData: '',
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
        ogTitle: value.ogTitle || undefined,
        ogDescription: value.ogDescription || undefined,
        ogImage: value.ogImage || undefined,
        structuredData: value.structuredData || undefined,
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
      form.setFieldValue('url', seoPagePath(dest));
    }
  };

  const handleRegionSelect = (regionId: string) => {
    const id = Number(regionId);
    const region = regions.find((r: Region) => r.id === id);
    if (region) {
      form.setFieldValue('regionId', id);
      form.setFieldValue('destinationId', null);
      form.setFieldValue('url', seoPagePath(region));
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
      className='!max-w-3xl'
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

          <SeoTemplateVarsHint />

          <form.AppField name='metaTitle'>
            {(field) => (
              <field.TextField
                label='Meta Title'
                placeholder='Buy Japan eSIM - Best Plans'
                recommendedLength={60}
                description='Google thường cắt tiêu đề sau khoảng 60 ký tự.'
              />
            )}
          </form.AppField>

          <form.AppField name='metaDescription'>
            {(field) => (
              <field.TextareaField
                label='Meta Description'
                placeholder='Mô tả SEO...'
                recommendedLength={160}
                description='Google thường cắt mô tả sau khoảng 160 ký tự.'
              />
            )}
          </form.AppField>

          <form.AppField name='metaKeywords'>
            {(field) => (
              <field.TextField label='Meta Keywords' placeholder='esim, japan, travel...' />
            )}
          </form.AppField>

          {/* Open Graph — what Facebook / Zalo / X show when the link is shared.
              Stored on the record all along, but the form never exposed them (#048). */}
          <div className='space-y-4 rounded-md border p-3'>
            <div className='space-y-1'>
              <p className='text-sm font-medium'>Thẻ Open Graph (chia sẻ link)</p>
              <p className='text-muted-foreground text-xs'>
                Để trống thì hệ thống tự dùng Meta Title / Meta Description ở trên.
              </p>
            </div>

            <form.AppField name='ogTitle'>
              {(field) => (
                <field.TextField
                  label='OG Title'
                  placeholder='eSIM Nhật Bản - Nhận mã QR ngay'
                  recommendedLength={60}
                />
              )}
            </form.AppField>

            <form.AppField name='ogDescription'>
              {(field) => (
                <field.TextareaField
                  label='OG Description'
                  placeholder='Mô tả hiện khi chia sẻ link...'
                  recommendedLength={160}
                  rows={3}
                />
              )}
            </form.AppField>

            <form.AppField name='ogImage'>
              {(field) => (
                <div className='space-y-2'>
                  <field.TextField
                    label='OG Image (URL)'
                    placeholder='https://cdn.esim.vn/og/japan.jpg'
                    type='url'
                    description='Ảnh hiện kèm link khi chia sẻ. Nên dùng ảnh tỉ lệ 1200×630.'
                  />
                  {field.state.value ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={field.state.value as string}
                      alt='Xem trước ảnh OG'
                      className='h-32 w-auto rounded border object-cover'
                    />
                  ) : null}
                </div>
              )}
            </form.AppField>
          </div>

          <form.AppField name='structuredData'>
            {(field) => (
              <field.TextareaField
                label='Schema / Script (JSON-LD, gtag, Google Ads...)'
                placeholder='<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>'
                rows={12}
                description='Dán được nhiều loại: schema JSON-LD, mã đo lường Google Analytics (gtag.js), mã Google Ads/chuyển đổi. Giữ nguyên thứ tự dán; dòng chú thích <!-- ... --> được bỏ qua. Không cần tự thêm type: chỉ khối JSON mới được gắn application/ld+json, script thường vẫn chạy như script.'
              />
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
    queryKey: ['destinations', 'all-pages-for-seo'],
    queryFn: () => fetchAllPages((page) => getDestinations({ page, limit: 200 })),
    enabled: open
  });

  const { data: regionsData } = useQuery({
    queryKey: ['regions', 'all-pages-for-seo'],
    queryFn: () => fetchAllPages((page) => getRegions({ page, limit: 200 })),
    enabled: open
  });

  const destinations = destinationsData ?? [];
  const regions = regionsData ?? [];

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
      ogTitle: seoConfig.ogTitle || '',
      ogDescription: seoConfig.ogDescription || '',
      ogImage: seoConfig.ogImage || '',
      structuredData: seoConfig.structuredData || '',
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
        ogTitle: value.ogTitle || undefined,
        ogDescription: value.ogDescription || undefined,
        ogImage: value.ogImage || undefined,
        structuredData: value.structuredData || undefined,
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
      form.setFieldValue('url', seoPagePath(dest));
    }
  };

  const handleRegionSelect = (regionId: string) => {
    const id = Number(regionId);
    const region = regions.find((r: Region) => r.id === id);
    if (region) {
      form.setFieldValue('regionId', id);
      form.setFieldValue('destinationId', null);
      form.setFieldValue('url', seoPagePath(region));
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
      className='!max-w-3xl'
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

          <SeoTemplateVarsHint />

          <form.AppField name='metaTitle'>
            {(field) => (
              <field.TextField
                label='Meta Title'
                placeholder='Buy Japan eSIM - Best Plans'
                recommendedLength={60}
                description='Google thường cắt tiêu đề sau khoảng 60 ký tự.'
              />
            )}
          </form.AppField>

          <form.AppField name='metaDescription'>
            {(field) => (
              <field.TextareaField
                label='Meta Description'
                placeholder='Mô tả SEO...'
                recommendedLength={160}
                description='Google thường cắt mô tả sau khoảng 160 ký tự.'
              />
            )}
          </form.AppField>

          <form.AppField name='metaKeywords'>
            {(field) => (
              <field.TextField label='Meta Keywords' placeholder='esim, japan, travel...' />
            )}
          </form.AppField>

          {/* Open Graph — what Facebook / Zalo / X show when the link is shared.
              Stored on the record all along, but the form never exposed them (#048). */}
          <div className='space-y-4 rounded-md border p-3'>
            <div className='space-y-1'>
              <p className='text-sm font-medium'>Thẻ Open Graph (chia sẻ link)</p>
              <p className='text-muted-foreground text-xs'>
                Để trống thì hệ thống tự dùng Meta Title / Meta Description ở trên.
              </p>
            </div>

            <form.AppField name='ogTitle'>
              {(field) => (
                <field.TextField
                  label='OG Title'
                  placeholder='eSIM Nhật Bản - Nhận mã QR ngay'
                  recommendedLength={60}
                />
              )}
            </form.AppField>

            <form.AppField name='ogDescription'>
              {(field) => (
                <field.TextareaField
                  label='OG Description'
                  placeholder='Mô tả hiện khi chia sẻ link...'
                  recommendedLength={160}
                  rows={3}
                />
              )}
            </form.AppField>

            <form.AppField name='ogImage'>
              {(field) => (
                <div className='space-y-2'>
                  <field.TextField
                    label='OG Image (URL)'
                    placeholder='https://cdn.esim.vn/og/japan.jpg'
                    type='url'
                    description='Ảnh hiện kèm link khi chia sẻ. Nên dùng ảnh tỉ lệ 1200×630.'
                  />
                  {field.state.value ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={field.state.value as string}
                      alt='Xem trước ảnh OG'
                      className='h-32 w-auto rounded border object-cover'
                    />
                  ) : null}
                </div>
              )}
            </form.AppField>
          </div>

          <form.AppField name='structuredData'>
            {(field) => (
              <field.TextareaField
                label='Schema / Script (JSON-LD, gtag, Google Ads...)'
                placeholder='<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>'
                rows={12}
                description='Dán được nhiều loại: schema JSON-LD, mã đo lường Google Analytics (gtag.js), mã Google Ads/chuyển đổi. Giữ nguyên thứ tự dán; dòng chú thích <!-- ... --> được bỏ qua. Không cần tự thêm type: chỉ khối JSON mới được gắn application/ld+json, script thường vẫn chạy như script.'
              />
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
