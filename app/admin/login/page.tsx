"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { LoginSchema } from "@/lib/validation/schemas";
import { AlertTriangle, AlertCircle, ArrowRight, CheckCircle2, Lock, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "session_expired") {
      setError("Admin session expired. Please authenticate again.");
    } else if (err === "unauthorized") {
      setError("Access denied: You must be an administrator to access that resource.");
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

      if (result.data.user.role !== "admin") {
        // Logout if they logged in with non-admin role in admin panel
        await fetch("/api/auth/logout", { method: "POST" });
        throw new Error("Access Denied: You do not possess administrator credentials.");
      }

      setSuccess("Administrator authenticated successfully! Redirecting...");
      router.refresh();
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#0a0f1d] text-slate-100">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-950/40 border border-red-500/20 flex items-center justify-center text-red-500">
            <ShieldCheck size={26} />
          </div>
          <h2 className="font-serif text-3xl font-extrabold tracking-tight text-slate-100">
            System Administration
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Restricted access portal for MicroIntern administrative and moderation tasks.
          </p>
        </div>

        <div className="bg-[#111827] border border-slate-800 shadow-modal rounded-2xl p-8 space-y-6">
          {/* Admin panel notice */}
          <div className="flex items-start space-x-2.5 rounded-lg border border-yellow-500/10 bg-yellow-500/5 p-3 text-[11px] font-medium text-yellow-500">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>
              Authorized personnel only. All access, modifications, and activities are logged.
            </span>
          </div>

          {error && (
            <div className="flex items-center space-x-2.5 rounded-lg border border-red-500/10 bg-red-500/5 p-3.5 text-xs font-medium text-red-400">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2.5 rounded-lg border border-green-500/10 bg-green-500/5 p-3.5 text-xs font-medium text-green-400">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@microintern.com"
                  {...register("email", { required: "Email is required" })}
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-md border border-slate-800 bg-[#0f172a] text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all placeholder:text-slate-600"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password", { required: "Password is required" })}
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-md border border-slate-800 bg-[#0f172a] text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all placeholder:text-slate-600"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer border border-red-500/10"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Return to Candidate/Company Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#0a0f1d] text-slate-100">
          <div className="text-xs text-slate-400 animate-pulse">Loading administrative forms...</div>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
