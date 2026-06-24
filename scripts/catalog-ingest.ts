import fs from "fs";
import path from "path";
import { db } from "../src/lib/db";
import { cardSets, setSubsets, catalogCards, cardParallels, pullOdds } from "../src/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

const VALID_CATEGORIES = [
  'football', 'baseball', 'basketball', 'hockey', 'soccer', 'ufc', 'wrestling', 'pokemon', 'mtg', 'one-piece', 'lorcana', 'non-sport', 'other'
];

function kebabCase(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRunIndex = args.indexOf('--dry-run');
  const isDryRun = dryRunIndex !== -1;
  if (isDryRun) args.splice(dryRunIndex, 1);
  
  const filePath = args[0];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/catalog-ingest.ts [--dry-run] <path-to-json>");
    process.exit(1);
  }

  const rawData = fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
  const data = JSON.parse(rawData);

  // Validation
  if (!data.set || !data.set.slug || !data.set.name || !data.set.brand || !data.set.category || !data.set.year_label) {
    console.error("Validation Error: Missing required set fields (slug, name, brand, category, year_label).");
    process.exit(1);
  }
  if (!VALID_CATEGORIES.includes(data.set.category)) {
    console.error(`Validation Error: Unknown category value '${data.set.category}'.`);
    process.exit(1);
  }

  const subsetNames = new Set(data.subsets?.map((s: any) => s.name) || []);
  if (data.parallels) {
    for (const p of data.parallels) {
      if (p.subset_name && !subsetNames.has(p.subset_name)) {
        console.error(`Validation Error: Parallel '${p.name}' references unknown subset '${p.subset_name}'.`);
        process.exit(1);
      }
    }
  }
  if (data.odds) {
    for (const o of data.odds) {
      if (o.subset_name && !subsetNames.has(o.subset_name)) {
        console.error(`Validation Error: Odds '${o.odds_text}' references unknown subset '${o.subset_name}'.`);
        process.exit(1);
      }
    }
  }

  // Duplicate card_numbers within subset
  for (const subset of (data.subsets || [])) {
    const cardNums = new Set();
    for (const card of (subset.cards || [])) {
      if (!card.card_number || !card.subject) {
        console.error(`Validation Error: Card in subset '${subset.name}' missing card_number or subject.`);
        process.exit(1);
      }
      if (cardNums.has(card.card_number)) {
        console.error(`Validation Error: Duplicate card_number '${card.card_number}' within subset '${subset.name}'.`);
        process.exit(1);
      }
      cardNums.add(card.card_number);
    }
  }

  if (isDryRun) {
    console.log(`\n=== DRY RUN MODE: Database will not be modified ===\n`);
  }

  let stats = {
    sets: { created: 0, updated: 0, unchanged: 0 },
    subsets: { created: 0, updated: 0, unchanged: 0 },
    cards: { created: 0, updated: 0, unchanged: 0 },
    parallels: { created: 0, updated: 0, unchanged: 0 },
    odds: { created: 0, updated: 0, unchanged: 0 }
  };

  // 1. Process Set
  let setId: number;
  const existingSet = await db.query.cardSets.findFirst({ where: eq(cardSets.slug, data.set.slug) });
  if (existingSet) {
    setId = existingSet.id;
    // For simplicity, check if changed by comparing all fields.
    const isChanged = existingSet.name !== data.set.name || existingSet.brand !== data.set.brand || existingSet.category !== data.set.category || existingSet.yearLabel !== data.set.year_label || ((existingSet.releaseDate ? new Date(existingSet.releaseDate).toISOString().split('T')[0] : null) !== (data.set.release_date || null)) || ((existingSet.description || null) !== (data.set.description || null));
    if (isChanged) {
      if (!isDryRun) {
        await db.update(cardSets).set({
          name: data.set.name,
          brand: data.set.brand,
          category: data.set.category,
          yearLabel: data.set.year_label,
          releaseDate: data.set.release_date || null,
          description: data.set.description || null,
          updatedAt: new Date()
        }).where(eq(cardSets.id, setId));
      }
      stats.sets.updated++;
    } else {
      stats.sets.unchanged++;
    }
  } else {
    if (!isDryRun) {
      const [newSet] = await db.insert(cardSets).values({
        slug: data.set.slug,
        name: data.set.name,
        brand: data.set.brand,
        category: data.set.category,
        yearLabel: data.set.year_label,
        releaseDate: data.set.release_date || null,
        description: data.set.description || null
      }).returning({ id: cardSets.id });
      setId = newSet.id;
    } else {
      setId = -1; // Mock ID
    }
    stats.sets.created++;
  }

  // 1a. Pre-load all existing slugs for the set to avoid global unique constraint violations
  const allExistingCards = setId !== -1 ? await db.query.catalogCards.findMany({
    where: eq(catalogCards.setId, setId)
  }) : [];
  const cardSlugs = new Set(allExistingCards.map(c => c.slug));

  // 2. Process Subsets
  const subsetIdMap = new Map<string, number>();
  for (const subset of (data.subsets || [])) {
    let subsetId: number;
    let existingSubset;
    if (setId !== -1) {
      existingSubset = await db.query.setSubsets.findFirst({
        where: and(eq(setSubsets.setId, setId), eq(setSubsets.name, subset.name))
      });
    }

    if (existingSubset) {
      subsetId = existingSubset.id;
      const isChanged = existingSubset.subsetType !== subset.subset_type || existingSubset.sortOrder !== (subset.sort_order || 0);
      if (isChanged) {
        if (!isDryRun) {
          await db.update(setSubsets).set({
            subsetType: subset.subset_type,
            sortOrder: subset.sort_order || 0
          }).where(eq(setSubsets.id, subsetId));
        }
        stats.subsets.updated++;
      } else {
        stats.subsets.unchanged++;
      }
    } else {
      if (!isDryRun) {
        const [newSub] = await db.insert(setSubsets).values({
          setId,
          name: subset.name,
          subsetType: subset.subset_type,
          sortOrder: subset.sort_order || 0
        }).returning({ id: setSubsets.id });
        subsetId = newSub.id;
      } else {
        subsetId = Math.random(); // mock for dry-run relations
      }
      stats.subsets.created++;
    }
    subsetIdMap.set(subset.name, subsetId);

    // 3. Process Cards in Subset
    const existingSubsetCards = allExistingCards.filter(c => c.subsetId === subsetId);
    const cardNumMap = new Map(existingSubsetCards.map(c => [c.cardNumber, c]));

    for (const card of (subset.cards || [])) {
      const existingCard = cardNumMap.get(card.card_number);
      let targetSlug = existingCard ? existingCard.slug : kebabCase(`${card.card_number}-${card.subject}`);
      
      if (!existingCard && cardSlugs.has(targetSlug)) {
        // Deterministic collision fallback: include subset name
        targetSlug = kebabCase(`${subset.name}-${card.card_number}-${card.subject}`);
        if (cardSlugs.has(targetSlug)) {
          // Last resort fallback
          let i = 1;
          while (cardSlugs.has(`${targetSlug}-${i}`)) i++;
          targetSlug = `${targetSlug}-${i}`;
        }
      }
      if (!existingCard) {
        cardSlugs.add(targetSlug);
      }

      if (existingCard) {
        const isChanged = existingCard.subject !== card.subject || 
                          existingCard.team !== (card.team || null) || 
                          existingCard.rcFlag !== (card.rc_flag || false);
        if (isChanged) {
          if (!isDryRun) {
            await db.update(catalogCards).set({
              subject: card.subject,
              team: card.team || null,
              rcFlag: card.rc_flag || false,
              attributesJson: card.attributes_json || null,
              updatedAt: new Date()
            }).where(eq(catalogCards.id, existingCard.id));
          }
          stats.cards.updated++;
        } else {
          stats.cards.unchanged++;
        }
      } else {
        if (!isDryRun) {
          await db.insert(catalogCards).values({
            setId,
            subsetId,
            cardNumber: card.card_number,
            subject: card.subject,
            team: card.team || null,
            rcFlag: card.rc_flag || false,
            slug: targetSlug,
            attributesJson: card.attributes_json || null
          });
        }
        stats.cards.created++;
      }
    }
  }

  // 4. Process Parallels
  const existingParallels = setId !== -1 ? await db.query.cardParallels.findMany({ where: eq(cardParallels.setId, setId) }) : [];
  for (const p of (data.parallels || [])) {
    const subId = p.subset_name ? subsetIdMap.get(p.subset_name) : null;
    const existing = existingParallels.find(e => e.name === p.name && e.subsetId === subId);
    if (existing) {
      const isChanged = existing.printRun !== (p.print_run || null) || existing.oddsText !== (p.odds_text || null);
      if (isChanged) {
        if (!isDryRun) {
          await db.update(cardParallels).set({
            printRun: p.print_run || null,
            oddsText: p.odds_text || null
          }).where(eq(cardParallels.id, existing.id));
        }
        stats.parallels.updated++;
      } else {
        stats.parallels.unchanged++;
      }
    } else {
      if (!isDryRun) {
        await db.insert(cardParallels).values({
          setId,
          subsetId: subId || null,
          name: p.name,
          printRun: p.print_run || null,
          oddsText: p.odds_text || null
        });
      }
      stats.parallels.created++;
    }
  }

  // 5. Process Odds
  const existingOdds = setId !== -1 ? await db.query.pullOdds.findMany({ where: eq(pullOdds.setId, setId) }) : [];
  for (const o of (data.odds || [])) {
    const subId = o.subset_name ? subsetIdMap.get(o.subset_name) : null;
    const existing = existingOdds.find(e => e.packType === o.pack_type && e.oddsText === o.odds_text && e.subsetId === subId);
    if (existing) {
      // Nothing really changes besides the identity keys
      stats.odds.unchanged++;
    } else {
      if (!isDryRun) {
        await db.insert(pullOdds).values({
          setId,
          subsetId: subId || null,
          packType: o.pack_type,
          oddsText: o.odds_text
        });
      }
      stats.odds.created++;
    }
  }

  console.log(`\n=== INGEST REPORT ===`);
  if (isDryRun) console.log(`(DRY RUN PLAN)`);
  console.log(`Sets:      ${stats.sets.created} created, ${stats.sets.updated} updated, ${stats.sets.unchanged} unchanged`);
  console.log(`Subsets:   ${stats.subsets.created} created, ${stats.subsets.updated} updated, ${stats.subsets.unchanged} unchanged`);
  console.log(`Cards:     ${stats.cards.created} created, ${stats.cards.updated} updated, ${stats.cards.unchanged} unchanged`);
  console.log(`Parallels: ${stats.parallels.created} created, ${stats.parallels.updated} updated, ${stats.parallels.unchanged} unchanged`);
  console.log(`Odds:      ${stats.odds.created} created, ${stats.odds.updated} updated, ${stats.odds.unchanged} unchanged`);
  console.log(`======================\n`);
  
  process.exit(0);
}

main().catch(err => {
  if (err.cause && err.cause.code === '42P01') {
    console.error("Database error: tables missing. Have you applied the migration?");
  } else {
    console.error("Ingest failed:", err.message);
  }
  process.exit(1);
});
