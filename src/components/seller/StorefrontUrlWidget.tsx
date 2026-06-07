"use client";

import { useState, useTransition } from "react";
import { Copy, Check, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { changeHandleAction } from "@/app/actions/handle";

const RESERVED_HANDLES = new Set([
  'admin', 'administrator', 'support', 'help', 'login', 'logout',
  'signup', 'signin', 'register', 'api', 'auth', 'oauth',
  'seller', 'sellers', 'account', 'accounts', 'settings',
  'profile', 'profiles', 'user', 'users', 'for-you', 'foryou',
  'home', 'marketplace', 'shop', 'cart', 'checkout',
  'dashboard', 'jackson', 'trax', 'cards', 'card',
  'about', 'terms', 'privacy', 'contact', 'faq',
  'blog', 'blogs', 'news', 'feed', 'notifications',
  'search', 'browse', 'discover', 'explore',
  'listing', 'listings', 'binder', 'collection',
]);

const PROFANITY_BLOCKLIST = ['fuck', 'shit', 'bitch', 'asshole', 'cunt', 'nigger', 'nigga', 'faggot'];

function containsProfanity(handle: string) {
  const lower = handle.toLowerCase();
  return PROFANITY_BLOCKLIST.some(word => lower.includes(word));
}

export function StorefrontUrlWidget({ handle: initialHandle }: { handle: string }) {
  const [handle, setHandle] = useState(initialHandle);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(handle);
  const [error, setError] = useState<string | null>(null);
  const [confirmingHandle, setConfirmingHandle] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const url = `trax.cards/${handle}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`https://${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const validateHandle = (val: string) => {
    const lower = val.trim().toLowerCase();
    if (lower.length < 3 || lower.length > 30) {
      return 'Handle must be between 3 and 30 characters.';
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(lower)) {
      return 'Handle must use lowercase letters, numbers, or hyphens. No leading/trailing hyphens.';
    }
    if (lower.includes('--')) {
      return 'Handle cannot contain consecutive hyphens.';
    }
    if (RESERVED_HANDLES.has(lower)) {
      return 'That handle is reserved.';
    }
    if (containsProfanity(lower)) {
      return 'That handle is not available.';
    }
    return null;
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();
    setEditValue(val);
    if (val === handle.toLowerCase()) {
      setError(null);
    } else {
      setError(validateHandle(val));
    }
  };

  const handleSaveClick = () => {
    const validationError = validateHandle(editValue);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (editValue.toLowerCase() === handle.toLowerCase()) {
      setIsEditing(false);
      return;
    }
    setConfirmingHandle(editValue.toLowerCase());
  };

  const confirmSave = () => {
    if (!confirmingHandle) return;
    
    startTransition(async () => {
      try {
        const result = await changeHandleAction(confirmingHandle);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        
        setHandle(confirmingHandle);
        setIsEditing(false);
        setConfirmingHandle(null);
        toast.success("Storefront URL updated successfully.");
      } catch (err) {
        toast.error("An unexpected error occurred.");
      }
    });
  };

  return (
    <>
      <div className="p-4 bg-zinc-900 border border-white/10 rounded-xl mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-zinc-300">Your Storefront URL</h3>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={() => { setIsEditing(true); setEditValue(handle); setError(null); }} className="h-6 px-2 text-zinc-400 hover:text-white">
              <Pencil className="w-3 h-3 mr-1.5" /> Edit
            </Button>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center bg-zinc-950 border border-white/10 rounded-md overflow-hidden focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 transition-all">
                <span className="pl-3 pr-1 text-zinc-500 text-sm font-mono select-none">trax.cards/</span>
                <input 
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={handleEditChange}
                  className="flex-1 bg-transparent py-2 pr-3 outline-none text-sm font-mono text-violet-300 placeholder:text-zinc-600"
                  placeholder="handle"
                  maxLength={30}
                />
              </div>
              <div className="flex justify-between items-center px-1">
                <span className={`text-xs ${error ? 'text-red-400' : 'text-zinc-500'}`}>
                  {error || "Lowercase letters, numbers, and hyphens"}
                </span>
                <span className={`text-xs ${editValue.length > 30 ? 'text-red-400' : 'text-zinc-500'}`}>
                  {editValue.length} / 30
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={handleSaveClick} disabled={!!error || editValue.toLowerCase() === handle.toLowerCase()}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input 
              readOnly 
              value={url} 
              className="bg-zinc-950 border-white/10 font-mono text-sm text-violet-300"
            />
            <Button 
              variant="secondary" 
              onClick={copyToClipboard}
              className="shrink-0 flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={confirmingHandle !== null} onOpenChange={(open) => !open && setConfirmingHandle(null)}>
        <AlertDialogContent className="bg-black/95 border border-[#7C3AED]/40 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm handle change</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
              Your storefront will move from <strong className="text-white">trax.cards/{handle}</strong> to <strong className="text-white">trax.cards/{confirmingHandle}</strong>. Any links to your old URL will automatically redirect to your new one — no broken shares.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmSave();
              }}
              disabled={isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
