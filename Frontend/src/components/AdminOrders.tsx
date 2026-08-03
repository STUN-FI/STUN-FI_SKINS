'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import BrandedLogo from './BrandedLogo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/orders';
const STATUS_OPTIONS = ['Pending', 'Confirmed', 'In Production', 'Completed'] as const;

type Status = (typeof STATUS_OPTIONS)[number];

type WholesaleDetails = {
  standardQty?: number;
  shinyStonesQty?: number;
  totalPaidUnits?: number;
  totalReceivedUnits?: number;
  freeBonusUnits?: number;
  technicianRequested?: boolean;
};

type RetailDetails = {
  device?: string;
  coverage?: string[];
  finish?: string;
  customText?: string;
  surfaceDesigns?: Array<Record<string, any>> | Record<string, any> | any;
};

type CustomerInfo = {
  storeName?: string;
  contactName?: string;
  whatsappNumber?: string;
  storeAddress?: string;
};

type Order = {
  orderId: string;
  mode: 'individual' | 'wholesale';
  createdAt?: string;
  customerInfo: CustomerInfo;
  retailDetails?: RetailDetails;
  wholesaleDetails?: WholesaleDetails;
  pricing: { totalAmount: number; currency?: string };
  status: Status;
};

const MODE_TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'individual', label: 'Retail Clients' },
  { key: 'wholesale', label: 'Wholesale Partners' },
] as const;

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number') return '₦0';
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
};

const getArtworkUrl = (order: Order) => {
  const designs = order.retailDetails?.surfaceDesigns;
  const items = Array.isArray(designs) ? designs : designs ? Object.values(designs) : [];

  for (const design of items) {
    if (!design || typeof design !== 'object') continue;
    if (typeof design.imageUrl === 'string' && design.imageUrl) return design.imageUrl;
    if (typeof design.url === 'string' && design.url) return design.url;
    if (typeof design.secure_url === 'string' && design.secure_url) return design.secure_url;
  }

  return undefined;
};

const getOrderSummary = (order: Order) => {
  if (order.mode === 'wholesale' && order.wholesaleDetails) {
    const paid = order.wholesaleDetails.totalPaidUnits ?? order.wholesaleDetails.standardQty ?? 0;
    const shiny = order.wholesaleDetails.shinyStonesQty ?? 0;
    const bonus = order.wholesaleDetails.freeBonusUnits ?? 0;
    return `${paid} wholesale sheet${paid === 1 ? '' : 's'}${shiny ? ` (${shiny} shiny)` : ''}${bonus ? ` + ${bonus} bonus` : ''}`;
  }

  if (order.retailDetails) {
    const device = order.retailDetails.device ?? 'Device';
    const finish = order.retailDetails.finish === 'shiny-stones' ? 'Shiny Stones' : 'Standard';
    const coverage = Array.isArray(order.retailDetails.coverage) ? order.retailDetails.coverage : [];
    if (device === 'laptop' && coverage.length > 0) {
      const coverageLabel = coverage.length === 3 ? 'Full Laptop Package' : coverage.map((item) => item.toString().replace(/-/g, ' ')).join(' + ');
      return `${coverageLabel} - ${finish}`;
    }
    return `${device.charAt(0).toUpperCase() + device.slice(1)} - ${finish}`;
  }

  return 'Order details unavailable';
};

const getCustomerName = (order: Order) => {
  return order.mode === 'wholesale'
    ? order.customerInfo.storeName || order.customerInfo.contactName || 'Wholesale Partner'
    : order.customerInfo.contactName || order.customerInfo.storeName || 'Retail Customer';
};

const getCustomerWhatsapp = (order: Order) => {
  return order.customerInfo.whatsappNumber?.replace(/\s+/g, '') || '';
};

