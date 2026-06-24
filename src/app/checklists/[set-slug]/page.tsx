import { db } from "@/lib/db";
import { cardSets, setSubsets, catalogCards, cardParallels, pullOdds } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ChecklistHero } from "@/components/checklists/ChecklistHero";
import { CosmosBackground } from "@/components/marketplace/CosmosBackground";

export const revalidate = 3600;

export async function generateStaticParams() {
  const sets = await db.query.cardSets.findMany({
    where: eq(cardSets.status, "published"),
    columns: { slug: true }
  });
  return sets.map((s) => ({ 'set-slug': s.slug }));
}

export async function generateMetadata({ params }: { params: { 'set-slug': string } }) {
  const set = await db.query.cardSets.findFirst({
    where: and(eq(cardSets.slug, params['set-slug']), eq(cardSets.status, "published"))
  });
  if (!set) return {};
  return {
    title: `${set.yearLabel} ${set.brand} ${set.name} Checklist — base, parallels, odds | Trax`,
    description: set.description || `Complete checklist for ${set.yearLabel} ${set.brand} ${set.name}.`
  };
}

export default async function SetPage({ params }: { params: { 'set-slug': string } }) {
  const setInfo = await db.query.cardSets.findFirst({
    where: and(eq(cardSets.slug, params['set-slug']), eq(cardSets.status, "published"))
  });

  if (!setInfo) {
    notFound();
  }

  const subsets = await db.query.setSubsets.findMany({
    where: eq(setSubsets.setId, setInfo.id),
    orderBy: [asc(setSubsets.sortOrder)]
  });

  const cards = await db.query.catalogCards.findMany({
    where: eq(catalogCards.setId, setInfo.id)
  });

  const parallels = await db.query.cardParallels.findMany({
    where: eq(cardParallels.setId, setInfo.id),
    orderBy: [asc(cardParallels.sortOrder)]
  });

  const odds = await db.query.pullOdds.findMany({
    where: eq(pullOdds.setId, setInfo.id)
  });

  // Sort cards by cardNumber roughly (assuming alphanumeric sorting works okay for now)
  const sortedCards = [...cards].sort((a, b) => {
    // Basic natural sort
    return a.cardNumber.localeCompare(b.cardNumber, undefined, { numeric: true, sensitivity: 'base' });
  });

  return (
    <div className="min-h-screen bg-black text-white relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CosmosBackground />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <ChecklistHero 
          name={setInfo.name}
          brand={setInfo.brand}
          yearLabel={setInfo.yearLabel}
          releaseDate={setInfo.releaseDate}
          description={setInfo.description}
        />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          
          {subsets.map(subset => {
            const subsetCards = sortedCards.filter(c => c.subsetId === subset.id);
            const subsetParallels = parallels.filter(p => p.subsetId === subset.id || p.subsetId === null);
            
            if (subsetCards.length === 0 && subsetParallels.length === 0) return null;

            return (
              <div key={subset.id} className="space-y-6">
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <h2 className="text-2xl font-bold">{subset.name}</h2>
                  <span className="text-sm font-medium text-zinc-500 bg-white/5 px-3 py-1 rounded-full">
                    {subset.subsetType}
                  </span>
                </div>

                {subsetCards.length > 0 && (
                  <div className="bg-zinc-950/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-900/50 text-zinc-400">
                          <tr>
                            <th className="px-6 py-4 font-semibold w-24">Card #</th>
                            <th className="px-6 py-4 font-semibold">Subject</th>
                            <th className="px-6 py-4 font-semibold">Team</th>
                            <th className="px-6 py-4 font-semibold w-24">Attributes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {subsetCards.map(card => (
                            <tr key={card.id} className="hover:bg-zinc-900/30 transition-colors">
                              <td className="px-6 py-3 font-medium text-zinc-300">{card.cardNumber}</td>
                              <td className="px-6 py-3 text-white font-semibold">{card.subject}</td>
                              <td className="px-6 py-3 text-zinc-400">{card.team || '-'}</td>
                              <td className="px-6 py-3">
                                {card.rcFlag && (
                                  <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-bold text-blue-400 ring-1 ring-inset ring-blue-500/20">
                                    RC
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {subsetParallels.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold mb-4 text-zinc-300">Parallels</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {subsetParallels.map(p => (
                        <div key={p.id} className="bg-zinc-950/60 border border-white/5 p-4 rounded-lg">
                          <div className="font-semibold text-[#7C3AED] mb-1">{p.name}</div>
                          <div className="text-sm text-zinc-400 flex items-center justify-between">
                            <span>{p.printRun ? `/${p.printRun}` : "Unnumbered"}</span>
                            {p.oddsText && <span className="text-xs text-zinc-500">{p.oddsText}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {odds.length > 0 && (
            <div className="space-y-6 pt-8 border-t border-white/10">
              <h2 className="text-2xl font-bold">Pull Odds</h2>
              <div className="bg-zinc-950/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-900/50 text-zinc-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Pack Type</th>
                      <th className="px-6 py-4 font-semibold">Odds</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {odds.map(odd => (
                      <tr key={odd.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="px-6 py-3 font-medium text-zinc-300">{odd.packType}</td>
                        <td className="px-6 py-3 text-white">{odd.oddsText}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
