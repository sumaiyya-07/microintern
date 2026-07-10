"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { RegisterSchema } from "@/lib/validation/schemas";
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Mail, ShieldCheck, User } from "lucide-react";
import Link from "next/link";

export default function AdminSignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: any) => {
    setError("");
    setSuccess("");
    setLoading(true);

    const payload = {
      ...values,
      role: "admin",
    };

    // Client-side Zod validation
    const parsed = RegisterSchema.safeParse(payload);
    if (!parsed.success) {
      setError("Please fix the validation errors.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Registration failed");
      }

      setSuccess("Administrator account created successfully! Redirecting...");
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
            Register Administrator
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Create a restricted system administration account for managing the platform.
          </p>
        </div>

        <div className="bg-[#111827] border border-slate-800 shadow-modal rounded-2xl p-8 space-y-6">
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
                htmlFor="name"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User size={16} />
                </div>
                <input
                  id="name"
                  type="text"
                  placeholder="System Operator"
                  {...register("name", { required: "Name is required" })}
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-md border border-slate-800 bg-[#0f172a] text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all placeholder:text-slate-600"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
              )}
            </div>

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
                  placeholder="Min. 8 characters"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 8, message: "Password must be at least 8 characters" },
                  })}
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
                <span>Registering Admin...</span>
              ) : (
                <>
                  <span>Register Admin Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/admin/login"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Already have an admin account? Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
