"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { acceptLegal } from "./actions";

export default function LegalAcceptancePage() {
  const router = useRouter();
  const [tos, setTos] = useState(false);
  const [photos, setPhotos] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = tos && photos && shipping;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await acceptLegal();
      router.push("/seller/onboarding/pending");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl min-h-[70vh]">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Review our standards</h1>
      
      {error && <div className="p-4 mb-6 bg-red-500/20 text-red-400 rounded">{error}</div>}

      <div className="space-y-6 bg-card/50 p-6 rounded-lg border border-white/10 backdrop-blur-sm mb-8">
        <div className="flex items-start space-x-3">
          <Checkbox id="tos" checked={tos} onCheckedChange={(c: boolean | 'indeterminate') => setTos(c === true)} />
          <div className="grid gap-1.5 leading-none">
            <label htmlFor="tos" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I have read and accept the <Link href="/legal/seller-tos" className="text-violet-400 hover:underline" target="_blank">Trax Seller Terms of Service</Link>
            </label>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox id="photos" checked={photos} onCheckedChange={(c: boolean | 'indeterminate') => setPhotos(c === true)} />
          <div className="grid gap-1.5 leading-none">
            <label htmlFor="photos" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I have read and accept the <Link href="/legal/photo-guidelines" className="text-violet-400 hover:underline" target="_blank">Trax Photo Guidelines</Link>
            </label>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox id="shipping" checked={shipping} onCheckedChange={(c: boolean | 'indeterminate') => setShipping(c === true)} />
          <div className="grid gap-1.5 leading-none">
            <label htmlFor="shipping" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I agree to ship orders within 48 hours of payment
            </label>
          </div>
        </div>
      </div>

      <Button size="lg" className="w-full bg-violet-600 hover:bg-violet-700" disabled={!canSubmit || loading} onClick={handleSubmit}>
        {loading ? "Submitting..." : "Submit Application"}
      </Button>
    </div>
  );
}
