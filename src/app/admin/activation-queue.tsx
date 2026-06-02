"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { activateListing, activateAllListings } from "./actions";
import { useRouter } from "next/navigation";

export type PendingListing = {
  id: number;
  title: string;
  priceCents: number;
  createdAt: Date;
  photoUrl: string;
  sellerHandle: string;
};

export default function ActivationQueue({ listings }: { listings: PendingListing[] }) {
  const router = useRouter();
  const [filterSeller, setFilterSeller] = useState<string>("all");
  const [sortField, setSortField] = useState<"createdAt" | "title" | "price">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"all" | "single">("all");
  const [targetListing, setTargetListing] = useState<PendingListing | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const uniqueSellers = Array.from(new Set(listings.map(l => l.sellerHandle))).filter(Boolean);

  const filtered = useMemo(() => {
    let result = [...listings];
    if (filterSeller !== "all") {
      result = result.filter(l => l.sellerHandle === filterSeller);
    }
    
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "createdAt") {
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
      } else if (sortField === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === "price") {
        comparison = a.priceCents - b.priceCents;
      }
      return sortDir === "asc" ? comparison : -comparison;
    });
    
    return result;
  }, [listings, filterSeller, sortField, sortDir]);

  const handleSort = (field: "createdAt" | "title" | "price") => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleActivateOne = async () => {
    if (!targetListing) return;
    setIsActivating(true);
    await activateListing(targetListing.id);
    setIsActivating(false);
    setIsModalOpen(false);
    setTargetListing(null);
    router.refresh();
  };

  const openActivateOneModal = (listing: PendingListing) => {
    setTargetListing(listing);
    setModalMode("single");
    setIsModalOpen(true);
  };

  const openActivateAllModal = () => {
    setModalMode("all");
    setIsModalOpen(true);
  };

  const handleActivateAll = async () => {
    setIsActivating(true);
    await activateAllListings();
    setIsActivating(false);
    setIsModalOpen(false);
    router.refresh();
  };

  if (listings.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">Marketplace Activation Queue</h2>
          <span className="bg-violet-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
            {listings.length}
          </span>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            className="h-10 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
            value={filterSeller}
            onChange={e => setFilterSeller(e.target.value)}
          >
            <option value="all">All Sellers</option>
            {uniqueSellers.map(s => (
              <option key={s} value={s}>@{s}</option>
            ))}
          </select>
          <button 
            onClick={openActivateAllModal}
            className="h-10 px-4 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            Activate All
          </button>
        </div>
      </div>

      <div className="bg-zinc-950 rounded-xl border border-white/10 overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-900/50">
            <TableRow>
              <TableHead className="w-[60px]"></TableHead>
              <TableHead className="cursor-pointer hover:text-white" onClick={() => handleSort("title")}>
                Title {sortField === "title" && (sortDir === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Seller</TableHead>
              <TableHead className="cursor-pointer hover:text-white text-right" onClick={() => handleSort("price")}>
                Price {sortField === "price" && (sortDir === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="cursor-pointer hover:text-white" onClick={() => handleSort("createdAt")}>
                Created {sortField === "createdAt" && (sortDir === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((l) => (
              <TableRow key={l.id} className="hover:bg-white/5 group">
                <TableCell>
                  <img src={l.photoUrl} alt="Thumbnail" className="w-10 h-14 object-cover rounded-md" />
                </TableCell>
                <TableCell className="font-medium text-white">{l.title}</TableCell>
                <TableCell className="text-muted-foreground">@{l.sellerHandle}</TableCell>
                <TableCell className="text-right font-medium">${(l.priceCents / 100).toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(l.createdAt, { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <a href={`/listings/${l.id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-white px-2 py-1">
                    View
                  </a>
                  <button 
                    onClick={() => openActivateOneModal(l)}
                    className="text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-md transition-colors"
                  >
                    Activate
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Activate listings for the public marketplace?</h3>
            <p className="text-muted-foreground mb-6">
              {modalMode === "all" ? (
                `This will move ${filtered.length} listings from Beta storefront-only visibility to the public marketplace catalog. This action cannot be undone via the dashboard.`
              ) : (
                `This will move 1 listing from Beta storefront-only visibility to the public marketplace catalog. This action cannot be undone via the dashboard.`
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setIsModalOpen(false); setTargetListing(null); }}
                className="px-4 py-2 text-sm font-medium hover:bg-white/5 rounded-md"
              >
                Cancel
              </button>
              <button 
                onClick={modalMode === "all" ? handleActivateAll : handleActivateOne}
                disabled={isActivating}
                className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
              >
                {isActivating ? "Activating..." : `Yes, activate ${modalMode === "all" ? filtered.length : 1} ${modalMode === "all" && filtered.length !== 1 ? 'listings' : 'listing'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
