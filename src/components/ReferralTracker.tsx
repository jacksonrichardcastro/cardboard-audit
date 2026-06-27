"use client";

import { useEffect } from "react";
import { processReferral } from "@/app/actions/referrals";

export function ReferralTracker() {
  useEffect(() => {
    // Fire and forget
    processReferral().catch(console.error);
  }, []);

  return null;
}
