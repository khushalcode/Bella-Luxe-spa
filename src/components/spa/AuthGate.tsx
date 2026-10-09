"use client";

import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { LoginScreen } from "./LoginScreen";

/**
 * Auth Gate — shows the LoginScreen if the user is not authenticated,
 * or the children (the full CRM dashboard) if they are.
 *
 * While the auth state is being checked (initial load), shows a centered
 * loading spinner with the spa branding.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at 18% 22%, rgba(217,112,138,0.18), transparent 42%), radial-gradient(circle at 82% 68%, rgba(201,168,106,0.16), transparent 46%), linear-gradient(180deg, #F8F1E9 0%, #F1E4DE 50%, #E8D5CE 100%)",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#D9708A]" />
          <p className="text-[13px] text-[#7A6E66]">Loading your spa dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
