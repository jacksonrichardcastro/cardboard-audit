import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ShieldCheck, LayoutDashboard } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId || userId !== process.env.ADMIN_USER_ID) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row">
      <aside className="w-full md:w-64 border-r border-white/10 bg-zinc-950 p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">Trax Admin</h2>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Command Center</p>
        </div>
        <nav className="flex flex-col gap-2">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 text-sm text-zinc-300 hover:text-white transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link href="/admin/sellers" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 text-sm text-zinc-300 hover:text-white transition-colors">
            <ShieldCheck className="w-4 h-4" />
            Seller Vetting
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
