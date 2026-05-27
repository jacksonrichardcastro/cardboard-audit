import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { EditProfileForm } from "./EditProfileForm";

export default async function EditProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [seller] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

  if (!seller) {
    redirect("/"); // Not a seller yet
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
          <p className="text-zinc-400 mt-2">Customize how you appear on the Trax marketplace.</p>
        </div>

        <div className="p-6 bg-zinc-950 border border-white/10 rounded-xl">
          <EditProfileForm 
            initialData={{
              bio: seller.bio,
              locationCity: seller.locationCity,
              profilePhotoUrl: seller.profilePhotoUrl,
              headerStyle: seller.headerStyle,
              bannerImageUrl: seller.bannerImageUrl,
            }} 
          />
        </div>
      </div>
    </div>
  );
}
