import Link from "next/link";
import { Search, MessageSquare, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfileHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tighter text-[#7C3AED]">Trax</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/search" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Search className="h-4 w-4" />
            Search
          </Link>
          <Link href="/messages" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <MessageSquare className="h-4 w-4" />
            Messages
          </Link>
          <Link href="/profile" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" className="hidden sm:flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            Review
          </Button>
          
          {/* Mobile Menu Toggle (simplified for V1) */}
          <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground">
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
