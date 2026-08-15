export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const VALID_STATUS = ['pending', 'confirmed', 'in_production', 'completed'] as const;

type ValidStatus = (typeof VALID_STATUS)[number];

import { getApiBaseUrl } from '@/lib/api';

export async function PATCH(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const body = await request.json();
    const status = body?.status as string;

    if (!status || !VALID_STATUS.includes(status as ValidStatus)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUS.join(', ')}` }, { status: 400 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/orders';
    const response = await fetch(`${apiUrl}/${params.orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data?.error || 'Unable to update order status' }, { status: response.status });
    }

    return NextResponse.json({ order: data.order });
  } catch (error) {
    console.error('Admin PATCH order status error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/orders';
    const response = await fetch(`${apiUrl}/${params.orderId}`, {
      method: 'DELETE',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json({ error: data?.error || 'Unable to delete order' }, { status: response.status });
    }

    return NextResponse.json({ success: true, message: data.message || 'Order deleted successfully', orderId: params.orderId });
  } catch (error) {
    console.error('Admin DELETE order error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
