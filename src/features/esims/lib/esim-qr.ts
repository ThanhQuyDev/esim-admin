import { BRAND_QR_LOGO_SRC, brandQrLogoSettings } from '@/lib/qr-branding';

/**
 * eSIM QR branding.
 *
 * The wordmark settings moved to `@/lib/qr-branding` when payment-order QR
 * codes started using them too (#085); this stays as the eSIM-facing name so
 * existing call sites keep reading naturally.
 */
export const ESIM_QR_LOGO_SRC = BRAND_QR_LOGO_SRC;

export const esimQrLogoSettings = brandQrLogoSettings;
