import Link from "next/link";
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BreaksPage() {
  return (
    <div className="container mx-auto flex items-center justify-center px-4 md:px-6 py-24 min-h-[70vh]">
      <Card className="w-full max-w-2xl text-center bg-card/60 backdrop-blur-sm border-white/10 shadow-xl">
        <CardHeader className="pt-12 pb-6">
          <CardTitle className="text-4xl font-bold tracking-tight">Live Breaks</CardTitle>
          <CardDescription className="text-lg mt-4 font-semibold text-violet-400">
            Coming Soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Live-stream pack and box breaks from vetted sellers. Bid in real time on every slot. Built for the rip.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pt-6 pb-12">
          <Link href="/">
            <Button size="lg" variant="default" className="px-8">Browse the marketplace</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
