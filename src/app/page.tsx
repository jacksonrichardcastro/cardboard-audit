import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";

const MOCK_LISTINGS = [
  { id: 1, title: "1999 Base Set Charizard Holo", grade: "PSA 9", price: 1550, seller: "Vanguard Vault", image: "https://placehold.co/400x550/111/444?text=Charizard" },
  { id: 2, title: "2018 Luka Doncic Prizm Rookie", grade: "BGS 9.5", price: 800, seller: "Retro Breaks", image: "https://placehold.co/400x550/111/444?text=Luka+RC" },
  { id: 3, title: "Black Lotus Unlimited", grade: "Raw - MP", price: 4200, seller: "MTG Kings", image: "https://placehold.co/400x550/111/444?text=Black+Lotus" },
  { id: 4, title: "Shohei Ohtani Bowman Chrome", grade: "PSA 10", price: 600, seller: "Retro Breaks", image: "https://placehold.co/400x550/111/444?text=Ohtani" },
  { id: 5, title: "1st Edition Blue-Eyes White Dragon", grade: "PSA 8", price: 2100, seller: "Vanguard Vault", image: "https://placehold.co/400x550/111/444?text=Blue+Eyes" },
  { id: 6, title: "Tom Brady 2000 Bowman RC", grade: "PSA 8", price: 3400, seller: "Vanguard Vault", image: "https://placehold.co/400x550/111/444?text=Brady" },
];

export default function Home() {
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
          
          <div className="max-w-xl mx-auto mt-8 relative">
            <Search className="absolute left-4 top-3.5 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Search by player, set, grade..." 
              className="w-full pl-12 h-12 bg-white/5 border-white/10 text-lg rounded-full focus-visible:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Trending Slabs</h2>
          <Badge variant="outline" className="border-white/10 hover:bg-white/5 cursor-pointer py-1.5">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {MOCK_LISTINGS.map((listing) => (
            <Link href={`/listing/${listing.id}`} key={listing.id}>
              <Card className="group overflow-hidden bg-card/40 border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block">
                <div className="aspect-[3/4] overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={listing.image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <Badge className="absolute top-3 right-3 bg-black/80 backdrop-blur text-white border-white/10">
                    {listing.grade}
                  </Badge>
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">{listing.title}</h3>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Seller</p>
                      <p className="text-sm font-medium text-primary hover:underline">{listing.seller}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${listing.price}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
