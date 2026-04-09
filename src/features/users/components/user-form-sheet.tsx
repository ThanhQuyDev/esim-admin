'use client';

import { useState } from 'react';
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
import { createUserMutation, updateUserMutation } from '../api/mutations';
import type { User, CreateUserPayload, UpdateUserPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormValues,
  type UpdateUserFormValues
} from '../schemas/user';

const API_ROLE_OPTIONS = [
  { value: '1', label: 'Admin' },
  { value: '2', label: 'User' }
];

const API_STATUS_OPTIONS = [
  { value: '1', label: 'Active' },
  { value: '2', label: 'Inactive' }
];

interface UserFormSheetProps {
  user?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserFormSheet({ user, open, onOpenChange }: UserFormSheetProps) {
  const isEdit = !!user;

  if (isEdit) {
    return <EditUserSheet key={user.id} user={user} open={open} onOpenChange={onOpenChange} />;
  }

  return <CreateUserSheet open={open} onOpenChange={onOpenChange} />;
}

function CreateUserSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createMutation = useMutation({
    ...createUserMutation,
    onSuccess: () => {
      toast.success('User created successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => toast.error(error.message || 'Failed to create user')
  });

  const form = useAppForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      roleId: '',
      statusId: '1'
    } as CreateUserFormValues,
    validators: {
      onSubmit: createUserSchema
    },
    onSubmit: async ({ value }) => {
      const payload: CreateUserPayload = {
        email: value.email,
        password: value.password,
        firstName: value.firstName,
        lastName: value.lastName,
        role: { id: Number(value.roleId) },
        status: { id: Number(value.statusId) }
      };
      await createMutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSelectField } = useFormFields<CreateUserFormValues>();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>New User</SheetTitle>
          <SheetDescription>Fill in the details to create a new user.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='user-form-sheet' className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <FormTextField
                  name='firstName'
                  label='First Name'
                  required
                  placeholder='John'
                  validators={{
                    onBlur: z.string().min(2, 'First name must be at least 2 characters')
                  }}
                />
                <FormTextField
                  name='lastName'
                  label='Last Name'
                  required
                  placeholder='Doe'
                  validators={{
                    onBlur: z.string().min(2, 'Last name must be at least 2 characters')
                  }}
                />
              </div>

              <FormTextField
                name='email'
                label='Email'
                required
                type='email'
                placeholder='john@example.com'
                validators={{
                  onBlur: z.string().email('Please enter a valid email')
                }}
              />

              <FormTextField
                name='password'
                label='Password'
                required
                type='password'
                placeholder='Enter password'
                validators={{
                  onBlur: z.string().min(6, 'Password must be at least 6 characters')
                }}
              />

              <FormSelectField
                name='roleId'
                label='Role'
                required
                options={API_ROLE_OPTIONS}
                placeholder='Select role'
                validators={{
                  onBlur: z.string().min(1, 'Please select a role')
                }}
              />

              <FormSelectField
                name='statusId'
                label='Status'
                required
                options={API_STATUS_OPTIONS}
                placeholder='Select status'
                validators={{
                  onBlur: z.string().min(1, 'Please select a status')
                }}
              />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='user-form-sheet' isLoading={createMutation.isPending}>
            <Icons.check /> Create User
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EditUserSheet({
  user,
  open,
  onOpenChange
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useMutation({
    ...updateUserMutation,
    onSuccess: () => {
      toast.success('User updated successfully');
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message || 'Failed to update user')
  });

  const form = useAppForm({
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: String(user.role?.id ?? ''),
      statusId: String(user.status?.id ?? '')
    } as UpdateUserFormValues,
    validators: {
      onSubmit: updateUserSchema
    },
    onSubmit: async ({ value }) => {
      const payload: UpdateUserPayload = {
        email: value.email,
        firstName: value.firstName,
        lastName: value.lastName,
        role: { id: Number(value.roleId) },
        status: { id: Number(value.statusId) }
      };
      await updateMutation.mutateAsync({ id: user.id, values: payload });
    }
  });

  const { FormTextField, FormSelectField } = useFormFields<UpdateUserFormValues>();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Edit User</SheetTitle>
          <SheetDescription>Update the user details below.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='user-form-sheet' className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <FormTextField
                  name='firstName'
                  label='First Name'
                  required
                  placeholder='John'
                  validators={{
                    onBlur: z.string().min(2, 'First name must be at least 2 characters')
                  }}
                />
                <FormTextField
                  name='lastName'
                  label='Last Name'
                  required
                  placeholder='Doe'
                  validators={{
                    onBlur: z.string().min(2, 'Last name must be at least 2 characters')
                  }}
                />
              </div>

              <FormTextField
                name='email'
                label='Email'
                required
                type='email'
                placeholder='john@example.com'
                validators={{
                  onBlur: z.string().email('Please enter a valid email')
                }}
              />

              <FormSelectField
                name='roleId'
                label='Role'
                required
                options={API_ROLE_OPTIONS}
                placeholder='Select role'
                validators={{
                  onBlur: z.string().min(1, 'Please select a role')
                }}
              />

              <FormSelectField
                name='statusId'
                label='Status'
                required
                options={API_STATUS_OPTIONS}
                placeholder='Select status'
                validators={{
                  onBlur: z.string().min(1, 'Please select a status')
                }}
              />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='user-form-sheet' isLoading={updateMutation.isPending}>
            <Icons.check /> Update User
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function UserFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> Add User
      </Button>
      <UserFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
