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
    storefrontId?: string;
    handle?: string;
    displayName?: string | null;
    bio: string | null;
    locationCity: string | null;
    locationState: string | null;
    profilePhotoUrl: string | null;
    headerStyle?: string | null;
    bannerImageUrl?: string | null;
    presenceStatus?: string | null;
  };
}

import { ImageCropperModal } from "@/components/shared/ImageCropperModal";

export function EditProfileForm({ initialData }: EditProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState("");
  const [cropTarget, setCropTarget] = useState<"avatar" | "banner">("avatar");

  const [formData, setFormData] = useState({
    storefrontId: initialData.storefrontId || undefined,
    displayName: initialData.displayName || "",
    bio: initialData.bio || "",
    locationCity: initialData.locationCity || "",
    locationState: initialData.locationState || "",
    profilePhotoUrl: initialData.profilePhotoUrl || "",
    headerStyle: initialData.headerStyle || "cards",
    bannerImageUrl: initialData.bannerImageUrl || "",
    presenceStatus: initialData.presenceStatus || "online",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setCropTarget("avatar");
    setCropImageUrl(url);
    setCropModalOpen(true);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setCropTarget("banner");
    setCropImageUrl(url);
    setCropModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await updateSellerProfile({
        storefrontId: formData.storefrontId,
        displayName: formData.displayName,
        bio: formData.bio,
        locationCity: formData.locationCity,
        profilePhotoUrl: formData.profilePhotoUrl,
        headerStyle: formData.headerStyle,
        bannerImageUrl: formData.bannerImageUrl,
        presenceStatus: formData.presenceStatus,
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
          <div className="w-24 h-24 rounded-full bg-zinc-900 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {formData.profilePhotoUrl ? (
              <img src={formData.profilePhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-[#7C3AED] text-white text-3xl font-bold uppercase">
                {(formData.displayName || initialData.handle || "S").charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="relative">
              <input 
                type="file" 
                id="profile-upload"
                accept="image/*" 
                onChange={handleFileUpload} 
                disabled={isUploading || isLoading} 
                className="sr-only"
              />
              <label 
                htmlFor="profile-upload"
                className="flex items-center justify-center w-full h-10 px-4 py-2 text-sm font-medium text-white bg-zinc-900 border border-white/10 rounded-md hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                Choose Image
              </label>
            </div>
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

      <div className="space-y-2 pt-4 border-t border-white/10">
        <Label htmlFor="displayName">Display Name</Label>
        <Input 
          id="displayName"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          placeholder="Enter Storefront Name"
          className="bg-zinc-900 border-white/10"
          disabled={isLoading}
        />
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
                <div className="relative">
                  <input 
                    type="file" 
                    id="banner-upload"
                    accept="image/*" 
                    onChange={handleBannerUpload} 
                    disabled={isUploading || isLoading} 
                    className="sr-only"
                  />
                  <label 
                    htmlFor="banner-upload"
                    className="flex items-center justify-center w-full h-10 px-4 py-2 text-sm font-medium text-white bg-zinc-900 border border-white/10 rounded-md hover:bg-zinc-800 cursor-pointer transition-colors"
                  >
                    Choose Image
                  </label>
                </div>
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

      <div className="space-y-4 pt-4 border-t border-white/10">
        <Label>Presence Status</Label>
        <div className="flex gap-4">
          {(['online', 'away', 'offline'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFormData({ ...formData, presenceStatus: status })}
              className={`px-4 py-2 border rounded-lg text-sm capitalize transition-colors ${
                formData.presenceStatus === status 
                  ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-white' 
                  : 'border-white/10 bg-zinc-950 text-zinc-400 hover:bg-zinc-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500">This status will be displayed on your storefront.</p>
      </div>

      <div className="space-y-2 pt-4 border-t border-white/10">
        <Label htmlFor="bio">Bio</Label>
        <Textarea 
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Add a bio so visitors know what this storefront is about"
          maxLength={160}
          className="bg-zinc-900 border-white/10 min-h-[100px]"
          disabled={isLoading}
        />
        <div className="text-right text-xs text-zinc-500">
          {formData.bio.length} / 160
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <div className="space-y-2">
          <Label htmlFor="locationState">Location (State)</Label>
          <Input 
            id="locationState"
            value={formData.locationState}
            onChange={(e) => setFormData({ ...formData, locationState: e.target.value })}
            placeholder="e.g., CA"
            className="bg-zinc-900 border-white/10"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end">
        <Button type="submit" disabled={isLoading} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-8">
          {isLoading ? "Saving..." : "Save Profile"}
        </Button>
      </div>

      <ImageCropperModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageUrl={cropImageUrl}
        aspectRatio={cropTarget === 'avatar' ? 1 : 1500 / 400}
        onCropComplete={async (blob) => {
          setIsUploading(true);
          try {
            const res = await fetch("/api/storage/profile", {
              method: "POST",
              body: JSON.stringify({ kind: cropTarget }),
              headers: { "Content-Type": "application/json" }
            });
            if (!res.ok) throw new Error("Failed to get secure upload URL");
            const { signedUrl, publicUrl } = await res.json();
            const uploadRes = await fetch(signedUrl, {
              method: "PUT",
              body: blob,
              headers: { "Content-Type": blob.type }
            });
            if (!uploadRes.ok) throw new Error("Failed to upload image to bucket");
            if (cropTarget === 'avatar') {
              setFormData(prev => ({ ...prev, profilePhotoUrl: publicUrl }));
            } else {
              setFormData(prev => ({ ...prev, bannerImageUrl: publicUrl }));
            }
          } catch (err) {
            console.error(err);
            alert("Failed to upload cropped photo. Please try again.");
          } finally {
            setIsUploading(false);
          }
        }}
      />
    </form>
  );
}
