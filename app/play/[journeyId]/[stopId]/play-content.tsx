"use client";

import { useState } from "react";
import { CompleteButton } from "./complete-button";

interface PlayContentProps {
  journeyId: string;
  stopId: string;
  isCompleted: boolean;
  isLastStop: boolean;
  nextStop: { id: string; title: string } | null;
  nextStopQR: string | null;
  userId: string | null;
  locationRequired: boolean;
  targetLatitude: number | null;
  targetLongitude: number | null;
  radius: number;
}

export function PlayContent({
  journeyId,
  stopId,
  isCompleted: initialCompleted,
  isLastStop,
  nextStop,
  nextStopQR,
  userId,
  locationRequired,
  targetLatitude,
  targetLongitude,
  radius,
}: PlayContentProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted);

  if (!isCompleted) {
    return (
      <div className="space-y-4">
        <CompleteButton
          journeyId={journeyId}
          stopId={stopId}
          onComplete={() => setIsCompleted(true)}
          locationRequired={locationRequired}
          targetLatitude={targetLatitude}
          targetLongitude={targetLongitude}
          radius={radius}
        />
        {!userId && (
          <p className="text-center text-sm text-gray-500 dark:text-secondary/60">
            <a href="/login" className="text-highlight dark:text-secondary hover:underline">
              Sign in
            </a>{" "}
            to track your progress
          </p>
        )}
      </div>
    );
  }

  // Completed state
  return (
    <div className="space-y-6">
      {/* Completed Badge */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold text-lg">Stop Completed!</span>
        </div>
      </div>

      {/* Next Stop or Journey Complete */}
      {isLastStop ? (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Journey Complete!
          </h2>
          <p className="text-gray-600 dark:text-secondary/80">
            Congratulations! You&apos;ve finished all the stops.
          </p>
        </div>
      ) : nextStop && nextStopQR ? (
        <div className="bg-white dark:bg-primary/90 rounded-2xl shadow-lg dark:shadow-secondary/20 p-6 text-center border border-gray-100 dark:border-secondary/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Next Stop
          </h2>
          <p className="text-gray-600 dark:text-secondary/80 mb-4">
            {nextStop.title}
          </p>
          <div className="bg-white dark:bg-primary/80 p-3 rounded-xl inline-block border border-gray-200 dark:border-secondary/30">
            <img
              src={nextStopQR}
              alt={`QR code for ${nextStop.title}`}
              width={250}
              height={250}
              className="block"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-secondary/60 mt-4">
            Scan this QR code at the next location
          </p>
        </div>
      ) : null}
    </div>
  );
}
