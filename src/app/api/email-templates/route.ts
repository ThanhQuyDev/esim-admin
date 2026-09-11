import { proxyEmailTemplates } from './_proxy';

// GET /api/email-templates — every template, so the CMS can edit all of them.
export async function GET() {
  return proxyEmailTemplates('');
}
