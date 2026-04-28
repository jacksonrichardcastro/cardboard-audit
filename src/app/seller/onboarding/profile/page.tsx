"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { saveProfile } from "./actions";
import { useState } from "react";

const profileSchema = z.object({
  handle: z.string().min(3).max(40).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  displayName: z.string().min(1).max(100),
  bio: z.string().max(160).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
});

export default function ProfileSetupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      handle: "",
      displayName: "",
      bio: "",
      city: "",
      state: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      setError(null);
      await saveProfile(data);
      router.push("/seller/onboarding/stripe");
    } catch (e: any) {
      setError(e.message || "Failed to save profile");
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Set up your seller profile</h1>
      
      {error && <div className="p-4 mb-6 bg-red-500/20 text-red-400 rounded">{error}</div>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="handle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store Handle</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <span className="bg-white/10 px-3 py-2 border border-white/10 border-r-0 rounded-l text-muted-foreground">trax.cards/</span>
                    <Input placeholder="your-store" className="rounded-l-none" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Store Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Tell buyers about your collection..." className="resize-none" {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground text-right">{field.value?.length || 0}/160</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Los Angeles" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="CA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Continue to Verify Identity"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
