import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/10 to-white dark:from-primary dark:to-primary/95 flex flex-col items-center justify-center px-4">
      <main className="text-center max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Quest<span className="text-highlight dark:text-secondary">Path</span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-600 dark:text-secondary/80 mb-8">
          Create interactive QR code journeys for scavenger hunts, museum tours,
          city explorations, and more.
        </p>

        <p className="text-gray-500 dark:text-secondary/60 mb-12 max-w-md mx-auto">
          Design multi-stop experiences with custom messages, unlock conditions,
          and track participant progress in real-time.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/journeys/new"
            className="px-8 py-4 bg-highlight dark:bg-secondary text-white font-semibold text-lg rounded-lg hover:bg-opacity-90 transition-colors shadow-lg shadow-highlight/25 dark:shadow-secondary/25"
          >
            Create a Journey
          </Link>
          <Link
            href="/journeys"
            className="px-8 py-4 bg-white dark:bg-primary/90 text-gray-700 dark:text-white font-semibold text-lg rounded-lg hover:bg-gray-50 dark:hover:bg-primary/80 transition-colors border border-gray-200 dark:border-secondary/30"
          >
            View My Journeys
          </Link>
        </div>
      </main>

      <footer className="absolute bottom-8 text-gray-400 dark:text-secondary/50 text-sm">
        Built with Next.js, Prisma, and Supabase
      </footer>
    </div>
  );
}
