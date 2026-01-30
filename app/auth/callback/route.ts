import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/journeys";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Eager user sync: Create/update user record in database
      try {
        await db.user.upsert({
          where: { id: data.user.id },
          update: {
            email: data.user.email!,
            name: data.user.user_metadata?.name || null,
            avatarUrl: data.user.user_metadata?.avatar_url || null,
          },
          create: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || null,
            avatarUrl: data.user.user_metadata?.avatar_url || null,
          },
        });
      } catch (dbError) {
        console.error("Failed to sync user:", dbError);
        // Continue - lazy sync will handle it
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
