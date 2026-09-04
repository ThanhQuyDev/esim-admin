import type { Metadata } from 'next';
import { RegisterPartnerForm } from './register-partner-form';

export const metadata: Metadata = {
  title: 'Đăng ký đối tác & KOL — esim.vn',
  description: 'Đăng ký trở thành đối tác phân phối hoặc KOL của esim.vn.'
};

export default function RegisterPartnerPage() {
  return (
    <div className='bg-muted/30 min-h-screen py-10'>
      <div className='mx-auto max-w-2xl px-4'>
        <div className='mb-8 text-center'>
          <h1 className='text-2xl font-bold tracking-tight'>Đăng ký đối tác & KOL</h1>
          <p className='text-muted-foreground mt-2 text-sm'>
            Trở thành đối tác phân phối eSIM hoặc KOL bán hàng nhận hoa hồng cùng esim.vn.
          </p>
        </div>
        <RegisterPartnerForm />
      </div>
    </div>
  );
}
