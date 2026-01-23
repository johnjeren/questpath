"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateQRCode } from "@/lib/qr";
import { StopType } from "@/app/generated/prisma";

const StopSchema = z.object({
  title: z.string().min(1, "Stop title is required"),
  message: z.string().optional(),
  type: z.enum(["PHYSICAL", "DIGITAL"]),
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

// Hardcoded test user ID (must be valid UUID for Postgres)
const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function createJourney(
  formData: FormData
): Promise<{ error: string } | void> {
  try {
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
          userId: TEST_USER_ID,
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
