'use client'

import Image from 'next/image';

export function WoodBackground({ scope = 'storefront-only' }: { scope?: 'storefront-only' | 'profile-wide' }) {
  // If storefront-only, the layout handles absolute positioning in the content area.
  // We use fixed or absolute based on scope via the parent's container,
  // but to match the prompt's base markup:
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ zIndex: -10 }} aria-hidden="true">
      <Image
        src="/themes/trax-wood-bg.jpg"
        alt="Wood Background"
        fill
        className="object-cover opacity-100"
        priority={scope === 'profile-wide'}
        quality={80}
      />
      {/* Subtle darkening overlay so text remains readable without totally burying the wood grain */}
      <div className="absolute inset-0 bg-black/40 mix-blend-multiply pointer-events-none" />
      {/* Very faint edge vignette for warmth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.6)_100%)] pointer-events-none opacity-50" />
    </div>
  )
}
