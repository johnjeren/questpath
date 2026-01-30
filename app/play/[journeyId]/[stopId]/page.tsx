import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StopType } from "@/app/generated/prisma";
import { generateQRCode } from "@/lib/qr";
import { PlayContent } from "./play-content";
import { getCurrentUserId } from "@/lib/auth";
import { MediaDisplay } from "./media-display";

interface PageProps {
  params: Promise<{ journeyId: string; stopId: string }>;
}

function StopTypeBadge({ type }: { type: StopType }) {
  const styles = {
    PHYSICAL: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    DIGITAL: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    TIMED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    CONDITIONAL: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };

  const labels = {
    PHYSICAL: "Physical",
    DIGITAL: "Digital",
    TIMED: "Timed",
    CONDITIONAL: "Conditional",
  };

  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

export default async function PlayStopPage({ params }: PageProps) {
  const { journeyId, stopId } = await params;
  const userId = await getCurrentUserId();

  // Fetch journey with all stops
  const journey = await db.journey.findUnique({
    where: { id: journeyId },
    include: {
      stops: {
        orderBy: { order: "asc" },
        include: { qrCode: true },
      },
    },
  });

  if (!journey) {
    notFound();
  }

  // Find current stop
  const currentStop = journey.stops.find((s) => s.id === stopId);
  if (!currentStop) {
    notFound();
  }

  // Check if already completed (only if logged in)
  let existingProgress = null;
  if (userId) {
    existingProgress = await db.userProgress.findUnique({
      where: {
        userId_journeyId_stopId: {
          userId,
          journeyId,
          stopId,
        },
      },
    });
  }

  const isCompleted = !!existingProgress;

  // Find current index and next stop
  const currentIndex = journey.stops.findIndex((s) => s.id === stopId);
  const nextStop = journey.stops[currentIndex + 1] || null;
  const isLastStop = currentIndex === journey.stops.length - 1;

  // Generate next stop's QR code if exists
  let nextStopQR: string | null = null;
  if (nextStop) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const nextUrl = `${baseUrl}/play/${journeyId}/${nextStop.id}`;
    nextStopQR = await generateQRCode(nextUrl, { size: 250 });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-primary py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Journey Header */}
        <div className="text-center mb-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-secondary/60 uppercase tracking-wide">
            {journey.title}
          </h2>
          <p className="text-gray-400 dark:text-secondary/40 text-sm mt-1">
            Stop {currentIndex + 1} of {journey.stops.length}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-secondary/20 rounded-full h-2 mb-8">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + (isCompleted ? 1 : 0)) / journey.stops.length) * 100}%` }}
          />
        </div>

        {/* Stop Card */}
        <div className="bg-white dark:bg-primary/90 rounded-2xl shadow-lg dark:shadow-secondary/20 p-6 mb-6 border border-gray-100 dark:border-secondary/30">
          <div className="flex items-center justify-between mb-4">
            <span className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-secondary/20 text-blue-700 dark:text-secondary font-bold rounded-full">
              #{currentIndex + 1}
            </span>
            <StopTypeBadge type={currentStop.type} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {currentStop.title}
          </h1>

          {currentStop.message && (
            <p className="text-gray-600 dark:text-secondary/80 text-lg leading-relaxed mb-6">
              {currentStop.message}
            </p>
          )}

          {/* Media Section */}
          <MediaDisplay
            imageUrl={currentStop.imageUrl}
            videoUrl={currentStop.videoUrl}
            audioUrl={currentStop.audioUrl}
            title={currentStop.title}
          />
        </div>

        {/* Action Area */}
        <PlayContent
          journeyId={journeyId}
          stopId={stopId}
          isCompleted={isCompleted}
          isLastStop={isLastStop}
          nextStop={nextStop ? { id: nextStop.id, title: nextStop.title } : null}
          nextStopQR={nextStopQR}
          userId={userId}
        />
      </div>
    </div>
  );
}
