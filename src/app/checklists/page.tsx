import { db } from "@/lib/db";
import { cardSets } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { CosmosBackground } from "@/components/marketplace/CosmosBackground";
import { CatalogSearchBar } from "@/components/search/catalog-search-bar";

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trading Card Checklists | Trax',
  description: "Browse complete checklists for the hobby's most popular sets.",
  openGraph: {
    title: 'Trading Card Checklists | Trax',
    description: "Browse complete checklists for the hobby's most popular sets.",
  },
  twitter: {
    title: 'Trading Card Checklists | Trax',
    description: "Browse complete checklists for the hobby's most popular sets.",
  }
};

export const revalidate = 3600;

export default async function ChecklistsHub() {
  const publishedSets = await db.query.cardSets.findMany({
    where: eq(cardSets.status, "published"),
    orderBy: [desc(cardSets.yearLabel), desc(cardSets.releaseDate)],
  });

  const grouped: Record<string, typeof publishedSets> = {};
  for (const s of publishedSets) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CosmosBackground />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-24">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Checklists</h1>
            <p className="text-lg text-zinc-400 max-w-2xl mb-8">
              Browse complete checklists for the hobby's most popular sets.
            </p>
            <div className="max-w-2xl">
              <CatalogSearchBar />
            </div>
          </div>

          {publishedSets.length === 0 ? (
             <div className="py-24 text-center border border-white/10 rounded-2xl bg-zinc-950/50 backdrop-blur-sm">
               <h2 className="text-2xl font-bold mb-2">Checklists coming soon</h2>
               <p className="text-zinc-500">We are currently building our catalog. Check back shortly.</p>
             </div>
          ) : (
            <div className="space-y-16">
              {Object.entries(grouped).map(([category, sets]) => (
                <div key={category} className="space-y-6">
                  <h2 className="text-2xl md:text-3xl font-bold border-b border-white/10 pb-4">{category}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sets.map(set => (
                      <Link key={set.id} href={`/checklists/${set.slug}`} className="block group">
                        <div className="p-6 rounded-xl border border-white/10 bg-zinc-950/60 hover:bg-zinc-900 transition-colors h-full flex flex-col">
                          <div className="text-xs font-bold text-[#7C3AED] mb-2 uppercase tracking-wider">{set.yearLabel} {set.brand}</div>
                          <h3 className="text-lg font-bold group-hover:text-[#9353d3] transition-colors line-clamp-2">{set.name}</h3>
                          {set.releaseDate && (
                            <p className="text-sm text-zinc-500 mt-4">Released: {new Date(set.releaseDate).toLocaleDateString()}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
