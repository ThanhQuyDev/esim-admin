import type { Metadata } from 'next';

import '@/styles/partner-register.css';

import { RegisterPartnerForm } from './register-partner-form';

export const metadata: Metadata = {
  title: 'Đăng ký đối tác esim.vn',
  description:
    'Đăng ký trở thành đối tác tiếp thị, đối tác phân phối hoặc đối tác tích hợp API của esim.vn.'
};

/**
 * Topbar and hero from dang-ky-doi-tac-esim.html, wrapped in `.pr-app` so the
 * design file's stylesheet applies here and nowhere else in the app.
 */
export default function RegisterPartnerPage() {
  return (
    <div className='pr-app'>
      <header className='topbar'>
        <a className='brand' href='https://esim.vn' aria-label='Trang chủ esim.vn'>
          <span className='brand-mark'>e</span>
          <span>
            <strong>esim.vn Đối tác</strong>
            <span>Tiếp thị · Phân phối · API</span>
          </span>
        </a>
        <div className='top-actions'>
          <span>Đã có tài khoản?</span>
          <a href='/auth/sign-in'>Đăng nhập cổng đối tác</a>
        </div>
      </header>

      <main className='page'>
        <section className='hero'>
          <div className='hero-main'>
            <div className='eyebrow'>Đăng ký đối tác esim.vn</div>
            <h1>Chọn mô hình hợp tác phù hợp và cùng phát triển doanh thu eSIM.</h1>
            <p>
              Lựa chọn trở thành đối tác tiếp thị để nhận hoa hồng, đối tác phân phối để bán eSIM
              cho khách hàng, hoặc đối tác tích hợp API để đưa sản phẩm esim.vn vào website và ứng
              dụng của bạn.
            </p>
            <div className='hero-badges'>
              <span className='hero-badge'>Miễn phí đăng ký</span>
              <span className='hero-badge'>Xét duyệt thủ công</span>
              <span className='hero-badge'>3 mô hình hợp tác</span>
              <span className='hero-badge'>Hỗ trợ tích hợp API</span>
            </div>
          </div>
          <aside className='hero-side'>
            <h2>Trước khi bắt đầu</h2>
            <div className='checklist'>
              <div className='check'>
                <i>✓</i>
                <div>
                  <strong>Chọn loại hình hợp tác</strong>
                  <span>Tiếp thị, phân phối hoặc tích hợp sản phẩm qua API.</span>
                </div>
              </div>
              <div className='check'>
                <i>✓</i>
                <div>
                  <strong>Chuẩn bị kênh hoạt động</strong>
                  <span>Website, mạng xã hội, cửa hàng, ứng dụng hoặc nền tảng kỹ thuật.</span>
                </div>
              </div>
              <div className='check'>
                <i>✓</i>
                <div>
                  <strong>Nhập thông tin chính xác</strong>
                  <span>Email và số điện thoại sẽ được dùng để liên hệ xét duyệt.</span>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <RegisterPartnerForm />
      </main>
    </div>
  );
}
