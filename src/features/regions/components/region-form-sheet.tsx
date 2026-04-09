'use client';

import { useState, useRef } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createRegionMutation, updateRegionMutation } from '../api/mutations';
import { uploadToCloudinary } from '../api/service';
import type { Region, CreateRegionPayload, UpdateRegionPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  createRegionSchema,
  updateRegionSchema,
  type CreateRegionFormValues,
  type UpdateRegionFormValues
} from '../schemas/region';

interface RegionFormSheetProps {
  region?: Region;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegionFormSheet({ region, open, onOpenChange }: RegionFormSheetProps) {
  const isEdit = !!region;

  if (isEdit) {
    return (
      <EditRegionSheet key={region.id} region={region} open={open} onOpenChange={onOpenChange} />
    );
  }

  return <CreateRegionSheet open={open} onOpenChange={onOpenChange} />;
}

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
          <img
            src={previewUrl}
            alt={label}
            className='h-10 w-10 rounded-full border object-cover'
          />
        )}
        <Button type='button' variant='outline' size='sm' onClick={() => inputRef.current?.click()}>
          <Icons.upload className='mr-2 h-4 w-4' />
          {previewUrl ? 'Change' : 'Upload'}
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

function CreateRegionSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const createMutation = useMutation({
    ...createRegionMutation,
    onSuccess: () => {
      toast.success('Region created successfully');
      onOpenChange(false);
      form.reset();
      setAvatarFile(null);
    },
    onError: (error) => toast.error(error.message || 'Failed to create region')
  });

  const form = useAppForm({
    defaultValues: {
      name: '',
      slug: '',
      isActive: true
    } as CreateRegionFormValues,
    validators: {
      onSubmit: createRegionSchema
    },
    onSubmit: async ({ value }) => {
      setUploading(true);
      try {
        let avatarUrl: string | undefined;

        if (avatarFile) {
          avatarUrl = await uploadToCloudinary(avatarFile);
        }

        const payload: CreateRegionPayload = {
          name: value.name,
          ...(value.slug && { slug: value.slug }),
          ...(avatarUrl && { avatarUrl }),
          isActive: value.isActive ?? true
        };

        await createMutation.mutateAsync(payload);
      } catch {
        toast.error('Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  });

  const { FormTextField, FormSwitchField } = useFormFields<CreateRegionFormValues>();

  const isPending = createMutation.isPending || uploading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>New Region</SheetTitle>
          <SheetDescription>Fill in the details to create a new region.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='region-form-sheet' className='space-y-4'>
              <FormTextField
                name='name'
                label='Name'
                required
                placeholder='European Union'
                validators={{
                  onBlur: z.string().min(2, 'Name must be at least 2 characters')
                }}
              />

              <FormTextField name='slug' label='Slug' placeholder='european-union' />

              <ImageUploadField
                label='Avatar Image'
                onFileSelect={setAvatarFile}
                file={avatarFile}
              />

              <FormSwitchField name='isActive' label='Active' />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='region-form-sheet' isLoading={isPending}>
            <Icons.check /> Create
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EditRegionSheet({
  region,
  open,
  onOpenChange
}: {
  region: Region;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const updateMutation = useMutation({
    ...updateRegionMutation,
    onSuccess: () => {
      toast.success('Region updated successfully');
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message || 'Failed to update region')
  });

  const form = useAppForm({
    defaultValues: {
      name: region.name,
      slug: region.slug ?? '',
      isActive: region.isActive
    } as UpdateRegionFormValues,
    validators: {
      onSubmit: updateRegionSchema
    },
    onSubmit: async ({ value }) => {
      setUploading(true);
      try {
        let avatarUrl: string | undefined;

        if (avatarFile) {
          avatarUrl = await uploadToCloudinary(avatarFile);
        }

        const payload: UpdateRegionPayload = {
          name: value.name,
          slug: value.slug || undefined,
          ...(avatarUrl && { avatarUrl }),
          isActive: value.isActive
        };

        await updateMutation.mutateAsync({
          id: region.id,
          values: payload
        });
      } catch {
        toast.error('Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  });

  const { FormTextField, FormSwitchField } = useFormFields<UpdateRegionFormValues>();

  const isPending = updateMutation.isPending || uploading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Edit Region</SheetTitle>
          <SheetDescription>Update the region details below.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='region-form-sheet' className='space-y-4'>
              <FormTextField
                name='name'
                label='Name'
                required
                placeholder='European Union'
                validators={{
                  onBlur: z.string().min(2, 'Name must be at least 2 characters')
                }}
              />

              <FormTextField name='slug' label='Slug' placeholder='european-union' />

              <ImageUploadField
                label='Avatar Image'
                currentUrl={region.avatarUrl}
                onFileSelect={setAvatarFile}
                file={avatarFile}
              />

              <FormSwitchField name='isActive' label='Active' />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='region-form-sheet' isLoading={isPending}>
            <Icons.check /> Update
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function RegionFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Add Region
      </Button>
      <RegionFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
