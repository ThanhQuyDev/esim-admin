'use client';

import { useState } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { useTierLabels } from '@/features/membership-tiers/hooks/use-tier-labels';
import { createUserMutation, updateUserMutation } from '../api/mutations';
import type { User, CreateUserPayload, UpdateUserPayload } from '../api/types';
import { toast } from 'sonner';
import {
  AUTHOR_DESCRIPTION_MAX_LENGTH,
  AuthorAvatarField,
  authorProfilePayload,
  describeUserSaveError
} from './author-profile-fields';
import { formatVnd } from '@/lib/format';
import { updateReferralCode } from '@/features/wallets/api/service';
import * as z from 'zod';
import {
  createUserSchema,
  updateUserSchema,
  phoneNumberSchema,
  adminReferralCodeSchema,
  type CreateUserFormValues,
  type UpdateUserFormValues,
  EXTRA_ROLE_OPTIONS,
  extraRoleIdsPayload,
  writesArticles
} from '../schemas/user';
import { Checkbox } from '@/components/ui/checkbox';

const API_ROLE_OPTIONS = [
  { value: '1', label: 'Admin' },
  { value: '2', label: 'User' },
  // Role 3 exists in the backend and has its own tab in this list, but was
  // never selectable here — so no author could be created (#059).
  { value: '3', label: 'Tác giả' }
];

