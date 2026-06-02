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
import { updatePresenceStatus } from "@/app/actions/profile";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface BadgeConfig {
  id: string;
  label: string;
  imgSrc?: string; // For future asset injection
  fallbackColor: string;
}

const PRESTIGE_BADGES: BadgeConfig[] = [
  { id: "founding", label: "Founding Seller", imgSrc: "/badges/badge-founding-seller.png", fallbackColor: "bg-slate-800 border-slate-600 text-slate-300" },
  { id: "gold", label: "Gold Medal", imgSrc: "/badges/badge-gold-medal.png", fallbackColor: "bg-amber-900/40 border-amber-500/50 text-amber-500" },
  { id: "certified", label: "Certified Badge", imgSrc: "/badges/badge-certified-badge.png", fallbackColor: "bg-purple-900/40 border-purple-500/50 text-purple-400" },
  { id: "verified", label: "Verified Pin", imgSrc: "/badges/badge-verified-pin.png", fallbackColor: "bg-blue-900/40 border-blue-500/50 text-blue-400" },
  { id: "ambassador", label: "Trax Ambassador", imgSrc: "/badges/badge-trax-ambassador.png", fallbackColor: "bg-zinc-800 border-[#7C3AED] text-[#7C3AED]" },
];

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
  // Passing these so we can render mock cards in the background shelf
  heroCards?: { id: string; url: string }[];
  customizerNode?: React.ReactNode;
  presenceStatus?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
}

export function SellerHero({ name, handle, bio, avatarUrl, headerStyle, bannerImageUrl, isOwner, sellerId, heroCards = [], customizerNode, badges = [], presenceStatus = "online", locationCity, locationState }: SellerHeroProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
    url: 'https://placehold.co/300x400/1a1a1a/333333?text=PSA+10'
  }));
  
  const displayCards = heroCards.length > 0 ? heroCards.slice(0, 19) : defaultHeroCards.slice(0, 19);

  return (
    <div className="relative w-full bg-black pt-0 pb-6 md:pb-8 flex flex-col items-center">
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
              {displayCards.map((card, i) => (
                <div 
                  key={`${card.id}-${i}`} 
                  className="relative flex-shrink-0 w-20 md:w-28 aspect-[5/7] rounded-lg border border-white/10 overflow-hidden shadow-xl transform transition-transform duration-500 hover:-translate-y-4 hover:z-10"
                >
                  <img src={card.url} alt="Hero Card" className="absolute inset-0 w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Avatar (overlapping the shelf) */}
        <div className="absolute left-1/2 bottom-0 translate-y-1/2 -translate-x-1/2 z-20">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={name} 
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-black shadow-2xl bg-zinc-900" 
            />
          ) : (
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-black shadow-2xl bg-zinc-800 flex items-center justify-center text-2xl md:text-3xl font-bold text-white">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
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
          <div className="flex justify-center items-center gap-2 shrink-0">
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

        {/* Prestige Emblems Row (Exactly 5, single row) */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 max-w-4xl mx-auto">
          {PRESTIGE_BADGES.filter(b => badges.includes(b.id)).map((badge) => (
            <div key={badge.id} className="flex flex-col items-center gap-3">
              {badge.imgSrc ? (
                // Future Asset Injection Point
                <div className="w-14 h-14 md:w-16 md:h-16 relative hover:scale-110 transition-transform duration-300 drop-shadow-2xl">
                  <img src={badge.imgSrc} alt={badge.label} className="w-full h-full object-contain" />
                </div>
              ) : (
                // V16 Placeholder Styling (3D tactile feel mockup)
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-lg flex items-center justify-center border-2 shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:scale-110 transition-transform duration-300 ${badge.fallbackColor} transform rotate-3`}>
                   <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 opacity-80" />
                </div>
              )}
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-500">
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
