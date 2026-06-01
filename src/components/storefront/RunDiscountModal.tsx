"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, Loader2 } from "lucide-react";
import { runDiscount } from "@/app/actions/discounts";
import { toast } from "sonner";

export interface RunDiscountModalProps {
  listingId: number;
  listingPriceCents: number;
  currentType?: string | null;
  currentAmount?: number | null;
  currentUntil?: Date | null;
  triggerNode?: React.ReactElement;
}

export function RunDiscountModal({ 
  listingId, 
  listingPriceCents,
  currentType,
  currentAmount,
  currentUntil,
  triggerNode
}: RunDiscountModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [type, setType] = useState<"percent" | "dollar">(
    (currentType as "percent" | "dollar") || "percent"
  );
  const [amountStr, setAmountStr] = useState<string>(
    currentAmount 
      ? currentType === "percent" 
        ? (currentAmount / 100).toString() 
        : (currentAmount / 100).toString() 
      : ""
  );

  let defaultDuration = "none";
  if (currentUntil) {
    const diff = new Date(currentUntil).getTime() - Date.now();
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    if (days <= 1) defaultDuration = "24h";
    else if (days <= 7) defaultDuration = "7d";
    else if (days <= 30) defaultDuration = "30d";
  }
  const [duration, setDuration] = useState<string>(defaultDuration);

  const handleSave = () => {
    let parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount)) {
      toast.error("Please enter a valid amount.");
      return;
    }

    let finalAmount = 0;
    if (type === "percent") {
      if (parsedAmount < 1 || parsedAmount > 99) {
        toast.error("Percent must be between 1 and 99.");
        return;
      }
      finalAmount = parsedAmount * 100; // Store 15% as 1500
    } else {
      if (parsedAmount <= 0) {
        toast.error("Dollar amount must be greater than 0.");
        return;
      }
      finalAmount = Math.round(parsedAmount * 100);
      if (finalAmount >= listingPriceCents) {
        toast.error("Discount cannot be greater than the listing price.");
        return;
      }
    }

    let activeUntil: Date | null = null;
    if (duration !== "none") {
      activeUntil = new Date();
      if (duration === "24h") activeUntil.setHours(activeUntil.getHours() + 24);
      if (duration === "7d") activeUntil.setDate(activeUntil.getDate() + 7);
      if (duration === "30d") activeUntil.setDate(activeUntil.getDate() + 30);
    }

    startTransition(async () => {
      try {
        await runDiscount(listingId, type, finalAmount, activeUntil);
        toast.success("Discount applied successfully!");
        setOpen(false);
      } catch (err: any) {
        toast.error(err.message || "Failed to apply discount");
      }
    });
  };

  const handleClear = () => {
    startTransition(async () => {
      try {
        await runDiscount(listingId, null, null, null);
        toast.success("Discount removed successfully!");
        setOpen(false);
        setAmountStr("");
        setType("percent");
        setDuration("none");
      } catch (err: any) {
        toast.error(err.message || "Failed to remove discount");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerNode || (
        <button className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 backdrop-blur-md p-1.5 rounded-md border border-white/10 text-white z-20 transition-colors">
          <Flame className="w-4 h-4 text-orange-500" />
        </button>
      )} />
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> Run Discount
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-3">
            <Label>Discount Type</Label>
            <RadioGroup 
              value={type} 
              onValueChange={(val) => setType(val as "percent" | "dollar")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percent" id="r1" />
                <Label htmlFor="r1" className="cursor-pointer">Percent Off</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dollar" id="r2" />
                <Label htmlFor="r2" className="cursor-pointer">Dollar Amount</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Amount</Label>
            <div className="relative">
              {type === "dollar" && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
              )}
              <Input
                type="number"
                placeholder={type === "percent" ? "20" : "50"}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className={`bg-zinc-900 border-white/10 ${type === "dollar" ? "pl-7" : ""}`}
              />
              {type === "percent" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">%</span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              Listing Price: ${(listingPriceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="space-y-3">
            <Label>Duration</Label>
            <Select value={duration} onValueChange={(val) => setDuration(val || "none")}>
              <SelectTrigger className="bg-zinc-900 border-white/10">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="none">No End Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          {currentType && (
            <Button 
              variant="destructive" 
              onClick={handleClear} 
              disabled={isPending}
              className="sm:mr-auto w-full sm:w-auto"
            >
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "End Discount"}
            </Button>
          )}
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending} className="bg-transparent border-white/10 hover:bg-white/5">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Discount"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
