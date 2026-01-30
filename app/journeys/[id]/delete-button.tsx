"use client";

import { useState, useTransition } from "react";
import { deleteJourney } from "@/app/actions/journey";

export function DeleteButton({ journeyId }: { journeyId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteJourney(journeyId);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-primary/95 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-secondary/30">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Delete Journey?
          </h3>
          <p className="text-gray-600 dark:text-secondary/80 mb-6">
            This will permanently delete this journey and all its stops. This action cannot be undone.
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-primary/80 text-gray-700 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-secondary/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
    >
      Delete Journey
    </button>
  );
}
