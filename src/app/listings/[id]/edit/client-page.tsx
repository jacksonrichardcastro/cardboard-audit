"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateListing } from "@/app/actions/edit-listing";
import { ListingFormFields } from "@/components/sell/ListingFormFields";
import { Button } from "@/components/ui/button";
import { RemoveListingModal } from "@/components/listings/RemoveListingModal";

export default function EditListingClient({ listing, card, handle, categories = [], storefrontLayout = "grid", cardMemberships = [], storefronts = [] }: { 
  listing: any, 
  card: any,
  handle?: string,
  categories?: any[],
  storefrontLayout?: string,
  cardMemberships?: any[],
  storefronts?: any[]
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Helper to extract subject from title
  const getSubject = () => {
    let extracted = (listing.title || card.title || "");
    const y = listing.year || card.year;
    const s = listing.set || card.set;
    const e = listing.edition;
    const c = listing.cardNumber || card.cardNumber;
    
    if (y) extracted = extracted.replace(y, "");
    if (s) extracted = extracted.replace(s, "");
    if (e) extracted = extracted.replace(e, "");
    if (c) extracted = extracted.replace(`#${c}`, "").replace(c, "");
    
    return extracted.trim().replace(/\s+/g, ' ');
  };

  // Initialize form data from DB
  const [formData, setFormData] = useState({
    subject: getSubject(),
    set: listing.set || card.set || "",
    year: listing.year || card.year || "",
    cardNumber: listing.cardNumber || card.cardNumber || "",
    edition: listing.edition || "",
    graded: listing.graded || card.graded || false,
    gradingCompany: listing.gradingCompany || card.gradingCompany || "",
    grade: listing.grade || card.grade || "",
    condition: listing.condition || card.condition || "",
    price: (listing.priceCents / 100).toFixed(2),
    shippingMethod: listing.shippingMethod || "Standard (USPS Ground Advantage)",
    description: listing.description || card.description || "",
    quantity: (listing as any).quantity || 1,
    categoryId: cardMemberships.length > 0 ? cardMemberships[0].categoryId.toString() : "",
    photos: (card.photos || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((p: any) => ({
      kind: p.kind,
      sortOrder: p.sortOrder,
      url: p.storagePath
    })),
    storefrontId: listing.storefrontId || storefronts?.find(s => s.isDefault)?.id || storefronts?.[0]?.id || ""
  });

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    const handleClick = (e: MouseEvent) => {
      if (!isDirty) return;
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href && anchor.target !== '_blank' && !anchor.hasAttribute('download')) {
        if (!window.confirm('Leave site? Changes you made may not be saved.')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick, { capture: true });
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [isDirty]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFiles(true);
    const newPhotos = [...formData.photos];
    let sortOrder = newPhotos.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Fetch upload URL (passing cardId as draftId so it stores cleanly)
        const res = await fetch("/api/storage/upload", {
          method: "POST",
          body: JSON.stringify({ draftId: card.id, kind: sortOrder === 0 ? "front" : (sortOrder === 1 ? "back" : "angle") }),
          headers: { "Content-Type": "application/json" }
        });
        
        if (!res.ok) throw new Error("Failed to get upload URL");
        const { signedUrl, publicUrl } = await res.json();
        
        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          body: await file.arrayBuffer(),
          headers: { "Content-Type": file.type || "image/jpeg" }
        });
        
        if (!uploadRes.ok) throw new Error("Failed to upload image");
        
        newPhotos.push({
          kind: sortOrder === 0 ? "front" : (sortOrder === 1 ? "back" : "angle"),
          sortOrder,
          url: publicUrl
        });
        sortOrder++;
      }
      
      setFormData({ ...formData, photos: newPhotos });
      setIsDirty(true);
    } catch (err: any) {
      alert("Error uploading file: " + err.message);
    } finally {
      setIsUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateListing(listing.id, formData);
      setIsDirty(false);
      router.push(`/listings/${listing.id}`);
    } catch (err: any) {
      alert("Error saving: " + err.message);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm("You have unsaved changes. Discard?")) return;
    router.push(`/listings/${listing.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 pb-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit Listing</h1>
        {isDirty && <div className="text-amber-500 text-sm font-medium">Unsaved changes</div>}
      </div>

      <div className="bg-card border border-border/50 rounded-xl p-6 mb-8">
        <ListingFormFields 
          formData={formData}
          handleChange={handleChange}
          handleManualUpload={handleManualUpload}
          fileInputRef={fileInputRef}
          isUploadingFiles={isUploadingFiles}
          draftId={card.id} 
          mode="listing"
          categories={categories}
          storefrontLayout={storefrontLayout}
          storefronts={storefronts}
        />
      </div>

      <div className="flex justify-center mt-12 mb-8">
        <RemoveListingModal 
          listingId={listing.id} 
          onSuccessRedirectUrl={handle ? `/${handle}` : "/seller/dashboard?tab=listings"}
          triggerNode={
            <Button type="button" variant="destructive" className="w-full max-w-xs">
              Remove Listing
            </Button>
          } 
        />
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-10 flex justify-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center w-full max-w-2xl">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <div className="flex items-center gap-4">
            {formData.photos.length < (formData.graded ? 1 : 2) && (
              <span className="text-destructive text-sm font-medium">
                {formData.graded ? "Slabbed cards require at least 1 photo." : "Raw cards require at least 2 photos."}
              </span>
            )}
            <Button 
              onClick={handleSave} 
              disabled={isSaving || formData.photos.length < (formData.graded ? 1 : 2) || !formData.subject || !formData.set || !formData.price}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
