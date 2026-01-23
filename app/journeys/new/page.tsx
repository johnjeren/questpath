"use client";

import { useState, useTransition } from "react";
import { createJourney } from "@/app/actions/journey";

interface Stop {
  title: string;
  message: string;
  type: "PHYSICAL" | "DIGITAL";
}

const emptyStop = (): Stop => ({
  title: "",
  message: "",
  type: "PHYSICAL",
});

export default function NewJourneyPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [stops, setStops] = useState<Stop[]>([emptyStop(), emptyStop()]);

  const addStop = () => {
    if (stops.length < 10) {
      setStops([...stops, emptyStop()]);
    }
  };

  const removeStop = (index: number) => {
    if (stops.length > 2) {
      setStops(stops.filter((_, i) => i !== index));
    }
  };

  const updateStop = (index: number, field: keyof Stop, value: string) => {
    const updated = [...stops];
    updated[index] = { ...updated[index], [field]: value };
    setStops(updated);
  };

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    formData.set("stops", JSON.stringify(stops));

    startTransition(async () => {
      const result = await createJourney(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Create New Journey
        </h1>

        <form action={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white dark:bg-primary/90 shadow-sm dark:shadow-secondary/20 rounded-lg p-6 space-y-6 border border-gray-200 dark:border-secondary/30">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Journey Details
            </h2>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-secondary/80 mb-1"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-secondary/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-highlight dark:focus:ring-secondary focus:border-highlight dark:focus:border-secondary bg-white dark:bg-primary/80 text-gray-900 dark:text-white"
                placeholder="Enter journey title"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-secondary/80 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-secondary/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-highlight dark:focus:ring-secondary focus:border-highlight dark:focus:border-secondary bg-white dark:bg-primary/80 text-gray-900 dark:text-white"
                placeholder="Describe your journey (optional)"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-primary/90 shadow-sm dark:shadow-secondary/20 rounded-lg p-6 space-y-6 border border-gray-200 dark:border-secondary/30">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Stops ({stops.length}/10)
              </h2>
              <button
                type="button"
                onClick={addStop}
                disabled={stops.length >= 10}
                className="px-4 py-2 text-sm font-medium text-highlight dark:text-secondary bg-highlight/10 dark:bg-secondary/20 rounded-lg hover:bg-highlight/20 dark:hover:bg-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                + Add Stop
              </button>
            </div>

            <div className="space-y-6">
              {stops.map((stop, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-secondary/30 rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-primary/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-secondary/60">
                      Stop {index + 1}
                    </span>
                    {stops.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeStop(index)}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-secondary/80 mb-1">
                      Stop Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={stop.title}
                      onChange={(e) =>
                        updateStop(index, "title", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-secondary/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-highlight dark:focus:ring-secondary focus:border-highlight dark:focus:border-secondary bg-white dark:bg-primary/80 text-gray-900 dark:text-white"
                      placeholder="Enter stop title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-secondary/80 mb-1">
                      Message
                    </label>
                    <textarea
                      value={stop.message}
                      onChange={(e) =>
                        updateStop(index, "message", e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-secondary/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-highlight dark:focus:ring-secondary focus:border-highlight dark:focus:border-secondary bg-white dark:bg-primary/80 text-gray-900 dark:text-white"
                      placeholder="Message to display at this stop (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-secondary/80 mb-1">
                      Type
                    </label>
                    <select
                      value={stop.type}
                      onChange={(e) =>
                        updateStop(
                          index,
                          "type",
                          e.target.value as "PHYSICAL" | "DIGITAL"
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-secondary/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-highlight dark:focus:ring-secondary focus:border-highlight dark:focus:border-secondary bg-white dark:bg-primary/80 text-gray-900 dark:text-white"
                    >
                      <option value="PHYSICAL">Physical Location</option>
                      <option value="DIGITAL">Digital (No Location)</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-3 bg-highlight dark:bg-secondary text-white font-medium rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-highlight dark:focus:ring-secondary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Creating..." : "Create Journey"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
