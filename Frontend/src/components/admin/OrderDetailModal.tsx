'use client';

import { useMemo, useState } from 'react';
import ReceiptModal from '../ReceiptModal';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_production', label: 'In Production' },
  { value: 'completed', label: 'Completed' },
] as const;

type Status = (typeof STATUS_OPTIONS)[number]['value'];

type RetailDetails = {
  device?: string;
  coverage?: string[];
  finish?: string;
  customText?: string;
  surfaceDesigns?: Array<Record<string, any>> | Record<string, any> | any;
};

type WholesaleDetails = {
  standardQty?: number;
  shinyStonesQty?: number;
  totalPaidUnits?: number;
  totalReceivedUnits?: number;
  freeBonusUnits?: number;
  technicianRequested?: boolean;
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

type Order = {
  orderId: string;
  mode: 'individual' | 'wholesale';
  createdAt?: string;
  clientName?: string;
  whatsappNumber?: string;
  deviceModel?: string;
  category?: string;
  surfaces?: SurfaceItem[];
  items?: Array<{ label: string; price: number }>;
  totalAmount?: number;
  customerInfo: CustomerInfo;
  retailDetails?: RetailDetails;
  wholesaleDetails?: WholesaleDetails;
  pricing: { totalAmount: number; currency?: string };
  status: Status;
};

type OrderDetailModalProps = {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, status: Status) => Promise<Order | null>;
  onDelete?: (orderId: string) => Promise<void>;
};

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number') return '₦0';
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
};

