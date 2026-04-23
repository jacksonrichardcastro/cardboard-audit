import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, MapPin, CalendarDays, ExternalLink, ChevronRight, Home, Expand } from "lucide-react";
import { notFound } from "next/navigation";
import { BuyNowButton } from "@/components/storefront/buy-now-button";
import { CardRail } from "@/components/storefront/card-rail";
import { getListingById, getTrendingListings } from "@/lib/db/queries/listings";
import Link from "next/link";
import Image from "next/image"; // Will use img securely with static Next boundaries as specified earlier to bypass proxy issues if any, but since they are in public/, we can use img

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listingId = parseInt(id, 10);
  
  if (isNaN(listingId)) return notFound();

  // Fetch directly from the native Backend schema
  const dbItem = await getListingById(listingId);
  
  if (!dbItem) return notFound();

  // Map to common structure cleanly
  const item = {
    id: dbItem.id,
    title: dbItem.title,
    category: dbItem.category,
    condition: dbItem.condition,
    gradingCompany: dbItem.gradingCompany,
    grade: dbItem.grade,
    description: dbItem.description,
    priceCents: dbItem.priceCents,
    photoUrl: Array.isArray(dbItem.photos) ? dbItem.photos[0] : (dbItem.photos as any || 'https://placehold.co/400x550'),
    sellerBusinessName: dbItem.sellerName,
    sellerVerified: dbItem.sellerVerified,
    set: undefined as string | undefined,
    year: undefined as string | undefined,
    cardNumber: undefined as string | undefined,
  };

  // Parse Title Dynamics natively to extract set/year logic for robust display
  // e.g. "1999 Pokemon Base Set Charizard Holo Rare"
  const titleParts = item.title.match(/(\d{4})\s+(.+?)\s+(.*)/);
  const derivedYear = item.year || (titleParts ? titleParts[1] : new Date().getFullYear().toString());
  const derivedSet = item.set || (titleParts ? titleParts[2] : "Standard Base");
  const derivedName = titleParts ? titleParts[3] : item.title;

  const dbRelated = await getTrendingListings({ category: item.category });
  const relatedListings = dbRelated
    .filter(i => i.id !== item.id)
    .map(d => ({
      id: d.id,
      title: d.title,
      category: d.category as any,
      subcategory: "Other",
      condition: d.condition,
      grade: d.grade || undefined,
      priceCents: d.priceCents,
      photoUrl: Array.isArray(d.photos) ? d.photos[0] : (d.photos as any || 'https://placehold.co/400x550'),
      sellerBusinessName: d.sellerName,
      createdAt: new Date().toISOString()
    }))
    .slice(0, 6);

  return (
    <div className="w-full flex justify-center pb-24 md:pb-12 bg-background animate-in fade-in duration-700">
      <div className="w-full max-w-7xl">
        {/* Breadcrumb - Align to left edges exactly like the rails (px-4 md:px-8) */}
        <div className="w-full px-4 md:px-8 py-6 flex items-center text-sm text-muted-foreground gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link href="/" className="hover:text-foreground transition-colors flex items-center"><Home className="w-4 h-4 mr-1" /> Home</Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="hover:text-foreground transition-colors cursor-pointer">{item.category}</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">{item.title}</span>
        </div>

        {/* Two Column Layout Viewport */}
        <div className="px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start mb-16">
          
          {/* Left Column: Media (55%) -> 7 / 12 */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl overflow-hidden border border-border/50 bg-neutral-900 shadow-2xl relative aspect-[3/4] group cursor-zoom-in">
              {/* Note: The lightbox is securely stubbed as pure CSS scale + overlay icon for this phase */}
              <img 
                src={item.photoUrl} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none opacity-50" />
              <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Expand className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Right Column: Details (45%) -> 5 / 12 */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-8">
            {/* Header Block */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {item.gradingCompany && item.grade ? (
                  <Badge className="bg-primary hover:bg-primary text-primary-foreground px-3 py-1 text-sm rounded-md shadow-sm">
                    {item.gradingCompany} {item.grade}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-border/50 text-muted-foreground px-3 py-1 text-sm rounded-md bg-secondary/50">
                    Raw • {item.condition}
                  </Badge>
                )}
                {item.cardNumber && <Badge variant="secondary" className="border-border/50 px-2 py-1 text-sm bg-transparent">#{item.cardNumber}</Badge>}
              </div>
              
              <div>
                <p className="text-muted-foreground text-base tracking-wide font-medium mb-1">
                  {derivedYear} {derivedSet}
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-foreground">
                  {derivedName}
                </h1>
              </div>

              <div className="flex items-end gap-3 pt-2">
                <p className="text-5xl font-black tracking-tighter text-foreground">${(item.priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* Purchase CTA */}
            <div className="pt-2">
              <BuyNowButton listingId={item.id} price={item.priceCents} />
            </div>

            {/* Logistics & Seller */}
            <div className="grid gap-4 pt-4">
              <Card className="bg-card/40 border-border/50 shadow-none backdrop-blur-sm">
                <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">Ships from Los Angeles, CA</h4>
                    <p className="text-sm text-muted-foreground mt-1">Estimated delivery: 3-5 business days via USPS Priority</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-border/50 shadow-none backdrop-blur-sm hover:border-primary/30 transition-colors group cursor-pointer">
                <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary text-xl">{item.sellerBusinessName.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.sellerBusinessName}</h4>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <CalendarDays className="w-3.5 h-3.5 mr-1" />
                        Member since 2024
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </div>

            <Separator className="bg-border/50 my-6" />

            {/* Description Block */}
            <div className="space-y-3 pb-8">
              <h3 className="text-xl font-bold tracking-tight text-foreground">Condition & Notes</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-base">
                {item.description || "Stored securely in an exact-fit sleeve and top-loader. Kept in a smoke-free, climate-controlled environment. Please inspect the high-resolution front and back scans carefully determining condition before purchase."}
              </p>
            </div>
          </div>
        </div>

        {/* Similar Cards Rail */}
        {relatedListings.length > 0 && (
          <div className="mt-8 border-t border-border/50 pt-16 mb-8">
            <CardRail 
              title="Similar Cards" 
              listings={relatedListings} 
              seeAllHref={`/category/${item.category.toLowerCase()}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
