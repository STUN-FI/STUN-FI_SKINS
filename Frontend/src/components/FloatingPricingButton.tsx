'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formatCurrency } from '../lib/pricing';

type SummaryItem = {
  label: string;
  price: number;
};

type FloatingPricingButtonProps = {
  price: number | null;
  summaryItems?: SummaryItem[];
  customerName?: string;
  customerPhone?: string;
  customerCategory?: string;
};

export default function FloatingPricingButton({ 
  price, 
  summaryItems = [],
  customerName,
  customerPhone,
  customerCategory,
}: FloatingPricingButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const previousPriceRef = useRef<number | null>(price);

  useEffect(() => {
    if (price !== null && previousPriceRef.current !== null && previousPriceRef.current !== price) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 400);
    }
    previousPriceRef.current = price;
  }, [price]);

  const scrollToPricing = useCallback(() => {
    const target = document.getElementById('price-section') ?? document.getElementById('wholesale');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleToggle = useCallback(() => {
    setIsOpen((current) => !current);
  }, []);

  return (
    <>
      {isOpen ? (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={() => setIsOpen(false)} aria-hidden="true" />
      ) : null}

      <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-50 sm:right-6" style={{ width: 'min(24rem, calc(100vw - 1.5rem))' }}>
        <div
          className="pointer-events-none absolute bottom-0 right-0 w-full transition-all duration-300"
          style={{
            transform: isOpen ? 'translateY(0)' : 'translateY(calc(100% + 0.5rem))',
            opacity: isOpen ? 1 : 0,
          }}
        >
          <div className="pointer-events-auto mt-3 overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2f7777]">Order summary</p>
                <h3 className="mt-1 text-lg font-black tracking-[-0.03em] text-black">Your skin</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close order summary"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-[#f7f7f5] text-black transition hover:border-black/30"
              >
                <i className="bx bx-x text-xl" aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[65vh] space-y-4 overflow-y-auto p-4">
              {/* Customer Details Section */}
              {(customerName || customerPhone || customerCategory) && (
                <div className="space-y-2 pb-4 border-b border-black/10">
                  {customerName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-black/60">Name</span>
                      <span className="font-semibold text-black">{customerName}</span>
                    </div>
                  )}
                  {customerPhone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-black/60">Phone</span>
                      <span className="font-semibold text-black">{customerPhone}</span>
                    </div>
                  )}
                  {customerCategory && (
                    <div className="flex justify-between text-sm">
                      <span className="text-black/60">Category</span>
                      <span className="font-semibold text-black capitalize">{customerCategory}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Pricing Items Section */}
              {summaryItems.length > 0 ? (
                <div className="space-y-2">
                  {summaryItems.map((item, index) => {
                    const isAdjustment = item.price < 0;
                    const isLast = index === summaryItems.length - 1;
                    return (
                      <div
                        key={`${item.label}-${index}`}
                        className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition text-sm ${
                          isAdjustment
                            ? 'border-green-200 bg-green-50'
                            : 'border-black/10 bg-white'
                        } ${isLast ? 'border-t-2 border-black/20 mt-3 pt-4' : ''}`}
                      >
                        <span className={`${
                          isAdjustment ? 'text-green-700 font-medium' : 'text-black/80'
                        }`}>
                          {item.label}
                        </span>
                        <span
                          className={`font-semibold ${
                            isAdjustment ? 'text-green-700' : 'text-black'
                          }`}
                        >
                          {item.price >= 0 ? formatCurrency(item.price) : `- ${formatCurrency(Math.abs(item.price))}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/15 bg-[#fafafa] px-4 py-4 text-sm text-black/60">
                  No items selected yet
                </div>
              )}

              {/* Total Section */}
              {typeof price === 'number' ? (
                <div className="mt-4 border-t border-black/10 pt-4">
                  <div className="flex flex-col gap-2">
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-black/50">Total</div>
                    <div className="text-2xl font-black tracking-[-0.03em] text-black">{formatCurrency(price)}</div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsOpen((current) => !current);
            if (!isOpen) {
              scrollToPricing();
            }
          }}
          aria-label={price !== null ? `View current price ${formatCurrency(price)}` : 'View order summary'}
          className={`relative z-50 block w-full min-h-12 rounded-full bg-black px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-black/20 transition hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#2f8f8f] ${
            isAnimating ? 'animate-price-pulse' : ''
          }`}
        >
          {price !== null ? `Review Order · ${formatCurrency(price)}` : 'Review Order'}
        </button>
      </div>
    </>
  );
}
