"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Mail, ChevronDown, MapPin } from "lucide-react";
import Link from "next/link";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { updatePresenceStatus, updateSellerProfile, removeProfilePhoto } from "@/app/actions/profile";
import { hideBadgeAction } from "@/app/actions/badges";
import { BadgeRow } from "@/components/seller/BadgeRow";
import { useTransition, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, Trash, Image as ImageIcon, X } from "lucide-react";

interface SellerHeroProps {
  name: string;
  handle: string;
  bio?: string | null;
  avatarUrl?: string | null;
  headerStyle?: string | null;
  bannerImageUrl?: string | null;
  isOwner?: boolean;
  sellerId?: string;
  badges?: string[];
  isFoundingSeller?: boolean;
  identityVerified?: boolean;
  hiddenBadges?: string[];
  heroCards?: { id: string; url: string; title?: string; activeListingId?: number }[];
  customizerNode?: React.ReactNode;
  presenceStatus?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  transparentBackground?: boolean;
}

export function SellerHero({ name, handle, bio, avatarUrl, headerStyle, bannerImageUrl, isOwner, sellerId, heroCards = [], customizerNode, badges = [], isFoundingSeller = false, identityVerified = false, hiddenBadges = [], presenceStatus = "online", locationCity, locationState, transparentBackground = false }: SellerHeroProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [heroLightboxUrl, setHeroLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
        setHeroLightboxUrl(null);
      }
    };
    if (lightboxOpen || heroLightboxUrl) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, heroLightboxUrl]);

  const handleStatusChange = (status: "online" | "away" | "offline") => {
    startTransition(async () => {
      try {
        await updatePresenceStatus(status);
        router.refresh();
      } catch (err) {
        console.error("Failed to update status", err);
      }
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
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

        await updateSellerProfile({ profilePhotoUrl: publicUrl });
        router.refresh();
      } catch (err) {
        console.error(err);
        alert("Failed to upload profile photo.");
      }
    });
  };

  const handleAvatarRemove = () => {
    if (!confirm("Remove profile photo?")) return;
    startTransition(async () => {
      try {
        await removeProfilePhoto();
        router.refresh();
      } catch (err) {
        console.error(err);
        alert("Failed to remove profile photo.");
      }
    });
  };

  const getStatusColor = (status: string) => {
    if (status === "away") return "bg-yellow-500";
    if (status === "offline") return "bg-zinc-500";
    return "bg-green-500";
  };

  const getStatusBadgeColor = (status: string) => {
    if (status === "away") return "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border-yellow-500/50";
    if (status === "offline") return "bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30 border-zinc-500/50";
    return "bg-[#7C3AED]/20 text-[#7C3AED] hover:bg-[#7C3AED]/30 border-[#7C3AED]/50";
  };

  // Placeholder images for the hero shelf background
  const defaultHeroCards = Array.from({ length: 12 }).map((_, i) => ({
    id: `hero-card-${i}`,
    url: 'https://placehold.co/300x400/1a1a1a/333333?text=PSA+10',
    title: undefined as string | undefined,
    activeListingId: undefined as number | undefined
  }));
  
  const displayCards = heroCards.length > 0 ? heroCards.slice(0, 19) : defaultHeroCards.slice(0, 19);

  return (
    <div className={`relative w-full ${transparentBackground ? 'bg-transparent' : 'bg-black'} pt-0 pb-6 md:pb-8 flex flex-col items-center`}>
      {/* Ambient Radial Glow Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-[#7C3AED]/20 blur-[120px] rounded-full opacity-50" />
      </div>

      {/* Hero Card Shelf or Banner */}
      <div className="relative w-full max-w-7xl mx-auto px-4 md:px-8 mt-2">
        {headerStyle === 'banner' && bannerImageUrl ? (
          <div className="relative h-40 md:h-52 w-full flex overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-zinc-900">
            {customizerNode}
            {/* Subtle bottom shelf glow to match the original gradient effect overlapping the avatar */}
            <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#7C3AED]/40 to-transparent pointer-events-none z-10" />
            <img src={bannerImageUrl} alt={`${name} Banner`} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        ) : (
          <div className="relative h-40 md:h-52 w-full flex items-center overflow-hidden rounded-xl border border-white/10 bg-black/50 shadow-2xl backdrop-blur-sm">
            {customizerNode}
            {/* Subtle bottom shelf glow */}
            <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#7C3AED]/40 to-transparent pointer-events-none z-0" />
            
            <div 
              ref={(el) => {
                if (el) {
                  // Center the scroll position on mount
                  el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
                }
              }}
              className="absolute inset-0 w-full h-full flex items-center gap-2 md:gap-4 px-[10vw] overflow-x-auto scrollbar-hide snap-none"
              style={{
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {displayCards.map((card, i) => {
                const isListed = card.activeListingId != null;
                const cardContent = (
                  <div 
                    key={customizerNode ? `${card.id}-${i}` : undefined} 
                    className="relative flex-shrink-0 w-20 md:w-28 aspect-[5/7] rounded-lg border border-white/10 overflow-hidden shadow-xl transform transition-transform duration-500 hover:-translate-y-4 hover:scale-105 hover:z-10 cursor-pointer"
                  >
                    <img src={card.url} alt={card.title || "Hero Card"} className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                );

                if (customizerNode) {
                  return cardContent;
                }

                if (isListed) {
                  return (
                    <Link key={`${card.id}-${i}`} href={`/listings/${card.activeListingId}`}>
                      {cardContent}
                    </Link>
                  );
                } else {
                  return (
                    <button 
                      key={`${card.id}-${i}`} 
                      onClick={() => setHeroLightboxUrl(card.url)}
                      className="text-left focus:outline-none"
                    >
                      {cardContent}
                    </button>
                  );
                }
              })}
            </div>
          </div>
        )}

        {/* Profile Avatar (overlapping the shelf) */}
        <div className="absolute left-1/2 bottom-0 translate-y-1/2 -translate-x-1/2 z-20">
          {isOwner ? (
            <DropdownMenu>
              <DropdownMenuTrigger disabled={isPending} className="focus:outline-none transition-transform hover:scale-105">
                <div className="relative group/avatar cursor-pointer">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={name} 
                      className={`w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-black shadow-2xl bg-zinc-900 ${isPending ? 'opacity-50' : ''}`} 
                    />
                  ) : (
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-black shadow-2xl bg-zinc-800 flex items-center justify-center text-2xl md:text-3xl font-bold text-white ${isPending ? 'opacity-50' : ''}`}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isPending && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="bg-[#7C3AED]/10 backdrop-blur-md border border-[#7C3AED]/30 text-white min-w-[160px] z-[120]">
                {avatarUrl && (
                  <DropdownMenuItem className="cursor-pointer focus:bg-[#7C3AED]/15 focus:text-white" onClick={() => setLightboxOpen(true)}>
                    <User className="w-4 h-4 mr-2 text-zinc-400" />
                    View Photo
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="cursor-pointer focus:bg-[#7C3AED]/15 focus:text-[#7C3AED] text-[#7C3AED]" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Change Photo
                </DropdownMenuItem>
                {avatarUrl && (
                  <DropdownMenuItem className="cursor-pointer focus:bg-red-500/15 focus:text-red-400 text-red-400" onClick={handleAvatarRemove}>
                    <Trash className="w-4 h-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div 
              className={`relative group/avatar ${avatarUrl ? 'cursor-pointer transition-transform hover:scale-105' : ''}`}
              onClick={() => {
                if (avatarUrl) setLightboxOpen(true);
              }}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={name} 
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-black shadow-2xl bg-zinc-900 ${isPending ? 'opacity-50' : ''}`} 
                />
              ) : (
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-black shadow-2xl bg-zinc-800 flex items-center justify-center text-2xl md:text-3xl font-bold text-white ${isPending ? 'opacity-50' : ''}`}>
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleAvatarUpload} 
            className="hidden" 
          />
        </div>
      </div>

      {/* Profile Details */}
      <div className="relative z-10 mt-10 md:mt-12 flex flex-col items-center text-center px-4 w-full overflow-hidden">
        <div className="flex flex-col items-center gap-2 w-full max-w-full mb-2">
          {/* Centered Name */}
          <div className="flex justify-center items-center min-w-0 w-full">
            <h1 className="text-xl md:text-2xl font-light font-[family-name:var(--font-display)] text-white tracking-[0.2em] uppercase text-center truncate px-2">
              {name}
            </h1>
          </div>

          {/* Flanking Status/Icon */}
          <div id="seller-status-row" className="flex justify-center items-center gap-2 shrink-0">
          {isOwner ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none" disabled={isPending}>
                <Badge variant="secondary" className={`flex items-center gap-1.5 rounded-sm font-semibold tracking-wider text-xs px-2 py-0.5 uppercase cursor-pointer transition-colors border ${getStatusBadgeColor(presenceStatus || "online")}`}>
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${getStatusColor(presenceStatus || "online")}`}></span>
                  {presenceStatus || "online"}
                  <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="bg-zinc-950 border-white/10 text-white min-w-[120px]">
                <DropdownMenuItem onClick={() => handleStatusChange("online")} className="cursor-pointer hover:bg-zinc-900 focus:bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full inline-block bg-green-500"></span>
                    Online
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("away")} className="cursor-pointer hover:bg-zinc-900 focus:bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full inline-block bg-yellow-500"></span>
                    Away
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("offline")} className="cursor-pointer hover:bg-zinc-900 focus:bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full inline-block bg-zinc-500"></span>
                    Offline
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Badge variant="secondary" className={`flex items-center gap-1.5 rounded-sm font-semibold tracking-wider text-xs px-2 py-0.5 uppercase border ${getStatusBadgeColor(presenceStatus || "online")}`}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${getStatusColor(presenceStatus || "online")}`}></span>
              {presenceStatus || "online"}
            </Badge>
          )}

          {(locationCity || locationState) && (
            <Badge variant="outline" className="flex items-center gap-1 rounded-sm font-semibold tracking-wider text-xs px-2 py-0.5 text-zinc-400 border-zinc-800">
              <MapPin className="w-3 h-3" />
              {[locationCity, locationState].filter(Boolean).join(", ")}
            </Badge>
          )}

          <Link 
            href={isOwner ? "/messages" : `/messages/new?to=${sellerId}`}
            className="p-1.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20 hover:text-white transition-colors border border-[#7C3AED]/30"
            title={isOwner ? "My Messages" : `Message ${name}`}
          >
            <Mail className="w-4 h-4" />
          </Link>
          </div>
        </div>
        
        {bio ? (
          <p className="text-xs md:text-sm text-zinc-400 font-medium max-w-2xl tracking-wide mb-4 md:mb-6">
            {bio}
          </p>
        ) : (
          <p className="text-xs md:text-sm text-zinc-400 font-medium max-w-2xl tracking-wide mb-4 md:mb-6">
            Expert Collector | PSA 10 Specialist | Trusted Seller Since 2018 | Curating Rarity
          </p>
        )}

        <BadgeRow
          displayName={name}
          isFoundingSeller={isFoundingSeller}
          identityVerified={identityVerified}
          badges={badges}
          hiddenBadges={hiddenBadges}
          isOwner={isOwner ?? false}
          onHideBadge={async (slug: string) => {
            await hideBadgeAction(slug);
          }}
        />
      </div>

      {/* Lightbox for Profile Photo */}
      {lightboxOpen && avatarUrl && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-[90vw] max-w-2xl aspect-square md:aspect-auto md:h-[80vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img src={avatarUrl} alt={name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

      {/* Lightbox for Hero Cards */}
      {heroLightboxUrl && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setHeroLightboxUrl(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setHeroLightboxUrl(null);
            }}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-[90vw] max-w-2xl aspect-auto md:h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img src={heroLightboxUrl} alt="Card Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
