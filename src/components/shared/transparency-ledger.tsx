"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Package, Truck, Home, AlertTriangle, ShieldCheck } from "lucide-react";

export type OrderState = "PAID" | "SELLER_RECEIVED" | "PACKAGED" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "BUYER_CONFIRMED" | "DISPUTED";

const TIMELINE_STATES = [
  { state: "PAID", label: "Payment Confirmed", desc: "Funds secured in escrow.", icon: ShieldCheck },
  { state: "SELLER_RECEIVED", label: "Order Acknowledged", desc: "Seller is preparing the item.", icon: Clock },
  { state: "PACKAGED", label: "Packaged", desc: "Item uniquely packed and documented.", icon: Package },
  { state: "SHIPPED", label: "Shipped", desc: "Handed over to the carrier.", icon: Truck },
  { state: "IN_TRANSIT", label: "In Transit", desc: "Moving through carrier network.", icon: Truck },
  { state: "DELIVERED", label: "Delivered", desc: "Item arrived at destination.", icon: Home },
  { state: "BUYER_CONFIRMED", label: "Sale Complete", desc: "Buyer confirmed condition. Payout released.", icon: CheckCircle2 },
];

interface LedgerProps {
  currentState: OrderState;
  history: {
    newState: string;
    createdAt: string;
    actorId: string;
    trackingNumber?: string | null;
  }[];
}

export function TransparencyLedger({ currentState, history }: LedgerProps) {
  const isDisputed = currentState === "DISPUTED";

  // Find index of current state to know how many steps are completed
  const currentIndex = TIMELINE_STATES.findIndex(s => s.state === currentState);
  const activeIndex = isDisputed ? -1 : currentIndex;

  return (
    <div className="w-full relative px-4 py-8 rounded-xl bg-card/20 border border-white/5 shadow-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none -z-10" />
      
      {isDisputed && (
        <div className="mb-8 p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-destructive">Order Disputed</h4>
            <p className="text-sm text-destructive/80 mt-1">This order is under review by our transparency team. Payouts are frozen pending evidence audit.</p>
          </div>
        </div>
      )}

      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[1.4rem] before:w-0.5 before:-translate-x-px before:bg-white/10 md:before:mx-auto md:before:translate-x-0">
        {TIMELINE_STATES.map((phase, i) => {
          const isCompleted = i <= activeIndex;
          const isActive = i === activeIndex;
          
          // Match historical data if available
          const historyEntry = history.find(h => h.newState === phase.state);
          const Icon = phase.icon;

          return (
            <div key={phase.state} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              {/* Timeline dot */}
              <div 
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full border-4 shrink-0 shadow-xl transition-all duration-500 z-10 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2",
                  isCompleted ? "bg-primary border-primary shadow-primary/40" : "bg-black border-white/10",
                  isActive && "ring-4 ring-primary/20 animate-pulse"
                )}
              >
                <Icon className={cn("w-5 h-5", isCompleted ? "text-white" : "text-muted-foreground")} />
              </div>
              
              {/* Content card */}
              <div 
                className={cn(
                  "w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-xl border transition-all duration-300",
                  isCompleted ? "bg-black/60 border-primary/30" : "bg-black/20 border-white/5 opacity-50 grayscale",
                  isActive && "bg-primary/5 border-primary/50 shadow-lg shadow-primary/5"
                )}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h3 className={cn("font-bold", isCompleted ? "text-foreground" : "text-muted-foreground")}>
                      {phase.label}
                    </h3>
                    {historyEntry && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(historyEntry.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{phase.desc}</p>
                  
                  {historyEntry?.trackingNumber && phase.state === "SHIPPED" && (
                    <div className="mt-3 p-2 bg-black rounded border border-white/10 text-xs font-mono text-primary/80 tracking-wide">
                      TRK: {historyEntry.trackingNumber}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
