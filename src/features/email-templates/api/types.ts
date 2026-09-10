export type EmailTemplate = {
  id: number;
  name: string;
  subject: string;
  htmlBody: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateEmailTemplatePayload = {
  subject?: string;
  htmlBody?: string;
};

export type PreviewEmailTemplatePayload = {
  htmlBody?: string;
  subject?: string;
};

export type PreviewEmailTemplateResponse = {
  subject: string;
  html: string;
};

export const EMAIL_TEMPLATE_VARIABLES = [
  { variable: '{{iccid}}', description: 'ICCID của eSIM' },
  { variable: '{{activationCode}}', description: 'Mã kích hoạt eSIM' },
  { variable: '{{lpa}}', description: 'Địa chỉ LPA' },
  { variable: '{{smdpAddress}}', description: 'Địa chỉ SM-DP+' },
  { variable: '{{apn}}', description: 'Tên điểm truy cập (APN)' },
  { variable: '{{phoneNumber}}', description: 'Số điện thoại' },
  { variable: '{{planName}}', description: 'Tên gói cước' },
  { variable: '{{orderNumber}}', description: 'Mã đơn hàng' },
  { variable: '{{qrCodeBase64}}', description: 'Mã QR dạng Base64' },
  { variable: '{{app_name}}', description: 'Tên ứng dụng' },
  // Branding + invoice-request email (#079)
  { variable: '{{logoUrl}}', description: 'Đường dẫn logo esim.vn (dùng trong thẻ <img>)' },
  { variable: '{{supportEmail}}', description: 'Email hỗ trợ khách hàng' },
  { variable: '{{companyName}}', description: 'Tên công ty xuất hóa đơn' },
  { variable: '{{taxCode}}', description: 'Mã số thuế' },
  { variable: '{{address}}', description: 'Địa chỉ đăng ký kinh doanh' },
  { variable: '{{totalAmountFormatted}}', description: 'Số tiền thanh toán (đã định dạng)' }
] as const;
