'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formatCurrency } from '../lib/pricing';

type FloatingPricingButtonProps = {
  price: number | null;
};

export default function FloatingPricingButton({ price }: FloatingPricingButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
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

  return (
    <button
      type="button"
      onClick={scrollToPricing}
      aria-label={price !== null ? `View current price ${formatCurrency(price)}` : 'View order summary'}
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-40 min-h-12 rounded-full bg-black px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-black/20 transition hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#66cccc] sm:bottom-6 sm:left-auto sm:right-6 sm:min-h-0 sm:max-w-[calc(100vw-2rem)] ${
        isAnimating ? 'animate-price-pulse' : ''
      }`}
    >
      {price !== null ? `Review Order · ${formatCurrency(price)}` : 'Review Order'}
    </button>
  );
}
