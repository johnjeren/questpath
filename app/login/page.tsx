import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { LoginForm } from "./login-form";

interface PageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { redirectTo } = await searchParams;

  // Check if already logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect(redirectTo || "/journeys");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            QuestPath
          </h1>
          <p className="mt-2 text-gray-600 dark:text-secondary/80">
            Sign in to create and manage your journeys
          </p>
        </div>

        <div className="bg-white dark:bg-primary/90 rounded-xl shadow-lg dark:shadow-secondary/20 p-8 border border-gray-200 dark:border-secondary/30">
          <LoginForm redirectTo={redirectTo} />
        </div>
      </div>
    </div>
  );
}
