"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Box } from "lucide-react";

export function SellerActions({ orderId, currentState }: { orderId: number, currentState: string }) {
    if (currentState === "DISPUTED" || currentState === "BUYER_CONFIRMED" || currentState === "DELIVERED") return null;

    return (
        <Card className="bg-primary/5 border-primary/20 backdrop-blur-xl">
            <CardHeader className="pb-4">
                <CardTitle className="text-primary flex items-center gap-2">
                    Seller Actions
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <Button variant="default" className="w-full"><Box className="w-4 h-4 mr-2" /> Mark as Packaged</Button>
                <Button variant="outline" className="w-full border-primary/50 text-white hover:bg-primary/20">Update Tracking Data</Button>
            </CardContent>
        </Card>
    );
}
