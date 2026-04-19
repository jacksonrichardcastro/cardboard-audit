import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { getTrendingListings } from "@/app/actions/listings";
import { SearchBar } from "@/components/storefront/search-bar";
import dynamic from "next/dynamic";

const FilterSidebar = dynamic(() => import("@/components/storefront/filter-sidebar").then(mod => mod.FilterSidebar), { 
  ssr: true,
  loading: () => <div className="h-10 animate-pulse bg-white/5 rounded-full w-48 mb-8" />
});

export default async function Home(
  props: {
    searchParams?: Promise<{
      q?: string;
      category?: string;
      minPrice?: string;
      maxPrice?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const trendingListings = await getTrendingListings(searchParams);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-black/60 border-b border-white/5 py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-900/20 -z-10" />
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

      {/* Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <FilterSidebar />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {trendingListings.map((listing) => (
            <Link href={`/listing/${listing.id}`} key={listing.id}>
              <Card className="group overflow-hidden bg-card/40 border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block h-full">
                <div className="aspect-[3/4] overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={listing.image?.[0] || 'https://placehold.co/400x550'} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <Badge className="absolute top-3 right-3 bg-black/80 backdrop-blur text-white border-white/10">
                    {listing.grade || listing.condition}
                  </Badge>
                </div>
                <CardContent className="p-4 flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">{listing.title}</h3>
                  </div>
                  <div className="flex justify-between items-end mt-auto">
                    <div>
                      <p className="text-xs text-muted-foreground">Seller</p>
                      <p className="text-sm font-medium text-primary hover:underline">{listing.sellerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${(listing.priceCents / 100).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {trendingListings.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/5">
              No listings available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
