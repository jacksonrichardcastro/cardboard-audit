"use client";

import { useTransition, useState } from "react";
import Image from "next/image";
import { ALL_BADGES } from "./BadgeRow";
import { hideBadgeAction, showBadgeAction } from "@/app/actions/badges";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Props = {
  isFoundingSeller: boolean;
  identityVerified: boolean;
  badges: string[];
  hiddenBadges: string[];
};

export function ProfileBadgesManager({ isFoundingSeller, identityVerified, badges, hiddenBadges }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticHidden, setOptimisticHidden] = useState<string[]>(hiddenBadges || []);

  const earned = new Set<string>();
  if (isFoundingSeller) earned.add('founding-seller');
  if (identityVerified) earned.add('verified-pin');
  if (badges?.includes('trax-ambassador')) earned.add('trax-ambassador');

  const earnedBadges = ALL_BADGES.filter(b => earned.has(b.slug));

  if (earnedBadges.length === 0) {
    return null;
  }

  const toggleBadge = (slug: string, isCurrentlyHidden: boolean) => {
    startTransition(async () => {
      if (isCurrentlyHidden) {
        setOptimisticHidden(prev => prev.filter(b => b !== slug));
        await showBadgeAction(slug);
      } else {
        setOptimisticHidden(prev => [...prev, slug]);
        await hideBadgeAction(slug);
      }
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Profile Badges</h3>
      <p className="text-sm text-zinc-400">
        Manage the badges displayed on your public storefront.
      </p>
      
      <div className="grid gap-4 mt-4">
        {earnedBadges.map(badge => {
          const isHidden = optimisticHidden.includes(badge.slug);
          return (
            <div key={badge.slug} className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-black/50">
              <div className="flex items-center gap-4">
                <Image 
                  src={badge.imageSrc} 
                  alt={badge.label} 
                  width={40} 
                  height={40}
                  className={`w-10 h-auto ${isHidden ? 'opacity-40 grayscale' : ''}`}
                />
                <div>
                  <Label className="text-sm font-semibold">{badge.label}</Label>
                  <p className="text-xs text-zinc-400">{isHidden ? "Hidden from profile" : "Visible on profile"}</p>
                </div>
              </div>
              <Switch 
                checked={!isHidden} 
                onCheckedChange={() => toggleBadge(badge.slug, isHidden)}
                disabled={isPending}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
