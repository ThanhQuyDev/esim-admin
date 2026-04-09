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
import { createDestinationMutation, updateDestinationMutation } from '../api/mutations';
import { uploadToCloudinary } from '../api/service';
import type { Destination, CreateDestinationPayload, UpdateDestinationPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  createDestinationSchema,
  updateDestinationSchema,
  type CreateDestinationFormValues,
  type UpdateDestinationFormValues
} from '../schemas/destination';

interface DestinationFormSheetProps {
  destination?: Destination;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DestinationFormSheet({
  destination,
  open,
  onOpenChange
}: DestinationFormSheetProps) {
  const isEdit = !!destination;

  if (isEdit) {
    return (
      <EditDestinationSheet
        key={destination.id}
        destination={destination}
        open={open}
        onOpenChange={onOpenChange}
      />
    );
  }

  return <CreateDestinationSheet open={open} onOpenChange={onOpenChange} />;
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
          <img src={previewUrl} alt={label} className='h-10 w-14 rounded border object-cover' />
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

function CreateDestinationSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [flagFile, setFlagFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const createMutation = useMutation({
    ...createDestinationMutation,
    onSuccess: () => {
      toast.success('Destination created successfully');
      onOpenChange(false);
      form.reset();
      setFlagFile(null);
      setAvatarFile(null);
    },
    onError: (error) => toast.error(error.message || 'Failed to create destination')
  });

  const form = useAppForm({
    defaultValues: {
      name: '',
      countryCode: '',
      slug: '',
      isPopular: false,
      isActive: true,
      description: ''
    } as CreateDestinationFormValues,
    validators: {
      onSubmit: createDestinationSchema
    },
    onSubmit: async ({ value }) => {
      setUploading(true);
      try {
        let flagUrl: string | undefined;
        let avatarUrl: string | undefined;

        if (flagFile) {
          flagUrl = await uploadToCloudinary(flagFile);
        }
        if (avatarFile) {
          avatarUrl = await uploadToCloudinary(avatarFile);
        }

        const payload: CreateDestinationPayload = {
          name: value.name,
          countryCode: value.countryCode,
          ...(value.slug && { slug: value.slug }),
          ...(flagUrl && { flagUrl }),
          ...(avatarUrl && { avatarUrl }),
          isPopular: value.isPopular ?? false,
          isActive: value.isActive ?? true,
          ...(value.description && { description: value.description })
        };

        await createMutation.mutateAsync(payload);
      } catch {
        toast.error('Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  });

  const { FormTextField, FormSwitchField, FormTextareaField } =
    useFormFields<CreateDestinationFormValues>();

  const isPending = createMutation.isPending || uploading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>New Destination</SheetTitle>
          <SheetDescription>Fill in the details to create a new destination.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='destination-form-sheet' className='space-y-4'>
              <FormTextField
                name='name'
                label='Name'
                required
                placeholder='France'
                validators={{
                  onBlur: z.string().min(2, 'Name must be at least 2 characters')
                }}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormTextField
                  name='countryCode'
                  label='Country Code'
                  required
                  placeholder='FR'
                  validators={{
                    onBlur: z
                      .string()
                      .min(2, 'Must be 2-3 characters')
                      .max(3, 'Must be 2-3 characters')
                  }}
                />
                <FormTextField name='slug' label='Slug' placeholder='france' />
              </div>

              <ImageUploadField label='Flag Image' onFileSelect={setFlagFile} file={flagFile} />

              <ImageUploadField
                label='Avatar Image'
                onFileSelect={setAvatarFile}
                file={avatarFile}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormSwitchField name='isPopular' label='Popular' />
                <FormSwitchField name='isActive' label='Active' />
              </div>

              <FormTextareaField
                name='description'
                label='Description'
                placeholder='Optional description...'
              />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='destination-form-sheet' isLoading={isPending}>
            <Icons.check /> Create
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EditDestinationSheet({
  destination,
  open,
  onOpenChange
}: {
  destination: Destination;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [flagFile, setFlagFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const updateMutation = useMutation({
    ...updateDestinationMutation,
    onSuccess: () => {
      toast.success('Destination updated successfully');
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message || 'Failed to update destination')
  });

  const form = useAppForm({
    defaultValues: {
      name: destination.name,
      countryCode: destination.countryCode,
      slug: destination.slug ?? '',
      isPopular: destination.isPopular,
      isActive: destination.isActive,
      description: destination.description ?? ''
    } as UpdateDestinationFormValues,
    validators: {
      onSubmit: updateDestinationSchema
    },
    onSubmit: async ({ value }) => {
      setUploading(true);
      try {
        let flagUrl: string | undefined;
        let avatarUrl: string | undefined;

        if (flagFile) {
          flagUrl = await uploadToCloudinary(flagFile);
        }
        if (avatarFile) {
          avatarUrl = await uploadToCloudinary(avatarFile);
        }

        const payload: UpdateDestinationPayload = {
          name: value.name,
          countryCode: value.countryCode,
          slug: value.slug || undefined,
          ...(flagUrl && { flagUrl }),
          ...(avatarUrl && { avatarUrl }),
          isPopular: value.isPopular,
          isActive: value.isActive,
          description: value.description || undefined
        };

        await updateMutation.mutateAsync({
          id: destination.id,
          values: payload
        });
      } catch {
        toast.error('Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  });

  const { FormTextField, FormSwitchField, FormTextareaField } =
    useFormFields<UpdateDestinationFormValues>();

  const isPending = updateMutation.isPending || uploading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Edit Destination</SheetTitle>
          <SheetDescription>Update the destination details below.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='destination-form-sheet' className='space-y-4'>
              <FormTextField
                name='name'
                label='Name'
                required
                placeholder='France'
                validators={{
                  onBlur: z.string().min(2, 'Name must be at least 2 characters')
                }}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormTextField
                  name='countryCode'
                  label='Country Code'
                  required
                  placeholder='FR'
                  validators={{
                    onBlur: z
                      .string()
                      .min(2, 'Must be 2-3 characters')
                      .max(3, 'Must be 2-3 characters')
                  }}
                />
                <FormTextField name='slug' label='Slug' placeholder='france' />
              </div>

              <ImageUploadField
                label='Flag Image'
                currentUrl={destination.flagUrl}
                onFileSelect={setFlagFile}
                file={flagFile}
              />

              <ImageUploadField
                label='Avatar Image'
                currentUrl={destination.avatarUrl}
                onFileSelect={setAvatarFile}
                file={avatarFile}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormSwitchField name='isPopular' label='Popular' />
                <FormSwitchField name='isActive' label='Active' />
              </div>

              <FormTextareaField
                name='description'
                label='Description'
                placeholder='Optional description...'
              />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='destination-form-sheet' isLoading={isPending}>
            <Icons.check /> Update
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function DestinationFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Add Destination
      </Button>
      <DestinationFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
