import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // In a real app, this should verify the JWT or session cookie.
  // For now, we just check if the session cookie exists.
  const session = request.cookies.get('session');
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  if (session && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
