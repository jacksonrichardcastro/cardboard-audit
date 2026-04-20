"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Box, Loader2 } from "lucide-react";
import { updateOrderState } from "@/app/actions/orders";

export function SellerActions({ orderId, currentState }: { orderId: number, currentState: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    if (currentState === "DISPUTED" || currentState === "BUYER_CONFIRMED" || currentState === "DELIVERED") return null;

    const markAsPackaged = async () => {
        setLoading(true);
        try {
            await updateOrderState(orderId, "PACKAGED");
            router.refresh();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-primary/5 border-primary/20 backdrop-blur-xl">
            <CardHeader className="pb-4">
                <CardTitle className="text-primary flex items-center gap-2">
                    Seller Actions
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {currentState === "PAID" && (
                    <Button onClick={markAsPackaged} disabled={loading} variant="default" className="w-full">
                       {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Box className="w-4 h-4 mr-2" />} 
                       Mark as Packaged
                    </Button>
                )}
                <Button variant="outline" className="w-full border-primary/50 text-white hover:bg-primary/20">Update Tracking Data</Button>
            </CardContent>
        </Card>
    );
}
