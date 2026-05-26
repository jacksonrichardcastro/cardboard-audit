"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSellerProfile } from "@/app/actions/profile";
import { Loader2 } from "lucide-react";

interface EditProfileFormProps {
  initialData: {
    bio: string | null;
    locationCity: string | null;
    profilePhotoUrl: string | null;
    headerStyle?: string | null;
    bannerImageUrl?: string | null;
  };
}

export function EditProfileForm({ initialData }: EditProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    bio: initialData.bio || "",
    locationCity: initialData.locationCity || "",
    profilePhotoUrl: initialData.profilePhotoUrl || "",
    headerStyle: initialData.headerStyle || "cards",
    bannerImageUrl: initialData.bannerImageUrl || "",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await fetch("/api/storage/profile", {
        method: "POST",
        body: JSON.stringify({ kind: "avatar" }),
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) throw new Error("Failed to get secure upload URL");
      
      const { signedUrl, publicUrl } = await res.json();
      
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });

      if (!uploadRes.ok) throw new Error("Failed to upload image to bucket");

      setFormData(prev => ({ ...prev, profilePhotoUrl: publicUrl }));
    } catch (err) {
      console.error(err);
      alert("Failed to upload profile photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await fetch("/api/storage/profile", {
        method: "POST",
        body: JSON.stringify({ kind: "avatar" }),
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) throw new Error("Failed to get secure upload URL");
      
      const { signedUrl, publicUrl } = await res.json();
      
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });

      if (!uploadRes.ok) throw new Error("Failed to upload image to bucket");

      setFormData(prev => ({ ...prev, bannerImageUrl: publicUrl }));
    } catch (err) {
      console.error(err);
      alert("Failed to upload banner photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await updateSellerProfile({
        bio: formData.bio,
        locationCity: formData.locationCity,
        profilePhotoUrl: formData.profilePhotoUrl,
        headerStyle: formData.headerStyle,
        bannerImageUrl: formData.bannerImageUrl,
      });
      router.push("/seller/dashboard"); // Redirect to dashboard after saving
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      
      <div className="space-y-2">
        <Label>Profile Photo</Label>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-zinc-900 border border-white/10 overflow-hidden flex-shrink-0">
            {formData.profilePhotoUrl ? (
              <img src={formData.profilePhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No Image</div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <Input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              disabled={isUploading || isLoading} 
              className="bg-zinc-900 border-white/10 text-zinc-300"
            />
            {isUploading && <p className="text-xs text-[#7C3AED] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading securely...</p>}
            <p className="text-xs text-zinc-500">You can also paste a direct URL below:</p>
            <Input 
              type="url" 
              value={formData.profilePhotoUrl} 
              onChange={(e) => setFormData({ ...formData, profilePhotoUrl: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
              className="bg-zinc-900 border-white/10"
              disabled={isLoading || isUploading}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-white/10">
        <Label>Header Style</Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, headerStyle: 'cards' })}
            className={`p-4 border rounded-xl flex flex-col items-start gap-2 transition-colors ${formData.headerStyle === 'cards' ? 'border-[#7C3AED] bg-[#7C3AED]/10' : 'border-white/10 bg-zinc-950 hover:bg-zinc-900'}`}
          >
            <span className="font-semibold text-sm">Cards</span>
            <span className="text-xs text-zinc-500 text-left">Your top active listings shown as a 3D shelf.</span>
          </button>
          
          <button
            type="button"
            onClick={() => setFormData({ ...formData, headerStyle: 'banner' })}
            className={`p-4 border rounded-xl flex flex-col items-start gap-2 transition-colors ${formData.headerStyle === 'banner' ? 'border-[#7C3AED] bg-[#7C3AED]/10' : 'border-white/10 bg-zinc-950 hover:bg-zinc-900'}`}
          >
            <span className="font-semibold text-sm">Photo Banner</span>
            <span className="text-xs text-zinc-500 text-left">A custom wide image acting as your profile header.</span>
          </button>
        </div>

        {formData.headerStyle === 'banner' && (
          <div className="mt-4 space-y-2 p-4 border border-white/10 bg-zinc-950 rounded-xl">
            <Label>Banner Image</Label>
            <div className="flex flex-col gap-4">
              <div className="w-full h-32 md:h-48 rounded-xl bg-zinc-900 border border-white/10 overflow-hidden flex-shrink-0">
                {formData.bannerImageUrl ? (
                  <img src={formData.bannerImageUrl} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 text-xs">
                    <span>No Image</span>
                    <span className="mt-1 font-medium text-center">Recommended: 1500 x 400px (wide aspect)</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleBannerUpload} 
                  disabled={isUploading || isLoading} 
                  className="bg-zinc-900 border-white/10 text-zinc-300"
                />
                {isUploading && <p className="text-xs text-[#7C3AED] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading securely...</p>}
                <p className="text-xs text-zinc-500">You can also paste a direct URL below:</p>
                <Input 
                  type="url" 
                  value={formData.bannerImageUrl || ''} 
                  onChange={(e) => setFormData({ ...formData, bannerImageUrl: e.target.value })}
                  placeholder="https://example.com/banner.jpg"
                  className="bg-zinc-900 border-white/10"
                  disabled={isLoading || isUploading}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 pt-4 border-t border-white/10">
        <Label htmlFor="bio">Bio</Label>
        <Textarea 
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Expert Collector | PSA 10 Specialist | Curating Rarity"
          maxLength={160}
          className="bg-zinc-900 border-white/10 min-h-[100px]"
          disabled={isLoading}
        />
        <div className="text-right text-xs text-zinc-500">
          {formData.bio.length} / 160
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="locationCity">Location (City)</Label>
        <Input 
          id="locationCity"
          value={formData.locationCity}
          onChange={(e) => setFormData({ ...formData, locationCity: e.target.value })}
          placeholder="e.g., Los Angeles"
          className="bg-zinc-900 border-white/10"
          disabled={isLoading}
        />
      </div>

      <Button type="submit" disabled={isLoading || isUploading} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
        {isLoading ? "Saving..." : "Save Profile"}
      </Button>

    </form>
  );
}
