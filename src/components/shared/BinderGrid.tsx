"use client";

import Link from "next/link";
import { Lock, Star, Edit2 } from "lucide-react";
import { setGrailCard } from "@/app/actions/profile";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { getPossessiveName } from "@/lib/utils/formatters";

export interface BinderGridProps {
  isOwner?: boolean;
  sellerName?: string;
  collectionValueCents?: number | null;
  grailCardId?: number | null;
  cards: {
    id: number;
    title: string;
    category: string;
    grade: string | null;
    gradingCompany: string | null;
    condition: string;
    photos: string[];
  }[];
  activeListings?: {
    id: number;
    cardId: number;
    priceCents: number;
  }[];
}

export function BinderGrid({ isOwner, sellerName, collectionValueCents, grailCardId, cards, activeListings = [] }: BinderGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSetGrail = (e: React.MouseEvent, cardId: number) => {
    e.preventDefault(); // prevent navigation
    startTransition(async () => {
      try {
        await setGrailCard(cardId);
        router.refresh();
      } catch (err) {
        console.error("Failed to set grail", err);
      }
    });
  };

  // Confirmation #2: Binder defaults to private
  const isPrivate = true; // Hardcoded default-private for public view in V1

  if (cards.length === 0) {
    return (
      <div className="text-center py-24 bg-zinc-950/50 rounded-xl border border-white/5">
        <p className="text-lg text-zinc-500">This binder is empty.</p>
      </div>
    );
  }

  // To simulate the grail being the top-middle slot, we can reorder the array.
  // We'll put the grail at index 2 (middle of a 5-column row).
  const grailCard = cards.find(c => c.id === grailCardId) || cards[0];
  const regularCards = cards.filter(c => c.id !== grailCard.id);
  
  // Create a display array where grail is injected at index 2 (if enough items exist)
  const displayCards = [...regularCards];
  if (displayCards.length >= 2) {
    displayCards.splice(2, 0, grailCard);
  } else {
    displayCards.unshift(grailCard);
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {displayCards.map((card, idx) => {
          const isGrail = card.id === grailCard.id;
          const photoUrl = (Array.isArray(card.photos) && card.photos.length > 0 && card.photos[0] !== null) 
            ? card.photos[0] 
            : 'https://placehold.co/400x550';
          
          const activeListing = activeListings.find(al => al.cardId === card.id);
          const isListed = !!activeListing;
          
          return (
            <div 
              key={card.id} 
              className={`relative flex flex-col group mx-auto transition-all duration-300 ${isGrail ? 'col-span-2 md:col-span-1 order-first md:order-none w-[80%] md:w-[85%] z-10' : 'w-[80%] sm:w-[65%]'}`}
            >
              
              {/* V16 Grail Centerpiece Styling */}
              <div className={`relative aspect-[5/7] w-full rounded-lg overflow-hidden border transition-all duration-300 ${
                  isGrail 
                    ? 'border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.3)] bg-gradient-to-b from-[#D4AF37]/20 to-black' 
                    : 'border-white/10 bg-black group-hover:border-white/20'
                }`}
              >
                {/* Top-edge sweep ribbon for Grail */}
                {isGrail && (
                  <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-transparent via-[#D4AF37]/90 to-transparent text-black text-center py-1 z-30 backdrop-blur-sm pointer-events-none">
                    <span className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase font-[family-name:var(--font-display)] drop-shadow-md">
                      {getPossessiveName(sellerName || 'Seller', isOwner)} Grail
                    </span>
                  </div>
                )}
                
                <img
                  src={photoUrl}
                  alt={card.title}
                  className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] object-cover rounded-sm"
                  loading="lazy"
                />
              </div>

              {/* MVP Grail Toggle for Owners */}
              {isOwner && !isGrail && (
                <button 
                  onClick={(e) => handleSetGrail(e, card.id)}
                  disabled={isPending}
                  className={`absolute top-2 left-2 z-40 p-2 rounded-full backdrop-blur-sm transition-all hover:scale-105 shadow-md border ${
                    grailCardId === card.id 
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/50' 
                      : 'bg-black/60 text-[#7C3AED] hover:bg-[#7C3AED]/20 border-white/10 hover:border-[#7C3AED]/50'
                  }`}
                  title={grailCardId === card.id ? "Currently your Grail" : "Set as Grail"}
                >
                  <Star className="w-4 h-4" fill={grailCardId === card.id ? "currentColor" : "none"} />
                </button>
              )}

              {/* Top-Right Badges & Actions */}
              <div className="absolute top-2 right-2 z-40 flex flex-col items-end gap-1.5">
                {/* Edit Affordance for Owners */}
                {isOwner && (
                  <Link
                    href={`/binder/${card.id}/edit`}
                    className="p-2 bg-black/60 text-zinc-300 hover:text-white rounded-full hover:bg-black/80 transition-all backdrop-blur-sm shadow-md border border-white/10"
                    title="Edit Card"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {/* Card Metadata */}
              <div className={`mt-4 px-1 space-y-1 ${isGrail ? 'mt-6 text-center' : ''}`}>
                <h3 className="text-xs font-semibold line-clamp-1 text-zinc-300" title={card.title}>
                  {card.title}
                </h3>
                <div className={`flex flex-col gap-1 mt-1 ${isGrail ? 'items-center' : 'items-start'}`}>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    {card.grade ? `${card.gradingCompany} ${card.grade}` : card.condition}
                  </p>
                  
                  {isListed && !isGrail && (
                    <div className="flex items-center justify-between w-full mt-0.5">
                      <div className="bg-[#7C3AED]/20 border border-[#7C3AED]/50 text-[#7C3AED] text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                        Listed
                      </div>
                      <p className="text-xs font-bold text-[#7C3AED]">
                        ${(activeListing!.priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
