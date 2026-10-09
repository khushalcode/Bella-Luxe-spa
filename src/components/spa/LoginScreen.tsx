"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/**
 * Login Screen — Bella Luxe Day Spa
 *
 * Beautiful login form that matches the spa's rose/pink branding and uses
 * the custom logo. Validates against the Supabase admin user (or any user
 * created via Supabase Auth).
 *
 * Default admin credentials (auto-created by bella-luxe-spa-complete.sql):
 *   Email:    admin@bellaluxe.com
 *   Password: BellaLuxe@2026
 */
export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill with the default admin credentials so the user can log in
  // with a single click on first run.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("bella-luxe-login-prefill") : null
    if (saved === "true") {
      setEmail(localStorage.getItem("bella-luxe-login-email") ?? "admin@bellaluxe.com")
      setPassword(localStorage.getItem("bella-luxe-login-password") ?? "BellaLuxe@2026")
    } else {
      setEmail("admin@bellaluxe.com")
      setPassword("BellaLuxe@2026")
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await signIn(email.trim(), password)
      if (result.error) {
        setError(result.error)
      }
      // On success, the useAuth hook updates and AuthGate will swap to the dashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden p-4"
      style={{
        background:
          "radial-gradient(circle at 18% 22%, rgba(217,112,138,0.18), transparent 42%), radial-gradient(circle at 82% 68%, rgba(201,168,106,0.16), transparent 46%), linear-gradient(180deg, #F8F1E9 0%, #F1E4DE 50%, #E8D5CE 100%)",
      }}
    >
      {/* Floating decorative circles */}
      <div className="pointer-events-none absolute left-8 top-8 h-32 w-32 rounded-full bg-[#FBE4E2]/40 blur-3xl" />
      <div className="pointer-events-none absolute right-8 top-20 h-40 w-40 rounded-full bg-[#DDF3E8]/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-8 left-1/3 h-48 w-48 rounded-full bg-[#FCE8CF]/30 blur-3xl" />

      {/* Login card */}
      <div className="relative w-full max-w-md">
        <div className="glass-card rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_24px_64px_rgba(61,31,43,0.18)] backdrop-blur-md">
          {/* Logo + brand */}
          <div className="flex flex-col items-center gap-3 text-center">
            <Image
              src="/logo.png"
              alt="Bella Luxe Day Spa logo"
              width={80}
              height={80}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-[0_8px_28px_rgba(217,112,138,0.45)]"
              priority
            />
            <div>
              <h1 className="font-display text-[32px] font-semibold leading-none tracking-tight text-[#3D1F2B]">
                Bella Luxe
              </h1>
              <div className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.42em] text-[#7A6E66]">
                Day Spa
              </div>
            </div>
            <p className="text-[13px] text-[#6B6570]">
              Sign in to your CRM dashboard
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[12px] font-medium text-[#3D1F2B]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A8E84]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bellaluxe.com"
                  required
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-[#D9708A]/20 bg-white/95 pl-11 pr-4 text-[14px] text-[#1F2937] shadow-sm outline-none transition-all placeholder:text-[#9A8E84] focus:border-[#D9708A] focus:ring-2 focus:ring-[#D9708A]/15"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[12px] font-medium text-[#3D1F2B]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A8E84]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-[#D9708A]/20 bg-white/95 pl-11 pr-12 text-[14px] text-[#1F2937] shadow-sm outline-none transition-all placeholder:text-[#9A8E84] focus:border-[#D9708A] focus:ring-2 focus:ring-[#D9708A]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8E84] transition-colors hover:text-[#3D1F2B]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-[#EF4444]/30 bg-[#FBDDE0]/40 px-3 py-2.5 text-[12.5px] text-[#A11A2D]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D9708A] to-[#B8456A] text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(190,70,110,0.35)] transition-all hover:from-[#B8456A] hover:to-[#8E3454] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-5 rounded-xl border border-[#D9708A]/15 bg-[#FBE4E2]/40 px-4 py-3 text-[11.5px] text-[#7A6E66]">
            <div className="font-semibold text-[#3D1F2B]">Demo Admin Credentials</div>
            <div className="mt-1 space-y-0.5">
              <div>
                Email: <span className="font-mono text-[#3D1F2B]">admin@bellaluxe.com</span>
              </div>
              <div>
                Password: <span className="font-mono text-[#3D1F2B]">BellaLuxe@2026</span>
              </div>
            </div>
            <div className="mt-2 text-[10.5px] text-[#9A8E84]">
              Pre-filled above — just click "Sign In" to log in.
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[10.5px] text-[#9A8E84]">
            <span className="h-px w-12 bg-[#9A8E84]/40" />
            <span className="uppercase tracking-[0.3em]">Relax • Rejuvenate • Be You</span>
            <span className="h-px w-12 bg-[#9A8E84]/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
