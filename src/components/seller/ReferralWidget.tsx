import { db } from "@/lib/db";
import { referrals } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { CopyButton } from "@/components/ui/copy-button";
import { Users } from "lucide-react";

interface ReferralWidgetProps {
  userId: string;
  handle: string | null;
}

export async function ReferralWidget({ userId, handle }: ReferralWidgetProps) {
  const [result] = await db
    .select({ count: count() })
    .from(referrals)
    .where(eq(referrals.referrerUserId, userId));

  const referralCount = result?.count || 0;
  
  // Fallback to userId if handle is not set
  const referralIdentifier = handle || userId;
  const referralLink = `https://trax.cards/r/${referralIdentifier}`;

  return (
    <div className="p-4 bg-zinc-900 border border-white/10 rounded-xl space-y-3">
      <div className="flex items-center space-x-2 text-violet-400">
        <Users className="w-5 h-5" />
        <h3 className="font-semibold text-white">Refer a Seller</h3>
      </div>
      <p className="text-sm text-zinc-400">
        Share your personal link. Earn rewards when new users sign up through it.
      </p>
      
      <div className="flex items-center justify-between p-3 bg-black rounded-lg border border-white/10">
        <code className="text-sm text-zinc-300 font-mono truncate mr-4">
          {referralLink}
        </code>
        <CopyButton text={referralLink} />
      </div>

      <div className="text-sm font-medium text-zinc-300 mt-2">
        <span className="text-white">{referralCount}</span> {referralCount === 1 ? 'person has' : 'people have'} joined through your link.
      </div>
    </div>
  );
}
