"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { User, Mail, ClipboardList, FileText, Building, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: "candidate" | "company" | "admin";
  bio?: string;
  skills?: string[];
  companyName?: string;
  companyDescription?: string;
}

export default function EditProfileForm({ initialUser }: { initialUser: UserProfile }) {
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
      name: initialUser.name,
      bio: initialUser.bio || "",
      skills: initialUser.skills ? initialUser.skills.join(", ") : "",
      companyName: initialUser.companyName || "",
      companyDescription: initialUser.companyDescription || "",
    },
  });

  const onSubmit = async (values: any) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      setSuccess("Profile details updated successfully!");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-surface border border-border shadow-card rounded-2xl p-8 space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-border pb-4">
        <h2 className="font-serif text-2xl font-bold text-text-primary">Edit Account Settings</h2>
        <p className="text-xs text-text-secondary mt-1">
          Update your public profile information and system credentials below.
        </p>
      </div>

      {error && (
        <div className="flex items-center space-x-2.5 rounded-lg border border-danger/10 bg-danger/5 p-4 text-xs font-medium text-danger">
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
        {/* Email - Readonly */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1.5">
            Registered Email (cannot be changed)
          </label>
          <div className="relative opacity-60">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
              <Mail size={15} />
            </div>
            <input
              type="text"
              value={initialUser.email}
              disabled
              className="block w-full pl-9 pr-3.5 py-2.5 rounded-md border border-border bg-background text-sm text-text-secondary cursor-not-allowed"
            />
          </div>
        </div>

        {/* Full Name / Representative Name */}
        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-text-primary mb-1.5">
            {initialUser.role === "company" ? "Contact Representative" : "Full Name"}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
              <User size={15} />
            </div>
            <input
              id="name"
              type="text"
              placeholder="Full Name"
              {...register("name", { required: "Name is required" })}
              className="block w-full pl-9 pr-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
            />
          </div>
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
        </div>

        {/* Candidate only fields */}
        {initialUser.role === "candidate" && (
          <>
            <div>
              <label htmlFor="skills" className="block text-xs font-semibold text-text-primary mb-1.5">
                Developer Skills (Comma separated list)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                  <ClipboardList size={15} />
                </div>
                <input
                  id="skills"
                  type="text"
                  placeholder="React, Next.js, Node.js"
                  {...register("skills")}
                  className="block w-full pl-9 pr-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-xs font-semibold text-text-primary mb-1.5">
                Bio / Background Summary
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start pointer-events-none text-text-secondary">
                  <FileText size={15} />
                </div>
                <textarea
                  id="bio"
                  rows={4}
                  placeholder="Write a brief intro..."
                  {...register("bio")}
                  className="block w-full pl-9 pr-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all resize-none"
                />
              </div>
            </div>
          </>
        )}

        {/* Company only fields */}
        {initialUser.role === "company" && (
          <>
            <div>
              <label htmlFor="companyName" className="block text-xs font-semibold text-text-primary mb-1.5">
                Registered Company Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                  <Building size={15} />
                </div>
                <input
                  id="companyName"
                  type="text"
                  placeholder="Company Name"
                  {...register("companyName", { required: "Company Name is required" })}
                  className="block w-full pl-9 pr-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                />
              </div>
              {errors.companyName && <p className="mt-1 text-xs text-danger">{errors.companyName.message}</p>}
            </div>

            <div>
              <label htmlFor="companyDescription" className="block text-xs font-semibold text-text-primary mb-1.5">
                Company Description / Headline
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start pointer-events-none text-text-secondary">
                  <FileText size={15} />
                </div>
                <textarea
                  id="companyDescription"
                  rows={4}
                  placeholder="What does your company do?"
                  {...register("companyDescription")}
                  className="block w-full pl-9 pr-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all resize-none"
                />
              </div>
            </div>
          </>
        )}

        {/* Save button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 rounded-md bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-4 shadow-btn hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer text-sm"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          <span>{loading ? "Saving Changes..." : "Save Profile Details"}</span>
        </button>
      </form>
    </div>
  );
}
