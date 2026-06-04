import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const TB = process.env.THINGSBOARD_URL || 'http://161.53.133.253:8080';

export async function POST(request) {
  const { username, password } = await request.json();
  const resp = await fetch(`${TB}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!resp.ok) {
    return NextResponse.json({ error: 'Neispravni podaci za prijavu.' }, { status: 401 });
  }
  const { token } = await resp.json();
  const cookieStore = await cookies();
  cookieStore.set('tb_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  return NextResponse.json({ ok: true });
}
