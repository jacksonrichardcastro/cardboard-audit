"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MoreVertical, Star, Link as LinkIcon, Edit, Trash2, SwitchCamera, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  setDefaultStorefrontAction, 
  deleteStorefrontAction, 
  switchActiveStorefrontAction 
} from "@/app/actions/storefronts";
import Link from "next/link";
import { CreateStorefrontModal } from "./CreateStorefrontModal";

type StorefrontData = {
  id: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  isDefault: boolean;
  listingsCount: number;
};

export function StorefrontsManager({ 
  initialStorefronts, 
  activeStorefrontId 
}: { 
  initialStorefronts: StorefrontData[];
  activeStorefrontId: string | null;
}) {
  const router = useRouter();
  const [storefronts, setStorefronts] = useState(initialStorefronts);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const activeId = activeStorefrontId || storefronts.find(s => s.isDefault)?.id || storefronts[0]?.id;

  const handleSetDefault = async (id: string) => {
    toast.promise(setDefaultStorefrontAction(id), {
      loading: 'Setting default storefront...',
      success: (data) => {
        if (data.error) throw new Error(data.error);
        setStorefronts(prev => prev.map(s => ({ ...s, isDefault: s.id === id })));
        return 'Default storefront updated';
      },
      error: (err) => err.message
    });
  };

  const handleSwitch = async (id: string) => {
    toast.promise(switchActiveStorefrontAction(id), {
      loading: 'Switching storefront...',
      success: (data) => {
        if (data.error) throw new Error(data.error);
        router.refresh();
        return 'Storefront switched';
      },
      error: (err) => err.message
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this storefront? All listings will be moved to your default storefront.")) return;
    
    toast.promise(deleteStorefrontAction(id), {
      loading: 'Deleting storefront...',
      success: (data) => {
        if (data.error) throw new Error(data.error);
        setStorefronts(prev => prev.filter(s => s.id !== id));
        router.refresh();
        return 'Storefront deleted';
      },
      error: (err) => err.message
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Your Storefronts</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your storefronts and switch between them.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="mr-2 h-4 w-4" /> Add Storefront
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {storefronts.map((storefront) => {
          const isActive = storefront.id === activeId;
          
          return (
            <Card key={storefront.id} className={`bg-card/50 border-white/10 ${isActive ? 'ring-2 ring-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.2)]' : ''}`}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={storefront.avatarUrl || ""} />
                    <AvatarFallback className="bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-300">
                      {(storefront.displayName || storefront.handle).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {storefront.displayName || storefront.handle}
                      {storefront.isDefault && (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[10px] px-1.5 py-0">
                          Login Default
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center text-xs mt-0.5">
                      @{storefront.handle}
                    </CardDescription>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2" />}>
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {!isActive && (
                      <DropdownMenuItem onClick={() => handleSwitch(storefront.id)} className="cursor-pointer">
                        <SwitchCamera className="mr-2 h-4 w-4" /> Switch to Storefront
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem render={<Link href={`/${storefront.handle}`} />} className="cursor-pointer">
                      <LinkIcon className="mr-2 h-4 w-4" /> View Public Page
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {!storefront.isDefault && (
                      <DropdownMenuItem onClick={() => handleSetDefault(storefront.id)} className="cursor-pointer">
                        <Star className="mr-2 h-4 w-4" /> Set as Login Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDelete(storefront.id)} 
                      disabled={storefronts.length <= 1 || storefront.isDefault}
                      className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm mt-4">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">Listings</span>
                    <span className="font-semibold">{storefront.listingsCount}</span>
                  </div>
                </div>
                
                {isActive ? (
                  <div className="mt-4 w-full text-center py-2 text-xs font-medium text-violet-400 bg-violet-500/10 rounded-md border border-violet-500/20">
                    Currently Active
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 h-8 text-xs border-white/10"
                    onClick={() => handleSwitch(storefront.id)}
                  >
                    Switch to this storefront
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CreateStorefrontModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
        onCreated={() => {
          setIsCreateModalOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
