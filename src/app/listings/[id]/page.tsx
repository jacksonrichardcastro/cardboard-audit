import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, MapPin, CalendarDays, ExternalLink, ChevronRight, Home, Expand, Flame, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { BuyNowButton } from "@/components/storefront/buy-now-button";
import { MakeOfferButton } from "@/components/storefront/make-offer-button";
import { CardRail } from "@/components/storefront/card-rail";
import { getListingById, getTrendingListings } from "@/lib/db/queries/listings";
import { db } from "@/lib/db";
import { viewHistory } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image"; // Will use img securely with static Next boundaries as specified earlier to bypass proxy issues if any, but since they are in public/, we can use img
import { ListingGallery } from "@/components/listings/listing-gallery";
import { RemoveListingModal } from "@/components/listings/RemoveListingModal";
import { PostCreationModal } from "@/components/listings/post-creation-modal";
import { Suspense } from "react";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listingId = parseInt(id, 10);
  
  if (isNaN(listingId)) return notFound();

  // Fetch directly from the native Backend schema
  const dbItem = await getListingById(listingId);
  
  if (!dbItem) return notFound();

  // View tracking
  const { userId } = await auth();
  if (userId) {
    try {
      await db.insert(viewHistory).values({ userId, listingId });
    } catch (err) {
      console.error("Failed to track view:", err);
    }
  }

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
    discountType: dbItem.discountType,
    discountAmount: dbItem.discountAmount,
    discountActiveUntil: dbItem.discountActiveUntil,
    photos: Array.isArray(dbItem.photos) ? dbItem.photos : (dbItem.photos ? [dbItem.photos as any] : []),
    sellerBusinessName: dbItem.sellerName,
    sellerHandle: dbItem.sellerHandle,
    sellerVerified: dbItem.sellerVerified,
    set: dbItem.set,
    year: dbItem.year,
    cardNumber: dbItem.cardNumber,
    shipsFrom: dbItem.shipsFrom,
    shippingEstimate: dbItem.shippingEstimate,
    sellerCreatedAt: dbItem.sellerCreatedAt,
    sellerAvatarUrl: dbItem.sellerAvatarUrl,
    shippingMethod: dbItem.shippingMethod,
  };

  const isOwner = userId === dbItem.sellerId;
  const isDraft = item.priceCents === null;

  const dbRelated = await getTrendingListings({ 
    category: item.category,
    includePending: true,
    excludeSellerId: userId || undefined
  });
  
  const seenRelatedTitles = new Set<string>();
  const diverseRelated = dbRelated.filter((i: any) => {
    if (i.id === item.id) return false;
    const baseTitle = i.title.split('#')[0].split('(')[0].trim().toLowerCase();
    if (seenRelatedTitles.has(baseTitle)) return false;
    seenRelatedTitles.add(baseTitle);
    return true;
  });

  const relatedListings = diverseRelated
    .map((d: any) => ({
      id: d.id,
      title: d.title,
      category: d.category as any,
      subcategory: "Other",
      condition: d.condition,
      grade: d.grade || undefined,
      gradingCompany: d.gradingCompany || undefined,
      priceCents: d.priceCents,
      discountType: d.discountType,
      discountAmount: d.discountAmount,
      discountActiveUntil: d.discountActiveUntil,
      photoUrl: Array.isArray(d.photos) ? d.photos[0] : (d.photos as any || 'https://placehold.co/400x550'),
      sellerBusinessName: d.sellerName,
      createdAt: new Date().toISOString()
    }))
    .slice(0, 6);

  return (
    <div className="w-full flex justify-center pb-24 md:pb-12 bg-background animate-in fade-in duration-700">
      <Suspense fallback={null}>
        <PostCreationModal sellerHandle={dbItem.sellerHandle} />
      </Suspense>
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
            <ListingGallery photos={item.photos} title={item.title} />
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
                  {item.year || ""} {item.set || ""}
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-foreground">
                  {item.title}
                </h1>
                {isOwner && (
                  <div className="mt-4 flex items-center gap-2">
                    <Link 
                      href={`/listings/${item.id}/edit`}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                      Edit Listing
                    </Link>
                    <RemoveListingModal 
                      listingId={item.id}
                      onSuccessRedirectUrl={dbItem.sellerHandle ? `/${dbItem.sellerHandle}` : "/seller/dashboard?tab=listings"}
                      triggerNode={
                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-red-900/50 bg-red-950/20 hover:bg-red-900/40 text-red-500 hover:text-red-400 h-10 px-4 py-2">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </button>
                      }
                    />
                  </div>
                )}
              </div>

              <div className="flex items-end gap-3 pt-2">
                <div className="flex flex-col">
                  {isDraft ? (
                    <p className="text-3xl font-black tracking-tighter text-muted-foreground">
                      Price coming soon
                    </p>
                  ) : (
                    <>
                      {item.discountType && item.discountAmount && (
                        <div className="flex items-center gap-2 mb-1">
                          <div className="bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded-sm border border-primary/30 flex items-center gap-1">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <span className="text-xs font-bold text-primary">
                              {item.discountType === 'percent' 
                                ? `${item.discountAmount / 100}% OFF` 
                                : `$${(item.discountAmount / 100).toFixed(0)} OFF`}
                            </span>
                          </div>
                          <span className="text-xl text-muted-foreground line-through font-medium">
                            ${(item.priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      <p className={`text-5xl font-black tracking-tighter ${item.discountType ? "text-primary" : "text-foreground"}`}>
                        ${((item.discountType === 'percent' 
                          ? item.priceCents * (1 - (item.discountAmount || 0) / 10000)
                          : item.discountType === 'dollar'
                          ? Math.max(0, item.priceCents - (item.discountAmount || 0))
                          : item.priceCents) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Purchase CTA */}
            {!isDraft && (
              <div className="pt-2 flex flex-row gap-2 sm:gap-3">
                <div className="flex-1">
                  <BuyNowButton 
                    listingId={item.id} 
                    price={item.discountType === 'percent' 
                      ? item.priceCents * (1 - (item.discountAmount || 0) / 10000)
                      : item.discountType === 'dollar'
                      ? Math.max(0, item.priceCents - (item.discountAmount || 0))
                      : item.priceCents} 
                    title={item.title} 
                    photoUrl={item.photos[0]} 
                    shipsFrom={item.shipsFrom || "Los Angeles, CA"}
                    shippingEstimate={item.shippingEstimate || "3-5 business days via USPS Priority"}
                    quantity={1} // Phase A: hardcoded default
                  />
                </div>
                <div className="flex-1">
                  <MakeOfferButton
                    listingId={item.id}
                    priceCents={item.discountType === 'percent' 
                      ? item.priceCents * (1 - (item.discountAmount || 0) / 10000)
                      : item.discountType === 'dollar'
                      ? Math.max(0, item.priceCents - (item.discountAmount || 0))
                      : item.priceCents}
                    title={item.title}
                  />
                </div>
              </div>
            )}
            {isDraft && isOwner && (
              <div className="pt-2 flex flex-col gap-3">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
                  <p className="text-sm text-primary font-medium">Set a price to publish this listing.</p>
                  <Link 
                    href={`/listings/${item.id}/edit`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 shrink-0 ml-4"
                  >
                    Edit Listing
                  </Link>
                </div>
              </div>
            )}

            {/* Logistics & Seller */}
            <div className="grid gap-4 pt-4">
              <Card className="bg-card/40 border-border/50 shadow-none backdrop-blur-sm">
                <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">Ships from {item.shipsFrom || "United States"}</h4>
                    <p className="text-sm text-muted-foreground mt-1">Shipping method: {item.shippingMethod || "Standard (USPS Ground Advantage)"}</p>
                  </div>
                </CardContent>
              </Card>

              <Link href={`/${item.sellerHandle}`}>
                <Card className="bg-card/40 border-border/50 shadow-none backdrop-blur-sm hover:border-primary/30 transition-colors group cursor-pointer">
                <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {item.sellerAvatarUrl ? (
                      <img src={item.sellerAvatarUrl} alt={item.sellerBusinessName} className="w-12 h-12 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="font-bold text-primary text-xl">{item.sellerBusinessName.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.sellerBusinessName}</h4>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <CalendarDays className="w-3.5 h-3.5 mr-1" />
                        Member since {item.sellerCreatedAt ? new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(item.sellerCreatedAt)) : "May 2026"}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
              </Link>
            </div>

            <Separator className="bg-border/50 my-6" />

            {/* Description Block */}
            <div className="space-y-3 pb-8">
              <h3 className="text-xl font-bold tracking-tight text-foreground">Condition & Notes</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-base">
                {item.description || "No description provided."}
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
              seeAllHref="/for-you"
            />
          </div>
        )}
      </div>
    </div>
  );
}
