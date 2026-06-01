"use client";

import { useState, useEffect } from "react";
import { PreferencesCaptureModal } from "./PreferencesCaptureModal";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export function ForYouClient() {
  const [modalOpen, setModalOpen] = useState(false);
  const [showSoftPrompt, setShowSoftPrompt] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const isSkipped = sessionStorage.getItem("trax_prefs_skipped");
    if (isSkipped) {
      setShowSoftPrompt(true);
    } else {
      setModalOpen(true);
    }
  }, []);

  const handleModalClose = (skipped: boolean) => {
    setModalOpen(false);
    if (skipped) {
      setShowSoftPrompt(true);
    }
  };

  const handleSaved = () => {
    setModalOpen(false);
    setShowSoftPrompt(false);
    router.push("/for-you");
  };

  return (
    <>
      {showSoftPrompt && (
        <button 
          onClick={() => setModalOpen(true)}
          className="w-full flex items-center justify-between p-4 mb-8 bg-violet-900/20 border border-violet-500/30 rounded-xl hover:bg-violet-900/40 transition-colors group"
        >
          <span className="text-violet-200 font-medium">Tell us what you collect</span>
          <ChevronRight className="w-5 h-5 text-violet-400 group-hover:text-violet-200 transition-colors group-hover:translate-x-1" />
        </button>
      )}

      <PreferencesCaptureModal 
        isOpen={modalOpen} 
        onClose={handleModalClose} 
        onSaved={handleSaved} 
      />
    </>
  );
}
