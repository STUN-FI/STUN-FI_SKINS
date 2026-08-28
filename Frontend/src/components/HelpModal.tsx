'use client';

import React, { useEffect, useRef } from 'react';

type HelpModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6" role="presentation">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-lg sm:p-6" role="dialog" aria-modal="true" aria-labelledby="help-modal-title">
        <div className="flex items-start justify-between">
          <h3 id="help-modal-title" className="text-lg font-bold">Which laptop parts are these?</h3>
          <button ref={closeButtonRef} type="button" onClick={onClose} className="ml-4 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-black/5 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2f8f8f]">Close</button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 text-center">
            <div className="text-3xl text-amber-400">
              <i className="bx bx-laptop" />
            </div>
            <div className="font-semibold">Top Lid</div>
            <div className="text-sm text-black/60">Outer top cover with the laptop logo.</div>
          </div>
          <div className="space-y-2 text-center">
            <div className="text-3xl text-amber-400">
              <i className="bx bx-keyboard" />
            </div>
            <div className="font-semibold">Keyboard Deck</div>
            <div className="text-sm text-black/60">Inside palm rest & area around trackpad.</div>
          </div>
          <div className="space-y-2 text-center">
            <div className="text-3xl text-amber-400">
              <i className="bx bx-hard-drive" />
            </div>
            <div className="font-semibold">Bottom Base</div>
            <div className="text-sm text-black/60">Underneath the laptop body.</div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-semibold">3-step order guide</h4>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-black/70">
            <li>Select laptop model & upload artwork/text for desired parts.</li>
            <li>Click &quot;Place Order&quot; to preview pricing.</li>
            <li>Tap &quot;Share to WhatsApp&quot; on the receipt modal to submit order for production.</li>
          </ol>
        </div>

      </div>
    </div>
  );
}
