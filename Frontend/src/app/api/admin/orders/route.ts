export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const VALID_STATUS = ['pending', 'confirmed', 'in_production', 'completed'] as const;
const STATUS_MAP = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_production: 'In Production',
  completed: 'Completed',
} as const;

type ValidStatus = (typeof VALID_STATUS)[number];

type BackendOrder = Record<string, any>;

const normalizeOrder = (order: BackendOrder) => {
  const rawStatus = String(order?.status ?? '').toLowerCase();
  const normalizedStatus = rawStatus === 'in production' || rawStatus === 'in_production' ? 'in_production' : rawStatus;
  return {
    ...order,
    status: VALID_STATUS.includes(normalizedStatus as ValidStatus) ? normalizedStatus : 'pending',
  };
};

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/orders';
    const response = await fetch(apiUrl, { cache: 'no-store' });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data?.error || 'Unable to fetch orders' }, { status: response.status });
    }

    const sorted = Array.isArray(data.orders)
      ? data.orders.slice().sort((a: BackendOrder, b: BackendOrder) => {
          const aTime = new Date(a.createdAt as string | number | Date).getTime();
          const bTime = new Date(b.createdAt as string | number | Date).getTime();
          return bTime - aTime;
        })
      : [];

    return NextResponse.json({ orders: sorted.map(normalizeOrder) });
  } catch (error) {
    console.error('Admin GET orders error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
