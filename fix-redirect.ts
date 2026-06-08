import fs from 'fs';

let content = fs.readFileSync('src/app/[handle]/page.tsx', 'utf-8');

if (!content.includes('storefronts')) {
  content = content.replace(
    'import { profiles, listings, users, cards, itemPhotos, categories, handleHistory } from "@/lib/db/schema";',
    'import { profiles, listings, users, cards, itemPhotos, categories, handleHistory, storefronts } from "@/lib/db/schema";'
  );
}

const oldRedirect = `    const historyEntry = await db.query.handleHistory.findFirst({
      where: sql\`LOWER(\${handleHistory.oldHandle}) = \${handleLower}\`,
      orderBy: desc(handleHistory.changedAt),
    });
    
    if (historyEntry) {
      const currentProfile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, historyEntry.userId)
      });
      if (currentProfile?.handle) {
        redirect(\`/\${currentProfile.handle}\`);
      }
    }`;

const newRedirect = `    const historyEntry = await db.query.handleHistory.findFirst({
      where: sql\`LOWER(\${handleHistory.oldHandle}) = \${handleLower}\`,
      orderBy: desc(handleHistory.changedAt),
    });
    
    if (historyEntry && historyEntry.storefrontId) {
      const currentStorefront = await db.query.storefronts.findFirst({
        where: eq(storefronts.id, historyEntry.storefrontId)
      });
      if (currentStorefront?.handle) {
        redirect(\`/\${currentStorefront.handle}\`);
      }
    }`;

content = content.replace(oldRedirect, newRedirect);
fs.writeFileSync('src/app/[handle]/page.tsx', content);
