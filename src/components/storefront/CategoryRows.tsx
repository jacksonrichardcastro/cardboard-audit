"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, Flame, Edit2, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { getPossessiveName } from "@/lib/utils/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { bulkAddCardsToCategory } from "@/app/actions/category-memberships";

export interface CategoryRowsProps {
  categories: any[];
  cards: any[];
  isOwner: boolean;
  sellerName: string;
  tab: "storefront" | "binder";
  allBinderCards?: any[];
}

export function CategoryRows({ categories, cards, isOwner, sellerName, tab, allBinderCards = [] }: CategoryRowsProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  
  const [activePickerCategoryId, setActivePickerCategoryId] = useState<number | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleAction = (e: React.MouseEvent, listingId: number) => {
    e.preventDefault();
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/listings/${listingId}`);
    } else {
      router.push(`/listings/${listingId}`);
    }
  };

  const openPicker = (categoryId: number) => {
    if (!isOwner) return;
    setActivePickerCategoryId(categoryId);
    setSelectedCardIds([]);
  };

  const toggleCardSelection = (cardId: number) => {
    setSelectedCardIds(prev => 
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const handleAddSelected = () => {
    if (activePickerCategoryId === null || selectedCardIds.length === 0) return;
    
    startTransition(async () => {
      try {
        await bulkAddCardsToCategory(activePickerCategoryId, selectedCardIds);
        setActivePickerCategoryId(null);
        setSelectedCardIds([]);
      } catch (err) {
        console.error(err);
        alert("Failed to add cards to category.");
      }
    });
  };

  // Find the active category for the picker to display its name
  const activeCategory = activePickerCategoryId ? categories.find(c => c.id === activePickerCategoryId) : null;
  
  // Filter out cards already in the active category for the picker
  const pickerCards = activeCategory 
    ? allBinderCards.filter(card => !activeCategory.memberships?.some((m: any) => m.cardId === card.id))
    : [];

  return (
    <>
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
                <div 
                  onClick={() => openPicker(category.id)}
                  className={`w-full py-12 px-6 rounded-xl border border-dashed border-white/20 bg-zinc-950/30 flex flex-col items-center text-center transition-colors ${isOwner ? 'cursor-pointer hover:bg-zinc-900/50 hover:border-white/40' : ''}`}
                >
                  <p className="text-zinc-500 mb-2">No cards in this category.</p>
                  {isOwner && <p className="text-sm text-[#7C3AED] font-semibold">Tap here to add cards from your binder.</p>}
                </div>
              ) : (
                <div className="w-full overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex gap-3 w-max">
                    {categoryCards.map(item => {
                      const photoUrl = (Array.isArray(item.photos) && item.photos.length > 0 && item.photos[0] !== null) 
                        ? item.photos[0] 
                        : 'https://placehold.co/400x550';

                      if (tab === "storefront") {
                        // Active Listings Card
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

      <Dialog open={activePickerCategoryId !== null} onOpenChange={(open) => {
        if (!open) {
          setActivePickerCategoryId(null);
          setSelectedCardIds([]);
        }
      }}>
        <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-800 text-white z-[120]">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Cards to {activeCategory?.name}</DialogTitle>
            <p className="text-sm text-zinc-400">
              Select cards from your binder to add to this category.
            </p>
          </DialogHeader>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto py-4 pr-2">
            {pickerCards.map(card => {
              const isSelected = selectedCardIds.includes(card.id);
              const photoUrl = (Array.isArray(card.photos) && card.photos.length > 0 && card.photos[0]) 
                ? card.photos[0] 
                : 'https://placehold.co/400x550';

              return (
                <div 
                  key={card.id} 
                  onClick={() => toggleCardSelection(card.id)}
                  className={`relative aspect-[5/7] rounded-lg cursor-pointer overflow-hidden border-2 transition-all ${isSelected ? 'border-[#7C3AED]' : 'border-transparent hover:border-zinc-700'}`}
                >
                  <img src={photoUrl} alt={card.title} className="w-full h-full object-cover" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#7C3AED]/20 flex items-center justify-center">
                      <div className="bg-[#7C3AED] rounded-full p-1">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {pickerCards.length === 0 && (
              <div className="col-span-full text-center py-12 text-zinc-500">
                <p>No eligible cards found in your binder.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setActivePickerCategoryId(null);
              setSelectedCardIds([]);
            }} className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800">
              Cancel
            </Button>
            <Button 
              onClick={handleAddSelected} 
              disabled={isPending || selectedCardIds.length === 0} 
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add selected to {activeCategory?.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