const normalizeSurfaceLabel = (surface?: string, index?: number) => {
  if (!surface) {
    return index === 0 ? 'Top Lid' : index === 1 ? 'Keyboard Deck' : index === 2 ? 'Bottom Base' : `Surface ${index ?? 1}`;
  }

  const lower = surface.toLowerCase();
  if (lower.includes('top')) return 'Top Lid';
  if (lower.includes('keyboard')) return 'Keyboard Deck';
  if (lower.includes('bottom')) return 'Bottom Base';
  return surface.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const getSurfaceDesigns = (order: Order) => {
  const designs = order.retailDetails?.surfaceDesigns ?? order.surfaces;
  const rawItems = Array.isArray(designs) ? designs : designs ? Object.values(designs) : [];
  return rawItems
    .filter((item): item is { surface?: string; name?: string; imageUrl?: string; customText?: string; monogramText?: string } =>
      Boolean(item && typeof item === 'object' && typeof (item.imageUrl ?? item.imageUrl) === 'string' && (item.imageUrl ?? item.imageUrl)),
    )
    .map((item, index) => {
      const imageUrl = (item as any).imageUrl || '';
      const customText = (item as any).customText ?? (item as any).monogramText ?? '';
      return {
        surface: item.surface ? String(item.surface) : (item as any).name ? String((item as any).name) : undefined,
        imageUrl,
        customText: customText ? String(customText) : '',
        label: normalizeSurfaceLabel(item.surface ? String(item.surface) : (item as any).name ? String((item as any).name) : undefined, index),
      };
    });
};

const getReceiptLineItems = (order: Order) => {
  if (order.mode === 'wholesale' && order.wholesaleDetails) {
    const paid = order.wholesaleDetails.totalPaidUnits ?? order.wholesaleDetails.standardQty ?? 0;
    const shiny = order.wholesaleDetails.shinyStonesQty ?? 0;
    const bonus = order.wholesaleDetails.freeBonusUnits ?? 0;
    const unitLabel = `Wholesale sheets${paid === 1 ? '' : 's'}`;
    return [
      { label: unitLabel, price: order.pricing.totalAmount },
      ...(shiny ? [{ label: 'Shiny stones surcharge', price: 0 }] : []),
      ...(bonus ? [{ label: 'Bonus units included', price: 0 }] : []),
    ];
  }

  if (order.retailDetails) {
    const coverage = Array.isArray(order.retailDetails.coverage) ? order.retailDetails.coverage : [];
    const coverageLabel = coverage.length === 3 ? 'Full Laptop Package' : coverage.map((item) => String(item).replace(/-/g, ' ')).join(' + ');
    return [
      { label: coverageLabel || 'Custom retail order', price: order.pricing.totalAmount },
      ...(order.retailDetails.customText ? [{ label: 'Monogram / custom text', price: 0 }] : []),
    ];
  }

  return [{ label: 'Order total', price: order.pricing.totalAmount }];
};

export default function OrderDetailModal({ order, isOpen, onClose, onStatusChange, onDelete }: OrderDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<Status>(order?.status ?? 'pending');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const surfaceDesigns = useMemo(() => (order ? getSurfaceDesigns(order) : []), [order]);

  const orderDate = useMemo(() => {
    if (!order?.createdAt) return 'Unknown';
    const date = new Date(order.createdAt);
    return isNaN(date.getTime()) ? order.createdAt : date.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  }, [order?.createdAt]);

  const whatsappNumber = order?.customerInfo?.whatsappNumber?.replace(/\D/g, '') || order?.whatsappNumber?.replace(/\D/g, '') || '';
  const customerName = order ? order.customerInfo?.contactName || order.customerInfo?.storeName || order.clientName || 'Customer' : '';
  const deviceModel = order
    ? order.mode === 'wholesale'
      ? 'Wholesale'
      : String(order.deviceModel || order.retailDetails?.device || 'Unknown')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase())
    : '';

  const lineItems = useMemo(() => {
    if (order?.items?.length) {
      return order.items;
    }
    return order ? getReceiptLineItems(order) : [];
  }, [order]);
  const receiptTotal = order?.totalAmount ?? order?.pricing.totalAmount ?? 0;

  const handleStatusUpdate = async (newStatus: Status) => {
    if (!order) return;
    setIsSaving(true);
    setError('');
    try {
      const updated = await onStatusChange(order.orderId, newStatus);
      if (updated) {
        setSelectedStatus(updated.status);
      } else {
        setSelectedStatus(newStatus);
      }
    } catch (err) {
      setSelectedStatus(order.status);
      setError(err instanceof Error ? err.message : 'Unable to update status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!order || !onDelete) return;
    const confirmed = window.confirm(`Are you sure you want to delete order #${order.orderId}? This action cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    setError('');
    try {
      await onDelete(order.orderId);
      window.alert(`Order #${order.orderId} has been deleted successfully.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete order');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      window.alert('Copied to clipboard');
    } catch (err) {
      window.alert('Unable to copy text.');
    }
  };

  if (!isOpen || !order) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
            aria-label="Close order details"
          >
            ×
          </button>

          <div className="space-y-6 p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Client</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{customerName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Device Model</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{deviceModel}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Order Date</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{orderDate}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Order ID</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">#{order.orderId}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">WhatsApp</p>
                {whatsappNumber ? (
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
                  >
                    Chat on WhatsApp
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No WhatsApp number</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Status</p>
                <select
                  value={selectedStatus}
                  onChange={(event) => handleStatusUpdate(event.target.value as Status)}
                  disabled={isSaving}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
              </div>
              <div className="flex items-end justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex rounded-3xl border border-red-300 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Order'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsReceiptOpen(true)}
                  className="inline-flex rounded-3xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  View Customer Receipt
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Artwork Surfaces</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                  {surfaceDesigns.length} found
                </span>
              </div>

              {surfaceDesigns.length === 0 ? (
                <p className="text-sm text-slate-600">No customized surface artwork available for this order.</p>
              ) : (
                <div className="grid gap-4">
                  {surfaceDesigns.map((surface) => (
                    <div key={surface.imageUrl} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{surface.label}</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">Artwork preview</p>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={surface.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
                          >
                            Download high-res
                          </a>
                          <button
                            type="button"
                            onClick={() => surface.customText ? handleCopyText(surface.customText) : undefined}
                            disabled={!surface.customText}
                            className="rounded-3xl border border-slate-200 bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {surface.customText ? 'Copy monogram' : 'No monogram'}
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-[120px_1fr] sm:items-center">
                        <div className="overflow-hidden rounded-3xl bg-slate-100 p-2">
                          {surface.imageUrl && surface.imageUrl.trim() ? (
                            <img src={surface.imageUrl} alt={`${surface.label} artwork preview`} className="h-28 w-full object-cover rounded-2xl" />
                          ) : (
                            <div className="h-28 w-full flex items-center justify-center rounded-2xl bg-slate-200 text-xs text-slate-600">No artwork</div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Monogram / Custom text</p>
                          <p className="mt-2 min-h-[2rem] rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
                            {surface.customText || 'No monogram text provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <ReceiptModal
            isOpen={isReceiptOpen}
            orderId={order.orderId}
            clientName={customerName}
            deviceModel={deviceModel}
            date={orderDate}
            category={order.mode === 'wholesale' ? 'Wholesale' : 'Retail'}
            lineItems={lineItems}
            totalPrice={receiptTotal}
            onClose={() => setIsReceiptOpen(false)}
          />
        </div>
      </div>
    </>
  );
}
