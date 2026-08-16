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
    <main className="scroll-smooth min-h-screen overflow-x-hidden bg-[#f3f3f1] px-4 py-10 text-black md:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 rounded-[2.5rem] border border-black/10 bg-white/90 p-5 sm:p-6 shadow-glow backdrop-blur"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-14 w-14 min-w-[3.5rem] items-center justify-center rounded-3xl bg-black p-2 sm:h-16 sm:w-16">
                <Image src="/img/stunfi-logo-white.png" alt="STUN-FI logo" className="h-full w-full object-contain" width={64} height={64} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-black">STUN-FI SKINS</h1>
                <p className="mt-0.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.24em] text-black/70">Order History</p>
              </div>
            </div>
            <Link
              href="/"
              className="rounded-2xl border border-black/20 bg-black/5 px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/10 hover:border-black/30 sm:px-5 sm:py-2.5"
            >
              New Order
            </Link>
          </div>
        </motion.header>

        {/* Description */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 rounded-[2.5rem] border border-black/10 bg-white/90 p-6 sm:p-8 shadow-glow backdrop-blur"
        >
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-black/60">View your orders</p>
            <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-[-0.04em] text-black">
              Search Your Order History
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-black/70 sm:text-base">
              Enter your phone number or name to find and view your previous orders and receipts.
            </p>
          </div>
        </motion.section>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 rounded-[2.5rem] border border-black/10 bg-white/90 p-6 sm:p-8 shadow-glow backdrop-blur"
        >
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-3">
              <label htmlFor="search" className="block text-sm font-semibold text-black uppercase tracking-[0.1em]">
                Phone Number or Name
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="08012345678 or John Test"
                  className="flex-1 rounded-2xl border border-black/10 bg-black/2 px-5 py-3 text-sm text-black placeholder-black/40 transition focus:border-black/30 focus:outline-none focus:ring-1 focus:ring-black/20"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700 backdrop-blur"
          >
            <i className="bx bx-error-circle text-base" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Results */}
        {hasSearched && !isLoading && orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-sm font-semibold text-black uppercase tracking-[0.1em]">
              Found {orders.length} order{orders.length !== 1 ? 's' : ''}
            </div>

            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto rounded-2xl border border-black/10 bg-white/90 shadow-glow backdrop-blur md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/10 bg-black/2">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.1em] text-black/80">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.1em] text-black/80">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.1em] text-black/80">Device</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.1em] text-black/80">Total</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.1em] text-black/80">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.1em] text-black/80">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, idx) => (
                    <tr key={order._id} className={`transition hover:bg-black/2 ${idx !== orders.length - 1 ? 'border-b border-black/10' : ''}`}>
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
                          {order.status}
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
                    </tr>
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
                  className="rounded-2xl border border-black/10 bg-white/90 p-4 shadow-glow backdrop-blur transition hover:border-black/20"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-black">{order.orderId}</div>
                      <div className="text-xs text-black/60 font-medium mt-1">{formatDate(order.createdAt)}</div>
                    </div>
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.1em] ${getStatusBadgeColor(order.status as OrderStatus)}`}
                    >
                      {order.status}
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
                    className="w-full rounded-2xl bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
                  >
                    View Receipt
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
            className="rounded-2xl border border-black/10 bg-white/90 p-12 text-center shadow-glow backdrop-blur"
          >
            <p className="text-black/70">No orders found. Try searching with a different phone number or name.</p>
          </motion.div>
        )}

        {/* Initial State */}
        {!hasSearched && orders.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-black/10 bg-white/90 p-12 text-center shadow-glow backdrop-blur"
          >
            <p className="text-black/70">Enter your phone number or name above to view your order history</p>
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
