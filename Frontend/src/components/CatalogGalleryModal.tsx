'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type CatalogArtwork = {
  id: string;
  category: string;
  image: string;
  title: string;
};

type CatalogGalleryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectArtwork: (artworkUrl: string) => void;
};

export default function CatalogGalleryModal({ isOpen, onClose, onSelectArtwork }: CatalogGalleryModalProps) {
  const [artworks, setArtworks] = useState<CatalogArtwork[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousOverflowRef = useRef('');
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    setLoadError(false);
    setActiveCategory('All');
    previousOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    fetch('/api/catalog-artworks?limit=24')
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load designs');
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Invalid design response');
        setArtworks(data);
      })
      .catch(() => {
        setArtworks([]);
        setLoadError(true);
      })
      .finally(() => setIsLoading(false));

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflowRef.current;
    };
  }, [isOpen]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    artworks.forEach((art) => set.add(art.category));
    return ['All', ...Array.from(set)];
  }, [artworks]);

  if (!isOpen) return null;

  const filtered = activeCategory === 'All' ? artworks : artworks.filter((art) => art.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-3 sm:p-6" role="presentation">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="catalog-dialog relative my-3 max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl overflow-y-auto rounded-[1.5rem] bg-white p-5 shadow-2xl sm:my-8 sm:max-h-[calc(100dvh-4rem)] sm:rounded-[2rem] sm:p-8" role="dialog" aria-modal="true" aria-labelledby="catalog-gallery-title">
        <div className="flex items-start justify-between gap-5 border-b border-black/10 pb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#319999]">Choose your artwork</p>
            <h3 id="catalog-gallery-title" className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">Design Gallery</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-black/60">Select a design to apply to the surface you are customizing.</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 text-black transition hover:border-black focus:outline-none focus:ring-2 focus:ring-[#66cccc]" aria-label="Close design gallery">
            <i className="bx bx-x text-xl" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Filter designs by category">
          {categories.map((cat) => (
            <button key={cat} type="button" onClick={() => setActiveCategory(cat)} aria-pressed={activeCategory === cat} className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#66cccc] ${activeCategory === cat ? 'bg-black text-white' : 'bg-[#f1f2ef] text-black/65 hover:bg-black/10'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : loadError ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-[#f7f7f5] px-6 text-center">
              <i className="bx bx-cloud-off text-3xl text-black/40" aria-hidden="true" />
              <p className="mt-3 font-bold">Designs could not load</p>
              <p className="mt-1 text-sm text-black/60">Close this window and try again.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-[#f7f7f5] px-6 text-center">
              <p className="font-bold">No designs in this category yet</p>
              <p className="mt-1 text-sm text-black/60">Try another category or upload your own artwork.</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                <span>{filtered.length} designs</span>
                <span>Tap to select</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {filtered.map((art) => (
                  <button key={art.id} type="button" onClick={() => { onSelectArtwork(art.image); onClose(); }} className="catalog-artwork-card group overflow-hidden rounded-2xl border border-black/10 bg-white text-left transition hover:-translate-y-0.5 hover:border-black/35 focus:outline-none focus:ring-2 focus:ring-[#66cccc]" aria-label={`Select ${art.title}`}>
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#f1f2ef]">
                      <img src={art.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      <span className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-sm transition group-hover:opacity-100" aria-hidden="true">
                        <i className="bx bx-plus text-lg" />
                      </span>
                    </div>
                    <div className="p-3 sm:p-4">
                      <p className="truncate text-sm font-bold text-black">{art.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-black/45">{art.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
