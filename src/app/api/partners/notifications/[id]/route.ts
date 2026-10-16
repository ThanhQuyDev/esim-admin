import { NextRequest } from 'next/server';
import { proxyAdminPartners } from '../../_proxy';

/** "Sửa" a sent announcement (doitac-1410 #062). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyAdminPartners(request, `/notifications/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body
  });
}

/** "Xóa" a sent announcement (doitac-1410 #062). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyAdminPartners(request, `/notifications/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}
