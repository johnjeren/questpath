"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateQRCode } from "@/lib/qr";
import { StopType } from "@/app/generated/prisma";
import { requireAuth } from "@/lib/auth";

const StopSchema = z.object({
  title: z.string().min(1, "Stop title is required"),
  message: z.string().optional(),
  type: z.enum(["PHYSICAL", "DIGITAL"]),
  imageUrl: z.string().url().optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
  audioUrl: z.string().url().optional().or(z.literal("")),
});

const CreateJourneySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  stops: z.array(StopSchema).min(2, "At least 2 stops are required"),
});

type StopInput = z.infer<typeof StopSchema>;

function generateCode(length: number = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createJourney(
  formData: FormData
): Promise<{ error: string } | void> {
  try {
    const userId = await requireAuth();

    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string | null,
      stops: JSON.parse(formData.get("stops") as string) as StopInput[],
    };

    const validated = CreateJourneySchema.safeParse(rawData);

    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      const message = Object.values(errors).flat().join(", ");
      return { error: message || "Validation failed" };
    }

    const { title, description, stops } = validated.data;

    await db.$transaction(async (tx) => {
      // Create the journey
      const journey = await tx.journey.create({
        data: {
          userId,
          title,
          description: description || null,
        },
      });

      // Create stops and QR codes
      for (let i = 0; i < stops.length; i++) {
        const stopData = stops[i];

        const stop = await tx.stop.create({
          data: {
            journeyId: journey.id,
            order: i,
            title: stopData.title,
            message: stopData.message || null,
            type: stopData.type as StopType,
            imageUrl: stopData.imageUrl || null,
            videoUrl: stopData.videoUrl || null,
            audioUrl: stopData.audioUrl || null,
          },
        });

        const code = generateCode();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const scanUrl = `${baseUrl}/play/${journey.id}/${stop.id}`;
        const qrImageData = await generateQRCode(scanUrl);

        await tx.qRCode.create({
          data: {
            code,
            journeyId: journey.id,
            stopId: stop.id,
          },
        });
      }
    });

    revalidatePath("/journeys");
  } catch (error) {
    console.error("Failed to create journey:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Failed to create journey: ${message}` };
  }

  redirect("/journeys");
}

export async function deleteJourney(
  journeyId: string
): Promise<{ error: string } | void> {
  try {
    const userId = await requireAuth();

    // Verify ownership
    const journey = await db.journey.findUnique({
      where: { id: journeyId },
      select: { userId: true },
    });

    if (!journey) {
      return { error: "Journey not found" };
    }

    if (journey.userId !== userId) {
      return { error: "Unauthorized" };
    }

    // Delete journey (cascades to stops, QR codes, etc.)
    await db.journey.delete({
      where: { id: journeyId },
    });

    revalidatePath("/journeys");
  } catch (error) {
    console.error("Failed to delete journey:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Failed to delete journey: ${message}` };
  }

  redirect("/journeys");
}

export async function updateJourney(
  journeyId: string,
  formData: FormData
): Promise<{ error: string } | void> {
  try {
    const userId = await requireAuth();

    // Verify ownership
    const existingJourney = await db.journey.findUnique({
      where: { id: journeyId },
      select: { userId: true },
    });

    if (!existingJourney) {
      return { error: "Journey not found" };
    }

    if (existingJourney.userId !== userId) {
      return { error: "Unauthorized" };
    }

    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string | null,
      stops: JSON.parse(formData.get("stops") as string) as StopInput[],
    };

    const validated = CreateJourneySchema.safeParse(rawData);

    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      const message = Object.values(errors).flat().join(", ");
      return { error: message || "Validation failed" };
    }

    const { title, description, stops } = validated.data;

    await db.$transaction(async (tx) => {
      // Update journey details
      await tx.journey.update({
        where: { id: journeyId },
        data: {
          title,
          description: description || null,
        },
      });

      // Delete all existing stops and QR codes (cascade handles QR codes)
      await tx.stop.deleteMany({
        where: { journeyId },
      });

      // Create new stops and QR codes
      for (let i = 0; i < stops.length; i++) {
        const stopData = stops[i];

        const stop = await tx.stop.create({
          data: {
            journeyId,
            order: i,
            title: stopData.title,
            message: stopData.message || null,
            type: stopData.type as StopType,
            imageUrl: stopData.imageUrl || null,
            videoUrl: stopData.videoUrl || null,
            audioUrl: stopData.audioUrl || null,
          },
        });

        const code = generateCode();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const scanUrl = `${baseUrl}/play/${journeyId}/${stop.id}`;
        await generateQRCode(scanUrl);

        await tx.qRCode.create({
          data: {
            code,
            journeyId,
            stopId: stop.id,
          },
        });
      }
    });

    revalidatePath("/journeys");
    revalidatePath(`/journeys/${journeyId}`);
  } catch (error) {
    console.error("Failed to update journey:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Failed to update journey: ${message}` };
  }

  redirect(`/journeys/${journeyId}`);
}
