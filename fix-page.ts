import fs from 'fs';

let content = fs.readFileSync('src/app/listings/[id]/page.tsx', 'utf-8');

// Add imports if needed, but db and eq are probably already there.
// profiles is likely not imported in page.tsx.
content = content.replace(
  'import { viewHistory } from "@/lib/db/schema";',
  'import { viewHistory, profiles } from "@/lib/db/schema";\nimport { eq } from "drizzle-orm";'
);

const oldIsOwner = '  const isOwner = userId === dbItem.sellerId;';
const newIsOwner = `  const isOwner = userId === dbItem.sellerId;

  let isInHeader = false;
  if (isOwner && dbItem.cardId) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
      columns: { headerCustomizationIds: true }
    });
    if (profile && Array.isArray(profile.headerCustomizationIds)) {
      isInHeader = profile.headerCustomizationIds.includes(dbItem.cardId);
    }
  }`;

content = content.replace(oldIsOwner, newIsOwner);

// Now add the button. First we need to import the action and a client component because the button has an onClick, or we can make a client component for the button.
// The existing `RemoveListingModal` is a client component. I will create a `RemoveFromHeaderButton` client component.

fs.writeFileSync('src/app/listings/[id]/page.tsx', content);
