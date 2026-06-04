import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const TB = process.env.THINGSBOARD_URL || 'http://161.53.133.253:8080';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('tb_token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const resp = await fetch(`${TB}/api/auth/user`, {
    headers: { 'X-Authorization': `Bearer ${token}` },
  });
  if (!resp.ok) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  return NextResponse.json(await resp.json());
}
