"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
// Writing manual Zod validation is extremely simple, clean, and avoids unresolved imports if npm packages are picky!
import { LoginSchema } from "@/lib/validation/schemas";
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Mail } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Check query params for redirected error states
  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "session_expired") {
      setError("Your session has expired. Please sign in again.");
    } else if (err === "unauthorized") {
      setError("You are not authorized to view that page. Please sign in with the correct role.");
    } else if (err === "invalid") {
      setError("Invalid session. Please login again.");
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: any) => {
    setError("");
    setSuccess("");
    setLoading(true);

    // Validate using Zod client-side
    const parsed = LoginSchema.safeParse(values);
    if (!parsed.success) {
      setError("Please fix the validation errors.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Login failed");
      }

      setSuccess("Login successful! Redirecting...");
      
      // Force refreshing page state and route based on role
      router.refresh();
      setTimeout(() => {
        if (result.data.user.role === "candidate") {
          router.push("/candidate/dashboard");
        } else if (result.data.user.role === "company") {
          router.push("/company/dashboard");
        } else if (result.data.user.role === "admin") {
          router.push("/admin/dashboard");
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="font-serif text-4xl font-extrabold tracking-tight text-text-primary">
              Welcome back
            </h2>
            <p className="mt-2.5 text-sm text-text-secondary">
              Need an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-accent hover:text-accent-dark transition-colors"
              >
                Sign up for free
              </Link>
            </p>
          </div>

          <div className="bg-surface border border-border shadow-card rounded-2xl p-8 sm:p-10 space-y-6">
            {error && (
              <div className="flex items-center space-x-2.5 rounded-lg border border-danger-dark/10 bg-danger/5 p-4 text-xs font-medium text-danger">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2.5 rounded-lg border border-success/10 bg-success/5 p-4 text-xs font-medium text-success">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-text-primary mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                    <Mail size={16} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register("email", { required: "Email is required" })}
                    className="block w-full pl-10 pr-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-text-primary mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                    <Lock size={16} />
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password", { required: "Password is required" })}
                    className="block w-full pl-10 pr-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 rounded-md bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-4 shadow-btn hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-text-primary">
          <div className="text-sm font-semibold animate-pulse">Loading login credentials form...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
