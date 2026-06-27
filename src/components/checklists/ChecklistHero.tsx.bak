import { CosmosBackground } from "@/components/marketplace/CosmosBackground";

interface ChecklistHeroProps {
  name: string;
  brand: string;
  yearLabel: string;
  releaseDate?: string | null;
  description?: string | null;
}

export function ChecklistHero({ name, brand, yearLabel, releaseDate, description }: ChecklistHeroProps) {
  return (
    <div className="relative w-full bg-black pt-12 pb-16 md:pt-16 md:pb-24 flex flex-col items-center">
      {/* Ambient Radial Glow Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-[#7C3AED]/20 blur-[120px] rounded-full opacity-50" />
      </div>

      <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center z-10">
        <div className="mb-4 inline-flex items-center rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-3 py-1 text-sm font-medium text-[#7C3AED]">
          {yearLabel} {brand}
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
          {name}
        </h1>
        {releaseDate && (
          <p className="text-sm font-medium text-zinc-400 mb-6 uppercase tracking-widest">
            Released {new Date(releaseDate).toLocaleDateString()}
          </p>
        )}
        {description && (
          <p className="text-lg text-zinc-300 max-w-2xl mx-auto">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
