import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const apiUrl = getApiBaseUrl();
    const body = await request.arrayBuffer();
    const contentType = request.headers.get('content-type');
    const headers = contentType ? { 'Content-Type': contentType } : undefined;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body,
    });
    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Order submission proxy error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to submit order' },
      { status: 502 },
    );
  }
}
