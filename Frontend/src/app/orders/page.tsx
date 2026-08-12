'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ReceiptModal from '@/components/ReceiptModal';
import type { Order, Status } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/orders';

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
        return 'bg-blue-100 text-blue-800';
      case 'in_production':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Order History</h1>
            <p className="mt-2 text-slate-600">View your previous orders and receipts</p>
          </div>
          <Link
            href="/"
            className="inline-flex rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
          >
            New Order
          </Link>
        </div>

        {/* Search Form */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-slate-900">
                Search by phone number or name
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter your phone number or name..."
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Results */}
        {hasSearched && !isLoading && orders.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm font-medium text-slate-600">Found {orders.length} order(s)</div>

            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Order ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Device</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Total</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-b border-slate-200 transition hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.orderId}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {order.mode === 'wholesale'
                          ? 'Wholesale'
                          : String(order.deviceModel || order.retailDetails?.device || 'Custom')
                              .replace(/-/g, ' ')
                              .replace(/\b\w/g, (char) => char.toUpperCase())}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                        {formatCurrency(order.totalAmount ?? order.pricing?.totalAmount ?? 0)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${getStatusBadgeColor(order.status as OrderStatus)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewReceipt(order)}
                          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
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
                <div key={order._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <div className="font-medium text-slate-900">{order.orderId}</div>
                      <div className="text-xs text-slate-600">{formatDate(order.createdAt)}</div>
                    </div>
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${getStatusBadgeColor(order.status as OrderStatus)}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="mb-3 space-y-1 text-sm">
                    <div className="text-slate-600">
                      Device:{' '}
                      <span className="font-medium text-slate-900">
                        {order.mode === 'wholesale'
                          ? 'Wholesale'
                          : String(order.deviceModel || order.retailDetails?.device || 'Custom')
                              .replace(/-/g, ' ')
                              .replace(/\b\w/g, (char) => char.toUpperCase())}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      Total: <span className="font-medium text-slate-900">{formatCurrency(order.totalAmount ?? order.pricing?.totalAmount ?? 0)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewReceipt(order)}
                    className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    View Receipt
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {hasSearched && !isLoading && orders.length === 0 && !error && (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">No orders found. Try searching with a different phone number or name.</p>
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && orders.length === 0 && !error && (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">Enter your phone number or name to view your order history</p>
          </div>
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
    </div>
  );
}
