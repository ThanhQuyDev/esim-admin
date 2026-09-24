'use client';

/**
 * Partner profile.
 *
 * Four tabs beside a completion card. The active tab lives in the URL (as in
 * `features/users/components/users-tabs`) so a partner can link someone
 * straight to the payment details. Each tab saves only its own fields, so
 * editing bank details cannot overwrite the channels saved from another tab.
 */

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { changePassword } from '@/features/auth/api/service';

import { updateMyProfileMutation } from '../api/mutations';
import { myProfileQueryOptions, mySummaryQueryOptions } from '../api/queries';
import type { UpdateMyProfilePayload } from '../api/types';

const TAB_VALUES = ['basic', 'channels', 'payment', 'security'] as const;
type ProfileTab = (typeof TAB_VALUES)[number];

const MIN_PASSWORD_LENGTH = 8;

/** Channel links live in the free-form `channelInfo` blob on the partner. */
type Channels = {
  youtube: string;
  tiktok: string;
  website: string;
  facebook: string;
  other: string;
};

const EMPTY_CHANNELS: Channels = {
  youtube: '',
  tiktok: '',
  website: '',
  facebook: '',
  other: ''
};

function initialsOf(name: string | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ĐT';
  return (parts[0]![0]! + (parts.length > 1 ? parts[parts.length - 1]![0]! : '')).toUpperCase();
}