const getStatusBadgeClasses = (status: Status) => {
  switch (status) {
    case 'Confirmed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'In Production':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Completed':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<typeof MODE_TABS[number]['key']>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to fetch orders');
      }
      setOrders(data.orders ?? []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'individual') {
      return orders.filter((order) => order.mode === 'individual');
    }

    if (activeTab === 'wholesale') {
      return orders.filter((order) => order.mode === 'wholesale');
    }

    return orders;
  }, [activeTab, orders]);

  const totalRevenue = useMemo(() => {
    return orders
      .filter((order) => ['Confirmed', 'Completed'].includes(order.status))
      .reduce((sum, order) => sum + (order.pricing?.totalAmount ?? 0), 0);
  }, [orders]);

  const pendingJobs = useMemo(() => {
    return orders.filter((order) => order.status !== 'Completed').length;
  }, [orders]);

  const activeWholesalePartners = useMemo(() => {
    const partnerNames = new Set(
      orders
        .filter((order) => order.mode === 'wholesale')
        .map((order) => order.customerInfo.storeName?.trim() || ''),
    );
    partnerNames.delete('');
    return partnerNames.size;
  }, [orders]);

  const totalOrders = orders.length;

  const updateOrderStatus = async (orderId: string, newStatus: Status) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`${API_URL}/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to update status');
      }
      setOrders((current) => current.map((order) => (order.orderId === orderId ? data.order : order)));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-black/10 bg-white/95 p-6 shadow-glow sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-black/60">Admin Dashboard</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex h-12 w-12 min-w-[3rem] items-center justify-center rounded-3xl bg-black p-2">
              <Image src="/img/stunfi-logo-white.png" alt="STUN-FI logo" width={48} height={48} className="h-full w-full object-contain" />
            </div>
            <BrandedLogo size="lg" />
            <span className="text-sm uppercase tracking-[0.24em] text-black/60">Order Management</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/60">Total Orders</p>
          <p className="mt-4 text-3xl font-black text-black">{totalOrders}</p>
        </div>
        <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/60">Total Revenue</p>
          <p className="mt-4 text-3xl font-black text-black">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/60">Pending Production Jobs</p>
          <p className="mt-4 text-3xl font-black text-black">{pendingJobs}</p>
        </div>
        <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/60">Active Wholesale Partners</p>
          <p className="mt-4 text-3xl font-black text-black">{activeWholesalePartners}</p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {MODE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-black text-white'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
        ) : null}

        {isLoading ? (
          <div className="rounded-3xl border border-black/10 bg-slate-50 p-6 text-center text-sm text-slate-700">Loading orders...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm text-slate-800 sm:text-base">
              <thead>
                <tr className="bg-slate-100 text-left text-[11px] uppercase tracking-[0.2em] text-slate-600 sm:text-xs">
                  <th className="border-b border-slate-200 px-3 py-3 sm:px-4">Order Ref</th>
                  <th className="border-b border-slate-200 px-3 py-3 sm:px-4">Date</th>
                  <th className="border-b border-slate-200 px-3 py-3 sm:px-4">Type</th>
                  <th className="border-b border-slate-200 px-3 py-3 sm:px-4">Customer / Store</th>
                  <th className="border-b border-slate-200 px-3 py-3 sm:px-4">Order Summary</th>
                  <th className="border-b border-slate-200 px-3 py-3 sm:px-4">Amount</th>
                  <th className="border-b border-slate-200 px-3 py-3 sm:px-4">Status</th>
                  <th className="border-b border-slate-200 px-3 py-3 sm:px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-sm text-slate-500 sm:px-4">
                      No orders found for this view.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const artworkUrl = getArtworkUrl(order);
                    const whatsappNumber = getCustomerWhatsapp(order);
                    return (
                      <tr key={order.orderId} className="border-b border-slate-200 last:border-b-0">
                        <td className="px-3 py-4 sm:px-4">
                          <div className="font-semibold text-slate-900">#{order.orderId}</div>
                        </td>
                        <td className="px-3 py-4 sm:px-4">
                          <div>{order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}</div>
                        </td>
                        <td className="px-3 py-4 sm:px-4 capitalize">{order.mode}</td>
                        <td className="px-3 py-4 sm:px-4">{getCustomerName(order)}</td>
                        <td className="px-3 py-4 sm:px-4 max-w-[220px] break-words text-slate-600">{getOrderSummary(order)}</td>
                        <td className="px-3 py-4 sm:px-4 font-semibold">{formatCurrency(order.pricing?.totalAmount)}</td>
                        <td className="px-3 py-4 sm:px-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.12em] ${getStatusBadgeClasses(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-3 py-4 sm:px-4 space-y-2">
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            <button
                              type="button"
                              disabled={!artworkUrl}
                              onClick={() => artworkUrl && window.open(artworkUrl, '_blank')}
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              View Artwork
                            </button>
                            <select
                              value={order.status}
                              onChange={(event) => updateOrderStatus(order.orderId, event.target.value as Status)}
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                              disabled={updatingOrderId === order.orderId}
                            >
                              {STATUS_OPTIONS.map((statusOption) => (
                                <option key={statusOption} value={statusOption}>
                                  {statusOption}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={!whatsappNumber}
                              onClick={() =>
                                whatsappNumber && window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`, '_blank')
                              }
                              className="rounded-2xl border border-slate-200 bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              WhatsApp Customer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
