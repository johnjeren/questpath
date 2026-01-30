import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { generateQRCode } from "@/lib/qr";
import { StopType } from "@/app/generated/prisma";
import { requireAuth } from "@/lib/auth";

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{journey.title}</h1>
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
