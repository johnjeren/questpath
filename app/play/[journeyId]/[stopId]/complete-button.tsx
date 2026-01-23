"use client";

import { useState, useTransition } from "react";
import { completeStop } from "@/app/actions/progress";

interface CompleteButtonProps {
  journeyId: string;
  stopId: string;
  onComplete: () => void;
}

export function CompleteButton({ journeyId, stopId, onComplete }: CompleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleComplete = () => {
    setError(null);
    startTransition(async () => {
      const result = await completeStop(journeyId, stopId);
      if (result.success) {
        onComplete();
      } else {
        setError(result.error || "Failed to complete stop");
      }
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleComplete}
        disabled={isPending}
        className="w-full px-8 py-4 bg-green-600 text-white font-semibold text-lg rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
      >
        {isPending ? "Completing..." : "Mark Complete"}
      </button>
      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  );
}
