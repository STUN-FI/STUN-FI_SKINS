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
      className={`fixed bottom-6 right-6 z-40 rounded-full bg-black px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-black/20 transition hover:bg-neutral-900 ${
        isAnimating ? 'animate-price-pulse' : ''
      }`}
    >
      {price !== null ? `View Price · ${formatCurrency(price)}` : 'View Price'}
    </button>
  );
}
