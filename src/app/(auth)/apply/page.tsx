"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { createSellerApplication } from "@/app/actions/sellers";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  businessName: z.string().min(2, {
    message: "Business name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
});

export default function ApplyPage() {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setSubmitting(true);
      const { applicationUrl } = await createSellerApplication({
        businessName: values.businessName,
        description: values.description
      });
      // P1-3: Hardware redirect directly onto Stripe Hosted KYC
      window.location.href = applicationUrl;
    } catch(err: any) {
      alert("Application Error: " + err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/10">
      <Card className="max-w-lg w-full bg-card/60 backdrop-blur-2xl border-white/5 shadow-2xl relative overflow-hidden group transition-all duration-500 hover:border-white/10 hover:shadow-primary/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
        <CardHeader>
          <div className="flex justify-between items-center mb-3">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 backdrop-blur-md">Vetted Seller Application</Badge>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Open Your Store</CardTitle>
          <CardDescription className="text-muted-foreground/80 pt-1 text-base">
            CardBound is an exclusive, vetted marketplace protecting both buyers and sellers. Complete your profile to apply.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business / Store Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Vanguard Vault" className="bg-black/20 border-white/10 focus-visible:ring-primary/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience & Inventory</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about the kinds of cards you sell..." 
                        className="bg-black/20 border-white/10 resize-none focus-visible:ring-primary/50" 
                        {...field} 
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be shown on your public seller profile.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="p-5 rounded-xl border border-white/10 bg-black/40 flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="font-semibold text-sm text-foreground">Identity Verification</p>
                    <p className="text-xs text-muted-foreground mt-0.5">You will be redirected securely to Stripe KYC upon submit</p>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full h-11 text-base shadow-xl shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Proceed to Secure Verification
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
