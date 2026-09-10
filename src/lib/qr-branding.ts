/** esim.vn wordmark placed in the middle of the QR codes the CMS renders. */
export const BRAND_QR_LOGO_SRC =
  'https://res.cloudinary.com/drozbviwb/image/upload/v1780067058/logo_esimvn_zycejk.png';

/**
 * The logo file is 700×144 — a WIDE wordmark, not a square mark. Forcing it
 * into a square box squashes it and it reads as a broken image.
 */
const LOGO_ASPECT = 144 / 700;

/** Share of the QR width the wordmark may take. */
const LOGO_WIDTH_RATIO = 0.58;

/**
 * `imageSettings` for `<QRCodeSVG>` / `<QRCodeCanvas>`, derived from the QR
 * size so the wordmark keeps its real proportions at every size instead of
 * being hand-tuned (and mis-tuned) per call site.
 *
 * Roughly 7% of the QR area is excavated, well inside what error-correction
 * level H can rebuild, so the code still scans.
 */
export function brandQrLogoSettings(size: number) {
  const width = Math.round(size * LOGO_WIDTH_RATIO);

  return {
    src: BRAND_QR_LOGO_SRC,
    width,
    height: Math.round(width * LOGO_ASPECT),
    excavate: true
  };
}
