"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const supabase = createBrowserClient();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="bg-white dark:bg-primary border-b border-gray-200 dark:border-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Quest<span className="text-highlight dark:text-secondary">Path</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/journeys"
              className="text-gray-700 dark:text-secondary/80 hover:text-highlight dark:hover:text-secondary transition-colors"
            >
              My Journeys
            </Link>
            <Link
              href="/journeys/new"
              className="text-gray-700 dark:text-secondary/80 hover:text-highlight dark:hover:text-secondary transition-colors"
            >
              Create
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-secondary/60">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white bg-gray-100 dark:bg-primary/80 hover:bg-gray-200 dark:hover:bg-secondary/10 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-highlight dark:bg-secondary hover:bg-opacity-90 rounded-lg transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-secondary/10"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-secondary/20">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/journeys"
              className="block px-4 py-2 text-gray-700 dark:text-secondary/80 hover:bg-gray-100 dark:hover:bg-secondary/10 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              My Journeys
            </Link>
            <Link
              href="/journeys/new"
              className="block px-4 py-2 text-gray-700 dark:text-secondary/80 hover:bg-gray-100 dark:hover:bg-secondary/10 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Create
            </Link>

            {user ? (
              <>
                <div className="px-4 py-2 text-sm text-gray-600 dark:text-secondary/60 border-t border-gray-200 dark:border-secondary/20 pt-3">
                  {user.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-gray-700 dark:text-white bg-gray-100 dark:bg-primary/80 hover:bg-gray-200 dark:hover:bg-secondary/10 rounded-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block px-4 py-2 text-center text-white bg-highlight dark:bg-secondary hover:bg-opacity-90 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
