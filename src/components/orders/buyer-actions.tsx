"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { confirmBuyerReceipt } from "@/app/actions/orders";
import { openDispute } from "@/app/actions/disputes";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ShieldAlert } from "lucide-react";

export function BuyerActions({ orderId, currentState }: { orderId: number, currentState: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await confirmBuyerReceipt(orderId, "buyer");
            router.refresh();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDispute = async () => {
        const reasonText = prompt("Please provide a reason for this dispute:");
        if (!reasonText) return;
        setLoading(true);
        try {
            await openDispute({ orderId, reason: "NOT_AS_DESCRIBED", reasonText });
            router.refresh();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (currentState === "DISPUTED" || currentState === "BUYER_CONFIRMED") return null;

    return (
        <Card className="bg-primary/5 border-primary/20 backdrop-blur-xl">
            <CardHeader className="pb-4">
                <CardTitle className="text-primary flex items-center gap-2">
                    Buyer Actions
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {currentState === "PENDING_BUYER_CONFIRM" ? (
                   <Button onClick={handleConfirm} disabled={loading} className="w-full shadow-lg shadow-primary/20">
                     {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : "Confirm Receipt"}
                   </Button>
                ) : (
                   <p className="text-sm text-muted-foreground mb-2 text-center">Awaiting Carrier Delivery</p>
                )}
                
                <Button onClick={handleDispute} disabled={loading} variant="outline" className="w-full border-rose-500/50 text-rose-400 hover:bg-rose-500/10">
                   <ShieldAlert className="w-4 h-4 mr-2" /> Open a Dispute
                </Button>
            </CardContent>
        </Card>
    );
}
