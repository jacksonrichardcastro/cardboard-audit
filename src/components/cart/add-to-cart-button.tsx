"use client";

import { useCartStore, CartItem } from "@/store/useCartStore";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

export function AddToCartButton({ item }: { item: CartItem }) {
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  const handleAdd = () => {
    addItem(item);
    router.push("/cart");
  };

  return (
    <Button 
      onClick={handleAdd}
      className="w-full h-14 text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
    >
      <ShoppingCart className="w-5 h-5 mr-2" /> Buy Now
    </Button>
  );
}
