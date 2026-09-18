/**
 * Per-partner-type wording for the application form.
 *
 * Copied from `partnerConfigs` in dang-ky-doi-tac-esim.html: picking a partner
 * type rewrites six labels, the channel list and the confirmation message, and
 * the design expects all of them to change together.
 */
import type { PartnerType } from '../api/types';

/** The mockup offers three models; the API stores two. */
export type ApplyPartnerType = 'marketing' | 'distribution' | 'api';

export type PartnerConfig = {
  note: string;
  payment: string;
  business: string;
  websiteLabel: string;
  websitePlaceholder: string;
  monthlyLabel: string;
  channelLabel: string;
  channels: string[];
  planLabel: string;
  planPlaceholder: string;
  additional: string;
  success: string;
  prefix: string;
};

export const PARTNER_CONFIGS: Record<ApplyPartnerType, PartnerConfig> = {
  marketing: {
    note: 'Đối tác tiếp thị được cấp liên kết và mã giảm giá để theo dõi lượt giới thiệu, đơn hàng và hoa hồng.',
    payment: 'Chọn phương thức nhận hoa hồng từ các đơn hàng tiếp thị đã được duyệt.',
    business: 'Cung cấp thông tin về kênh nội dung, quy mô tiếp cận và sản lượng đơn hàng dự kiến.',
    websiteLabel: 'Website hoặc kênh nội dung chính',
    websitePlaceholder: 'https://website.com hoặc https://youtube.com/@kenh',
    monthlyLabel: 'Ước tính số đơn hàng giới thiệu mỗi tháng',
    channelLabel: 'Kênh tiếp thị chính',
    channels: [
      'Website hoặc blog',
      'YouTube',
      'TikTok',
      'Facebook',
      'Instagram',
      'Zalo hoặc cộng đồng',
      'Email hoặc bản tin',
      'Kênh khác'
    ],
    planLabel: 'Bạn dự định tiếp thị sản phẩm esim.vn như thế nào?',
    planPlaceholder:
      'Mô tả loại nội dung, cách đặt liên kết hoặc mã giảm giá và nhóm khách hàng bạn muốn tiếp cận.',
    additional: 'Giúp chúng tôi đánh giá nội dung, tệp người xem và phương thức quảng bá phù hợp.',
    success:
      'Cảm ơn bạn đã đăng ký trở thành Đối tác tiếp thị esim.vn. Đội ngũ chương trình sẽ đánh giá kênh tiếp thị, quy mô tiếp cận và phản hồi qua email hoặc số điện thoại đã cung cấp.',
    prefix: 'MKT'
  },
  distribution: {
    note: 'Đối tác phân phối được áp dụng chính sách giá, chiết khấu và hỗ trợ bán hàng dựa trên sản lượng và thị trường khách hàng.',
    payment:
      'Chọn phương thức nhận khoản hoàn trả, thưởng doanh số hoặc thanh toán phát sinh theo chính sách phân phối.',
    business: 'Cung cấp thông tin về mô hình bán hàng, nhóm khách hàng và sản lượng dự kiến.',
    websiteLabel: 'Website, cửa hàng hoặc kênh bán hàng chính',
    websitePlaceholder: 'https://website.com hoặc đường dẫn giới thiệu cửa hàng',
    monthlyLabel: 'Ước tính số đơn hàng phân phối mỗi tháng',
    channelLabel: 'Kênh phân phối chính',
    channels: [
      'Website hoặc cửa hàng trực tuyến',
      'Cửa hàng hoặc điểm bán trực tiếp',
      'Công ty du lịch hoặc bán tour',
      'Bán hàng doanh nghiệp',
      'Sàn thương mại điện tử',
      'Mạng lưới cộng tác viên hoặc đại lý',
      'Kênh khác'
    ],
    planLabel: 'Bạn dự định phân phối sản phẩm esim.vn như thế nào?',
    planPlaceholder:
      'Mô tả quy trình bán hàng, thị trường khách hàng, đội ngũ kinh doanh và cách bạn dự định phân phối eSIM.',
    additional:
      'Giúp chúng tôi đánh giá sản lượng, thị trường và chính sách giá phù hợp cho đối tác phân phối.',
    success:
      'Cảm ơn bạn đã đăng ký trở thành Đối tác phân phối esim.vn. Đội ngũ kinh doanh sẽ đánh giá mô hình phân phối, sản lượng dự kiến và liên hệ qua email hoặc số điện thoại đã cung cấp.',
    prefix: 'DIST'
  },
  api: {
    note: 'Đối tác tích hợp API có thể kết nối danh mục sản phẩm, đặt hàng và quản lý eSIM trực tiếp trong hệ thống của mình.',
    payment:
      'Chọn phương thức nhận khoản chia sẻ doanh thu, hoàn trả hoặc thanh toán phát sinh theo thỏa thuận tích hợp API.',
    business:
      'Cung cấp thông tin về nền tảng, năng lực kỹ thuật, sản lượng giao dịch và thời gian triển khai dự kiến.',
    websiteLabel: 'Website hoặc ứng dụng dự kiến tích hợp',
    websitePlaceholder: 'https://website.com hoặc đường dẫn ứng dụng',
    monthlyLabel: 'Ước tính số giao dịch API mỗi tháng',
    channelLabel: 'Loại nền tảng cần tích hợp',
    channels: [
      'Website thương mại điện tử',
      'Ứng dụng di động',
      'Nền tảng đặt tour hoặc vé',
      'Cổng bán hàng B2B',
      'Hệ thống CRM, ERP hoặc POS',
      'Giải pháp white-label',
      'Nền tảng khác'
    ],
    planLabel: 'Bạn dự định tích hợp API esim.vn vào sản phẩm như thế nào?',
    planPlaceholder:
      'Mô tả luồng người dùng, chức năng cần tích hợp, sản lượng kỳ vọng và nhu cầu về API hoặc white-label.',
    additional:
      'Giúp đội ngũ kỹ thuật hiểu rõ trường hợp sử dụng, phạm vi tích hợp và nhu cầu hỗ trợ của bạn.',
    success:
      'Cảm ơn bạn đã đăng ký trở thành Đối tác tích hợp API esim.vn. Đội ngũ tích hợp sẽ đánh giá nhu cầu kỹ thuật, sản lượng dự kiến và liên hệ với đầu mối bạn đã cung cấp.',
    prefix: 'API'
  }
};

