import fs from 'fs';

let content = fs.readFileSync('src/lib/db/schema.ts', 'utf-8');

// 1. Add storefronts table after profiles
const storefrontsCode = `
export const storefronts = pgTable("storefronts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  handle: varchar("handle", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  theme: varchar("theme", { length: 50 }).notNull().default("trax-cosmos"),
  themeScope: varchar("theme_scope", { length: 50 }).default("profile-wide"),
  headerCustomizationIds: json("header_customization_ids").default([]),
  hiddenBadges: json("hidden_badges").$type<string[]>().default([]),
  isDefaultForUser: boolean("is_default_for_user").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_storefronts_user_id").on(table.userId),
  handleIdx: index("idx_storefronts_handle").on(sql\`LOWER(\${table.handle})\`),
  userDefaultIdx: unique("idx_storefronts_user_default").on(table.userId).where(sql\`is_default_for_user = true\`),
}));

export const storefrontsRelations = relations(storefronts, ({ one, many }) => ({
  user: one(users, {
    fields: [storefronts.userId],
    references: [users.id]
  }),
  listings: many(listings),
  categories: many(categories)
}));
`;

content = content.replace(
  'export const profilesRelations = relations(profiles, ({ one }) => ({',
  storefrontsCode + '\nexport const profilesRelations = relations(profiles, ({ one }) => ({'
);

// 2. Add storefrontId to listings
content = content.replace(
  '  sellerId: varchar("seller_id", { length: 255 }).notNull().references(() => users.id),',
  '  sellerId: varchar("seller_id", { length: 255 }).notNull().references(() => users.id),\n  storefrontId: uuid("storefront_id").references(() => storefronts.id, { onDelete: "set null" }),'
);
content = content.replace(
  '  sellerIdx: index("seller_idx").on(table.sellerId),',
  '  sellerIdx: index("seller_idx").on(table.sellerId),\n  storefrontIdx: index("idx_listings_storefront_id").on(table.storefrontId),'
);

// 3. Add storefrontId to categories
content = content.replace(
  '  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),',
  '  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),\n  storefrontId: uuid("storefront_id").references(() => storefronts.id, { onDelete: "cascade" }),'
);
content = content.replace(
  '  userOrderIdx: index("categories_user_order_idx").on(table.userId, table.displayOrder),',
  '  userOrderIdx: index("categories_user_order_idx").on(table.userId, table.displayOrder),\n  storefrontIdx: index("idx_categories_storefront_id").on(table.storefrontId),'
);

// 4. Add storefrontId to handleHistory
content = content.replace(
  "  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),",
  "  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),\n  storefrontId: uuid('storefront_id').references(() => storefronts.id, { onDelete: 'cascade' }),"
);

fs.writeFileSync('src/lib/db/schema.ts', content);
