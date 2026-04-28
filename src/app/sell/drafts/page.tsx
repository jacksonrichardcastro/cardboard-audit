import { db } from "@/lib/db";
import { listingDrafts, sellers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { deleteDraft } from "../actions";

export default async function DraftsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const seller = await db.query.sellers.findFirst({
    where: eq(sellers.userId, userId),
  });

  if (!seller || seller.applicationStatus !== "approved") {
    redirect("/seller/become");
  }

  const drafts = await db.query.listingDrafts.findMany({
    where: eq(listingDrafts.sellerId, userId),
    orderBy: [desc(listingDrafts.updatedAt)],
  });

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 md:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Drafts</h1>
          <p className="text-muted-foreground mt-1">Finish creating your listings.</p>
        </div>
        <Link href="/sell/new">
          <Button>Create New Listing</Button>
        </Link>
      </div>

      {drafts.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-xl border border-border/50">
          <p className="text-muted-foreground mb-4">You have no in-progress listings.</p>
          <Link href="/sell/new">
            <Button variant="secondary">Start a Listing</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drafts.map((draft) => {
            const data = draft.data as any;
            const title = data.subject || "Untitled Listing";
            const set = data.set || "Unknown Set";
            
            return (
              <div key={draft.id} className="bg-card border border-border/50 rounded-xl p-5 flex flex-col">
                <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
                <p className="text-sm text-muted-foreground mb-6 line-clamp-1">{set}</p>
                <div className="mt-auto flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Last updated {new Date(draft.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <form action={async () => {
                      "use server";
                      await deleteDraft(draft.id);
                    }}>
                      <Button variant="ghost" size="sm" type="submit" className="text-destructive hover:text-destructive hover:bg-destructive/10">Delete</Button>
                    </form>
                    <Link href={`/sell/new?draftId=${draft.id}`}>
                      <Button size="sm" variant="secondary">Resume</Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
