"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";

export default function SignInPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "var(--font-inter)" }}>
      {/* Left hero panel */}
      <div
        className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "#f3f4f5" }}
      >
        {/* Dot grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #c8c9ca 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: 0.55,
          }}
        />

        {/* Top wordmark */}
        <div className="relative z-10">
          <span
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-manrope)", color: "#835500" }}
          >
            ConstructIQ
          </span>
        </div>

        {/* Center copy */}
        <div className="relative z-10 max-w-lg">
          <h1
            className="font-bold leading-[1.1] mb-5"
            style={{
              fontFamily: "var(--font-manrope)",
              fontSize: "3rem",
              color: "#191c1d",
            }}
          >
            Welcome back.
          </h1>
          <p className="text-lg leading-relaxed mb-12" style={{ color: "#524534" }}>
            Your projects, assets, and teams —<br />all in one place.
          </p>

          {/* Trust badges */}
          <div className="flex flex-col gap-4">
            {[
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                ),
                label: "500+ Active Projects",
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                ),
                label: "98% Platform Uptime",
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
                label: "SOC2 Compliant",
              },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
                  style={{ background: "rgba(131,85,0,0.08)", color: "#835500" }}
                >
                  {icon}
                </div>
                <span className="text-sm font-medium" style={{ color: "#191c1d" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom version tag */}
        <div className="relative z-10">
          <span className="text-xs" style={{ color: "#857462" }}>
            v2.0 · Blueprint Precision
          </span>
        </div>
      </div>

      {/* Right form panel */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: "#f8f9fa" }}
      >
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <span
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-manrope)", color: "#835500" }}
            >
              ConstructIQ
            </span>
          </div>

          {/* Card */}
          <div
            className="bg-white rounded-2xl px-8 py-10"
            style={{ boxShadow: "0 20px 40px rgba(25,28,29,0.06)" }}
          >
            {/* Icon mark */}
            <div className="flex justify-center mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #835500, #f5a623)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </div>
            </div>

            <h2
              className="text-center font-bold mb-1"
              style={{ fontFamily: "var(--font-manrope)", fontSize: "1.375rem", color: "#191c1d" }}
            >
              Sign in to your account
            </h2>
            <p className="text-center text-sm mb-8" style={{ color: "#857462" }}>
              Enter your credentials to continue
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: "#524534" }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="w-full bg-transparent text-sm py-2.5 outline-none transition-colors"
                  style={{
                    borderBottom: "1.5px solid #d7c3ae",
                    color: "#191c1d",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#835500")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#d7c3ae")}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className="block text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "#524534" }}
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium hover:underline"
                    style={{ color: "#835500" }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm py-2.5 pr-8 outline-none transition-colors"
                    style={{
                      borderBottom: "1.5px solid #d7c3ae",
                      color: "#191c1d",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#835500")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#d7c3ae")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1"
                    style={{ color: "#857462" }}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  className="text-xs px-3 py-2.5 rounded-lg"
                  style={{ background: "#ffdad6", color: "#93000a" }}
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-semibold py-3 rounded-lg text-sm transition-opacity disabled:opacity-50 mt-2"
                style={{
                  background: "linear-gradient(135deg, #835500, #f5a623)",
                  fontFamily: "var(--font-inter)",
                  letterSpacing: "0.02em",
                }}
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: "#edeeef" }} />
              <span className="text-xs" style={{ color: "#857462" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "#edeeef" }} />
            </div>

            {/* SSO button */}
            <button
              type="button"
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                border: "1.5px solid #d7c3ae",
                color: "#524534",
                background: "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f5")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Continue with SSO
            </button>

            <p className="text-center text-xs mt-6" style={{ color: "#857462" }}>
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="font-semibold hover:underline" style={{ color: "#835500" }}>
                Request access
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
