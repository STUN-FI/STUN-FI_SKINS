import React, { useEffect, useMemo, useState } from 'react';

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

  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/catalog-artworks')
      .then((response) => response.json())
      .then((data) => setArtworks(data))
      .catch(() => setArtworks([]));
  }, [isOpen]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    artworks.forEach((art) => set.add(art.category));
    return ['All', ...Array.from(set)];
  }, [artworks]);

  if (!isOpen) return null;

  const filtered = activeCategory === 'All' ? artworks : artworks.filter((art) => art.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative mt-12 mb-12 w-full max-w-6xl rounded-2xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Design Gallery</h3>
          <button onClick={onClose} className="text-sm">Close</button>
        </div>

        <div className="mt-4 flex gap-2 overflow-auto">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`rounded-full px-3 py-1 text-sm ${activeCategory===cat? 'bg-black text-white':'bg-gray-100'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <div className="masonry-grid">
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
              {filtered.map((art) => (
                <div key={art.id} className="mb-4 break-inside-avoid rounded-lg overflow-hidden shadow-sm transform hover:scale-105 transition cursor-pointer" onClick={() => { onSelectArtwork(art.image); onClose(); }}>
                  <img src={art.image} alt={art.title} className="w-full object-cover" />
                  <div className="p-2 text-sm text-black/70">{art.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
