'use client';

import React, { useEffect, useRef } from 'react';

type LaptopPreviewModalProps = {
  imageUrl: string;
  surface: 'top-lid' | 'keyboard-deck' | 'bottom-base';
  onClose: () => void;
};

const SURFACE_LABELS: Record<LaptopPreviewModalProps['surface'], string> = {
  'top-lid': 'Top Lid',
  'keyboard-deck': 'Keyboard Deck',
  'bottom-base': 'Bottom Base',
};

export default function LaptopPreviewModal({ imageUrl, surface, onClose }: LaptopPreviewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

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
  }, [imageUrl, onClose]);

  if (!imageUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative my-3 max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-[1.5rem] bg-white shadow-2xl sm:my-6 sm:max-h-[calc(100dvh-3rem)] sm:rounded-[2rem]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="laptop-preview-title"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-white transition hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#66cccc]"
          aria-label="Close preview"
        >
          <i className="bx bx-x" />
        </button>

        <div className="px-6 pb-6 pt-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/60">Live preview</p>
          <h2 id="laptop-preview-title" className="mt-2 text-2xl font-black text-black">{SURFACE_LABELS[surface]} surface preview</h2>
          <p className="mt-2 text-sm text-black/70">
            View your uploaded artwork under the laptop surface cutouts and overlay template.
          </p>
        </div>

        <div className="relative mx-3 mb-5 h-[min(420px,52dvh)] overflow-hidden rounded-[1.25rem] bg-black sm:mx-6 sm:mb-6 sm:h-[min(420px,62vh)] sm:rounded-[2rem]">
          <img
            src={imageUrl}
            alt="Uploaded artwork preview"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {surface === 'keyboard-deck' ? (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/2 top-1/2 h-[55%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-[1.8rem] border border-white/20 bg-black/85 shadow-inner">
                <div className="absolute left-5 top-5 right-5 bottom-24 rounded-[1.4rem] border border-white/10 bg-black/80">
                  <div className="grid h-full gap-2 p-4 pt-6">
                    <div className="grid grid-cols-15 gap-2">
                      {Array.from({ length: 15 }).map((_, index) => (
                        <div key={`row1-${index}`} className="h-2 rounded-sm bg-black/70" />
                      ))}
                    </div>
                    <div className="grid grid-cols-15 gap-2">
                      {Array.from({ length: 15 }).map((_, index) => (
                        <div key={`row2-${index}`} className="h-2 rounded-sm bg-black/70" />
                      ))}
                    </div>
                    <div className="grid grid-cols-15 gap-2">
                      {Array.from({ length: 15 }).map((_, index) => (
                        <div key={`row3-${index}`} className="h-2 rounded-sm bg-black/70" />
                      ))}
                    </div>
                    <div className="grid grid-cols-15 gap-2">
                      {Array.from({ length: 15 }).map((_, index) => (
                        <div key={`row4-${index}`} className="h-2 rounded-sm bg-black/70" />
                      ))}
                    </div>
                    <div className="mt-auto flex items-end justify-center">
                      <div className="h-10 w-[45%] rounded-2xl bg-black/70" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-black/10 px-6 py-4 text-sm text-black/70">
          {surface === 'keyboard-deck' ? (
            'The artwork covers the palm rest and deck area; the keyboard keys and trackpad are cut out for fitment.'
          ) : (
            'The preview shows how the uploaded artwork fits the selected laptop section. This is a visual guide and not the final printed layout.'
          )}
        </div>
      </div>
    </div>
  );
}
