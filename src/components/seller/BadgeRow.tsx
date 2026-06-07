'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { X } from 'lucide-react'

export type Badge = {
  slug: string
  imageSrc: string
  label: string
  description: (displayName: string) => string
}

export const ALL_BADGES: Badge[] = [
  {
    slug: 'founding-seller',
    imageSrc: '/badges/badge-founding-seller.png',
    label: 'Founding Seller',
    description: (name) => `${name} is a Trax Founding Seller. 2.5% commission on cards $25+ — locked in for life.`,
  },
  {
    slug: 'verified-pin',
    imageSrc: '/badges/badge-verified-pin.png',
    label: 'Verified Pin',
    description: (name) => `${name} is identity-verified by Trax.`,
  },
  {
    slug: 'trax-ambassador',
    imageSrc: '/badges/badge-trax-ambassador.png',
    label: 'Trax Ambassador',
    description: (name) => `${name} has earned Trax Ambassador status — 10+ approved seller referrals to the platform.`,
  },
]

type Props = {
  displayName: string
  isFoundingSeller: boolean
  identityVerified: boolean
  badges: string[]
  hiddenBadges: string[]
  isOwner: boolean
  onHideBadge?: (slug: string) => Promise<void>
}

export function BadgeRow({ displayName, isFoundingSeller, identityVerified, badges, hiddenBadges, isOwner, onHideBadge }: Props) {
  const [confirmingHide, setConfirmingHide] = useState<string | null>(null)

  const earned = new Set<string>()
  if (isFoundingSeller) earned.add('founding-seller')
  if (identityVerified) earned.add('verified-pin')
  if (badges?.includes('trax-ambassador')) earned.add('trax-ambassador')

  const hidden = new Set(hiddenBadges ?? [])
  const visible = ALL_BADGES.filter(b => earned.has(b.slug) && !hidden.has(b.slug))
  
  if (visible.length === 0) return null

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
        {visible.map(badge => (
          <Popover key={badge.slug}>
            <PopoverTrigger className="group relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7C3AED] rounded">
              <Image src={badge.imageSrc} alt={badge.label} width={56} height={56}
                className="h-12 w-auto sm:h-14 transition-transform hover:scale-105" />
            </PopoverTrigger>
            <PopoverContent className="w-72 bg-black/95 border border-[#7C3AED]/40 text-white p-4 relative">
              {isOwner && (
                <button onClick={() => setConfirmingHide(badge.slug)}
                  className="absolute top-2 right-2 rounded-full p-1 hover:bg-red-500/20 transition-colors"
                  aria-label="Hide this badge">
                  <X className="h-4 w-4 text-red-400" />
                </button>
              )}
              <div className="text-sm font-semibold mb-1 px-6 text-center">{badge.label}</div>
              <div className="text-xs text-zinc-300 leading-relaxed text-center">
                {badge.description(displayName)}
              </div>
            </PopoverContent>
          </Popover>
        ))}
      </div>
      <AlertDialog open={confirmingHide !== null} onOpenChange={(open) => !open && setConfirmingHide(null)}>
        <AlertDialogContent className="bg-black/95 border border-[#7C3AED]/40 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Hide this badge from your profile?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
              Your badge won't be visible to anyone viewing your storefront. You can re-enable it anytime from your Seller Dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmingHide) {
                  if (onHideBadge) {
                    await onHideBadge(confirmingHide)
                  }
                }
                setConfirmingHide(null)
              }}
              className="bg-red-600 hover:bg-red-700 text-white">Hide badge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
