"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function completeStop(
  journeyId: string,
  stopId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already completed
    const existing = await db.userProgress.findUnique({
      where: {
        userId_journeyId_stopId: {
          userId: TEST_USER_ID,
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
        userId: TEST_USER_ID,
        journeyId,
        stopId,
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
