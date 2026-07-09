"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { RegisterSchema } from "@/lib/validation/schemas";
import { AlertCircle, ArrowRight, CheckCircle2, User, Building, Mail, Lock, FileText, ClipboardList } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<"candidate" | "company">("candidate");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      bio: "",
      skills: "",
      companyName: "",
      companyDescription: "",
    },
  });

  const handleRoleToggle = (selectedRole: "candidate" | "company") => {
    setRole(selectedRole);
    setError("");
    reset(); // Clear inputs on switch
  };

  const onSubmit = async (values: any) => {
    setError("");
    setSuccess("");
    setLoading(true);

    const payload = {
      ...values,
      role,
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

      setSuccess("Account created successfully! Logging in...");
      router.refresh();
      
      setTimeout(() => {
        if (role === "candidate") {
          router.push("/candidate/dashboard");
        } else {
          router.push("/company/dashboard");
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
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center">
            <h2 className="font-serif text-4xl font-extrabold tracking-tight text-text-primary">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-accent hover:text-accent-dark transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <div className="bg-surface border border-border shadow-card rounded-2xl p-8 sm:p-10 space-y-6">
            {/* Role selection tab */}
            <div className="grid grid-cols-2 gap-2.5 p-1 bg-background rounded-lg border border-border">
              <button
                type="button"
                onClick={() => handleRoleToggle("candidate")}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  role === "candidate"
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <User size={14} />
                <span>Candidate</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleToggle("company")}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  role === "company"
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Building size={14} />
                <span>Company</span>
              </button>
            </div>

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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    {role === "candidate" ? "Full Name" : "Contact Name"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                      <User size={14} />
                    </div>
                    <input
                      id="name"
                      type="text"
                      placeholder={role === "candidate" ? "John Doe" : "Jane Smith"}
                      {...register("name", { required: "Name is required" })}
                      className="block w-full pl-9 pr-3 py-2 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-text-primary mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                      <Mail size={14} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      {...register("email", { required: "Email is required" })}
                      className="block w-full pl-9 pr-3 py-2 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-text-primary mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                    <Lock size={14} />
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Password must be at least 8 characters" },
                    })}
                    className="block w-full pl-9 pr-3 py-2 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
                )}
              </div>

              {role === "candidate" ? (
                <>
                  <div>
                    <label
                      htmlFor="skills"
                      className="block text-xs font-semibold text-text-primary mb-1"
                    >
                      Skills (Comma separated list)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                        <ClipboardList size={14} />
                      </div>
                      <input
                        id="skills"
                        type="text"
                        placeholder="React, CSS, Node.js, UI Design"
                        {...register("skills")}
                        className="block w-full pl-9 pr-3 py-2 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="bio"
                      className="block text-xs font-semibold text-text-primary mb-1"
                    >
                      Bio / Summary
                    </label>
                    <div className="relative">
                      <div className="absolute top-2.5 left-3 flex items-start pointer-events-none text-text-secondary">
                        <FileText size={14} />
                      </div>
                      <textarea
                        id="bio"
                        rows={3}
                        placeholder="Tell companies a little about yourself and your background..."
                        {...register("bio")}
                        className="block w-full pl-9 pr-3 py-2 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all resize-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="companyName"
                      className="block text-xs font-semibold text-text-primary mb-1"
                    >
                      Company Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                        <Building size={14} />
                      </div>
                      <input
                        id="companyName"
                        type="text"
                        placeholder="PixelForge Studio"
                        {...register("companyName", { required: "Company Name is required" })}
                        className="block w-full pl-9 pr-3 py-2 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                      />
                    </div>
                    {errors.companyName && (
                      <p className="mt-1 text-xs text-danger">{errors.companyName.message}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="companyDescription"
                      className="block text-xs font-semibold text-text-primary mb-1"
                    >
                      Company Description
                    </label>
                    <div className="relative">
                      <div className="absolute top-2.5 left-3 flex items-start pointer-events-none text-text-secondary">
                        <FileText size={14} />
                      </div>
                      <textarea
                        id="companyDescription"
                        rows={3}
                        placeholder="What does your company do?"
                        {...register("companyDescription")}
                        className="block w-full pl-9 pr-3 py-2 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all resize-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 rounded-md bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-4 shadow-btn hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer pt-3"
              >
                {loading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <span>Create Account</span>
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
