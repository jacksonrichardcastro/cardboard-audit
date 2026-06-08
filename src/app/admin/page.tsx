import { db } from "@/lib/db";
import { users, profiles, listings, orders, cards } from "@/lib/db/schema";
import { sql, eq, desc, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow, format } from "date-fns";
import { Search } from "lucide-react";
import { redirect } from "next/navigation";
import ActivationQueue from "./activation-queue";

export default async function AdminDashboardPage(props: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";
  const typeFilter = searchParams.type || "all";

  // Base query with subqueries
  let queryBuilder = db
    .select({
      userId: users.id,
      email: users.email,
      accountType: users.accountType,
      createdAt: users.createdAt,
      handle: profiles.handle,
      displayName: profiles.displayName,
      businessName: profiles.businessName,
      kycStatus: profiles.kycStatus,
      activeListingCount: sql<number>`(SELECT CAST(COUNT(*) AS INT) FROM ${listings} WHERE ${listings.sellerId} = ${users.id} AND ${listings.status} = 'active')`,
      pendingListingCount: sql<number>`(SELECT CAST(COUNT(*) AS INT) FROM ${listings} WHERE ${listings.sellerId} = ${users.id} AND ${listings.status} = 'pending_marketplace_activation')`,
      binderCardCount: sql<number>`(SELECT CAST(COUNT(*) AS INT) FROM ${cards} WHERE ${cards.ownerId} = ${users.id})`,
      transactionCount: sql<number>`(SELECT CAST(COUNT(*) AS INT) FROM ${orders} WHERE ${orders.buyerId} = ${users.id} OR ${orders.sellerId} = ${users.id})`,
      lifetimeSalesCents: sql<number>`(SELECT COALESCE(SUM(${orders.totalCents}), 0) FROM ${orders} WHERE ${orders.sellerId} = ${users.id})`,
    })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.userId));

  const conditions = [];

  if (query) {
    conditions.push(
      or(
        ilike(users.email, `%${query}%`),
        ilike(profiles.handle, `%${query}%`),
        ilike(profiles.displayName, `%${query}%`),
        ilike(profiles.businessName, `%${query}%`)
      )
    );
  }

  if (typeFilter !== "all") {
    conditions.push(eq(users.accountType, typeFilter));
  }

  // Combine where conditions if any exist
  if (conditions.length > 0) {
    // We have to build this manually because Drizzle's where() overrides previous where()s
    // Since we just have an array of conditions, we can 'and' them all
    const combinedWhere = conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`;
    // A safer way in Drizzle is using the 'and()' helper
    queryBuilder = queryBuilder.where(conditions.length > 1 ? conditions[0] : conditions[0]) as any; // Temporary cast due to strict typescript complaining about variable reassignment.
  }

  // Hack for TS error: We'll just execute with the combined WHERE clause using .where() correctly.
  // Actually, let's just do it cleanly:
  const fetchedUsers = await db
    .select({
      userId: users.id,
      email: users.email,
      accountType: users.accountType,
      createdAt: users.createdAt,
      handle: profiles.handle,
      displayName: profiles.displayName,
      businessName: profiles.businessName,
      kycStatus: profiles.kycStatus,
      activeListingCount: sql<number>`(SELECT CAST(COUNT(*) AS INT) FROM ${listings} WHERE ${listings.sellerId} = ${users.id} AND ${listings.status} = 'active')`,
      pendingListingCount: sql<number>`(SELECT CAST(COUNT(*) AS INT) FROM ${listings} WHERE ${listings.sellerId} = ${users.id} AND ${listings.status} = 'pending_marketplace_activation')`,
      binderCardCount: sql<number>`(SELECT CAST(COUNT(*) AS INT) FROM ${cards} WHERE ${cards.ownerId} = ${users.id})`,
      transactionCount: sql<number>`(SELECT CAST(COUNT(*) AS INT) FROM ${orders} WHERE ${orders.buyerId} = ${users.id} OR ${orders.sellerId} = ${users.id})`,
      lifetimeSalesCents: sql<number>`(SELECT COALESCE(SUM(${orders.totalCents}), 0) FROM ${orders} WHERE ${orders.sellerId} = ${users.id})`,
    })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(
      conditions.length > 0
        ? conditions.length === 1
          ? conditions[0]
          : sql`${conditions[0]} AND ${conditions[1]}`
        : undefined
    )
    .orderBy(desc(users.createdAt));

  const totalSignups = fetchedUsers.length; // If unfiltered, this is all signups.

  // Fetch pending listings for Activation Queue
  const pendingDbListings = await db
    .select({
      id: listings.id,
      title: listings.title,
      priceCents: listings.priceCents,
      createdAt: listings.createdAt,
      photoUrl: sql<string>`(SELECT storage_path FROM item_photos WHERE item_photos.card_id = listings.card_id ORDER BY sort_order ASC LIMIT 1)`,
      sellerHandle: profiles.handle,
    })
    .from(listings)
    .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
    .where(eq(listings.status, "pending_marketplace_activation"))
    .orderBy(desc(listings.createdAt));

  const pendingListings = pendingDbListings.map(l => ({
    ...l,
    photoUrl: l.photoUrl || "https://placehold.co/400x550",
    sellerHandle: l.sellerHandle || "unknown",
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <ActivationQueue listings={pendingListings as any} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Master Accounts</h1>
          <p className="text-muted-foreground text-sm">
            Total Signups: <span className="text-white font-semibold">{totalSignups}</span>
          </p>
        </div>

        <form className="flex items-center gap-3 w-full md:w-auto" action="/admin">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              name="q"
              placeholder="Search email, handle..." 
              className="pl-8 bg-zinc-900 border-white/10" 
              defaultValue={query}
            />
          </div>
          <select 
            name="type" 
            className="h-10 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
            defaultValue={typeFilter}
          >
            <option value="all">All Types</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </select>
          <button type="submit" className="h-10 px-4 rounded-md bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors">
            Filter
          </button>
        </form>
      </div>

      <div className="bg-zinc-950 rounded-xl border border-white/10 overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-900/50">
            <TableRow>
              <TableHead>User / Handle</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>KYC</TableHead>
              <TableHead className="text-right">Active Listings</TableHead>
              <TableHead className="text-right">Pending Listings</TableHead>
              <TableHead className="text-right">Binder Cards</TableHead>
              <TableHead className="text-right">Txns</TableHead>
              <TableHead className="text-right">Sales</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetchedUsers.map((user) => {
              const name = user.displayName || user.businessName || "Unnamed";
              return (
                <TableRow key={user.userId} className="hover:bg-white/5 cursor-pointer group">
                  <TableCell>
                    <Link href={`/admin/sellers/${user.userId}`} className="block">
                      <div className="font-medium text-white group-hover:text-violet-400 transition-colors">{name}</div>
                      <div className="text-xs text-muted-foreground">{user.handle ? `@${user.handle}` : "No Handle"}</div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/sellers/${user.userId}`} className="block text-sm">
                      {user.email}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/sellers/${user.userId}`} className="block">
                      <span className="capitalize text-sm">{user.accountType}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/sellers/${user.userId}`} className="block">
                      {user.accountType === "seller" ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${user.kycStatus === 'verified' ? 'bg-green-500' : user.kycStatus === 'incomplete' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                          <span className="capitalize text-xs">{user.kycStatus || "pending"}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/sellers/${user.userId}`} className="block text-sm">
                      {user.activeListingCount}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/sellers/${user.userId}`} className="block text-sm">
                      {user.pendingListingCount}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/sellers/${user.userId}`} className="block text-sm">
                      {user.binderCardCount}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/sellers/${user.userId}`} className="block text-sm">
                      {user.transactionCount}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/sellers/${user.userId}`} className="block text-sm">
                      ${(user.lifetimeSalesCents / 100).toFixed(2)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/sellers/${user.userId}`} className="block text-sm text-muted-foreground">
                      {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/sellers/${user.userId}`} className="block text-xs text-muted-foreground italic">
                      N/A (Requires Clerk Sync)
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            {fetchedUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  No accounts found matching filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
