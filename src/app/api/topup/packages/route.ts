import { NextRequest } from 'next/server';
import { proxyTopup } from '../_proxy';

/** Topup packages an eSIM can take: `GET /api/topup/packages?iccid=…`. */
export async function GET(request: NextRequest) {
  return proxyTopup(request, '/packages');
}
