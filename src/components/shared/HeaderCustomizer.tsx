"use client";

import { useState, useTransition, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Edit3, Loader2 } from "lucide-react";
import { updateHeaderCustomization, updateSellerProfile } from "@/app/actions/profile";

interface Card {
  id: number;
  title: string;
  photos: string[];
}

interface HeaderCustomizerProps {
  cards: Card[];
  selectedIds: number[];
  headerStyle?: string;
  bannerImageUrl?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerNode?: React.ReactElement;
}

export function HeaderCustomizer({ cards, selectedIds, headerStyle = 'cards', bannerImageUrl, open = false, onOpenChange, triggerNode }: HeaderCustomizerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = onOpenChange ? open : internalOpen;
  const setOpen = onOpenChange ? onOpenChange : setInternalOpen;
  
  const [localSelection, setLocalSelection] = useState<number[]>(selectedIds);
  const [localMode, setLocalMode] = useState<string>(headerStyle);
  const [isPending, startTransition] = useTransition();
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Sync local selection when opening
  useEffect(() => {
    if (isOpen) {
      setLocalSelection(selectedIds);
      setLocalMode(headerStyle);
    }
  }, [isOpen, selectedIds, headerStyle]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-header-customizer', handler);
    return () => window.removeEventListener('open-header-customizer', handler);
  }, [setOpen]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      const res = await fetch("/api/storage/profile", {
        method: "POST",
        body: JSON.stringify({ kind: "avatar" }),
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) throw new Error("Failed to get secure upload URL");
      
      const { signedUrl, publicUrl } = await res.json();
      
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });

      if (!uploadRes.ok) throw new Error("Failed to upload image to bucket");

      await updateSellerProfile({
        headerStyle: 'banner',
        bannerImageUrl: publicUrl,
      });

      setOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to upload banner photo. Please try again.");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const toggleCard = (id: number) => {
    setLocalSelection(prev => {
      if (prev.includes(id)) {
        return prev.filter(cId => cId !== id);
      }
      if (prev.length >= 8) return prev; // max 8
      return [...prev, id];
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await Promise.all([
          updateHeaderCustomization(localSelection),
          updateSellerProfile({ headerStyle: localMode })
        ]);
        setOpen(false);
        if (localMode !== headerStyle) {
          window.location.reload();
        }
      } catch (err) {
        alert("Failed to update header");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen} modal={false}>
      {triggerNode && <DialogTrigger render={triggerNode} />}
      <DialogContent hideOverlay={true} className="max-w-3xl bg-[#7C3AED]/10 backdrop-blur-md border-[#7C3AED]/30 text-white shadow-2xl z-[120]">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">Customize Header</DialogTitle>
              <p className="text-sm text-zinc-300">
                Choose how your storefront header is displayed.
              </p>
            </div>
            {/* Segmented Control */}
            <div className="flex bg-black/40 p-1 rounded-lg border border-[#7C3AED]/30 shrink-0">
              <button 
                onClick={() => setLocalMode('cards')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${localMode === 'cards' ? 'bg-[#7C3AED] text-white shadow-[0_0_10px_rgba(124,58,237,0.4)]' : 'text-zinc-400 hover:text-white'}`}
              >
                Cards
              </button>
              <button 
                onClick={() => setLocalMode('banner')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${localMode === 'banner' ? 'bg-[#7C3AED] text-white shadow-[0_0_10px_rgba(124,58,237,0.4)]' : 'text-zinc-400 hover:text-white'}`}
              >
                Image
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {localMode === 'cards' ? (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-zinc-300">Select up to 8 cards from your binder</span>
                <span className="font-medium text-[#7C3AED]">{localSelection.length}/8 selected</span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto py-2 pr-2">
                {cards.map(card => {
                  const isSelected = localSelection.includes(card.id);
                  const photoUrl = (Array.isArray(card.photos) && card.photos.length > 0 && card.photos[0]) 
                    ? card.photos[0] 
                    : 'https://placehold.co/400x550';

                  return (
                    <div 
                      key={card.id} 
                      onClick={() => toggleCard(card.id)}
                      className={`relative aspect-[5/7] rounded-lg cursor-pointer overflow-hidden border-2 transition-all ${isSelected ? 'border-[#7C3AED] shadow-[0_0_15px_rgba(124,58,237,0.5)] scale-[0.98]' : 'border-transparent hover:border-[#7C3AED]/40 hover:scale-105'}`}
                    >
                      <img src={photoUrl} alt={card.title} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#7C3AED]/20 flex items-center justify-center backdrop-blur-[2px]">
                          <div className="bg-[#7C3AED] rounded-full p-1 shadow-lg">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {cards.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center text-center py-12 text-zinc-400 gap-4">
                    <p>You don't have any cards in your binder yet.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8 gap-4 border border-[#7C3AED]/20 rounded-xl bg-black/20 min-h-[30vh]">
              {bannerImageUrl ? (
                <div className="relative w-full px-4 flex flex-col items-center gap-4">
                  <div className="w-full max-w-lg aspect-[3/1] rounded-lg overflow-hidden border border-white/10 shadow-2xl">
                    <img src={bannerImageUrl} alt="Current Banner" className="w-full h-full object-cover" />
                  </div>
                  <div className="relative mt-2">
                    <Button variant="outline" className="border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white bg-black/40" disabled={isUploadingBanner}>
                      {isUploadingBanner ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                      ) : (
                        "Replace Banner Image"
                      )}
                    </Button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleBannerUpload}
                      disabled={isUploadingBanner}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm font-medium text-white mb-2">Upload a custom banner image</p>
                  <div className="relative">
                    <Button variant="outline" className="border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white bg-black/40" disabled={isUploadingBanner}>
                      {isUploadingBanner ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                      ) : (
                        "Upload Banner Image"
                      )}
                    </Button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleBannerUpload}
                      disabled={isUploadingBanner}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Recommended: 1500 x 400px</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="border-[#7C3AED]/30 bg-black/40 hover:bg-black/60 text-white">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
