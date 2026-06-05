import { NextResponse } from 'next/server';

export function middleware(request) {
  // Mock mode: no auth required
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') return NextResponse.next();

  const { pathname } = request.nextUrl;
  const token = request.cookies.get('tb_token')?.value;

  const isPublic = pathname.startsWith('/login') || pathname.startsWith('/api/auth') || pathname.startsWith('/api/tb');
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
