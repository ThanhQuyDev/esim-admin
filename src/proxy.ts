import { NextRequest, NextResponse } from 'next/server';

import {
  PARTNER_ONLY_PREFIXES,
  SHARED_PREFIXES,
  homePathFor,
  matchesPrefix,
  resolveAppMode
} from '@/config/app-mode';

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/auth/sign-in', '/auth/sign-up'];

/**
 * The other deployment's routes are 404'd rather than redirected: on this
 * hostname they genuinely do not exist. See src/config/app-mode.ts for why the
 * admin console and the partner portal share one codebase but not one surface.
 */
function notFound(pathname: string): NextResponse {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
  return new NextResponse(
    '<!doctype html><meta charset="utf-8"><title>404</title><p>404 — Not found</p>',
    { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}

const isShared = (pathname: string) =>
  SHARED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));

const isPartnerOnly = (pathname: string) =>
  PARTNER_ONLY_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;
  const mode = resolveAppMode(req.headers.get('host'));
  const home = homePathFor(mode);

  // 1. Deployment split — checked before auth so a route this deployment does
  //    not own never even reveals whether you would need to sign in for it.
  if (!isShared(pathname)) {
    if (mode === 'partner') {
      const isAppRoute = matchesPrefix(pathname, '/dashboard') || matchesPrefix(pathname, '/api');
      if (isAppRoute && !isPartnerOnly(pathname)) {
        return notFound(pathname);
      }
    } else if (isPartnerOnly(pathname)) {
      return notFound(pathname);
    }
  }

  // 2. The partner portal has no admin overview to land on, so `/` is resolved
  //    here instead of by app/page.tsx.
  if (mode === 'partner' && pathname === '/') {
    return NextResponse.redirect(new URL(token ? home : '/auth/sign-in', req.url));
  }

  // 3. Auth gating.
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !token) {
    const signInUrl = new URL('/auth/sign-in', req.url);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthRoute && token) {
    // Was hardcoded to the admin overview, which 404s on the partner host.
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
};
