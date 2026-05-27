import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Mail } from "lucide-react";
import Link from "next/link";

interface BadgeConfig {
  id: string;
  label: string;
  imgSrc?: string; // For future asset injection
  fallbackColor: string;
}

const PRESTIGE_BADGES: BadgeConfig[] = [
  { id: "founding", label: "Founding Seller", fallbackColor: "bg-slate-800 border-slate-600 text-slate-300" },
  { id: "gold", label: "Gold Medal", fallbackColor: "bg-amber-900/40 border-amber-500/50 text-amber-500" },
  { id: "certified", label: "Certified Badge", fallbackColor: "bg-purple-900/40 border-purple-500/50 text-purple-400" },
  { id: "verified", label: "Verified Pin", fallbackColor: "bg-blue-900/40 border-blue-500/50 text-blue-400" },
  { id: "ambassador", label: "Trax Ambassador", fallbackColor: "bg-zinc-800 border-[#7C3AED] text-[#7C3AED]" },
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
  // Passing these so we can render mock cards in the background shelf
  heroCards?: { id: string; url: string }[];
  customizerNode?: React.ReactNode;
}

export function SellerHero({ name, handle, bio, avatarUrl, headerStyle, bannerImageUrl, isOwner, sellerId, heroCards = [], customizerNode }: SellerHeroProps) {
  // Placeholder images for the hero shelf background
  const defaultHeroCards = Array.from({ length: 8 }).map((_, i) => ({
    id: `hero-card-${i}`,
    url: 'https://placehold.co/300x400/1a1a1a/333333?text=PSA+10'
  }));
  
  const displayCards = heroCards.length > 0 ? heroCards : defaultHeroCards;

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
          <div className="relative h-40 md:h-52 w-full flex justify-center gap-2 md:gap-4 overflow-hidden rounded-xl border border-white/10 bg-black/50 p-4 md:p-6 shadow-2xl backdrop-blur-sm">
            {customizerNode}
            {/* Subtle bottom shelf glow */}
            <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#7C3AED]/40 to-transparent pointer-events-none" />
            
            {displayCards.slice(0, 8).map((card, i) => (
              <div 
                key={card.id} 
                className={`relative flex-shrink-0 w-20 md:w-28 aspect-[5/7] rounded-lg border border-white/10 overflow-hidden shadow-xl transform transition-transform duration-500 hover:-translate-y-4 hover:z-10`}
                style={{
                  // Creating a slight fan/curve effect if desired, but strictly horizontal as requested
                  transform: `translateY(${Math.abs(i - 3.5) * 4}px)`,
                  opacity: 1 - Math.abs(i - 3.5) * 0.1
                }}
              >
                <img src={card.url} alt="Hero Card" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            ))}
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
      <div className="relative z-10 mt-10 md:mt-12 flex flex-col items-center text-center px-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl md:text-2xl font-light font-[family-name:var(--font-display)] text-white tracking-[0.2em] uppercase">
            {name}
          </h1>
          <Badge variant="secondary" className="bg-[#7C3AED]/20 text-[#7C3AED] hover:bg-[#7C3AED]/30 border border-[#7C3AED]/50 rounded-sm font-semibold tracking-wider text-xs px-2 py-0.5 uppercase">
            Text Profile
          </Badge>
          <Link 
            href={isOwner ? "/messages" : `/messages/new?to=${sellerId}`}
            className="p-1.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20 hover:text-white transition-colors border border-[#7C3AED]/30"
            title={isOwner ? "My Messages" : `Message ${name}`}
          >
            <Mail className="w-4 h-4" />
          </Link>
        </div>
        
        {bio ? (
          <p className="text-xs md:text-sm text-zinc-400 font-medium max-w-2xl tracking-wide mb-4 md:mb-6">
            {bio}
          </p>
        ) : (
          <p className="text-xs md:text-sm text-zinc-400 font-medium max-w-2xl tracking-wide mb-4 md:mb-6">
            Expert Collector | PSA 10 Specialist | Trax Trusted Seller since 2018 | Curating Rarity
          </p>
        )}

        {/* Prestige Emblems Row (Exactly 5, single row) */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 max-w-4xl mx-auto">
          {PRESTIGE_BADGES.map((badge) => (
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
