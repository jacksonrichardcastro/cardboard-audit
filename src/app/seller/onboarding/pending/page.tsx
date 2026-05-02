import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PendingReviewPage() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-2xl text-center min-h-[70vh] flex flex-col items-center justify-center">
      <div className="mb-8 p-4 bg-violet-500/10 rounded-full">
        <svg className="w-12 h-12 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-4">Application submitted</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Trax is hand-vetting every founding seller. You'll hear from us within 48 hours.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Return to marketplace</Link>
      </Button>
    </div>
  );
}
