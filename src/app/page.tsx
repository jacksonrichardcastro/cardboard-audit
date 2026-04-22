import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { SearchBar } from "@/components/storefront/search-bar";
import { CardRail } from "@/components/storefront/card-rail";
import { mockListings } from "@/lib/mock/listings";

export default function Home() {
  // "Recommended for you" - simple stable slice
  const recommendedListings = mockListings.slice(0, 10);
  
  // "Recently added" - sorted by createdAt descending
  const recentListings = [...mockListings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-black/60 border-b border-white/5 py-24">
        <div className="absolute inset-0 bg-[url('https://placehold.co/1920x400/000/111?text=+')] opacity-20 bg-cover bg-center -z-20" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-6">
          <Badge className="bg-primary/20 text-primary border-none hover:bg-primary/30 py-1.5 px-4 rounded-full text-sm">
            <ShieldCheck className="w-4 h-4 mr-2 inline" /> Transparent & Vetted Marketplace
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
            Find Your Holy Grail.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Shop highly vetted sellers with full 100% supply chain transparency, standard payout logic, and the fairest fees in the hobby.
          </p>
          
          <SearchBar />
        </div>
      </div>

      {/* Horizontal Dashboard Rails */}
      <div className="pt-8">
        <CardRail 
          title="Recommended for you" 
          listings={recommendedListings} 
          seeAllHref="/search?sort=recommended" 
        />
        
        <CardRail 
          title="Recently added" 
          listings={recentListings} 
          seeAllHref="/search?sort=newest" 
        />
      </div>
    </div>
  );
}
