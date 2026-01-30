import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { EditJourneyForm } from "./edit-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJourneyPage({ params }: PageProps) {
  const { id } = await params;
  const userId = await requireAuth();

  const journey = await db.journey.findUnique({
    where: { id },
    include: {
      stops: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!journey) {
    notFound();
  }

  // Verify ownership
  if (journey.userId !== userId) {
    redirect("/journeys");
  }

  return <EditJourneyForm journey={journey} />;
}
