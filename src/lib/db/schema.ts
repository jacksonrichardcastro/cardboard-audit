import { pgTable, serial, text, integer, timestamp, json, varchar, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk user ID
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("buyer"), // buyer, seller, admin
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sellers = pgTable("sellers", {
  userId: varchar("user_id", { length: 255 }).primaryKey().references(() => users.id),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  description: text("description"),
  identityVerified: boolean("identity_verified").notNull().default(false),
  applicationStatus: varchar("application_status", { length: 50 }).notNull().default("pending"), // pending, approved, rejected
  feeTier: varchar("fee_tier", { length: 50 }).notNull().default("standard"), // standard=5%, founding=3%
  stripeConnectAccountId: varchar("stripe_connect_account_id", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  sellerId: varchar("seller_id", { length: 255 }).notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // Sports, TCG, Graded
  subcategory: varchar("subcategory", { length: 100 }), // Pokemon, Baseball, etc.
  condition: varchar("condition", { length: 100 }).notNull(),
  gradingCompany: varchar("grading_company", { length: 100 }),
  grade: varchar("grade", { length: 50 }),
  description: text("description"),
  priceCents: integer("price_cents").notNull(), // Stored in cents
  quantity: integer("quantity").notNull().default(1),
  photos: json("photos").$type<string[]>(), // Array of image URLs
  status: varchar("status", { length: 50 }).notNull().default("ACTIVE"), // ACTIVE, SOLD, DRAFT
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  sellerIdx: index("seller_idx").on(table.sellerId),
  categoryIdx: index("category_idx").on(table.category, table.subcategory),
}));

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  buyerId: varchar("buyer_id", { length: 255 }).notNull().references(() => users.id),
  sellerId: varchar("seller_id", { length: 255 }).notNull().references(() => users.id),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  currentState: varchar("current_state", { length: 100 }).notNull(), // PAID, SELLER_RECEIVED, PACKAGED, SHIPPED, IN_TRANSIT, DELIVERED, BUYER_CONFIRMED, DISPUTED
  priceCentsAtSale: integer("price_cents_at_sale").notNull(),
  taxCents: integer("tax_cents").notNull().default(0),
  shippingCents: integer("shipping_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  feeCents: integer("fee_cents").notNull().default(0),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  transferGroupId: varchar("transfer_group_id", { length: 255 }),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  buyerOrderIdx: index("buyer_order_idx").on(table.buyerId),
  sellerOrderIdx: index("seller_order_idx").on(table.sellerId),
}));

// Append-only audit trail
export const stateTransitions = pgTable("state_transitions", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  previousState: varchar("previous_state", { length: 100 }),
  newState: varchar("new_state", { length: 100 }).notNull(),
  actorId: varchar("actor_id", { length: 255 }).notNull(), // User who caused transition
  trackingNumber: varchar("tracking_number", { length: 255 }),
  carrier: varchar("carrier", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  trackingIdx: index("tracking_idx").on(table.trackingNumber),
}));

// P0-2: Idempotency dedupe table preventing catastrophic double-payouts
export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id", { length: 255 }).primaryKey(), // The explicit Stripe / Shippo event ID
  source: varchar("source", { length: 50 }).notNull(), // "stripe" | "shipping"
  eventType: varchar("event_type", { length: 255 }),
  payloadJson: json("payload_json").notNull(),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// P0-6: Complete centralized Audit Ledger
export const auditEvents = pgTable("audit_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  actorId: varchar("actor_id", { length: 255 }).notNull(),
  actorType: varchar("actor_type", { length: 50 }).notNull(), // 'seller' | 'buyer' | 'system' | 'admin'
  subjectType: varchar("subject_type", { length: 100 }), // 'order' | 'listing' | 'transfer'
  subjectId: varchar("subject_id", { length: 255 }),
  payloadJson: json("payload_json"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// P1-1: Core Product Differentiator - Escrow Disputes
export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  openedBy: varchar("opened_by", { length: 255 }).notNull().references(() => users.id),
  reason: varchar("reason", { length: 50 }).notNull(), // NOT_RECEIVED, NOT_AS_DESCRIBED, DAMAGED
  reasonText: text("reason_text"),
  buyerEvidenceUrls: json("buyer_evidence_urls").default([]),
  sellerEvidenceUrls: json("seller_evidence_urls").default([]),
  status: varchar("status", { length: 50 }).notNull().default("OPEN"), // OPEN, SELLER_RESPONDED, ADMIN_REVIEW, RESOLVED_FOR_BUYER, RESOLVED_FOR_SELLER, RESOLVED_SPLIT
  resolutionNote: text("resolution_note"),
  resolvedBy: varchar("resolved_by", { length: 255 }), // Admin user ID
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// P1-8: Dedicated Payouts Sub-Ledger mapping explicitly to Stripe API IDs
export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  sellerId: varchar("seller_id", { length: 255 }).notNull().references(() => users.id),
  orderId: integer("order_id").notNull().references(() => orders.id),
  stripeTransferId: varchar("stripe_transfer_id", { length: 255 }).notNull(),
  grossCents: integer("gross_cents").notNull(),
  feeCents: integer("fee_cents").notNull(),
  netCents: integer("net_cents").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations definitions (optional but highly recommended for Drizzle Query API)
export const usersRelations = relations(users, ({ one, many }) => ({
  sellerProfile: one(sellers, {
    fields: [users.id],
    references: [sellers.userId],
  }),
  listings: many(listings),
  ordersAsBuyer: many(orders, { relationName: "buyer" }),
  ordersAsSeller: many(orders, { relationName: "seller" }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, {
    fields: [orders.buyerId],
    references: [users.id],
    relationName: "buyer"
  }),
  seller: one(users, {
    fields: [orders.sellerId],
    references: [users.id],
    relationName: "seller"
  }),
  listing: one(listings, {
    fields: [orders.listingId],
    references: [listings.id],
  }),
  transitions: many(stateTransitions),
}));

export const stateTransitionsRelations = relations(stateTransitions, ({ one }) => ({
  order: one(orders, {
    fields: [stateTransitions.orderId],
    references: [orders.id],
  }),
}));

export const disputesRelations = relations(disputes, ({ one }) => ({
  order: one(orders, {
    fields: [disputes.orderId],
    references: [orders.id],
  }),
  opener: one(users, {
    fields: [disputes.openedBy],
    references: [users.id],
  }),
}));
