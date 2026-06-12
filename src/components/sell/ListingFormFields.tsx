"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PhotoCapture, type CapturedPhoto } from "@/components/sell/photo-capture";
import { Loader2, ImagePlus } from "lucide-react";
import { useRef } from "react";
import Link from "next/link";

export function ListingFormFields({
  formData,
  handleChange,
  handleManualUpload,
  fileInputRef,
  isUploadingFiles,
  draftId,
  mode,
  categories,
  storefrontLayout,
  storefronts
}: {
  formData: any;
  handleChange: (field: string, value: any) => void;
  handleManualUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploadingFiles: boolean;
  draftId: number;
  mode: "listing" | "binder";
  categories?: any[];
  storefrontLayout?: string;
  storefronts?: any[];
}) {
  return (
    <div className="space-y-12">
      {/* 1. Identify the Card */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold border-b pb-2">Card Identification</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Player / Character / Subject *</Label>
            <Input value={formData.subject || ''} onChange={e => handleChange("subject", e.target.value)} placeholder="e.g. Michael Jordan, Charizard" />
          </div>
          {storefronts && storefronts.length > 1 && (
            <div className="space-y-2">
              <Label>Storefront *</Label>
              <select 
                value={formData.storefrontId || ''}
                onChange={e => handleChange("storefrontId", e.target.value)}
                className="w-full h-10 px-3 bg-background border rounded-md"
              >
                {storefronts.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.displayName || `@${s.handle}`}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Set *</Label>
              <Input value={formData.set || ''} onChange={e => handleChange("set", e.target.value)} placeholder="e.g. Base Set, Prizm" />
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input value={formData.year || ''} onChange={e => handleChange("year", e.target.value)} placeholder="e.g. 1999" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Card Number</Label>
              <Input value={formData.cardNumber || ''} onChange={e => handleChange("cardNumber", e.target.value)} placeholder="e.g. 4/102" />
            </div>
            <div className="space-y-2">
              <Label>Edition / Parallel</Label>
              <Input value={formData.edition || ''} onChange={e => handleChange("edition", e.target.value)} placeholder="e.g. 1st Edition, Silver Prizm" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Condition */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold border-b pb-2">Condition</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <input 
              type="checkbox" 
              id="graded" 
              checked={formData.graded || false} 
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
                  value={formData.gradingCompany || ''}
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
                <Input value={formData.grade || ''} onChange={e => handleChange("grade", e.target.value)} placeholder="e.g. 10, 9.5" />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Raw Condition</Label>
              <select 
                value={formData.condition || ''}
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
      </div>

      {/* 2.5 Quantity */}
      {mode !== 'binder' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2">Quantity Available</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <p className="text-sm text-muted-foreground">
                Listing multiple copies of the same card in the same condition? Set quantity here instead of creating duplicate listings.
              </p>
              <Input 
                type="number" 
                min="1" 
                max="99" 
                value={formData.quantity === "" ? "" : formData.quantity} 
                onChange={e => handleChange("quantity", e.target.value === "" ? "" : parseInt(e.target.value) || "")} 
                onBlur={e => {
                  if (e.target.value === "" || parseInt(e.target.value) < 1) {
                    handleChange("quantity", 1);
                  }
                }}
                className="max-w-[150px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2.6 Category */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold border-b pb-2">Storefront Category</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            {(!categories || categories.length === 0) ? (
              <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/10 mt-2">
                No categories yet — <Link href="/seller/dashboard?tab=categories" className="text-[#7C3AED] hover:underline">create one from Manage Categories</Link>
              </div>
            ) : (
              <>
                <select 
                  value={formData.categoryId || ''}
                  onChange={e => handleChange("categoryId", e.target.value)}
                  className="w-full h-10 px-3 mt-2 bg-background border rounded-md"
                >
                  <option value="">No Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id.toString()}>{c.name}</option>
                  ))}
                  <option value="not_exist">Category doesn't exist</option>
                </select>
                {formData.categoryId === "not_exist" && (
                  <p className="text-sm text-yellow-500 mt-2">
                    Card will be saved to your binder. You can create the category later and add it.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Photos */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold border-b pb-2 flex justify-between items-center">
          Photos
          <div className="flex gap-2">
            <label 
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-2 cursor-pointer ${(!draftId || isUploadingFiles) ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input 
                type="file" 
                ref={fileInputRef as any}
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
        
        {(!formData.photos || formData.photos.length === 0) ? (
          <div className="py-4">
            <h3 className="text-center font-medium mb-4 text-muted-foreground">Capture Front of Card</h3>
            <PhotoCapture 
              key="front"
              draftId={draftId}
              kind="front" 
              sortOrder={0} 
              onCapture={(photo) => {
                handleChange("photos", [...(formData.photos || []), photo]);
              }} 
            />
          </div>
        ) : formData.photos.length === 1 ? (
          <div className="space-y-4">
             {/* Render the single photo so they can delete it or see it before taking back */}
             <div className="grid grid-cols-2 gap-4 mb-4">
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
                        handleChange("photos", newPhotos);
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
             </div>
             
             <div className="py-4 border-t pt-8">
               <h3 className="text-center font-medium mb-4 text-muted-foreground">Capture Back of Card</h3>
               <PhotoCapture 
                 key="back"
                 draftId={draftId}
                 kind="back" 
                 sortOrder={1} 
                 onCapture={(photo) => {
                   handleChange("photos", [...formData.photos, photo]);
                 }} 
               />
             </div>
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
                      handleChange("photos", newPhotos);
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
      </div>

      {/* 4. Details & Price (if applicable) */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold border-b pb-2">{mode === 'binder' ? 'Description' : 'Price & Description'}</h2>
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
                  value={formData.price || ''} 
                  onChange={e => handleChange("price", e.target.value)} 
                  placeholder="0.00" 
                  className="pl-7"
                />
              </div>
            </div>
          )}
          {mode !== 'binder' && (
            <div className="space-y-2">
              <Label>Shipping Method</Label>
              <select 
                value={formData.shippingMethod || ''}
                onChange={e => handleChange("shippingMethod", e.target.value)}
                className="w-full h-10 px-3 bg-background border rounded-md"
              >
                <option value="Standard (USPS Ground Advantage)">Standard (USPS Ground Advantage)</option>
                <option value="Tracked First Class">Tracked First Class</option>
                <option value="Priority Mail">Priority Mail</option>
                <option value="Local Pickup Only">Local Pickup Only</option>
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={formData.description || ''} 
              onChange={e => handleChange("description", e.target.value)} 
              placeholder="Describe the card's surface, corners, edges, and centering..."
              className="min-h-[120px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
