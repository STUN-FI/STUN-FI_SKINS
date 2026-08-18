'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { formatCurrency } from '../lib/pricing';

type ReceiptModalProps = {
  isOpen: boolean;
  orderId: string;
  clientName: string;
  deviceModel: string;
  date: string;
  category: string;
  lineItems: Array<{ label: string; price: number }>;
  totalPrice: number;
  surfacePreviews?: Array<{ label: string; previewUrl: string }>;
  onClose: () => void;
};

export default function ReceiptModal({
  isOpen,
  orderId,
  clientName,
  deviceModel,
  date,
  category,
  lineItems,
  totalPrice,
  surfacePreviews = [],
  onClose,
}: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const receiptMessage = useMemo(
    () =>
      `STUN-FI order receipt for ${clientName} (${deviceModel}) - ${formatCurrency(totalPrice)}. Order ID ${orderId}.`,
    [clientName, deviceModel, orderId, totalPrice],
  );

  const handleDownload = useCallback(async () => {
    if (!receiptRef.current) return;
    const dataUrl = await htmlToImage.toPng(receiptRef.current, { backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `${orderId}-receipt.png`;
    link.href = dataUrl;
    link.click();
  }, [orderId]);

  const handleShare = useCallback(async () => {
    if (!receiptRef.current) return;
    setIsSharing(true);

    try {
      const dataUrl = await htmlToImage.toPng(receiptRef.current, { backgroundColor: '#ffffff' });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${orderId}-receipt.png`, { type: 'image/png' });
      const shareData = {
        files: [file],
        title: 'STUN-FI Order Receipt',
        text: receiptMessage,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      window.alert('Your browser does not support direct image sharing. Please download the receipt and share it manually to WhatsApp.');
    } catch (error) {
      console.error(error);
      window.alert('Unable to share the receipt image directly. Please download it and share manually to WhatsApp.');
    } finally {
      setIsSharing(false);
    }
  }, [orderId, receiptMessage]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl md:max-w-3xl h-[calc(100vh-2rem)] overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:bg-neutral-900 sm:right-4 sm:top-4"
          aria-label="Close receipt"
        >
          <i className="bx bx-x" />
        </button>

        <div className="flex min-h-0 h-full flex-col overflow-hidden">
          <div className="overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            <div ref={receiptRef} className="space-y-6 rounded-[2rem] border border-black/10 bg-[#f9fafb] p-4 sm:p-5">
              <div className="flex flex-col gap-4 rounded-[1.75rem] border border-black/10 bg-[#f8fafc] p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/50">Stun-Fi</p>
                    <h1 className="mt-2 text-2xl font-black text-black sm:text-3xl">Order Receipt</h1>
                  </div>
                  <span className="rounded-full bg-black px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">{orderId}</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/50">Client</p>
                  <p className="mt-2 text-base font-semibold text-black sm:text-lg">{clientName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/50">Date</p>
                  <p className="mt-2 text-base font-semibold text-black sm:text-lg">{date}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/50">Device model</p>
                  <p className="mt-2 text-base font-semibold text-black sm:text-lg">{deviceModel}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/50">Category</p>
                  <p className="mt-2 text-base font-semibold text-black sm:text-lg">{category}</p>
                </div>
              </div>

              {surfacePreviews.length > 0 && (
                <div className="rounded-[1.5rem] bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-4 text-sm font-semibold text-black">Surface previews</div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {surfacePreviews.map((item) => (
                      <div key={item.label} className="rounded-[1.5rem] border border-black/10 bg-[#f8fafc] p-3 text-center">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-black/50">{item.label}</p>
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={`${item.label} preview`}
                            className="mx-auto h-28 w-full max-w-[160px] rounded-3xl object-cover"
                          />
                        ) : (
                          <div className="mx-auto flex h-28 w-full max-w-[160px] items-center justify-center rounded-3xl border border-dashed border-black/10 bg-[#f2f4f7] text-xs text-black/50">
                            No artwork selected
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-3">
                  <span className="text-sm font-semibold text-black">Description</span>
                  <span className="text-sm font-semibold text-black">Price</span>
                </div>
                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="flex items-center justify-between text-sm text-black/80">
                      <span>{item.label}</span>
                      <span>{formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4 text-base font-semibold text-black">
                  <span>Total</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-black/10 bg-white p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-3xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-900"
              >
                Download Image
              </button>
              <button
                type="button"
                onClick={handleShare}
                disabled={isSharing}
                className="rounded-3xl border border-black px-5 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSharing ? 'Sharing…' : 'Share to WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
