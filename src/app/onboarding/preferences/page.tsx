"use client";

import { useRouter } from "next/navigation";
import { PreferencesCaptureModal } from "@/components/recommendations/PreferencesCaptureModal";

export default function PreferencesOnboardingPage() {
  const router = useRouter();

  const handleNext = () => {
    router.push("/seller/onboarding/profile");
  };

  return (
    <div className="min-h-screen bg-black">
      <PreferencesCaptureModal 
        isOpen={true} 
        onClose={handleNext} 
        onSaved={handleNext} 
      />
    </div>
  );
}
