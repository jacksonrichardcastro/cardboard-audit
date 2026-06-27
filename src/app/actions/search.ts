"use server";

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export type SearchResult = {
  type: "set" | "card" | "parallel";
  id: number | string;
  name: string;
  slug?: string;
  setId?: number;
  setSlug?: string;
  cardNumber?: string;
  team?: string;
};

export async function searchCatalog(query: string): Promise<{
  sets: SearchResult[];
  cards: SearchResult[];
  parallels: SearchResult[];
}> {
  if (!query || query.trim().length < 2) {
    return { sets: [], cards: [], parallels: [] };
  }

  const q = query.trim();
  const normQuery = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  const qFuzzy = `%${q}%`;
  const qNormFuzzy = `%${normQuery}%`;
  const qPrefix = `${q}%`;

  // Sets: fuzzy match on card_sets.name OR set_aliases.alias
  // Exclude drafts, only published sets if status exists (assuming status='published')
  // We'll just search all non-draft sets
  const setsResult = await db.execute(sql`
    WITH matched_sets AS (
      SELECT 
        s.id, 
        s.name, 
        s.slug,
        GREATEST(
          similarity(s.name, ${q}),
          COALESCE((SELECT max(similarity(a.alias, ${q})) FROM set_aliases a WHERE a.set_id = s.id AND a.alias ILIKE ${qFuzzy}), 0)
        ) as score
      FROM card_sets s
      WHERE (s.name ILIKE ${qFuzzy} 
         OR ${q} <% s.name
         OR EXISTS (SELECT 1 FROM set_aliases a WHERE a.set_id = s.id AND (a.alias ILIKE ${qFuzzy} OR ${q} <% a.alias)))
        AND s.status = 'published'
    )
    SELECT id, name, slug, score
    FROM matched_sets
    ORDER BY score DESC, name ASC
    LIMIT 5
  `);

  // Cards: fuzzy match name_normalized, prefix match card_number, exact/prefix match subject_aliases.alias
  const cardsResult = await db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL pg_trgm.word_similarity_threshold = 0.3;`);
    await tx.execute(sql`SET LOCAL pg_trgm.similarity_threshold = 0.2;`);
    return await tx.execute(sql`
      WITH matched_cards AS (
      SELECT 
        MIN(c.id) as id, 
        c.subject, 
        c.card_number, 
        MIN(c.slug) as slug,
        MIN(c.team) as team,
        s.slug as set_slug,
        s.id as set_id,
        MAX(GREATEST(
          word_similarity(${normQuery}, c.name_normalized),
          COALESCE((SELECT max(word_similarity(${q}, a.alias)) FROM subject_aliases a WHERE a.subject = c.subject AND a.alias ILIKE ${qFuzzy}), 0),
          word_similarity(${q}, c.team)
        )) as score,
        bool_or(c.card_number ILIKE ${qPrefix}) as exact_number
      FROM catalog_cards c
      JOIN card_sets s ON c.set_id = s.id
      WHERE (
        c.name_normalized ILIKE ${qNormFuzzy} 
        OR ${normQuery} <% c.name_normalized
        OR c.card_number ILIKE ${qPrefix}
        OR c.team ILIKE ${qFuzzy}
        OR EXISTS (SELECT 1 FROM subject_aliases a WHERE a.subject = c.subject AND (a.alias ILIKE ${qFuzzy} OR ${q} <% a.alias))
      )
      AND s.status = 'published'
      GROUP BY s.id, s.slug, c.subject, c.card_number
    )
    SELECT id, subject as name, card_number, slug, set_slug, set_id, score, exact_number, team
    FROM matched_cards
    ORDER BY exact_number DESC, score DESC
    LIMIT 8
    `);
  });

  // Parallels: fuzzy match card_parallels.name
  const parallelsResult = await db.execute(sql`
    SELECT 
      p.id, 
      p.name,
      word_similarity(${q}, p.name) as score
    FROM card_parallels p
    WHERE p.name ILIKE ${qFuzzy} OR ${q} <% p.name
    ORDER BY score DESC
    LIMIT 5
  `);

  return {
    sets: (setsResult as any[]).map((r: any) => ({
      type: "set",
      id: r.id,
      name: r.name,
      slug: r.slug,
    })),
    cards: (cardsResult as any[]).map((r: any) => ({
      type: "card",
      id: r.id,
      name: r.name,
      slug: r.slug,
      setId: r.set_id,
      setSlug: r.set_slug,
      cardNumber: r.card_number,
      team: r.team,
    })),
    parallels: (parallelsResult as any[]).map((r: any) => ({
      type: "parallel",
      id: r.id,
      name: r.name,
    }))
  };
}
