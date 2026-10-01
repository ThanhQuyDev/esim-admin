'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { uploadToCloudinary } from '@/features/blogs/api/service';
import { updateAuthPageSettingMutation } from '../api/mutations';
import type { AuthPageSetting } from '../api/types';

/** Upload-or-paste field: admins have both a file and a CDN URL in practice. */
function ImageField({
  label,
  description,
  value,
  onChange,
  previewClassName
}: {
  label: string;
  description: string;
  value: string;
  onChange: (url: string) => void;
  previewClassName: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
      toast.success('Đã tải ảnh lên');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Tải ảnh lên thất bại');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      {value && (
        <div className={previewClassName}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className='h-full w-full object-contain' />
        </div>
      )}
      <div className='flex items-center gap-2'>
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder='https://... (để trống dùng mặc định)'
          maxLength={500}
        />
        <Button
          type='button'
          variant='outline'
          size='sm'
          isLoading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Icons.upload className='mr-2 h-4 w-4' />
          Tải lên
        </Button>
        {value && (
          <Button type='button' variant='ghost' size='sm' onClick={() => onChange('')}>
            <Icons.close className='mr-2 h-4 w-4' />
            Xoá
          </Button>
        )}
      </div>
      <p className='text-muted-foreground text-xs'>{description}</p>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void upload(file);
        }}
      />
    </div>
  );
}

/**
 * One sign-in page's branding (#006). Every field may be left empty, which puts
 * that one field back to the built-in default rather than showing a blank.
 */
export function AuthPageSettingsForm({ setting }: { setting: AuthPageSetting }) {
  const [logoUrl, setLogoUrl] = useState(setting.logoUrl ?? '');
  const [logoText, setLogoText] = useState(setting.logoText ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(setting.coverImageUrl ?? '');
  const [quote, setQuote] = useState(setting.quote ?? '');
  const [quoteAuthor, setQuoteAuthor] = useState(setting.quoteAuthor ?? '');
  const [heading, setHeading] = useState(setting.heading ?? '');
  const [subheading, setSubheading] = useState(setting.subheading ?? '');

  const mutation = useMutation({
    ...updateAuthPageSettingMutation,
    onSuccess: () => toast.success('Đã lưu nội dung trang đăng nhập'),
    onError: (error) => toast.error(error.message || 'Lưu thất bại')
  });

  const save = () =>
    mutation.mutate({
      mode: setting.mode,
      values: {
        logoUrl: logoUrl.trim() || null,
        logoText: logoText.trim() || null,
        coverImageUrl: coverImageUrl.trim() || null,
        quote: quote.trim() || null,
        quoteAuthor: quoteAuthor.trim() || null,
        heading: heading.trim() || null,
        subheading: subheading.trim() || null
      }
    });

  const isPartner = setting.mode === 'partner';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isPartner ? 'Trang đăng nhập đối tác' : 'Trang đăng nhập quản trị'}</CardTitle>
        <CardDescription>
          Nội dung hiện trên {isPartner ? 'doitac.esim.vn' : 'admin.esim.vn'}. Trường nào để trống
          thì hệ thống dùng nội dung mặc định, không hiện khoảng trắng.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid gap-6 lg:grid-cols-2'>
          <ImageField
            label='Logo'
            description='Ảnh logo hiện ở góc trên bên trái. Bỏ trống thì dùng ký hiệu mặc định kèm dòng chữ bên dưới.'
            value={logoUrl}
            onChange={setLogoUrl}
            previewClassName='bg-zinc-900 relative h-20 w-full overflow-hidden rounded-lg border p-2'
          />
          <ImageField
            label='Ảnh nền cột trái'
            description='Bỏ trống thì giữ hiệu ứng lưới động mặc định. Ảnh sẽ được làm mờ vì có chữ đè lên.'
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            previewClassName='bg-muted/30 relative aspect-[16/9] w-full overflow-hidden rounded-lg border'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor={`logoText-${setting.mode}`}>Chữ cạnh logo</Label>
          <Input
            id={`logoText-${setting.mode}`}
            value={logoText}
            onChange={(event) => setLogoText(event.target.value)}
            placeholder='VD: esim.vn — Cổng đối tác'
            maxLength={120}
          />
        </div>

        <div className='grid gap-4 lg:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor={`heading-${setting.mode}`}>Tiêu đề form</Label>
            <Input
              id={`heading-${setting.mode}`}
              value={heading}
              onChange={(event) => setHeading(event.target.value)}
              placeholder='VD: Đăng nhập đối tác'
              maxLength={120}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor={`subheading-${setting.mode}`}>Mô tả dưới tiêu đề</Label>
            <Input
              id={`subheading-${setting.mode}`}
              value={subheading}
              onChange={(event) => setSubheading(event.target.value)}
              placeholder='VD: Nhập email và mật khẩu bạn đã đăng ký.'
              maxLength={300}
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor={`quote-${setting.mode}`}>Nội dung giới thiệu (cột trái)</Label>
          <Textarea
            id={`quote-${setting.mode}`}
            value={quote}
            onChange={(event) => setQuote(event.target.value)}
            placeholder='Câu giới thiệu ngắn về hệ thống'
            maxLength={500}
            rows={3}
          />
          <p className='text-muted-foreground text-xs'>
            Đây là chỗ trước đây còn sót nội dung mẫu của bộ giao diện khởi đầu.
          </p>
        </div>

        <div className='space-y-2'>
          <Label htmlFor={`quoteAuthor-${setting.mode}`}>Ký tên dưới nội dung</Label>
          <Input
            id={`quoteAuthor-${setting.mode}`}
            value={quoteAuthor}
            onChange={(event) => setQuoteAuthor(event.target.value)}
            placeholder='VD: esim.vn'
            maxLength={120}
          />
        </div>
      </CardContent>
      <CardFooter className='justify-end'>
        <Button onClick={save} isLoading={mutation.isPending} disabled={mutation.isPending}>
          Lưu
        </Button>
      </CardFooter>
    </Card>
  );
}
