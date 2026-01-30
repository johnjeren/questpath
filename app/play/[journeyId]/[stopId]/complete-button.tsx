"use client";

import { useState, useTransition, useEffect } from "react";
import { completeStop } from "@/app/actions/progress";

interface CompleteButtonProps {
  journeyId: string;
  stopId: string;
  onComplete: () => void;
  locationRequired: boolean;
  targetLatitude: number | null;
  targetLongitude: number | null;
  radius: number;
}

// Calculate distance between two GPS coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function CompleteButton({
  journeyId,
  stopId,
  onComplete,
  locationRequired,
  targetLatitude,
  targetLongitude,
  radius,
}: CompleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<"loading" | "granted" | "denied" | "error">("loading");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (!locationRequired || !targetLatitude || !targetLongitude) {
      setLocationStatus("granted");
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus("error");
      setError("Geolocation is not supported by your browser");
      return;
    }

    // Request user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng });

        const dist = calculateDistance(userLat, userLng, targetLatitude, targetLongitude);
        setDistance(Math.round(dist));
        setLocationStatus("granted");
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLocationStatus("denied");
        setError("Location access denied. Please enable location services to continue.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [locationRequired, targetLatitude, targetLongitude]);

  const handleComplete = () => {
    setError(null);
    startTransition(async () => {
      const result = await completeStop(
        journeyId,
        stopId,
        userLocation?.lat || null,
        userLocation?.lng || null,
        distance
      );
      if (result.success) {
        onComplete();
      } else {
        setError(result.error || "Failed to complete stop");
      }
    });
  };

  const isWithinRadius = !locationRequired || (distance !== null && distance <= radius);
  const canComplete = locationStatus === "granted" && isWithinRadius && !isPending;

  return (
    <div className="space-y-3">
      {/* Location Status */}
      {locationRequired && (
        <div className="space-y-2">
          {locationStatus === "loading" && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg text-blue-700 dark:text-blue-400 text-sm text-center">
              📍 Getting your location...
            </div>
          )}

          {locationStatus === "granted" && distance !== null && (
            <div className={`p-3 border rounded-lg text-sm ${
              isWithinRadius
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400"
                : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-400"
            }`}>
              {isWithinRadius ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">You&apos;re at the location! ({distance}m away)</span>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-medium">Not quite there yet</p>
                  <p className="mt-1">
                    You&apos;re {distance}m away • Need to be within {radius}m
                  </p>
                </div>
              )}
            </div>
          )}

          {locationStatus === "denied" && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg text-red-700 dark:text-red-400 text-sm text-center">
              ⚠️ Location access required for this stop
            </div>
          )}
        </div>
      )}

      {/* Complete Button */}
      <button
        onClick={handleComplete}
        disabled={!canComplete}
        className="w-full px-8 py-4 bg-green-600 text-white font-semibold text-lg rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
      >
        {isPending ? "Completing..." : "Mark Complete"}
      </button>

      {error && (
        <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>
      )}

      {!isWithinRadius && distance !== null && (
        <p className="text-gray-500 dark:text-secondary/60 text-xs text-center">
          Get closer to the location to complete this stop
        </p>
      )}
    </div>
  );
}
