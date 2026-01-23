import Link from "next/link";
import { db } from "@/lib/db";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "...";
}

export default async function JourneysPage() {
  const journeys = await db.journey.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { stops: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Journeys</h1>
          <Link
            href="/journeys/new"
            className="px-4 py-2 bg-highlight dark:bg-secondary text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Create Journey
          </Link>
        </div>

        {journeys.length === 0 ? (
          <div className="bg-white dark:bg-primary/90 rounded-lg shadow-sm dark:shadow-secondary/20 p-12 text-center border border-gray-200 dark:border-secondary/30">
            <div className="text-gray-400 dark:text-secondary mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No journeys yet
            </h2>
            <p className="text-gray-500 dark:text-secondary/70 mb-6">
              Create your first QR journey to get started!
            </p>
            <Link
              href="/journeys/new"
              className="inline-block px-6 py-3 bg-highlight dark:bg-secondary text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Create Your First Journey
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journeys.map((journey) => (
              <div
                key={journey.id}
                className="bg-white dark:bg-primary/90 rounded-lg shadow-sm dark:shadow-secondary/20 border border-gray-200 dark:border-secondary/30 overflow-hidden hover:shadow-md dark:hover:shadow-secondary/30 transition-all hover:-translate-y-1"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {journey.title}
                  </h2>
                  <p className="text-gray-600 dark:text-secondary/80 text-sm mb-4 min-h-[40px]">
                    {journey.description
                      ? truncate(journey.description, 100)
                      : "No description"}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-secondary/60 mb-4">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {journey._count.stops} stops
                    </span>
                    <span>{formatDate(journey.createdAt)}</span>
                  </div>
                  <Link
                    href={`/journeys/${journey.id}`}
                    className="block w-full text-center px-4 py-2 bg-gray-100 dark:bg-accent/20 text-gray-700 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-accent/30 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
