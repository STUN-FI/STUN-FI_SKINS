'use client';

import React from 'react';

type HelpModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold">Which laptop parts are these?</h3>
          <button onClick={onClose} className="ml-4 rounded-full bg-black/5 px-3 py-1 text-sm">Close</button>
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
