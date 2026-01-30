"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export async function completeStop(
  journeyId: string,
  stopId: string,
  userLatitude: number | null = null,
  userLongitude: number | null = null,
  distanceMeters: number | null = null
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        error: "Please sign in to track your progress",
      };
    }

    // Check if already completed
    const existing = await db.userProgress.findUnique({
      where: {
        userId_journeyId_stopId: {
          userId,
          journeyId,
          stopId,
        },
      },
    });

    if (existing) {
      return { success: true }; // Already completed, treat as success
    }

    // Create progress record
    await db.userProgress.create({
      data: {
        userId,
        journeyId,
        stopId,
        scanLatitude: userLatitude,
        scanLongitude: userLongitude,
        distanceMeters: distanceMeters,
      },
    });

    // Update QR code scan count
    await db.qRCode.updateMany({
      where: { stopId },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: new Date(),
      },
    });

    revalidatePath(`/play/${journeyId}/${stopId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to complete stop:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
