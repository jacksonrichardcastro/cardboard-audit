"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDraft, updateDraft, loadDraft } from "../actions";

export default function NewListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdParam = searchParams.get("draftId");
  
  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState<number | null>(draftIdParam ? parseInt(draftIdParam) : null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!draftIdParam);

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

    shippingMethod: "seller_managed"
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

  // Debounced auto-save
  useEffect(() => {
    if (isLoading) return;
    
    const handler = setTimeout(async () => {
      setIsSaving(true);
      try {
        if (draftId) {
          await updateDraft(draftId, formData);
        } else {
          const draft = await createDraft(formData);
          setDraftId(draft.id);
          // Only update URL silently if possible, but for simplicity we'll just keep the ID in state.
        }
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
                <Button onClick={() => setStep(4)}>Next: Price & Details</Button>
                <p className="text-xs text-muted-foreground mt-2">(Photos step coming in next phase)</p>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Step 4: Price & Description</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Price (USD) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
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
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(5)} disabled={!formData.price || parseFloat(formData.price) < 1}>Next: Shipping</Button>
            </div>
          </div>
        )}

        {step === 5 && (
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
                <Button disabled>Review & Publish</Button>
                <p className="text-xs text-muted-foreground mt-2">(Publish flow coming in Phase 5d)</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
