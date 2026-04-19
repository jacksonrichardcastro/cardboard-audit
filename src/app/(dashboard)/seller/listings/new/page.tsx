"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePlus, PackageSearch } from "lucide-react";
import { useState, useRef } from "react";

const listingSchema = z.object({
  title: z.string().min(5),
  category: z.enum(["Sports", "TCG", "Other"]),
  condition: z.string().min(1),
  priceDisplay: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a valid number greater than 0"
  }),
  description: z.string().min(10)
});

export default function NewListingPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");

  const form = useForm<z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      category: "TCG",
      condition: "",
      priceDisplay: "",
      description: ""
    }
  });

  const onSubmit = (values: z.infer<typeof listingSchema>) => {
    const priceCents = Math.round(Number(values.priceDisplay) * 100);
    console.log("Submitting listing payload:", { ...values, priceCents, photos: [uploadedUrl] });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploading(true);
    
    try {
      const res = await fetch("/api/storage/upload", {
        method: "POST", body: JSON.stringify({ filename: file.name })
      });
      const { signedUrl, publicUrl } = await res.json();
      
      await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });
      
      setUploadedUrl(publicUrl);
    } catch {
      alert("Failed to securely upload via Signed URL");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3">
        <PackageSearch className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Listing</h1>
          <p className="text-muted-foreground">List a new trading card on the CardBound marketplace.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr,300px] gap-8">
        <Card className="bg-card/40 backdrop-blur-lg border-white/5">
          <CardHeader>
            <CardTitle>Card Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input placeholder="e.g. 1999 Base Set Charizard Holo" className="bg-black/20" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-black/20">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-950 border-white/10">
                          <SelectItem value="TCG">TCG (Pokemon, Magic, Lorcana)</SelectItem>
                          <SelectItem value="Sports">Sports Cards</SelectItem>
                          <SelectItem value="Other">Other / Non-Sports</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="condition" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition / Grade</FormLabel>
                      <FormControl><Input placeholder="e.g. Near Mint OR PSA 10" className="bg-black/20" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="priceDisplay" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Details (USD)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input placeholder="50.00" className="bg-black/20 pl-7" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any edge wear, centring issues, or notable flaws?" className="bg-black/20 resize-none h-32" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full shadow-lg shadow-primary/20">Create Listing</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-card/40 border-dashed border-white/10 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-48 gap-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <ImagePlus className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {uploading ? "Securing connection..." : uploadedUrl ? "Photo Safely Vaulted!" : "Upload Photo"}
                </p>
                {uploadedUrl && <p className="text-xs text-emerald-500 mt-1">Uploaded securely to Supabase Bucket</p>}
                {!uploadedUrl && !uploading && <p className="text-xs text-muted-foreground mt-1">Minimum 3 required</p>}
              </div>
            </CardContent>
          </Card>
          <div className="text-xs text-muted-foreground border border-white/5 p-4 rounded-xl bg-white/5">
            <strong>Transparency Notice:</strong><br/>
            All high-value items will be photographed by our vaulted hub before final distribution if disputes occur. Please upload accurate front, back, and corner images.
          </div>
        </div>
      </div>
    </div>
  );
}
