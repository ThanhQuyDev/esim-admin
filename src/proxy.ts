import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/auth/sign-in', '/auth/sign-up'];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !token) {
    const signInUrl = new URL('/auth/sign-in', req.url);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthRoute && token) {
    const dashboardUrl = new URL('/dashboard/overview', req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
};
