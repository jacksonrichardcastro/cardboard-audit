"use client";

import { use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, ShoppingCart, Link as LinkIcon, AlertCircle } from "lucide-react";
import Link from "next/link";

const MOCK_LISTING = {
  id: "1",
  title: "1999 Base Set Charizard Holo",
  category: "TCG",
  condition: "Near Mint",
  gradingCompany: "PSA",
  grade: "9",
  priceCents: 155000,
  sellerHandle: "Vanguard Vault",
  sellerVerified: true,
  description: "Freshly graded back from PSA. Beautiful swirl on the top right next to the wing. Minimal edge wear on the bottom back.",
  images: ["https://placehold.co/800x1100/111/444?text=Charizard"]
};

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const listingId = unwrappedParams.id;
  const item = MOCK_LISTING;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Left: Media Gallery */}
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl relative aspect-[3/4]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            <Badge className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-md text-white border-white/20 px-3 py-1.5 text-base">
              {item.gradingCompany} {item.grade}
            </Badge>
          </div>
        </div>

        {/* Right: Details & Purchase */}
        <div className="space-y-8 sticky top-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-primary border-primary/30 uppercase tracking-widest">{item.category}</Badge>
              <Badge variant="outline" className="border-white/10">{item.condition}</Badge>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">{item.title}</h1>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-muted-foreground">Sold by</span>
              <span className="font-semibold text-primary">{item.sellerHandle}</span>
              {item.sellerVerified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
            </div>
          </div>

          <Separator className="bg-white/10" />

          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Price</p>
              <p className="text-5xl font-bold tracking-tighter">${(item.priceCents / 100).toFixed(2)}</p>
            </div>

            <Card className="bg-card/40 border-white/5 backdrop-blur-md">
              <CardContent className="p-6">
                <Link href="/cart">
                  <Button className="w-full h-14 text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                    <ShoppingCart className="w-5 h-5 mr-2" /> Buy Now
                  </Button>
                </Link>
                <div className="mt-4 flex items-start gap-3 text-sm text-muted-foreground bg-black/20 p-3 rounded-lg border border-white/5">
                  <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                  <p>Your payment is held securely in escrow until this item is delivered and confirmed, powering our Transparency Ledger.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator className="bg-white/10" />

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Description</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
