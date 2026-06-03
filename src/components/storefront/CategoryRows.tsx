"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, Flame, Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { RunDiscountModal } from "./RunDiscountModal";
import { getPossessiveName } from "@/lib/utils/formatters";

export interface CategoryRowsProps {
  categories: any[];
  cards: any[];
  isOwner: boolean;
  sellerName: string;
  tab: "storefront" | "binder";
}

export function CategoryRows({ categories, cards, isOwner, sellerName, tab }: CategoryRowsProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleAction = (e: React.MouseEvent, listingId: number) => {
    e.preventDefault();
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/listings/${listingId}`);
    } else {
      router.push(`/listings/${listingId}`);
    }
  };

  return (
    <div className="flex flex-col gap-12">
      {categories.map(category => {
        const categoryCards = cards.filter(card => {
          const targetCardId = tab === "storefront" ? card.cardId : card.id;
          return category.memberships?.some((m: any) => m.cardId === targetCardId);
        });

        return (
          <div key={category.id} className="w-full space-y-4">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">{category.name}</h2>
            
            {categoryCards.length === 0 ? (
              <div className="w-full py-12 px-6 rounded-xl border border-dashed border-white/20 bg-zinc-950/30 flex flex-col items-center text-center">
                <p className="text-zinc-500 mb-2">No cards in this category.</p>
                {isOwner && <p className="text-sm text-zinc-400">Add cards to this category from your binder.</p>}
              </div>
            ) : (
              <div className="w-full overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex gap-3 w-max">
                  {categoryCards.map(item => {
                    const photoUrl = (Array.isArray(item.photos) && item.photos.length > 0 && item.photos[0] !== null) 
                      ? item.photos[0] 
                      : 'https://placehold.co/400x550';

                    if (tab === "storefront") {
                      // Active Listings Card (Buy / Offer)
                      const listing = item;
                      return (
                        <div key={listing.id} className="snap-start shrink-0 w-[160px] md:w-[180px] lg:w-[200px] block group relative rounded-xl overflow-hidden bg-[#111111] border border-white/5 hover:border-white/10 hover:-translate-y-1 transition-all duration-300">
                          <Link href={`/listings/${listing.id}`} className="block">
                            <div className="relative aspect-[5/7] w-full overflow-hidden bg-black">
                              <img src={photoUrl} alt={listing.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                            </div>
                            <div className="p-2.5 text-center flex flex-col items-center">
                              <h3 className="text-[11px] md:text-sm font-medium line-clamp-1 text-zinc-300 mb-1.5 w-full">{listing.title}</h3>
                              <div className="flex flex-col gap-1 mb-2 w-full items-center">
                                {listing.discountType && listing.discountAmount ? (
                                  <div className="flex items-center justify-center gap-1.5 w-full">
                                    <span className="text-[10px] md:text-[11px] text-zinc-500 line-through shrink-0">${(listing.priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                    <p className="text-sm md:text-[15px] font-bold text-[#7C3AED] shrink-0">
                                      ${((listing.discountType === 'percent' ? listing.priceCents * (1 - listing.discountAmount / 10000) : listing.priceCents - listing.discountAmount) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm md:text-[15px] font-bold text-white text-center w-full">${(listing.priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                )}
                                <p className="text-[10px] md:text-[11px] text-zinc-500 truncate w-full text-center">
                                  {listing.grade ? `${listing.gradingCompany} ${listing.grade}` : listing.condition}
                                </p>
                              </div>
                            </div>
                          </Link>
                          
                          {isOwner && (
                            <div className="absolute top-2 right-2 z-20">
                              <button onClick={(e) => { e.preventDefault(); router.push(`/listings/${listing.id}/edit`); }} className="bg-black/60 hover:bg-black/80 backdrop-blur-md p-1.5 rounded-full border border-white/10 text-white transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 shadow-md">
                                <Edit2 className="w-4 h-4 mx-auto" />
                              </button>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2 px-2.5 pb-2.5">
                            <Button onClick={(e) => handleAction(e, listing.id)} className="h-7 w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[9px] sm:text-[10px] md:text-xs font-semibold px-1 sm:px-2 rounded z-20 relative">
                              <span className="sm:hidden">Buy</span>
                              <span className="hidden sm:inline">Buy Now</span>
                            </Button>
                            <Button onClick={(e) => handleAction(e, listing.id)} variant="outline" className="h-7 w-full border-white/10 bg-white/5 hover:bg-white/10 text-white text-[9px] sm:text-[10px] md:text-xs font-semibold px-1 sm:px-2 rounded z-20 relative">
                              <span className="sm:hidden">Offer</span>
                              <span className="hidden sm:inline">Make Offer</span>
                            </Button>
                          </div>
                        </div>
                      );
                    } else {
                      // Binder Card
                      const card = item;
                      return (
                        <div key={card.id} className="snap-start shrink-0 w-[160px] md:w-[180px] lg:w-[200px] relative flex flex-col group transition-all duration-300">
                          {isOwner && (
                            <Link href={`/binder/${card.id}/edit`} className="absolute top-2 right-2 z-30 p-2 bg-black/60 text-zinc-300 hover:text-white rounded-full hover:bg-black/80 transition-all backdrop-blur-sm shadow-md border border-white/10">
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          )}
                          <div className="relative aspect-[5/7] w-full rounded-lg overflow-hidden border border-white/10 bg-black group-hover:border-white/20 transition-all duration-300">
                            <img src={photoUrl} alt={card.title} className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] object-cover rounded-sm" loading="lazy" />
                          </div>
                          <div className="mt-4 px-1 space-y-1">
                            <h3 className="text-xs font-semibold line-clamp-1 text-zinc-300" title={card.title}>{card.title}</h3>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                              {card.grade ? `${card.gradingCompany} ${card.grade}` : card.condition}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  })}
                  <div className="w-1 shrink-0 md:hidden" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
