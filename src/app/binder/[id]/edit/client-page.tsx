"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateBinderCard } from "@/app/actions/edit-binder";
import { ListingFormFields } from "@/components/sell/ListingFormFields";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function EditBinderClient({ card }: { card: any }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const hasActiveListing = card.listings && card.listings.some((l: any) => 
    l.status === 'active' || l.status === 'pending_marketplace_activation'
  );

  // Initialize form data from DB
  const [formData, setFormData] = useState({
    subject: card.subject || "",
    set: card.set || "",
    year: card.year || "",
    cardNumber: card.cardNumber || "",
    edition: card.edition || "",
    graded: card.graded || false,
    gradingCompany: card.gradingCompany || "",
    grade: card.grade || "",
    condition: card.condition || "",
    description: card.description || "",
    isPrivate: card.isPrivate || false,
    photos: (card.photos || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((p: any) => ({
      kind: p.kind,
      sortOrder: p.sortOrder,
      url: p.storagePath
    }))
  });

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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
        
        // Fetch upload URL (passing cardId as draftId)
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
      await updateBinderCard(card.id, formData);
      setIsDirty(false);
      router.push(`/${card.owner?.profile?.handle || ''}?tab=binder`);
    } catch (err: any) {
      alert("Error saving: " + err.message);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm("You have unsaved changes. Discard?")) return;
    router.push(`/${card.owner?.profile?.handle || ''}?tab=binder`);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 pb-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit Collection Card</h1>
        {isDirty && <div className="text-amber-500 text-sm font-medium">Unsaved changes</div>}
      </div>

      <div className="bg-card border border-border/50 rounded-xl p-6 mb-8 space-y-12">
        <ListingFormFields 
          formData={formData}
          handleChange={handleChange}
          handleManualUpload={handleManualUpload}
          fileInputRef={fileInputRef}
          isUploadingFiles={isUploadingFiles}
          draftId={card.id} 
          mode="binder"
        />

        {/* Binder Specific Fields */}
        <div className="space-y-6 pt-6 border-t border-border/50">
          <h2 className="text-xl font-semibold border-b pb-2">Visibility Options</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/20">
              <input 
                type="checkbox" 
                id="isPrivate" 
                checked={formData.isPrivate} 
                onChange={e => handleChange("isPrivate", e.target.checked)} 
                className="w-4 h-4 mt-1 disabled:opacity-50"
                disabled={hasActiveListing}
              />
              <div className="space-y-1">
                <Label htmlFor="isPrivate" className={hasActiveListing ? "opacity-50" : ""}>
                  Private Card
                </Label>
                <p className="text-sm text-muted-foreground">
                  If checked, this card will be hidden from your public binder.
                </p>
                {hasActiveListing && (
                  <p className="text-xs text-amber-500 font-medium mt-1">
                    Pause or delete your active listing before making this card private.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-10 flex justify-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between w-full max-w-2xl">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || formData.photos.length === 0 || !formData.subject || !formData.set}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