export function PortalProfileView() {
  const { data: me } = useQuery(myProfileQueryOptions());
  const { data: summary } = useQuery(mySummaryQueryOptions());

  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(TAB_VALUES).withDefault('basic').withOptions({ shallow: true })
  );

  const [basic, setBasic] = useState({
    contactName: '',
    contactPhone: '',
    companyName: '',
    taxCode: '',
    businessAddress: ''
  });
  const [channels, setChannels] = useState<Channels>(EMPTY_CHANNELS);
  const [bank, setBank] = useState({
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: '',
    bankBranch: ''
  });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Seed the forms from the partner record exactly once. `me` is refetched on
  // window focus and after every save, and re-seeding on each of those would
  // overwrite whatever the partner had typed since.
  const seededFor = useRef<number | null>(null);
  useEffect(() => {
    if (!me || seededFor.current === me.id) return;
    seededFor.current = me.id;
    setBasic({
      contactName: me.contactName ?? '',
      contactPhone: me.contactPhone ?? '',
      companyName: me.companyName ?? '',
      taxCode: me.taxCode ?? '',
      businessAddress: me.businessAddress ?? ''
    });
    setChannels({ ...EMPTY_CHANNELS, ...((me.channelInfo ?? {}) as Partial<Channels>) });
    setBank({
      bankName: me.bankName ?? '',
      bankAccountNumber: me.bankAccountNumber ?? '',
      bankAccountHolder: me.bankAccountHolder ?? '',
      bankBranch: me.bankBranch ?? ''
    });
  }, [me]);

  const save = useMutation({
    ...updateMyProfileMutation,
    onSuccess: () => toast.success('Đã lưu thay đổi.'),
    onError: (e: Error) => toast.error(e.message || 'Không lưu được, vui lòng thử lại.')
  });

  const updatePassword = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPasswords({ current: '', next: '', confirm: '' });
      toast.success('Đã cập nhật mật khẩu.');
    },
    onError: (e: Error) =>
      toast.error(e.message || 'Không đổi được mật khẩu, kiểm tra lại mật khẩu hiện tại.')
  });

  const submit = (payload: UpdateMyProfilePayload) => save.mutate(payload);

  const submitPassword = () => {
    if (passwords.next.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Mật khẩu mới cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError('Xác nhận mật khẩu chưa khớp.');
      return;
    }
    setPasswordError(null);
    updatePassword.mutate({ oldPassword: passwords.current, password: passwords.next });
  };

  const filledChannels = Object.values(channels).filter(Boolean).length;
  const hasBank = Boolean(bank.bankAccountNumber);
  const steps = [
    { label: 'Thông tin liên hệ', done: Boolean(basic.contactName && basic.contactPhone) },
    { label: 'Kênh tiếp thị', done: filledChannels > 0 },
    { label: 'Tài khoản nhận tiền', done: hasBank }
  ];
  const completion = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);

  return (
    <div className='grid gap-4 lg:grid-cols-3'>
      <div className='lg:col-span-2'>
        <Tabs value={tab} onValueChange={(v) => setTab(v as ProfileTab)}>
          <TabsList>
            <TabsTrigger value='basic'>Thông tin cơ bản</TabsTrigger>
            <TabsTrigger value='channels'>Kênh tiếp thị</TabsTrigger>
            <TabsTrigger value='payment'>Thanh toán</TabsTrigger>
            <TabsTrigger value='security'>Bảo mật</TabsTrigger>
          </TabsList>

          <TabsContent value='basic' className='mt-4'>
            <Card>
              <CardHeader>
                <CardTitle>Thông tin tài khoản đối tác</CardTitle>
                <CardDescription>Dùng để xác minh và liên hệ vận hành.</CardDescription>
              </CardHeader>
              <CardContent className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='contactName'>Họ và tên</Label>
                  <Input
                    id='contactName'
                    value={basic.contactName}
                    onChange={(e) => setBasic({ ...basic, contactName: e.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='contactEmail'>Email</Label>
                  <Input id='contactEmail' value={me?.contactEmail ?? ''} disabled />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='contactPhone'>Số điện thoại</Label>
                  <Input
                    id='contactPhone'
                    value={basic.contactPhone}
                    onChange={(e) => setBasic({ ...basic, contactPhone: e.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='legalType'>Tư cách pháp nhân</Label>
                  <Input
                    id='legalType'
                    value={me?.legalType === 'company' ? 'Doanh nghiệp' : 'Cá nhân'}
                    disabled
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='companyName'>Tên thương hiệu hoặc kênh</Label>
                  <Input
                    id='companyName'
                    value={basic.companyName}
                    onChange={(e) => setBasic({ ...basic, companyName: e.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='taxCode'>Mã số thuế</Label>
                  <Input
                    id='taxCode'
                    inputMode='numeric'
                    value={basic.taxCode}
                    onChange={(e) => setBasic({ ...basic, taxCode: e.target.value })}
                  />
                </div>
                <div className='space-y-2 md:col-span-2'>
                  <Label htmlFor='businessAddress'>Địa chỉ</Label>
                  <Input
                    id='businessAddress'
                    value={basic.businessAddress}
                    onChange={(e) => setBasic({ ...basic, businessAddress: e.target.value })}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button isLoading={save.isPending} onClick={() => submit(basic)}>
                  Lưu thay đổi
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value='channels' className='mt-4'>
            <Card>
              <CardHeader>
                <CardTitle>Kênh tiếp thị</CardTitle>
                <CardDescription>
                  Khai báo các kênh bạn dùng để quảng bá. Đội duyệt dựa vào đây để đánh giá hồ sơ.
                </CardDescription>
              </CardHeader>
              <CardContent className='grid gap-4 md:grid-cols-2'>
                {(
                  [
                    ['youtube', 'YouTube', 'https://youtube.com/@...'],
                    ['tiktok', 'TikTok', 'https://tiktok.com/@...'],
                    ['website', 'Trang web', 'https://...'],
                    ['facebook', 'Facebook', 'https://facebook.com/...']
                  ] as const
                ).map(([key, label, placeholder]) => (
                  <div className='space-y-2' key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      value={channels[key]}
                      placeholder={placeholder}
                      onChange={(e) => setChannels({ ...channels, [key]: e.target.value })}
                    />
                  </div>
                ))}
                <div className='space-y-2 md:col-span-2'>
                  <Label htmlFor='otherChannel'>Kênh khác</Label>
                  <Input
                    id='otherChannel'
                    value={channels.other}
                    placeholder='Instagram, Threads, Telegram, Zalo OA, podcast…'
                    onChange={(e) => setChannels({ ...channels, other: e.target.value })}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  isLoading={save.isPending}
                  onClick={() => submit({ channelInfo: channels })}
                >
                  Lưu thay đổi
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value='payment' className='mt-4'>
            <Card>
              <CardHeader>
                <CardTitle>Tài khoản nhận tiền</CardTitle>
                <CardDescription>
                  Thông tin phải trùng với chủ tài khoản đã xác minh, nếu không yêu cầu rút sẽ bị từ
                  chối.
                </CardDescription>
              </CardHeader>
              <CardContent className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='bankName'>Ngân hàng</Label>
                  <Input
                    id='bankName'
                    value={bank.bankName}
                    placeholder='Vietcombank'
                    onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='bankBranch'>Chi nhánh</Label>
                  <Input
                    id='bankBranch'
                    value={bank.bankBranch}
                    onChange={(e) => setBank({ ...bank, bankBranch: e.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='bankAccountNumber'>Số tài khoản</Label>
                  <Input
                    id='bankAccountNumber'
                    inputMode='numeric'
                    value={bank.bankAccountNumber}
                    onChange={(e) => setBank({ ...bank, bankAccountNumber: e.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='bankAccountHolder'>Chủ tài khoản</Label>
                  <Input
                    id='bankAccountHolder'
                    value={bank.bankAccountHolder}
                    onChange={(e) => setBank({ ...bank, bankAccountHolder: e.target.value })}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button isLoading={save.isPending} onClick={() => submit(bank)}>
                  Lưu thay đổi
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value='security' className='mt-4'>
            <Card>
              <CardHeader>
                <CardTitle>Đổi mật khẩu</CardTitle>
                <CardDescription>
                  Mật khẩu mới cần ít nhất {MIN_PASSWORD_LENGTH} ký tự.
                </CardDescription>
              </CardHeader>
              <CardContent className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2 md:col-span-2'>
                  <Label htmlFor='currentPassword'>Mật khẩu hiện tại</Label>
                  <Input
                    id='currentPassword'
                    type='password'
                    autoComplete='current-password'
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='newPassword'>Mật khẩu mới</Label>
                  <Input
                    id='newPassword'
                    type='password'
                    autoComplete='new-password'
                    value={passwords.next}
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby='password-error'
                    onChange={(e) => {
                      setPasswords({ ...passwords, next: e.target.value });
                      if (passwordError) setPasswordError(null);
                    }}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='confirmPassword'>Xác nhận mật khẩu mới</Label>
                  <Input
                    id='confirmPassword'
                    type='password'
                    autoComplete='new-password'
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                </div>
                {passwordError && (
                  <p id='password-error' className='text-destructive text-xs md:col-span-2'>
                    {passwordError}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button isLoading={updatePassword.isPending} onClick={submitPassword}>
                  Cập nhật mật khẩu
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className='space-y-4'>
        <Card>
          <CardHeader className='items-center text-center'>
            <Avatar className='mx-auto size-16'>
              <AvatarFallback className='text-lg'>{initialsOf(me?.contactName)}</AvatarFallback>
            </Avatar>
            <CardTitle className='mt-3'>{me?.contactName ?? 'Đối tác'}</CardTitle>
            <CardDescription>
              {me?.partnerType === 'distribution' ? 'Đối tác phân phối' : 'Đối tác tiếp thị'}
              {summary?.tier.current ? ` · Hạng ${summary.tier.current.tierName}` : ''}
            </CardDescription>
            <Badge
              variant={me?.status === 'active' ? 'default' : 'secondary'}
              className='mx-auto mt-2'
            >
              {me?.status === 'active' ? 'Đã xác minh' : 'Đang chờ duyệt'}
            </Badge>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Mức độ hoàn thiện hồ sơ</CardTitle>
            <CardDescription>{completion}% hoàn tất</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='bg-muted h-2 overflow-hidden rounded-full'>
              <div
                className='bg-primary h-full rounded-full transition-[width] duration-500'
                style={{ width: `${completion}%` }}
              />
            </div>
            {steps.map((step) => (
              <div key={step.label} className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>{step.label}</span>
                <Badge variant={step.done ? 'default' : 'outline'}>
                  {step.done ? 'Hoàn tất' : 'Còn thiếu'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
