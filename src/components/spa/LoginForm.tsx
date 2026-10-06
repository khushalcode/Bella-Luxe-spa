"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  Sparkles,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  KeyRound,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";
import { Lotus } from "./Lotus";

type Mode = "sign-in" | "sign-up" | "forgot";

const ROLES = [
  { value: "receptionist", label: "Receptionist" },
  { value: "therapist", label: "Therapist" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
] as const;

/**
 * 3-mode login form (Sign In / Create Account / Forgot Password).
 *
 * Layout:
 *   - Left: editorial hero photo with brand overlay
 *   - Right: glass card with the active mode
 *
 * On every successful auth action we `router.refresh()` so the server
 * component re-evaluates `getServerUser()` and swaps to the dashboard.
 */
export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [busy, setBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const [email, setEmail] = useState("admin@bellaluxe.com");
  const [password, setPassword] = useState("BellaLuxe@2026");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]["value"]>("receptionist");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message || "Invalid email or password.");
        return;
      }
      toast.success("Welcome back to Bella Luxe Day Spa.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabaseBrowser.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });
      if (error) {
        toast.error(error.message || "Unable to create account.");
        return;
      }
      // If email confirmation is required (default Supabase setting),
      // `data.session` will be null and `data.user` will be populated.
      if (data?.session) {
        toast.success("Account created. Welcome to Bella Luxe Day Spa.");
        router.refresh();
      } else {
        toast.success("Account created. Check your inbox to confirm your email, then sign in.");
        setMode("sign-in");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      if (error) {
        toast.error(error.message || "Unable to send reset email.");
        return;
      }
      toast.success("Password reset link sent. Check your inbox.");
      setMode("sign-in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-stretch bg-[#FAF6F2]">
      {/* Editorial left pane */}
      <div className="relative hidden w-[46%] shrink-0 overflow-hidden lg:block">
        <Image
          src="/spa/hero-spa.jpg"
          alt="Bella Luxe Day Spa sanctuary"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D1B30]/70 via-[#3D1F2B]/55 to-[#5D2A3D]/70" />
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center gap-3">
              <Lotus className="h-9 w-12 text-[#F3D9DF]" strokeWidth={1.2} />
              <div>
                <div className="font-display text-3xl leading-none">Bella Luxe</div>
                <div className="text-[10.5px] font-medium uppercase tracking-[0.4em] text-white/85">
                  Day Spa
                </div>
              </div>
            </div>
            <p className="mt-7 max-w-[360px] font-display text-[28px] italic leading-[1.25] text-white/95">
              Wellness is a journey, not a destination.
            </p>
            <p className="mt-3 max-w-[360px] text-[13px] tracking-wide text-white/80">
              Relax <span className="mx-1.5 text-white/55">•</span> Rejuvenate{" "}
              <span className="mx-1.5 text-white/55">•</span> Be You
            </p>
          </div>

          <div className="space-y-3 text-[12px] text-white/75">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#D9708A]" />
              Memberships, plans &amp; staff — all in one calm dashboard.
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#D9708A]" />
              Role-based access for admins, managers, receptionists &amp; therapists.
            </div>
          </div>
        </div>
      </div>

      {/* Right pane — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-[440px]">
          {/* Mobile brand */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <Lotus className="h-9 w-12 text-[#D9708A]" strokeWidth={1.3} />
            <div className="font-display mt-2 text-[34px] leading-none text-[#2D1B30]">Bella Luxe</div>
            <div className="mt-1.5 text-[10.5px] font-medium uppercase tracking-[0.4em] text-[#7A6E66]">
              Day Spa
            </div>
          </div>

          <h1 className="font-display text-[30px] font-medium leading-tight text-[#2D1B30]">
            {mode === "sign-in" && "Welcome back"}
            {mode === "sign-up" && "Create your account"}
            {mode === "forgot" && "Reset your password"}
          </h1>
          <p className="mt-2 text-[13px] text-[#7A6E66]">
            {mode === "sign-in" && "Sign in to your Bella Luxe Day Spa dashboard."}
            {mode === "sign-up" && "New team members can join the CRM here."}
            {mode === "forgot" && "We'll email you a secure link to set a new password."}
          </p>

          {/* Mode tabs */}
          {mode !== "forgot" && (
            <div className="mt-6 inline-flex rounded-full bg-[#F3E6E1] p-1 text-[12.5px] font-medium text-[#5C4A52]">
              <button
                type="button"
                onClick={() => setMode("sign-in")}
                className={
                  "rounded-full px-4 py-1.5 transition-colors " +
                  (mode === "sign-in" ? "bg-white text-[#2D1B30] shadow-sm" : "hover:text-[#2D1B30]")
                }
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("sign-up")}
                className={
                  "rounded-full px-4 py-1.5 transition-colors " +
                  (mode === "sign-up" ? "bg-white text-[#2D1B30] shadow-sm" : "hover:text-[#2D1B30]")
                }
              >
                Create Account
              </button>
            </div>
          )}

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              if (mode === "sign-in") handleSignIn(e);
              else if (mode === "sign-up") handleSignUp(e);
              else handleForgot(e);
            }}
          >
            {mode === "sign-up" && (
              <Field label="Full name">
                <InputWrap icon={<UserIcon className="h-4 w-4" />}>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Priya Sharma"
                    className="form-input"
                    autoComplete="name"
                  />
                </InputWrap>
              </Field>
            )}

            <Field label="Email">
              <InputWrap icon={<Mail className="h-4 w-4" />}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@bellaluxe.com"
                  className="form-input"
                  autoComplete="email"
                />
              </InputWrap>
            </Field>

            {mode !== "forgot" && (
              <Field label="Password">
                <InputWrap icon={<Lock className="h-4 w-4" />}>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input pr-9"
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7A6E66] hover:text-[#2D1B30]"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </InputWrap>
              </Field>
            )}

            {mode === "sign-up" && (
              <>
                <Field label="Confirm password">
                  <InputWrap icon={<Lock className="h-4 w-4" />}>
                    <input
                      type={showPwd2 ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="form-input pr-9"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd2((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7A6E66] hover:text-[#2D1B30]"
                      aria-label={showPwd2 ? "Hide password" : "Show password"}
                    >
                      {showPwd2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </InputWrap>
                </Field>

                <Field label="Role">
                  <div className="relative">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as (typeof ROLES)[number]["value"])}
                      className="form-input appearance-none pr-9"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A6E66]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </Field>
              </>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8E4A63] via-[#7A3F56] to-[#5D2A3D] text-[14px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(110,40,70,0.5)] transition-all hover:shadow-[0_10px_26px_-6px_rgba(110,40,70,0.55)] disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "sign-in" && "Sign In"}
                  {mode === "sign-up" && "Create Account"}
                  {mode === "forgot" && "Send Reset Link"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-5 text-center text-[12.5px] text-[#7A6E66]">
            {mode === "sign-in" && (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setMode("sign-up")}
                  className="font-medium text-[#8E4A63] hover:underline"
                >
                  Need an account? Sign up
                </button>
                <span className="text-[#D9C2B0]">•</span>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="font-medium text-[#8E4A63] hover:underline inline-flex items-center gap-1"
                >
                  <KeyRound className="h-3 w-3" />
                  Forgot?
                </button>
              </div>
            )}
            {mode === "sign-up" && (
              <button
                type="button"
                onClick={() => setMode("sign-in")}
                className="font-medium text-[#8E4A63] hover:underline"
              >
                Already have an account? Sign in
              </button>
            )}
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("sign-in")}
                className="font-medium text-[#8E4A63] hover:underline"
              >
                Back to sign in
              </button>
            )}
          </div>

          {/* Default admin hint */}
          {mode === "sign-in" && (
            <div className="mt-7 rounded-xl border border-[#D9708A]/15 bg-white/70 px-4 py-3 text-[11.5px] text-[#7A6E66]">
              <div className="font-medium text-[#5C4A52]">Demo admin login</div>
              <div className="mt-1">
                <code className="rounded bg-[#F3EEEE] px-1.5 py-0.5 text-[#2D1B30]">admin@bellaluxe.com</code>
                {" / "}
                <code className="rounded bg-[#F3EEEE] px-1.5 py-0.5 text-[#2D1B30]">BellaLuxe@2026</code>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Local input styling — uses Bella Luxe palette */}
      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          height: 44px;
          padding-left: 2.5rem;
          padding-right: 0.875rem;
          border-radius: 12px;
          border: 1px solid rgba(217, 112, 138, 0.18);
          background: #ffffff;
          font-size: 13.5px;
          color: #1f2937;
          outline: none;
          transition: border-color 120ms ease, box-shadow 120ms ease;
        }
        :global(.form-input::placeholder) {
          color: #9a8e84;
        }
        :global(.form-input:focus) {
          border-color: rgba(142, 74, 99, 0.5);
          box-shadow: 0 0 0 3px rgba(142, 74, 99, 0.12);
        }
        :global(.form-input:hover) {
          border-color: rgba(142, 74, 99, 0.32);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-wider text-[#7A6E66]">
        {label}
      </span>
      {children}
    </label>
  );
}

function InputWrap({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A8E84]">{icon}</span>
      {children}
    </div>
  );
}
