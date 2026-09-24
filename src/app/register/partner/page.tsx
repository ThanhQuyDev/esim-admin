import type { Metadata } from 'next';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';

import { RegisterPartnerForm } from './register-partner-form';

export const metadata: Metadata = {
  title: 'Đăng ký đối tác esim.vn',
  description:
    'Đăng ký trở thành đối tác tiếp thị, đối tác phân phối hoặc đối tác tích hợp API của esim.vn.'
};

const CHECKLIST = [
  {
    title: 'Chọn loại hình hợp tác',
    description: 'Tiếp thị, phân phối hoặc tích hợp sản phẩm qua API.'
  },
  {
    title: 'Chuẩn bị kênh hoạt động',
    description: 'Website, mạng xã hội, cửa hàng, ứng dụng hoặc nền tảng kỹ thuật.'
  },
  {
    title: 'Nhập thông tin chính xác',
    description: 'Email và số điện thoại sẽ được dùng để liên hệ xét duyệt.'
  }
];

export default function RegisterPartnerPage() {
  return (
    <div className='bg-background min-h-screen'>
      <header className='bg-background/80 sticky top-0 z-20 border-b backdrop-blur'>
        <div className='mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 md:px-6'>
          <a
            href='https://esim.vn'
            className='flex items-center gap-2'
            aria-label='Trang chủ esim.vn'
          >
            <div className='bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-bold'>
              e
            </div>
            <div className='leading-tight'>
              <p className='text-sm font-medium'>esim.vn Đối tác</p>
              <p className='text-muted-foreground text-xs'>Tiếp thị · Phân phối · API</p>
            </div>
          </a>
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            <span className='hidden sm:inline'>Đã có tài khoản?</span>
            <a href='/auth/sign-in' className='text-foreground font-medium hover:underline'>
              Đăng nhập
            </a>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-5xl space-y-4 px-4 py-8 md:px-6'>
        <div className='grid gap-4 lg:grid-cols-3'>
          <Card className='lg:col-span-2'>
            <CardHeader>
              <Badge variant='outline' className='w-fit'>
                Đăng ký đối tác
              </Badge>
              <CardTitle className='mt-2 text-2xl tracking-tight md:text-3xl'>
                Chọn mô hình hợp tác và cùng phát triển doanh thu eSIM
              </CardTitle>
              <CardDescription>
                Trở thành đối tác tiếp thị để nhận hoa hồng, đối tác phân phối để bán eSIM cho khách
                hàng, hoặc đối tác tích hợp API để đưa sản phẩm esim.vn vào website và ứng dụng của
                bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className='flex flex-wrap gap-2'>
              {[
                'Miễn phí đăng ký',
                'Xét duyệt thủ công',
                '3 mô hình hợp tác',
                'Hỗ trợ tích hợp'
              ].map((item) => (
                <Badge key={item} variant='secondary'>
                  {item}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Trước khi bắt đầu</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {CHECKLIST.map((item) => (
                <div key={item.title} className='flex gap-3'>
                  <Icons.check className='text-primary mt-0.5 size-4 shrink-0' />
                  <div>
                    <p className='text-sm font-medium'>{item.title}</p>
                    <p className='text-muted-foreground text-xs'>{item.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <RegisterPartnerForm />
      </main>
    </div>
  );
}
