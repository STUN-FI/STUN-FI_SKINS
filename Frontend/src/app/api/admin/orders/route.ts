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

import { getApiBaseUrl } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(apiUrl, { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.error || 'Unable to fetch orders';
      if (String(message).toLowerCase().includes('mongodb connection unavailable')) {
        return NextResponse.json({ orders: [] });
      }
      return NextResponse.json({ error: message }, { status: response.status });
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
