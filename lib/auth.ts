import { createClient } from "@/lib/supabase";
import { db } from "@/lib/db";
import type { User } from "@supabase/supabase-js";

/**
 * Get the current user ID without requiring authentication.
 * Returns null if not authenticated.
 * Use this for optional auth scenarios (e.g., public pages with enhanced features for logged-in users).
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

/**
 * Get the full Supabase user object.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Ensure a User record exists in the database for the given Supabase auth user.
 * Creates the record if it doesn't exist (lazy sync pattern).
 *
 * This is called automatically by requireAuth(), but can be used standalone
 * if you need to ensure a user exists without throwing on missing auth.
 */
export async function ensureUser(user: User): Promise<void> {
  await db.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
    },
    update: {
      email: user.email!,
      name: user.user_metadata?.name || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
    },
  });
}

/**
 * Require authentication and ensure User record exists.
 * Throws an error if not authenticated.
 * Returns the user ID on success.
 *
 * Use this in server actions and pages that require authentication.
 */
export async function requireAuth(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Lazy sync: create User record if it doesn't exist
  await ensureUser(user);

  return user.id;
}
