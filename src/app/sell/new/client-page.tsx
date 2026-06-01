"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRef } from "react";
import { PhotoCapture, type CapturedPhoto } from "@/components/sell/photo-capture";
import { createDraft, updateDraft, loadDraft, publishDraft } from "../actions";
import { Loader2, ImagePlus } from "lucide-react";

export default function NewListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdParam = searchParams.get("draftId");
  const mode = searchParams.get("mode");
  
  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState<number | null>(draftIdParam ? parseInt(draftIdParam) : null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!draftIdParam);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<any>({
    subject: "",
    set: "",
    year: "",
    cardNumber: "",
    edition: "",
    
    graded: false,
    gradingCompany: "",
    grade: "",
    condition: "",

    price: "",
    description: "",

    photos: [] as { kind: string; url: string; sortOrder: number }[],

    shippingMethod: "seller_managed",
    mode: mode || "listing"
  });

  useEffect(() => {
    if (draftIdParam) {
      loadDraft(parseInt(draftIdParam)).then(draft => {
        if (draft.data) {
          setFormData({ ...formData, ...(draft.data as any) });
        }
        setIsLoading(false);
      }).catch(err => {
        console.error(err);
        setIsLoading(false);
      });
    }
  }, [draftIdParam]);

  // Initialize draft immediately if not editing an existing one
  useEffect(() => {
    if (!draftIdParam && !draftId && !isLoading) {
      setIsSaving(true);
      createDraft({ ...formData, mode: mode || "listing" })
        .then(draft => {
          setDraftId(draft.id);
        })
        .catch(console.error)
        .finally(() => {
          setIsSaving(false);
        });
    }
  }, [draftIdParam, draftId, isLoading, mode]);

  // Debounced auto-save (only when draftId exists)
  useEffect(() => {
    if (isLoading || !draftId) return;
    
    const handler = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateDraft(draftId, formData);
      } catch (err) {
        console.error("Failed to save draft", err);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [formData, draftId, isLoading]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!draftId) return alert("Draft is still initializing. Please wait.");
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploadingFiles(true);
    let newPhotos = [...formData.photos];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const kind = newPhotos.length === 0 ? "front" : newPhotos.length === 1 ? "back" : "angle";
        const sortOrder = newPhotos.length;
        
        const res = await fetch("/api/storage/upload", {
          method: "POST",
          body: JSON.stringify({ draftId, kind }),
          headers: { "Content-Type": "application/json" }
        });
        if (!res.ok) throw new Error("Failed to get secure upload URL");
        
        const { signedUrl, publicUrl } = await res.json();
        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          body: await file.arrayBuffer(),
          headers: { "Content-Type": file.type || "image/jpeg" }
        });
        
        if (!uploadRes.ok) throw new Error("Failed to upload image to bucket");
        newPhotos.push({ kind, url: publicUrl, sortOrder });
      }
      setFormData((prev: any) => ({ ...prev, photos: newPhotos }));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Upload failed");
    } finally {
      setIsUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePublish = async () => {
    if (!draftId) return;
    setIsPublishing(true);
    try {
      const isDemo = searchParams.get("demo") === "1";
      // Perform final save before publish
      await updateDraft(draftId, formData);
      const id = await publishDraft(draftId, isDemo);
      if (isDemo) {
        alert("Demo Mode: Submission blocked. This would have redirected to /listings/" + id);
        setIsPublishing(false);
      } else {
        if (mode === "binder") {
          router.push(`/`); // Could go to profile if we had handle, home is safe
        } else {
          router.push(`/listings/${id}`);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to publish listing.");
      setIsPublishing(false);
    }
  };

  if (isLoading) return <div className="p-12 text-center">Loading draft...</div>;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Create Listing</h1>
        <div className="text-sm text-muted-foreground">
          {isSaving ? "Saving..." : "Saved as draft"}
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-xl p-6">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Step 1: Identify the Card</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Player / Character / Subject *</Label>
                <Input value={formData.subject} onChange={e => handleChange("subject", e.target.value)} placeholder="e.g. Michael Jordan, Charizard" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Set *</Label>
                  <Input value={formData.set} onChange={e => handleChange("set", e.target.value)} placeholder="e.g. Base Set, Prizm" />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input value={formData.year} onChange={e => handleChange("year", e.target.value)} placeholder="e.g. 1999" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <Input value={formData.cardNumber} onChange={e => handleChange("cardNumber", e.target.value)} placeholder="e.g. 4/102" />
                </div>
                <div className="space-y-2">
                  <Label>Edition / Parallel</Label>
                  <Input value={formData.edition} onChange={e => handleChange("edition", e.target.value)} placeholder="e.g. 1st Edition, Silver Prizm" />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(2)} disabled={!formData.subject || !formData.set}>Next: Condition</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Step 2: Condition</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <input 
                  type="checkbox" 
                  id="graded" 
                  checked={formData.graded} 
                  onChange={e => handleChange("graded", e.target.checked)} 
                  className="w-4 h-4"
                />
                <Label htmlFor="graded">This card is graded (slabbed)</Label>
              </div>

              {formData.graded ? (
                <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label>Grading Company</Label>
                    <select 
                      value={formData.gradingCompany}
                      onChange={e => handleChange("gradingCompany", e.target.value)}
                      className="w-full h-10 px-3 bg-background border rounded-md"
                    >
                      <option value="">Select...</option>
                      <option value="PSA">PSA</option>
                      <option value="BGS">BGS</option>
                      <option value="CGC">CGC</option>
                      <option value="SGC">SGC</option>
                      <option value="TAG">TAG</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Grade</Label>
                    <Input value={formData.grade} onChange={e => handleChange("grade", e.target.value)} placeholder="e.g. 10, 9.5" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Raw Condition</Label>
                  <select 
                    value={formData.condition}
                    onChange={e => handleChange("condition", e.target.value)}
                    className="w-full h-10 px-3 bg-background border rounded-md"
                  >
                    <option value="">Select condition...</option>
                    <option value="Near Mint or Better">Near Mint or Better</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <div className="text-right">
                <Button onClick={() => setStep(3)}>Next: Photos</Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2 flex justify-between items-center">
              Step 3: Photos
              <div className="flex gap-2">
                <label 
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-2 cursor-pointer ${(!draftId || isUploadingFiles) ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*" 
                    multiple 
                    onChange={handleManualUpload}
                    disabled={!draftId || isUploadingFiles}
                  />
                  {isUploadingFiles ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  {isUploadingFiles ? "Uploading..." : "Upload Existing"}
                </label>
              </div>
            </h2>
            
            {formData.photos.length === 0 ? (
              <div className="py-4">
                <h3 className="text-center font-medium mb-4 text-muted-foreground">Capture Front of Card</h3>
                <PhotoCapture 
                  key="front"
                  draftId={draftId}
                  kind="front" 
                  sortOrder={0} 
                  onCapture={(photo) => {
                    setFormData({ ...formData, photos: [...formData.photos, photo] });
                  }} 
                />
              </div>
            ) : formData.photos.length === 1 ? (
              <div className="py-4">
                <h3 className="text-center font-medium mb-4 text-muted-foreground">Capture Back of Card</h3>
                <PhotoCapture 
                  key="back"
                  draftId={draftId}
                  kind="back" 
                  sortOrder={1} 
                  onCapture={(photo) => {
                    setFormData({ ...formData, photos: [...formData.photos, photo] });
                  }} 
                />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-sm text-muted-foreground">Photos captured/uploaded successfully!</p>
                <div className="grid grid-cols-2 gap-4">
                  {formData.photos.map((p: any, i: number) => (
                    <div key={i} className="relative aspect-[3/4] bg-neutral-900 rounded-lg overflow-hidden border border-border">
                      <img src={p.url} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded capitalize">
                        {p.kind}
                      </div>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full"
                        onClick={() => {
                          const newPhotos = [...formData.photos];
                          newPhotos.splice(i, 1);
                          setFormData({ ...formData, photos: newPhotos });
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="text-center mt-4">
                   <Button 
                    variant="secondary" 
                    size="sm" 
                    className="gap-2"
                    disabled={!draftId || isUploadingFiles}
                    onClick={() => fileInputRef.current?.click()}
                   >
                     {isUploadingFiles ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                     Add Another Photo
                   </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button 
                onClick={() => setStep(4)} 
                disabled={formData.photos.length === 0 || (!formData.graded && formData.photos.length < 2)}
              >
                Next: Price & Details
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Step 4: {mode === 'binder' ? 'Description' : 'Price & Description'}</h2>
            <div className="space-y-4">
              {mode !== 'binder' && (
                <div className="space-y-2">
                  <Label>Price (USD) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input 
                      type="number" 
                      min="1.00" 
                      step="0.01" 
                      value={formData.price} 
                      onChange={e => handleChange("price", e.target.value)} 
                      placeholder="0.00" 
                      className="pl-7"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => handleChange("description", e.target.value)} 
                  placeholder="Describe the card's surface, corners, edges, and centering..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              {mode === 'binder' ? (
                <div className="text-right">
                  <Button 
                    onClick={handlePublish}
                    disabled={isPublishing || !draftId}
                  >
                    {isPublishing ? "Saving..." : "Save to Binder"}
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setStep(5)} disabled={!formData.price || parseFloat(formData.price) < 1}>Next: Shipping</Button>
              )}
            </div>
          </div>
        )}

        {step === 5 && mode !== 'binder' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Step 5: Shipping</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Shipping Method</Label>
                <select 
                  value={formData.shippingMethod}
                  onChange={e => handleChange("shippingMethod", e.target.value)}
                  className="w-full h-10 px-3 bg-background border rounded-md"
                >
                  <option value="seller_managed">Seller-managed (you buy and print the label)</option>
                </select>
                <p className="text-sm text-muted-foreground mt-1">
                  You are responsible for purchasing the shipping label and entering the tracking number on Trax after the sale. Funds are released when the carrier confirms tracking is live.
                </p>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(4)}>Back</Button>
              <div className="text-right">
                <Button 
                  onClick={handlePublish}
                  disabled={isPublishing || !draftId}
                >
                  {isPublishing ? "Publishing..." : "Review & Publish"}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
