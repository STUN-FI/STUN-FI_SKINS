'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ReceiptModal from '@/components/ReceiptModal';
import { getApiBaseUrl, type Order, type Status } from '@/lib/api';

const API_BASE = getApiBaseUrl();

type OrderStatus = Status;

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError('Please enter a phone number or name');
      return;
    }

    setIsLoading(true);
    setError('');
    setOrders([]);
    setHasSearched(true);

    try {
      const response = await fetch(`${API_BASE}/customer/${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to fetch orders');
      }

      setOrders(data.orders || []);
      if ((!data.orders || data.orders.length === 0) && response.ok) {
        setError('No orders found for this search');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to fetch orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReceipt = (order: Order) => {
    setSelectedOrder(order);
    setIsReceiptOpen(true);
  };

  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800';
      case 'in_production':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
        return 'bg-sky-100 text-sky-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: OrderStatus) => status.replace('_', ' ');

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#efefe9] px-4 py-6 text-black sm:px-6 sm:py-8 md:px-8 lg:py-12">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(0,0,0,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.045)_1px,transparent_1px)] [background-size:3rem_3rem]" />
      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 border-b border-black/15 pb-5 sm:mb-12 sm:pb-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-12 w-12 min-w-[3rem] items-center justify-center rounded-2xl bg-black p-2 shadow-[0_12px_24px_rgba(0,0,0,0.14)] sm:h-14 sm:w-14">
                <Image src="/img/stunfi-logo-white.png" alt="STUN-FI logo" className="h-full w-full object-contain" width={64} height={64} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-black tracking-[-0.04em] sm:text-xl">STUN-FI SKINS</h1>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-black/55 sm:text-xs">Order tracking</p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex min-h-10 items-center gap-2 border border-black/20 bg-white/60 px-4 text-xs font-bold uppercase tracking-[0.14em] text-black transition hover:border-black/40 hover:bg-white sm:px-5"
            >
              <i className="bx bx-plus text-base" aria-hidden="true" /> New order
            </Link>
          </div>
        </motion.header>

        {/* Description */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5 max-w-3xl sm:mb-8"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#2f7777] sm:text-xs">STUN-FI SKINS / CUSTOMER HUB</p>
          <h2 className="mt-3 text-[clamp(2.5rem,7vw,5.8rem)] font-black uppercase leading-[0.88] tracking-[-0.07em] text-black">Find your order.</h2>
          <p className="mt-5 max-w-xl text-sm font-medium leading-6 text-black/60 sm:text-base">Search by the phone number or name used at checkout to see progress, totals, and receipts.</p>
        </motion.section>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 border-y border-black/15 bg-white/55 py-4 backdrop-blur sm:mb-10 sm:py-5"
        >
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <label htmlFor="search" className="block text-[10px] font-bold uppercase tracking-[0.18em] text-black/60">
                  Phone Number or Name
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="08012345678 or John Test"
                  className="min-h-12 w-full border border-black/15 bg-white px-4 text-sm text-black placeholder-black/35 transition focus:border-[#2f7777] focus:outline-none focus:ring-4 focus:ring-[#66cccc]/20"
                  />
                  <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-black px-6 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#2f7777] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isLoading ? <><i className="bx bx-loader-alt animate-spin text-base" aria-hidden="true" /> Searching</> : <><i className="bx bx-search text-base" aria-hidden="true" /> Search orders</>}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-2 border border-red-200 bg-red-50/80 p-4 text-sm text-red-700 backdrop-blur"
          >
            <i className="bx bx-error-circle" /> {error}
          </motion.div>
        )}

        {/* Results */}
        {hasSearched && !isLoading && orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-end justify-between gap-4 border-b border-black/15 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2f7777]">Search results</p>
                <p className="mt-1 text-sm font-semibold text-black">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
              </div>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45 sm:block">Select an order to view receipt</span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto border-y border-black/15 bg-white/65 backdrop-blur md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/10 bg-black/2">
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-black/55">Order ID</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-black/55">Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-black/55">Device</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.16em] text-black/55">Total</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-black/55">Status</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-black/55">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, idx) => (
                    <motion.tr key={order._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} className={`transition hover:bg-[#e9f6f5] ${idx !== orders.length - 1 ? 'border-b border-black/10' : ''}`}>
                      <td className="px-6 py-4 text-sm font-semibold text-black">{order.orderId}</td>
                      <td className="px-6 py-4 text-sm text-black/70">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-black/70">
                        {order.mode === 'wholesale'
                          ? 'Wholesale'
                          : String(order.deviceModel || order.retailDetails?.device || 'Custom')
                              .replace(/-/g, ' ')
                              .replace(/\b\w/g, (char) => char.toUpperCase())}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-black">
                        {formatCurrency(order.totalAmount ?? order.pricing?.totalAmount ?? 0)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${getStatusBadgeColor(order.status as OrderStatus)}`}
                        >
                          {getStatusLabel(order.status as OrderStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewReceipt(order)}
                          className="text-sm font-semibold text-black/70 transition hover:text-black"
                        >
                          View
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 md:hidden">
              {orders.map((order) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-black/12 bg-white/70 p-5 shadow-[0_16px_30px_rgba(0,0,0,0.06)] backdrop-blur transition hover:-translate-y-1 hover:border-[#66cccc]"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-black">{order.orderId}</div>
                      <div className="text-xs text-black/60 font-medium mt-1">{formatDate(order.createdAt)}</div>
                    </div>
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.1em] ${getStatusBadgeColor(order.status as OrderStatus)}`}
                    >
                      {getStatusLabel(order.status as OrderStatus)}
                    </span>
                  </div>
                  <div className="mb-3 space-y-1.5 text-sm">
                    <div className="text-black/70">
                      Device:{' '}
                      <span className="font-semibold text-black">
                        {order.mode === 'wholesale'
                          ? 'Wholesale'
                          : String(order.deviceModel || order.retailDetails?.device || 'Custom')
                              .replace(/-/g, ' ')
                              .replace(/\b\w/g, (char) => char.toUpperCase())}
                      </span>
                    </div>
                    <div className="text-black/70">
                      Total: <span className="font-semibold text-black">{formatCurrency(order.totalAmount ?? order.pricing?.totalAmount ?? 0)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewReceipt(order)}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-black px-4 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#2f7777]"
                  >
                    View receipt <i className="bx bx-arrow-up-right text-base" aria-hidden="true" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {hasSearched && !isLoading && orders.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-y border-black/15 bg-white/55 px-6 py-16 text-center backdrop-blur"
          >
            <i className="bx bx-search-alt-2 text-4xl text-black/20" aria-hidden="true" />
            <p className="mt-4 text-sm font-medium text-black/65">No orders found. Try a different phone number or name.</p>
          </motion.div>
        )}

        {/* Initial State */}
        {!hasSearched && orders.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-y border-black/15 bg-white/55 px-6 py-16 text-center backdrop-blur"
          >
            <i className="bx bx-receipt text-4xl text-[#2f7777]/60" aria-hidden="true" />
            <p className="mt-4 text-sm font-medium text-black/65">Your order history will appear here after you search.</p>
          </motion.div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedOrder && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          orderId={selectedOrder.orderId}
          clientName={selectedOrder.customerInfo?.contactName || selectedOrder.clientName || 'Customer'}
          deviceModel={
            selectedOrder.mode === 'wholesale'
              ? 'Wholesale'
              : String(selectedOrder.deviceModel || selectedOrder.retailDetails?.device || 'Custom')
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, (char) => char.toUpperCase())
          }
          date={formatDate(selectedOrder.createdAt)}
          category={selectedOrder.category || 'Custom'}
          lineItems={selectedOrder.items || []}
          totalPrice={selectedOrder.totalAmount ?? selectedOrder.pricing?.totalAmount ?? 0}
          surfacePreviews={
            selectedOrder.surfaces?.map((surface) => ({
              label: surface.name || 'Surface',
              previewUrl: surface.imageUrl || '',
            })) || []
          }
          onClose={() => {
            setIsReceiptOpen(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </main>
  );
}
