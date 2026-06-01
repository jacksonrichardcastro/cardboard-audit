"use client";

import { useState, useEffect } from "react";
import { Expand, X } from "lucide-react";

export function ListingGallery({ photos, title }: { photos: string[], title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Dedupe photos to prevent redundant thumbnails
  const uniquePhotos = Array.from(new Set(photos || []));
  const validPhotos = uniquePhotos.length > 0 ? uniquePhotos : ['https://placehold.co/400x550'];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    if (lightboxOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  return (
    <div className="space-y-4">
      {/* Hero Image */}
      <div 
        className="rounded-2xl overflow-hidden border border-border/50 bg-neutral-900 shadow-2xl relative aspect-[3/4] group cursor-zoom-in"
        onClick={() => setLightboxOpen(true)}
      >
        <img 
          src={validPhotos[activeIndex]} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none opacity-50" />
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <Expand className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Thumbnail Strip (only if > 1 photo) */}
      {validPhotos.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide w-full">
          {validPhotos.map((photo, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveIndex(index);
                }}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  isActive 
                    ? "border-violet-600 ring-2 ring-violet-600/30" 
                    : "border-transparent opacity-60 hover:opacity-100 hover:border-border/50"
                }`}
              >
                <img 
                  src={photo} 
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setLightboxOpen(false);
          }}
          tabIndex={0}
          autoFocus
        >
          {/* Close Button */}
          <button 
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-[110]"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <img 
            src={validPhotos[activeIndex]} 
            alt={title} 
            className="max-w-[95vw] max-h-[95vh] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent click from closing if clicking on image itself
          />
        </div>
      )}
    </div>
  );
}
