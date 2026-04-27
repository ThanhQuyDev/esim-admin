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
  { variable: '{{app_name}}', description: 'Tên ứng dụng' }
] as const;
