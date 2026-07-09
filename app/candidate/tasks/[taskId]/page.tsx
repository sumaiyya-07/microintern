"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { SubmissionCreateSchema } from "@/lib/validation/schemas";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Gift,
  LayoutGrid,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Building,
  Star,
} from "lucide-react";
import { STATUS_COLOR_MAP } from "@/lib/constants/statusColors";

interface CompanyInfo {
  name: string;
  companyName: string;
  companyDescription?: string;
}

interface TaskDetail {
  _id: string;
  companyId: CompanyInfo;
  title: string;
  description: string;
  category: string;
  deadline: string;
  rewardText?: string;
  status: string;
  isActive: boolean;
}

interface Review {
  _id: string;
  comment: string;
  rating: number;
  isAiGenerated: boolean;
}

interface Submission {
  _id: string;
  textAnswer: string;
  link?: string;
  fileUrl?: string;
  submittedAt: string;
  review?: Review | null;
  aiReview?: Review | null;
}

interface Application {
  _id: string;
  taskId: any;
  candidateId: string;
  status: keyof typeof STATUS_COLOR_MAP;
  appliedAt: string;
  submission: Submission | null;
}

export default function CandidateTaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  const router = useRouter();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      textAnswer: "",
      link: "",
      fileUrl: "",
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch task detail
      const taskRes = await fetch(`/api/tasks/${taskId}`);
      const taskResult = await taskRes.json();
      if (!taskRes.ok) throw new Error(taskResult.error || "Failed to load task");
      setTask(taskResult.data);

      // Fetch candidate applications to check if applied to this task
      const appsRes = await fetch("/api/applications");
      const appsResult = await appsRes.json();
      if (!appsRes.ok) throw new Error(appsResult.error || "Failed to load applications");

      const match = appsResult.data.find(
        (app: any) => app.taskId._id.toString() === taskId
      );
      
      if (match) {
        setApplication(match);
        if (match.submission) {
          reset({
            textAnswer: match.submission.textAnswer,
            link: match.submission.link || "",
            fileUrl: match.submission.fileUrl || "",
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [taskId]);

  // Countdown clock effect
  useEffect(() => {
    if (!task) return;

    const interval = setInterval(() => {
      const diff = new Date(task.deadline).getTime() - new Date().getTime();
      
      if (diff <= 0) {
        setTimeLeft("Deadline passed");
        setIsExpired(true);
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      let str = "";
      if (days > 0) str += `${days}d `;
      if (hours > 0 || days > 0) str += `${hours}h `;
      str += `${minutes}m ${seconds}s`;
      
      setTimeLeft(str);
      setIsExpired(false);
    }, 1000);

    return () => clearInterval(interval);
  }, [task]);

  // Apply to Task
  const handleApply = async () => {
    if (!task) return;
    setActionLoading(true);
    setError("");

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task._id }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to apply");
      }

      setSuccessMsg("Successfully applied! Now you can submit your work below.");
      setApplication({
        ...result.data,
        submission: null,
      });
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to apply.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Work Form
  const onSubmitWork = async (values: any) => {
    if (!application || isExpired) return;
    setActionLoading(true);
    setError("");
    setSuccessMsg("");

    const payload = {
      applicationId: application._id,
      textAnswer: values.textAnswer,
      link: values.link,
      fileUrl: values.fileUrl,
    };

    // Client-side Zod validation
    const parsed = SubmissionCreateSchema.safeParse(payload);
    if (!parsed.success) {
      const errMsgs = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      setError(`Validation failed: ${errMsgs}`);
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to submit work");
      }

      setSuccessMsg("Work submitted successfully! You can edit this until the deadline passes.");
      setApplication((prev) =>
        prev
          ? {
              ...prev,
              submission: result.data,
            }
          : null
      );
      reset({
        textAnswer: result.data.textAnswer,
        link: result.data.link || "",
        fileUrl: result.data.fileUrl || "",
      });
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit work.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-10 space-y-6 animate-pulse">
        <div className="h-4 w-32 bg-border rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-10 w-96 bg-border rounded" />
            <div className="h-4 w-48 bg-border/60 rounded" />
            <div className="h-40 bg-surface border border-border rounded-xl" />
          </div>
          <div className="h-64 bg-surface border border-border rounded-xl" />
        </div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="container-custom py-16 text-center max-w-md mx-auto space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
          <AlertCircle size={22} />
        </div>
        <h2 className="font-serif text-2xl font-bold text-text-primary">Error loading task</h2>
        <p className="text-sm text-text-secondary">{error}</p>
        <div className="pt-2">
          <Link
            href="/candidate/tasks"
            className="rounded-md bg-primary text-white font-semibold py-2 px-4 shadow-btn text-xs animate-pulse"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  if (!task) return null;

  const statusColor = application ? STATUS_COLOR_MAP[application.status] : null;

  return (
    <div className="container-custom py-10 space-y-8">
      {/* Back link */}
      <div>
        <Link
          href="/candidate/tasks"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Browse Tasks</span>
        </Link>
      </div>

      {successMsg && (
        <div className="flex items-center space-x-2.5 rounded-lg border border-success/15 bg-success/5 p-4 text-xs font-medium text-success">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2.5 rounded-lg border border-danger-dark/15 bg-danger/5 p-4 text-xs font-medium text-danger">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-2xl shadow-card p-6 md:p-8 space-y-6">
            {/* Header info */}
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/25">
                  {task.category}
                </span>
                {application && statusColor && (
                  <span
                    style={{
                      backgroundColor: statusColor.bg,
                      color: statusColor.text,
                      borderColor: statusColor.border,
                    }}
                    className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border"
                  >
                    Status: {application.status}
                  </span>
                )}
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">
                {task.title}
              </h1>
            </div>

            {/* Task Description */}
            <div className="border-t border-border pt-6 space-y-2.5">
              <h3 className="text-xs font-bold text-text-secondary uppercase">Task Specifications</h3>
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
                {task.description}
              </p>
            </div>
          </div>

          {/* Submission Form Block */}
          {application && (
            <>
              {application.submission && !isEditing ? (
                /* 1. Submitted details summary view (Closure screen) */
                <div className="bg-surface border border-border rounded-2xl shadow-card p-6 md:p-8 space-y-6 animate-in fade-in duration-200">
                  {/* Status & Results Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background/40 border border-border rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 size={24} className="text-success shrink-0" />
                      <div>
                        <h3 className="font-serif text-base font-bold text-text-primary">Submission Recorded</h3>
                        <p className="text-[11px] text-text-secondary">
                          Your proof-of-work was received on {new Date(application.submission.submittedAt).toLocaleDateString()}.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-text-secondary font-semibold">Application Status:</span>
                      <span
                        style={{
                          backgroundColor: STATUS_COLOR_MAP[application.status].bg,
                          color: STATUS_COLOR_MAP[application.status].text,
                          borderColor: STATUS_COLOR_MAP[application.status].border,
                        }}
                        className="text-xs font-bold px-3 py-1.5 rounded-md border capitalize"
                      >
                        {application.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border-b border-border pb-2 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-text-secondary uppercase">Your Submission</h4>
                      <span className="text-[10px] text-text-secondary">
                        Submitted: {new Date(application.submission.submittedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-text-secondary">Solution Text / Answer Description:</p>
                      <div className="bg-background/50 rounded-lg p-4 border border-border text-sm text-text-primary leading-relaxed whitespace-pre-line font-sans">
                        {application.submission.textAnswer}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {application.submission.link && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-text-secondary">Solution URL Link:</p>
                          <a
                            href={application.submission.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-secondary dark:text-blue-400 font-semibold hover:underline bg-background/50 px-3 py-2 rounded-md border border-border w-full"
                          >
                            <span className="truncate">Open Submission Link</span>
                            <ExternalLink size={12} className="shrink-0" />
                          </a>
                        </div>
                      )}
                      {application.submission.fileUrl && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-text-secondary">Attached File / URL Reference:</p>
                          <div className="inline-flex items-center gap-1.5 text-xs text-text-primary bg-background/50 px-3 py-2 rounded-md border border-border w-full">
                            <FileText size={12} className="text-accent shrink-0" />
                            <span className="truncate">{application.submission.fileUrl}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Feedback & Scores Section */}
                    {(application.submission.review || application.submission.aiReview) && (
                      <div className="border-t border-border/60 pt-4 space-y-4">
                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Evaluation & Feedback</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {application.submission.review && (
                            <div className="bg-background/30 border border-border rounded-xl p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-secondary uppercase">
                                  Company Evaluation
                                </span>
                                <div className="flex items-center gap-0.5 text-accent">
                                  {[...Array(5)].map((_, idx) => (
                                    <Star
                                      key={idx}
                                      size={12}
                                      fill={
                                        idx < (application.submission?.review?.rating || 0)
                                          ? "currentColor"
                                          : "none"
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-text-primary leading-relaxed font-serif italic">
                                "{application.submission.review.comment}"
                              </p>
                            </div>
                          )}

                          {application.submission.aiReview && (
                            <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 text-[10px] font-bold text-accent uppercase">
                                  <Sparkles size={12} />
                                  AI Analysis
                                </span>
                                <div className="flex items-center gap-0.5 text-accent">
                                  {[...Array(5)].map((_, idx) => (
                                    <Star
                                      key={idx}
                                      size={12}
                                      fill={
                                        idx < (application.submission?.aiReview?.rating || 0)
                                          ? "currentColor"
                                          : "none"
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-text-primary leading-relaxed">
                                "{application.submission.aiReview.comment}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {!isExpired && (
                      <div className="pt-4 border-t border-border/60">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center space-x-2 rounded-md border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary hover:bg-background transition-all shadow-sm cursor-pointer"
                        >
                          <span>Edit Submission</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* 2. Input/Update Form Block */
                <div className="bg-surface border border-border rounded-2xl shadow-card p-6 md:p-8 space-y-6">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-text-primary">
                      {application.submission ? "Edit Your Submission" : "Submit Your Proof-of-Work"}
                    </h2>
                    <p className="text-xs text-text-secondary mt-1">
                      Deliver your solution before the deadline. You can edit this submission anytime before it closes.
                    </p>
                  </div>

                  {isExpired ? (
                    <div className="flex items-center space-x-2.5 rounded-lg border border-warning/15 bg-warning/5 p-4 text-xs font-medium text-warning">
                      <Clock size={16} />
                      <span>The deadline for this task has passed. Submissions and updates are closed.</span>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSubmit(
                        onSubmitWork,
                        (errs) => {
                          console.log("Form Validation Errors:", errs);
                          const errMsgs = Object.values(errs)
                            .map((e: any) => e?.message)
                            .filter(Boolean)
                            .join(", ");
                          setError(`Please correct the form errors: ${errMsgs || "Invalid inputs"}`);
                        }
                      )}
                      className="space-y-5"
                    >
                      <div>
                        <label
                          htmlFor="textAnswer"
                          className="block text-xs font-semibold text-text-primary mb-1.5"
                        >
                          Solution Text / Answer Description
                        </label>
                        <div className="relative">
                          <div className="absolute top-3 left-3 flex items-start pointer-events-none text-text-secondary">
                            <FileText size={16} />
                          </div>
                          <textarea
                            id="textAnswer"
                            rows={6}
                            placeholder="Explain your approach, implementation, or solution steps clearly..."
                            {...register("textAnswer", {
                              required: "Description of your solution is required",
                              minLength: { value: 20, message: "Please enter at least 20 characters" },
                            })}
                            className="block w-full pl-10 pr-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all resize-y"
                          />
                        </div>
                        {errors.textAnswer && (
                          <p className="mt-1 text-xs text-danger">{errors.textAnswer.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="link"
                            className="block text-xs font-semibold text-text-primary mb-1.5"
                          >
                            Solution URL Link (Github, Figma, etc.)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                              <ExternalLink size={16} />
                            </div>
                            <input
                              id="link"
                              type="text"
                              placeholder="https://github.com/..."
                              {...register("link", { required: "Link is required" })}
                              className="block w-full pl-10 pr-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                            />
                          </div>
                          {errors.link && (
                            <p className="mt-1 text-xs text-danger">{errors.link.message}</p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="fileUrl"
                            className="block text-xs font-semibold text-text-primary mb-1.5"
                          >
                            Mock File Attachment URL (e.g. static/uploads/...)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                              <FileText size={16} />
                            </div>
                            <input
                              id="fileUrl"
                              type="text"
                              placeholder="e.g. /public/uploads/figma_mockup.png"
                              {...register("fileUrl")}
                              className="block w-full pl-10 pr-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="flex-1 flex items-center justify-center space-x-2 rounded-md bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-4 shadow-btn hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          <Send size={16} />
                          <span>{application.submission ? "Update Submission" : "Final Submit"}</span>
                        </button>
                        {application.submission && (
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="rounded-md border border-border bg-surface px-5 py-2.5 text-xs font-semibold text-text-primary hover:bg-background transition-all shadow-sm cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar Info Card */}
        <div className="space-y-6">
          {/* Deadline Countdown card */}
          <div className="bg-surface border border-border rounded-xl shadow-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Countdown to Deadline
            </h3>
            <div className="flex items-start space-x-3">
              <Clock
                size={22}
                className={isExpired ? "text-danger shrink-0 mt-0.5" : "text-accent shrink-0 mt-0.5"}
              />
              <div>
                <p
                  className={`text-xl font-serif font-extrabold ${
                    isExpired ? "text-danger animate-pulse" : "text-text-primary"
                  }`}
                >
                  {timeLeft || "Calculating..."}
                </p>
                <p className="text-[10px] text-text-secondary mt-1">
                  Closes: {new Date(task.deadline).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Apply Action block */}
            {!application && (
              <div className="pt-2">
                {isExpired ? (
                  <button
                    disabled
                    className="w-full text-center rounded-md border border-border bg-background py-2.5 text-xs font-semibold text-text-secondary cursor-not-allowed"
                  >
                    Task Closed
                  </button>
                ) : (
                  <button
                    onClick={handleApply}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center space-x-2 rounded-md bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-4 shadow-btn hover:shadow-glow transition-all text-xs cursor-pointer"
                  >
                    <span>Apply to Task</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reward text card */}
          {task.rewardText && (
            <div className="bg-surface border border-border rounded-xl shadow-card p-6 flex items-start space-x-3.5">
              <Gift size={22} className="text-success shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Reward & Stipend
                </h4>
                <p className="text-sm font-semibold text-text-primary mt-1">{task.rewardText}</p>
              </div>
            </div>
          )}

          {/* Company details card */}
          <div className="bg-surface border border-border rounded-xl shadow-card p-6 space-y-3">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              About the Company
            </h3>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <Building size={16} />
              </div>
              <h4 className="font-serif font-bold text-text-primary">
                {task.companyId?.companyName || task.companyId?.name}
              </h4>
            </div>
            {task.companyId?.companyDescription && (
              <p className="text-xs text-text-secondary leading-relaxed pt-1.5 border-t border-border">
                {task.companyId.companyDescription}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
