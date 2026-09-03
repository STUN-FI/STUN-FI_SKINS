import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { identifier: string } },
) {
  try {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/customer/${encodeURIComponent(params.identifier)}`, {
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Customer orders proxy error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to fetch orders' },
      { status: 502 },
    );
  }
}
