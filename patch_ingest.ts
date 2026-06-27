import fs from 'fs';

let content = fs.readFileSync('scripts/catalog-ingest.ts', 'utf8');

// 1. Add replace argument parsing
content = content.replace(
  /const args = process\.argv\.slice\(2\);\n\s*const dryRunIndex = args\.indexOf\('--dry-run'\);/,
  `const args = process.argv.slice(2);
  const replaceIndex = args.indexOf('--replace');
  const isReplace = replaceIndex !== -1;
  if (isReplace) args.splice(replaceIndex, 1);
  const dryRunIndex = args.indexOf('--dry-run');`
);

// 2. Add replace warning logging
content = content.replace(
  /if \(isDryRun\) \{\n\s*console\.log\(`\\n=== DRY RUN MODE: Database will not be modified ===\\n`\);\n\s*\}/,
  `if (isDryRun) {
    console.log(\`\\n=== DRY RUN MODE: Database will not be modified ===\\n\`);
  }
  if (isReplace && !isDryRun) {
    console.log(\`\\n=== REPLACE MODE: Existing catalog rows for this set will be PRUNED ===\\n\`);
  }`
);

// 3. Add prune logic
// Find where we do: `const existingSet = await db.query.cardSets.findFirst({ where: eq(cardSets.slug, data.set.slug) });`
// And right after we get setId, if isReplace && !isDryRun, we delete.
content = content.replace(
  /const existingSet = await db\.query\.cardSets\.findFirst\(\{ where: eq\(cardSets\.slug, data\.set\.slug\) \}\);/,
  `const existingSet = await db.query.cardSets.findFirst({ where: eq(cardSets.slug, data.set.slug) });
  if (existingSet && isReplace && !isDryRun) {
    console.log(\`PRUNING existing set \${existingSet.id} (\${existingSet.slug})...\`);
    await db.delete(pullOdds).where(eq(pullOdds.setId, existingSet.id));
    await db.delete(cardParallels).where(eq(cardParallels.setId, existingSet.id));
    await db.delete(catalogCards).where(eq(catalogCards.setId, existingSet.id));
    await db.delete(setSubsets).where(eq(setSubsets.setId, existingSet.id));
    console.log(\`Pruning complete.\`);
  }`
);

fs.writeFileSync('scripts/catalog-ingest.ts', content);
