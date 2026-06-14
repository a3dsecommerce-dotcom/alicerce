import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all dashboard routes — requires auth_token cookie
  if (pathname.startsWith('/dashboard')) {
    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken || !authToken.startsWith('al_sovereign_')) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
