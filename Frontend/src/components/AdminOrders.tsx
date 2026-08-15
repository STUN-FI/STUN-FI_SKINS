'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import BrandedLogo from './BrandedLogo';
import OrderDetailModal from './admin/OrderDetailModal';

const ADMIN_API_BASE = '/api/admin/orders';
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_production', label: 'In Production' },
  { value: 'completed', label: 'Completed' },
] as const;

type Status = (typeof STATUS_OPTIONS)[number]['value'];

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

type SurfaceItem = {
  name?: string;
  imageUrl?: string;
  monogramText?: string;
};

type LineItem = {
  label: string;
  price: number;
};

type Order = {
  orderId: string;
  mode: 'individual' | 'wholesale';
  createdAt?: string;
  clientName?: string;
  whatsappNumber?: string;
  deviceModel?: string;
  category?: string;
  surfaces?: SurfaceItem[];
  items?: LineItem[];
  totalAmount?: number;
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

const getArtworkItems = (order: Order) => {
  const designs = order.retailDetails?.surfaceDesigns ?? order.surfaces;
  const items = Array.isArray(designs) ? designs : designs ? Object.values(designs) : [];
  return items
    .filter((item): item is { surface?: string; name?: string; imageUrl?: string } =>
      Boolean(item && typeof item === 'object' && typeof item.imageUrl === 'string' && item.imageUrl),
    )
    .map((item) => ({
      label: item.surface
        ? String(item.surface).replace(/-/g, ' ')
        : item.name
        ? String(item.name).replace(/-/g, ' ')
        : 'Artwork',
      url: item.imageUrl,
    }));
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
  const fallbackName = order.clientName || order.customerInfo.contactName || order.customerInfo.storeName || 'Customer';
  return order.mode === 'wholesale'
    ? order.customerInfo.storeName || order.customerInfo.contactName || order.clientName || 'Wholesale Partner'
    : order.customerInfo.contactName || order.customerInfo.storeName || order.clientName || 'Retail Customer';
};

const getCustomerWhatsapp = (order: Order) => {
  return order.customerInfo?.whatsappNumber?.replace(/\s+/g, '') || order.whatsappNumber?.replace(/\s+/g, '') || '';
};

const getDeviceModel = (order: Order) => {
  if (order.mode === 'wholesale') {
    return 'Wholesale';
  }
  const device = order.deviceModel || order.retailDetails?.device || 'Unknown';
  return String(device)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusBadgeClasses = (status: Status) => {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'in_production':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'completed':
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(ADMIN_API_BASE, { cache: 'no-store' });
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
      .filter((order) => ['confirmed', 'completed'].includes(order.status))
      .reduce((sum, order) => sum + (order.pricing?.totalAmount ?? 0), 0);
  }, [orders]);

  const pendingJobs = useMemo(() => {
    return orders.filter((order) => order.status !== 'completed').length;
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
      const response = await fetch(`${ADMIN_API_BASE}/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to update status');
      }
      setOrders((current) => current.map((order) => (order.orderId === orderId ? data.order : order)));
      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder(data.order);
      }
      return data.order as Order;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to update order status');
      return null;
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`${ADMIN_API_BASE}/${orderId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'Unable to delete order');
      }
      setOrders((current) => current.filter((order) => order.orderId !== orderId));
      closeDetails();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const closeDetails = () => {
    setIsDetailOpen(false);
    setSelectedOrder(null);
  };

  useEffect(() => {
    if (isDetailOpen && detailsRef.current) {
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  }, [isDetailOpen]);

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
                  <th className="border-b border-slate-200 px-3 py-3 sm:px-4">Customer Name</th>
                  <th className="border-b border-slate-200 px-3 py-3 sm:px-4">WhatsApp</th>
                  <th className="border-b border-slate-200 px-3 py-3 sm:px-4">Device Model</th>
                  <th className="border-b border-slate-200 px-3 py-3 sm:px-4">Order Mode</th>
                  <th className="border-b border-slate-200 px-3 py-3 sm:px-4">Amount</th>
                  <th className="border-b border-slate-200 px-3 py-3 sm:px-4">Artwork Files</th>
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
                    const whatsappNumber = getCustomerWhatsapp(order);
                    const artworkItems = getArtworkItems(order);
                    return (
                      <tr key={order.orderId} className="border-b border-slate-200 last:border-b-0">
                        <td className="px-3 py-4 sm:px-4">
                          <div className="font-semibold text-slate-900">#{order.orderId}</div>
                        </td>
                        <td className="px-3 py-4 sm:px-4">{getCustomerName(order)}</td>
                        <td className="px-3 py-4 sm:px-4">
                          {whatsappNumber ? (
                            <a
                              href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 underline"
                            >
                              {whatsappNumber}
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="px-3 py-4 sm:px-4">{getDeviceModel(order)}</td>
                        <td className="px-3 py-4 sm:px-4">{order.mode === 'individual' ? 'Individual' : 'Wholesale'}</td>
                        <td className="px-3 py-4 sm:px-4 font-semibold">{formatCurrency(order.pricing?.totalAmount)}</td>
                        <td className="px-3 py-4 sm:px-4">
                          {artworkItems.length > 0 ? (
                            <div className="grid gap-2">
                              {artworkItems.map((artwork, index) => (
                                <a
                                  key={`${order.orderId}-${index}`}
                                  href={artwork.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition hover:border-slate-300"
                                >
                                  Download {artwork.label}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">No artwork</span>
                          )}
                        </td>
                        <td className="px-3 py-4 sm:px-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.12em] ${getStatusBadgeClasses(order.status)}`}>
                            {STATUS_OPTIONS.find((option) => option.value === order.status)?.label ?? order.status}
                          </span>
                        </td>
                        <td className="px-3 py-4 sm:px-4 space-y-2">
                          <div className="grid gap-2">
                            <select
                              value={order.status}
                              onChange={(event) => updateOrderStatus(order.orderId, event.target.value as Status)}
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                              disabled={updatingOrderId === order.orderId}
                            >
                              {STATUS_OPTIONS.map((statusOption) => (
                                <option key={statusOption.value} value={statusOption.value}>
                                  {statusOption.label}
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
                              WhatsApp
                            </button>
                            <button
                              type="button"
                              onClick={() => openDetails(order)}
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition hover:border-slate-300"
                            >
                              View Details
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

      <div ref={detailsRef}>
        <OrderDetailModal
          order={selectedOrder}
          isOpen={isDetailOpen}
          onClose={closeDetails}
          onStatusChange={updateOrderStatus}
          onDelete={deleteOrder}
        />
      </div>
    </div>
  );
}