/** "Vai trò thêm" — roles on top of the main one (vande #071). */
function ExtraRolesField({
  mainRoleId,
  value,
  onChange
}: {
  mainRoleId: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const options = EXTRA_ROLE_OPTIONS.filter((option) => option.value !== mainRoleId);
  if (!mainRoleId || options.length === 0) return null;
  return (
    <div className='space-y-2' data-testid='extra-roles'>
      <p className='text-sm font-medium'>Vai trò thêm</p>
      <p className='text-muted-foreground text-xs'>
        Tích thêm nếu người này cần làm nhiều việc — ví dụ admin cũng viết bài, hoặc dùng để mua thử
        ngoài web.
      </p>
      <div className='flex flex-wrap gap-3'>
        {options.map((option) => {
          const checked = value.includes(option.value);
          return (
            <div
              key={option.value}
              className='hover:bg-muted flex items-start gap-2 rounded-md border px-3 py-2'
            >
              <Checkbox
                id={`extra-role-${option.value}`}
                checked={checked}
                data-testid={`extra-role-${option.value}`}
                onCheckedChange={(next) =>
                  onChange(
                    next
                      ? [...value.filter((id) => id !== option.value), option.value]
                      : value.filter((id) => id !== option.value)
                  )
                }
              />
              <label htmlFor={`extra-role-${option.value}`} className='cursor-pointer'>
                <span className='block text-sm font-medium'>{option.label}</span>
                <span className='text-muted-foreground block text-xs'>{option.hint}</span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const API_STATUS_OPTIONS = [
  { value: '1', label: 'Hoạt động' },
  { value: '2', label: 'Không hoạt động' }
];

interface UserFormDialogProps {
  user?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserFormDialog({ user, open, onOpenChange }: UserFormDialogProps) {
  const isEdit = !!user;

  if (isEdit) {
    return <EditUserDialog key={user.id} user={user} open={open} onOpenChange={onOpenChange} />;
  }

  return <CreateUserDialog open={open} onOpenChange={onOpenChange} />;
}

function CreateUserDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createMutation = useMutation({
    ...createUserMutation,
    onSuccess: () => {
      toast.success('Tạo người dùng thành công');
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => toast.error(describeUserSaveError(error, 'Tạo người dùng thất bại'))
  });

  const form = useAppForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      roleId: '',
      extraRoleIds: [],
      statusId: '1',
      authorName: '',
      authorNameEn: '',
      authorSlug: '',
      authorAvatar: '',
      authorDescription: '',
      authorDescriptionEn: ''
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
        phoneNumber: value.phoneNumber.trim() || null,
        role: { id: Number(value.roleId) },
        extraRoleIds: extraRoleIdsPayload(value),
        status: { id: Number(value.statusId) },
        ...(writesArticles(value) ? { authorProfile: authorProfilePayload(value) } : {})
      };
      await createMutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } =
    useFormFields<CreateUserFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Người dùng mới'
      description='Điền thông tin để tạo người dùng mới trong hệ thống'
      formId='user-form-dialog'
      isLoading={createMutation.isPending}
      submitLabel='Tạo người dùng'
      metaInfo={
        <>
          <Icons.user className='h-4 w-4' />
          <span>Quản lý người dùng</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='user-form-dialog' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormTextField
              name='firstName'
              label='Họ'
              required
              placeholder='Nguyễn'
              validators={{
                onBlur: z.string().min(2, 'Họ phải có ít nhất 2 ký tự')
              }}
            />
            <FormTextField
              name='lastName'
              label='Tên'
              required
              placeholder='Văn A'
              validators={{
                onBlur: z.string().min(2, 'Tên phải có ít nhất 2 ký tự')
              }}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormTextField
              name='email'
              label='Email'
              required
              type='email'
              placeholder='nguyen@example.com'
              validators={{
                onBlur: z.string().email('Vui lòng nhập email hợp lệ')
              }}
            />
            <FormTextField
              name='phoneNumber'
              label='Số điện thoại'
              type='tel'
              placeholder='0901234567'
              validators={{ onBlur: phoneNumberSchema }}
            />
          </div>

          <FormTextField
            name='password'
            label='Mật khẩu'
            required
            type='password'
            placeholder='Nhập mật khẩu'
            validators={{
              onBlur: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
            }}
          />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormSelectField
              name='roleId'
              label='Vai trò'
              required
              options={API_ROLE_OPTIONS}
              placeholder='Chọn vai trò'
              validators={{
                onBlur: z.string().min(1, 'Vui lòng chọn vai trò')
              }}
            />

            <FormSelectField
              name='statusId'
              label='Trạng thái'
              required
              options={API_STATUS_OPTIONS}
              placeholder='Chọn trạng thái'
              validators={{
                onBlur: z.string().min(1, 'Vui lòng chọn trạng thái')
              }}
            />
          </div>

          {/* "Vai trò thêm" (vande #071): an admin who also writes, an author
              who also buys on the storefront. */}
          <form.Subscribe selector={(state) => state.values.roleId}>
            {(roleId) => (
              <form.Field name='extraRoleIds'>
                {(field) => (
                  <ExtraRolesField
                    mainRoleId={roleId}
                    value={field.state.value}
                    onChange={(next) => field.handleChange(next)}
                  />
                )}
              </form.Field>
            )}
          </form.Subscribe>

          {/* Author profile — required by the API for the Tác giả role (#059),
              main or ticked on top (vande #071). */}
          <form.Subscribe selector={(state) => writesArticles(state.values)}>
            {(writes) =>
              writes ? (
                <div className='space-y-4 rounded-md border p-4'>
                  <p className='text-sm font-medium'>Thông tin tác giả</p>
                  <p className='text-muted-foreground text-xs'>
                    Hiện ở phần tác giả cuối mỗi bài viết; bấm vào tên tác giả sẽ ra trang tổng hợp
                    bài viết của người này.
                  </p>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormTextField
                      name='authorName'
                      label='Tên tác giả (Tiếng Việt)'
                      required
                      placeholder='Nguyễn Văn A'
                    />
                    <FormTextField
                      name='authorNameEn'
                      label='Tên tác giả (English)'
                      placeholder='Nguyen Van A'
                      description='Để trống sẽ dùng tên tiếng Việt.'
                    />
                  </div>

                  <FormTextField
                    name='authorSlug'
                    label='Slug tác giả'
                    required
                    placeholder='nguyen-van-a'
                    description='Dùng cho địa chỉ trang tác giả. Để trống sẽ tự tạo từ tên.'
                  />

                  <form.Field name='authorAvatar'>
                    {(field) => (
                      <AuthorAvatarField
                        value={field.state.value as string}
                        onChange={(url) => field.handleChange(url)}
                      />
                    )}
                  </form.Field>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormTextareaField
                      name='authorDescription'
                      label='Nội dung tóm tắt (Tiếng Việt)'
                      placeholder='Giới thiệu ngắn về tác giả...'
                      rows={6}
                      maxLength={AUTHOR_DESCRIPTION_MAX_LENGTH}
                    />
                    <FormTextareaField
                      name='authorDescriptionEn'
                      label='Nội dung tóm tắt (English)'
                      placeholder='A short introduction to the author...'
                      rows={6}
                      maxLength={AUTHOR_DESCRIPTION_MAX_LENGTH}
                      description='Để trống sẽ dùng tóm tắt tiếng Việt.'
                    />
                  </div>
                </div>
              ) : null
            }
          </form.Subscribe>
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

function EditUserDialog({
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
      toast.success('Cập nhật người dùng thành công');
      onOpenChange(false);
    },
    onError: (error) => toast.error(describeUserSaveError(error, 'Cập nhật người dùng thất bại'))
  });

  // The ladder as the admin set it, so a tier added in "Hạng khách hàng" can
  // be given by hand too (vande #066).
  const tierLabels = useTierLabels();
  const tierOptions = [
    { value: 'auto', label: 'Tự động theo chi tiêu' },
    ...tierLabels.options,
    // A customer held on a tier that has since gone keeps it selectable.
    ...(user.tierOverride && !tierLabels.options.some((o) => o.value === user.tierOverride)
      ? [{ value: user.tierOverride, label: tierLabels.label(user.tierOverride) }]
      : [])
  ];

  const form = useAppForm({
    defaultValues: {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email,
      phoneNumber: user.phoneNumber ?? '',
      referralCode: user.referralCode ?? '',
      roleId: String(user.role?.id ?? ''),
      extraRoleIds: (user.extraRoleIds ?? []).map(String),
      statusId: String(user.status?.id ?? ''),
      tierOverride: user.tierOverride ?? 'auto',
      tierOverrideReason: user.tierOverrideReason ?? '',
      authorName: user.authorProfile?.name ?? '',
      authorNameEn: user.authorProfile?.nameEn ?? '',
      authorSlug: user.authorProfile?.slug ?? '',
      authorAvatar: user.authorProfile?.avatar ?? '',
      authorDescription: user.authorProfile?.description ?? '',
      authorDescriptionEn: user.authorProfile?.descriptionEn ?? ''
    } as UpdateUserFormValues,
    validators: {
      onSubmit: updateUserSchema
    },
    onSubmit: async ({ value }) => {
      // The referral code lives on the wallet side; save it first so a taken
      // code stops the save instead of half-applying the form (#026).
      const referralCode = value.referralCode.trim().toUpperCase();
      if (referralCode && referralCode !== (user.referralCode ?? '').toUpperCase()) {
        try {
          await updateReferralCode(user.id, referralCode);
        } catch (error) {
          toast.error(describeUserSaveError(error as Error, 'Cập nhật mã giới thiệu thất bại'));
          return;
        }
      }

      const payload: UpdateUserPayload = {
        email: value.email,
        firstName: value.firstName.trim() || null,
        lastName: value.lastName.trim() || null,
        phoneNumber: value.phoneNumber.trim() || null,
        tierOverride: value.tierOverride === 'auto' ? null : value.tierOverride,
        tierOverrideReason: value.tierOverride === 'auto' ? null : value.tierOverrideReason.trim(),
        role: { id: Number(value.roleId) },
        extraRoleIds: extraRoleIdsPayload(value),
        status: { id: Number(value.statusId) },
        ...(writesArticles(value) ? { authorProfile: authorProfilePayload(value) } : {})
      };
      await updateMutation.mutateAsync({ id: user.id, values: payload });
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } =
    useFormFields<UpdateUserFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Chỉnh sửa người dùng'
      description='Cập nhật thông tin người dùng trong hệ thống'
      formId='user-form-dialog'
      isLoading={updateMutation.isPending}
      submitLabel='Cập nhật người dùng'
      metaInfo={
        <>
          <Icons.edit className='h-4 w-4' />
          <span>ID: {user.id}</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='user-form-dialog' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormTextField name='firstName' label='Họ' placeholder='Nguyễn' />
            <FormTextField name='lastName' label='Tên' placeholder='Văn A' />
          </div>

          <FormTextField
            name='referralCode'
            label='Mã giới thiệu'
            placeholder='VD: VIP2026'
            validators={{ onBlur: adminReferralCodeSchema }}
            description='Admin được đặt mã 3–50 ký tự chữ hoặc số (khách tự đổi phải đủ 10 ký tự). Mã được lưu chữ in hoa.'
          />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormTextField
              name='email'
              label='Email'
              required
              type='email'
              placeholder='nguyen@example.com'
              validators={{
                onBlur: z.string().email('Vui lòng nhập email hợp lệ')
              }}
            />
            <FormTextField
              name='phoneNumber'
              label='Số điện thoại'
              type='tel'
              placeholder='0901234567'
              validators={{ onBlur: phoneNumberSchema }}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormSelectField
              name='roleId'
              label='Vai trò'
              required
              options={API_ROLE_OPTIONS}
              placeholder='Chọn vai trò'
              validators={{
                onBlur: z.string().min(1, 'Vui lòng chọn vai trò')
              }}
            />

            <FormSelectField
              name='statusId'
              label='Trạng thái'
              required
              options={API_STATUS_OPTIONS}
              placeholder='Chọn trạng thái'
              validators={{
                onBlur: z.string().min(1, 'Vui lòng chọn trạng thái')
              }}
            />
          </div>

          <div className='rounded-xl border bg-muted/40 p-4'>
            <p className='text-sm font-medium'>
              Hạng tự động: {tierLabels.label(user.automaticTier)}
            </p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Tổng chi tiêu: {formatVnd(user.lifetimeSpendVnd)}
            </p>
          </div>

          <FormSelectField
            name='tierOverride'
            label='Hạng thành viên'
            options={tierOptions}
            description='Hạng thủ công thay thế toàn bộ quyền lợi tự động.'
          />

          <form.Subscribe selector={(state) => state.values.tierOverride}>
            {(tierOverride) =>
              tierOverride !== 'auto' ? (
                <FormTextareaField
                  name='tierOverrideReason'
                  label='Lý do điều chỉnh'
                  required
                  placeholder='Nhập lý do điều chỉnh hạng thành viên...'
                  maxLength={500}
                />
              ) : null
            }
          </form.Subscribe>

          {/* "Vai trò thêm" (vande #071): an admin who also writes, an author
              who also buys on the storefront. */}
          <form.Subscribe selector={(state) => state.values.roleId}>
            {(roleId) => (
              <form.Field name='extraRoleIds'>
                {(field) => (
                  <ExtraRolesField
                    mainRoleId={roleId}
                    value={field.state.value}
                    onChange={(next) => field.handleChange(next)}
                  />
                )}
              </form.Field>
            )}
          </form.Subscribe>

          {/* Author profile — required by the API for the Tác giả role (#059),
              main or ticked on top (vande #071). */}
          <form.Subscribe selector={(state) => writesArticles(state.values)}>
            {(writes) =>
              writes ? (
                <div className='space-y-4 rounded-md border p-4'>
                  <p className='text-sm font-medium'>Thông tin tác giả</p>
                  <p className='text-muted-foreground text-xs'>
                    Hiện ở phần tác giả cuối mỗi bài viết; bấm vào tên tác giả sẽ ra trang tổng hợp
                    bài viết của người này.
                  </p>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormTextField
                      name='authorName'
                      label='Tên tác giả (Tiếng Việt)'
                      required
                      placeholder='Nguyễn Văn A'
                    />
                    <FormTextField
                      name='authorNameEn'
                      label='Tên tác giả (English)'
                      placeholder='Nguyen Van A'
                      description='Để trống sẽ dùng tên tiếng Việt.'
                    />
                  </div>

                  <FormTextField
                    name='authorSlug'
                    label='Slug tác giả'
                    required
                    placeholder='nguyen-van-a'
                    description='Dùng cho địa chỉ trang tác giả. Để trống sẽ tự tạo từ tên.'
                  />

                  <form.Field name='authorAvatar'>
                    {(field) => (
                      <AuthorAvatarField
                        value={field.state.value as string}
                        onChange={(url) => field.handleChange(url)}
                      />
                    )}
                  </form.Field>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormTextareaField
                      name='authorDescription'
                      label='Nội dung tóm tắt (Tiếng Việt)'
                      placeholder='Giới thiệu ngắn về tác giả...'
                      rows={6}
                      maxLength={AUTHOR_DESCRIPTION_MAX_LENGTH}
                    />
                    <FormTextareaField
                      name='authorDescriptionEn'
                      label='Nội dung tóm tắt (English)'
                      placeholder='A short introduction to the author...'
                      rows={6}
                      maxLength={AUTHOR_DESCRIPTION_MAX_LENGTH}
                      description='Để trống sẽ dùng tóm tắt tiếng Việt.'
                    />
                  </div>
                </div>
              ) : null
            }
          </form.Subscribe>
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

export function UserFormDialogTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm người dùng
      </Button>
      <UserFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