/**
 * The application endpoint only knows `kol` and `distribution`. An API
 * integrator is a distribution partner whose channel is an integration, so the
 * distinction is preserved in `channelInfo.integrationType` rather than lost.
 */
export function toApiPartnerType(type: ApplyPartnerType): PartnerType {
  return type === 'marketing' ? 'kol' : 'distribution';
}

export const MONTHLY_ORDER_RANGES = [
  { value: '1-10', label: '1–10 đơn/tháng' },
  { value: '11-50', label: '11–50 đơn/tháng' },
  { value: '51-100', label: '51–100 đơn/tháng' },
  { value: '101-300', label: '101–300 đơn/tháng' },
  { value: '301-1000', label: '301–1.000 đơn/tháng' },
  { value: '1000+', label: 'Trên 1.000 đơn/tháng' }
];

export const AUDIENCE_SIZES = [
  'Dưới 5.000 lượt',
  '5.000–20.000 lượt',
  '20.001–100.000 lượt',
  '100.001–500.000 lượt',
  'Trên 500.000 lượt'
];

export const CONTENT_CATEGORIES = [
  'Du lịch và trải nghiệm',
  'Công nghệ và viễn thông',
  'Đời sống và tiêu dùng',
  'Khuyến mãi và săn ưu đãi',
  'Kinh doanh hoặc cộng đồng',
  'Chủ đề khác'
];

export const DISTRIBUTION_MODELS = [
  'Bán trực tiếp trên website',
  'Cửa hàng hoặc điểm bán',
  'Công ty du lịch hoặc bán tour',
  'Bán cho khách hàng doanh nghiệp',
  'Mạng lưới cộng tác viên hoặc đại lý cấp dưới',
  'Mô hình khác'
];

export const CUSTOMER_SEGMENTS = [
  'Khách du lịch tự túc',
  'Khách đi tour',
  'Khách công tác hoặc doanh nghiệp',
  'Du học sinh hoặc người lao động',
  'Đại lý du lịch và đối tác B2B',
  'Nhóm khách hàng khác'
];

export const API_EXPERIENCE = [
  'Đã từng tích hợp API tương tự',
  'Có đội kỹ thuật nhưng chưa tích hợp API eSIM',
  'Sử dụng đơn vị kỹ thuật thuê ngoài',
  'Chưa có đội kỹ thuật, cần tư vấn giải pháp'
];

export const INTEGRATION_TIMELINES = [
  'Trong vòng 2 tuần',
  'Trong vòng 1 tháng',
  'Trong 2–3 tháng',
  'Trên 3 tháng',
  'Chưa xác định, cần tư vấn trước'
];

export const COUNTRIES = [
  { value: 'VN', label: 'Việt Nam' },
  { value: 'SG', label: 'Singapore' },
  { value: 'TH', label: 'Thái Lan' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'US', label: 'Hoa Kỳ' },
  { value: 'OTHER', label: 'Quốc gia khác' }
];

export const REFERRAL_SOURCES = [
  'Tìm kiếm Google',
  'YouTube',
  'Facebook hoặc cộng đồng',
  'Được bạn bè hoặc đối tác giới thiệu',
  'Nhân viên esim.vn liên hệ',
  'Sự kiện hoặc hội thảo',
  'Nguồn khác'
];
