import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const TB = process.env.THINGSBOARD_URL || 'http://161.53.133.253:8080';

async function proxy(request, { params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('tb_token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const segments = (await params).path;
  const tbPath = segments.join('/');
  const { search } = new URL(request.url);
  const tbUrl = `${TB}/api/${tbPath}${search}`;

  const body = (request.method !== 'GET' && request.method !== 'HEAD')
    ? await request.text() : undefined;

  const tbResp = await fetch(tbUrl, {
    method: request.method,
    headers: { 'Content-Type': 'application/json', 'X-Authorization': `Bearer ${token}` },
    body,
  });

  const text = await tbResp.text();
  return new NextResponse(text, {
    status: tbResp.status,
    headers: { 'Content-Type': tbResp.headers.get('Content-Type') || 'application/json' },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
