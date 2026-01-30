import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { generateQRCode } from "@/lib/qr";
import { StopType } from "@/app/generated/prisma";
import { requireAuth } from "@/lib/auth";
import { DeleteButton } from "./delete-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

function StopTypeBadge({ type }: { type: StopType }) {
  const styles = {
    PHYSICAL: "bg-green-100 text-green-700",
    DIGITAL: "bg-purple-100 text-purple-700",
    TIMED: "bg-yellow-100 text-yellow-700",
    CONDITIONAL: "bg-orange-100 text-orange-700",
  };

  const labels = {
    PHYSICAL: "Physical",
    DIGITAL: "Digital",
    TIMED: "Timed",
    CONDITIONAL: "Conditional",
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

function DownloadButton({ dataUrl, filename }: { dataUrl: string; filename: string }) {
  return (
    <a
      href={dataUrl}
      download={filename}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-accent/20 rounded-lg hover:bg-gray-200 dark:hover:bg-accent/30 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Download QR
    </a>
  );
}

export default async function JourneyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const userId = await requireAuth();

  const journey = await db.journey.findUnique({
    where: { id },
    include: {
      stops: {
        orderBy: { order: "asc" },
        include: {
          qrCode: true,
        },
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

  // Generate QR codes on-demand for each stop
  const stopsWithQR = await Promise.all(
    journey.stops.map(async (stop) => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const scanUrl = `${baseUrl}/play/${journey.id}/${stop.id}`;
      const qrDataUrl = await generateQRCode(scanUrl, { size: 200 });
      return { ...stop, qrDataUrl };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/journeys"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-secondary/80 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Journeys
        </Link>

        <div className="bg-white dark:bg-primary/90 rounded-lg shadow-sm dark:shadow-secondary/20 p-6 mb-8 border border-gray-200 dark:border-secondary/30">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{journey.title}</h1>
            <div className="flex gap-2">
              <Link
                href={`/journeys/${journey.id}/edit`}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white bg-gray-100 dark:bg-primary/80 rounded-lg hover:bg-gray-200 dark:hover:bg-secondary/10 transition-colors"
              >
                Edit
              </Link>
              <DeleteButton journeyId={journey.id} />
            </div>
          </div>
          {journey.description && (
            <p className="text-gray-600 dark:text-secondary/80">{journey.description}</p>
          )}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-secondary/60">
            <span>{journey.stops.length} stops</span>
            <span>Created {new Intl.DateTimeFormat("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }).format(journey.createdAt)}</span>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Stops</h2>

        <div className="space-y-6">
          {stopsWithQR.map((stop, index) => (
            <div
              key={stop.id}
              className="bg-white dark:bg-primary/90 rounded-lg shadow-sm dark:shadow-secondary/20 border border-gray-200 dark:border-secondary/30 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-highlight/10 dark:bg-secondary/20 text-highlight dark:text-secondary font-semibold rounded-full text-sm">
                        #{index + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {stop.title}
                      </h3>
                      <StopTypeBadge type={stop.type} />
                    </div>

                    {stop.message && (
                      <p className="text-gray-600 dark:text-secondary/80 mb-4">{stop.message}</p>
                    )}

                    {/* Location Info */}
                    {(stop.latitude && stop.longitude) && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Location Required</p>
                            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                              {stop.latitude.toString()}, {stop.longitude.toString()}
                              {stop.radius && ` • ${stop.radius}m radius`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Media Indicators */}
                    {(stop.imageUrl || stop.videoUrl || stop.audioUrl) && (
                      <div className="flex gap-2 mb-4">
                        {stop.imageUrl && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Image
                          </span>
                        )}
                        {stop.videoUrl && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs font-medium rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Video
                          </span>
                        )}
                        {stop.audioUrl && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            Audio
                          </span>
                        )}
                      </div>
                    )}

                    {stop.qrCode && (
                      <div className="text-sm text-gray-500 dark:text-secondary/60">
                        <span className="font-medium">Code:</span>{" "}
                        <code className="bg-gray-100 dark:bg-primary/80 px-2 py-0.5 rounded text-gray-800 dark:text-gray-200">
                          {stop.qrCode.code}
                        </code>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white dark:bg-primary/80 p-2 border border-gray-200 dark:border-secondary/30 rounded-lg">
                      <img
                        src={stop.qrDataUrl}
                        alt={`QR code for ${stop.title}`}
                        width={200}
                        height={200}
                        className="block"
                      />
                    </div>
                    <DownloadButton
                      dataUrl={stop.qrDataUrl}
                      filename={`qr-stop-${index + 1}-${stop.title.toLowerCase().replace(/\s+/g, "-")}.png`}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {journey.stops.length === 0 && (
          <div className="bg-white dark:bg-primary/90 rounded-lg shadow-sm dark:shadow-secondary/20 p-12 text-center border border-gray-200 dark:border-secondary/30">
            <p className="text-gray-500 dark:text-secondary/60">No stops in this journey yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
