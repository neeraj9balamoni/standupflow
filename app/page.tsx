"use client";

import React from "react";
import { Hero } from "@/components/hero";
import { Generator } from "@/components/generator";
import { HowItWorks } from "@/components/how-it-works";
import { CopyToast } from "@/components/copy-toast";
import { useStandupStore } from "@/components/store";

export default function Home() {
  const { toastInfo, dismissToast } = useStandupStore();

  return (
    <div className="page-transition">
      <Hero />
      <Generator />
      <HowItWorks />

      {toastInfo.visible && (
        <CopyToast
          timeSavedMinutes={toastInfo.timeSavedMinutes}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}
