"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { TaskCreateSchema } from "@/lib/validation/schemas";
import { AlertCircle, ArrowLeft, Calendar, FileText, Gift, LayoutGrid, Type } from "lucide-react";
import Link from "next/link";

export default function NewTaskPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      category: "Software Development",
      deadline: "",
      rewardText: "",
    },
  });

  const onSubmit = async (values: any) => {
    setError("");
    setLoading(true);

    // Client-side Zod validation
    const parsed = TaskCreateSchema.safeParse(values);
    if (!parsed.success) {
      setError("Please fix the validation errors.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to create task");
      }

      router.push("/company/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="container-custom py-12 max-w-3xl">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/company/dashboard"
          className="flex items-center space-x-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="text-left mb-8">
        <h1 className="font-serif text-4xl font-extrabold tracking-tight text-text-primary">
          Create a Micro-Task
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Post an actionable task. Candidates will submit proof-of-work to apply.
        </p>
      </div>

      <div className="bg-surface border border-border shadow-card rounded-2xl p-8 space-y-6">
        {error && (
          <div className="flex items-center space-x-2.5 rounded-lg border border-danger-dark/10 bg-danger/5 p-4 text-xs font-medium text-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-xs font-semibold text-text-primary mb-1.5"
            >
              Task Title
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                <Type size={16} />
              </div>
              <input
                id="title"
                type="text"
                placeholder="e.g. Design a Figma landing page mockup for SaaS"
                {...register("title", { required: "Title is required" })}
                className="block w-full pl-10 pr-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
              />
            </div>
            {errors.title && (
              <p className="mt-1 text-xs text-danger">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category"
                className="block text-xs font-semibold text-text-primary mb-1.5"
              >
                Category
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                  <LayoutGrid size={16} />
                </div>
                <select
                  id="category"
                  {...register("category", { required: "Category is required" })}
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                >
                  <option value="Software Development">Software Development</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Data & Analytics">Data & Analytics</option>
                  <option value="Content & Writing">Content & Writing</option>
                  <option value="Marketing & Growth">Marketing & Growth</option>
                </select>
              </div>
              {errors.category && (
                <p className="mt-1 text-xs text-danger">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="deadline"
                className="block text-xs font-semibold text-text-primary mb-1.5"
              >
                Submission Deadline
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                  <Calendar size={16} />
                </div>
                <input
                  id="deadline"
                  type="datetime-local"
                  {...register("deadline", { required: "Deadline is required" })}
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                />
              </div>
              {errors.deadline && (
                <p className="mt-1 text-xs text-danger">{errors.deadline.message}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="rewardText"
              className="block text-xs font-semibold text-text-primary mb-1.5"
            >
              Reward / Stipend (Optional display text)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                <Gift size={16} />
              </div>
              <input
                id="rewardText"
                type="text"
                placeholder="e.g. $250 stipend or contract role offer"
                {...register("rewardText")}
                className="block w-full pl-10 pr-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
              />
            </div>
            {errors.rewardText && (
              <p className="mt-1 text-xs text-danger">{errors.rewardText.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-xs font-semibold text-text-primary mb-1.5"
            >
              Task Description & Submission Instructions
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 flex items-start pointer-events-none text-text-secondary">
                <FileText size={16} />
              </div>
              <textarea
                id="description"
                rows={8}
                placeholder="Describe the task parameters, requirements, and what candidates need to submit to verify their skill..."
                {...register("description", { required: "Description is required" })}
                className="block w-full pl-10 pr-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all resize-y"
              />
            </div>
            {errors.description && (
              <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 rounded-md bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-4 shadow-btn hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {loading ? <span>Creating Task...</span> : <span>Publish Task</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
