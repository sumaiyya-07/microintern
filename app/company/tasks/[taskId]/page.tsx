"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  LayoutGrid,
  Loader2,
  Sparkles,
  Star,
  User,
  AlertCircle,
  HelpCircle,
  Trash2,
} from "lucide-react";
import { STATUS_COLOR_MAP, ApplicationStatus } from "@/lib/constants/statusColors";

interface TaskDetail {
  _id: string;
  title: string;
  description: string;
  category: string;
  deadline: string;
  rewardText?: string;
  status: "open" | "closed";
  isActive: boolean;
}

interface Candidate {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  skills?: string[];
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
  taskId: string;
  candidateId: Candidate;
  status: ApplicationStatus;
  appliedAt: string;
  submission: Submission | null;
}

export default function CompanyTaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  const router = useRouter();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal and evaluation states
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Human review states
  const [humanComment, setHumanComment] = useState("");
  const [humanRating, setHumanRating] = useState(5);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Confirmation dialog states
  const [confirmStatusModal, setConfirmStatusModal] = useState<{
    isOpen: boolean;
    appId: string;
    newStatus: ApplicationStatus;
  }>({
    isOpen: false,
    appId: "",
    newStatus: "Applied",
  });

  // Delete task states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch task
      const taskRes = await fetch(`/api/tasks/${taskId}`);
      const taskResult = await taskRes.json();
      if (!taskRes.ok) throw new Error(taskResult.error || "Failed to load task");
      setTask(taskResult.data);

      // Fetch applications
      const appsRes = await fetch(`/api/tasks/${taskId}/applications`);
      const appsResult = await appsRes.json();
      if (!appsRes.ok) throw new Error(appsResult.error || "Failed to load applications");
      setApplications(appsResult.data);
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

  // When selectedApp changes, pre-populate manual review inputs
  useEffect(() => {
    if (selectedApp && selectedApp.submission) {
      const review = selectedApp.submission.review;
      if (review) {
        setHumanComment(review.comment);
        setHumanRating(review.rating);
        setIsEditingReview(false);
      } else {
        setHumanComment("");
        setHumanRating(5);
        setIsEditingReview(true);
      }
    }
  }, [selectedApp]);

  const handleSaveReview = async () => {
    if (!selectedApp || !selectedApp.submission) return;
    setReviewLoading(true);
    setReviewError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedApp.submission._id,
          comment: humanComment,
          rating: humanRating,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save review");
      }

      const savedReview = result.data;

      // Update local state list
      setApplications((prev) =>
        prev.map((app) => {
          if (app._id === selectedApp._id && app.submission) {
            const updatedSub = { ...app.submission, review: savedReview };
            const updatedStatus = app.status === "Applied" ? "Reviewed" as ApplicationStatus : app.status;
            return { ...app, submission: updatedSub, status: updatedStatus };
          }
          return app;
        })
      );

      setSelectedApp((prev) => {
        if (prev && prev.submission) {
          const updatedSub = { ...prev.submission, review: savedReview };
          const updatedStatus = prev.status === "Applied" ? "Reviewed" as ApplicationStatus : prev.status;
          return { ...prev, submission: updatedSub, status: updatedStatus };
        }
        return prev;
      });

      setIsEditingReview(false);
    } catch (err: any) {
      console.error(err);
      setReviewError(err.message || "Failed to save review.");
    } finally {
      setReviewLoading(false);
    }
  };

  // Actual API status updater
  const executeStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    // Optimistic UI update
    const previousApps = [...applications];
    setApplications((prev) =>
      prev.map((app) => (app._id === appId ? { ...app, status: newStatus } : app))
    );

    if (selectedApp && selectedApp._id === appId) {
      setSelectedApp((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to update status");
      }
    } catch (err: any) {
      console.error(err);
      // Revert on error
      setApplications(previousApps);
      if (selectedApp && selectedApp._id === appId) {
        setSelectedApp(previousApps.find((a) => a._id === appId) || null);
      }
      alert(err.message || "Failed to update status. Reverted.");
    }
  };

  // Update applicant status with interceptor for Offers/Rejections
  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    if (newStatus === "Offered" || newStatus === "Rejected") {
      setConfirmStatusModal({
        isOpen: true,
        appId,
        newStatus,
      });
    } else {
      await executeStatusChange(appId, newStatus);
    }
  };

  // Generate Grok Feedback
  const handleGenerateAiFeedback = async (submissionId: string) => {
    if (!selectedApp) return;
    setAiLoading(true);
    setAiError("");

    try {
      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "AI generation failed");
      }

      // Update local state for the AI review
      const aiReviewData = result.data;
      
      setApplications((prev) =>
        prev.map((app) => {
          if (app._id === selectedApp._id && app.submission) {
            const updatedSub = { ...app.submission, aiReview: aiReviewData };
            // Also update app status to Reviewed if it was Applied
            const updatedStatus = app.status === "Applied" ? "Reviewed" as ApplicationStatus : app.status;
            return { ...app, submission: updatedSub, status: updatedStatus };
          }
          return app;
        })
      );

      setSelectedApp((prev) => {
        if (prev && prev.submission) {
          const updatedSub = { ...prev.submission, aiReview: aiReviewData };
          const updatedStatus = prev.status === "Applied" ? "Reviewed" as ApplicationStatus : prev.status;
          return { ...prev, submission: updatedSub, status: updatedStatus };
        }
        return prev;
      });
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Failed to generate AI reviews.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to delete task");
      }
      // Redirect to dashboard on success
      router.push("/company/dashboard");
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.message || "Failed to delete task");
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-10 space-y-6 animate-pulse">
        <div className="h-4 w-32 bg-border rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-10 w-96 bg-border rounded" />
            <div className="h-6 w-48 bg-border/60 rounded" />
            <div className="h-32 bg-surface border border-border rounded-xl" />
          </div>
          <div className="h-64 bg-surface border border-border rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="container-custom py-16 text-center max-w-md mx-auto space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
          <AlertCircle size={22} />
        </div>
        <h2 className="font-serif text-2xl font-bold text-text-primary">Error loading task</h2>
        <p className="text-sm text-text-secondary">{error || "Task not found"}</p>
        <div className="pt-2">
          <Link
            href="/company/dashboard"
            className="rounded-md bg-primary text-white font-semibold py-2 px-4 shadow-btn text-xs"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-10 space-y-8">
      {/* Back & Breadcrumb */}
      <div>
        <Link
          href="/company/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Task Overview */}
      <div className="bg-surface border border-border rounded-xl shadow-card p-6 md:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block text-[10px] font-bold tracking-wider uppercase text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/25">
              {task.category}
            </span>
            <h1 className="font-serif text-3xl font-extrabold tracking-tight text-text-primary mt-1">
              {task.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-center">
            <span
              className={`inline-block text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                task.isActive && new Date(task.deadline) > new Date()
                  ? "text-success border-success/30 bg-success/5"
                  : "text-text-secondary border-border bg-background"
              }`}
            >
              {!task.isActive
                ? "Deactivated"
                : new Date(task.deadline) < new Date()
                ? "Expired"
                : "Open"}
            </span>
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-danger hover:bg-danger-dark text-white font-semibold py-1.5 px-3 text-xs transition-colors shadow-sm cursor-pointer animate-in fade-in"
            >
              <Trash2 size={13} />
              <span>Delete Task</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border pt-4 text-xs text-text-secondary">
          <div className="flex items-center space-x-2">
            <Calendar size={15} className="text-accent" />
            <span>
              Deadline:{" "}
              <strong className="text-text-primary font-semibold">
                {new Date(task.deadline).toLocaleString()}
              </strong>
            </span>
          </div>
          {task.rewardText && (
            <div className="flex items-center space-x-2">
              <Sparkles size={15} className="text-accent" />
              <span>
                Reward:{" "}
                <strong className="text-text-primary font-semibold">{task.rewardText}</strong>
              </span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <LayoutGrid size={15} className="text-accent" />
            <span>
              Total Applicants:{" "}
              <strong className="text-text-primary font-semibold">{applications.length}</strong>
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="text-xs font-bold text-text-secondary uppercase mb-2">Description</h3>
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
            {task.description}
          </p>
        </div>
      </div>

      {/* Applicants List */}
      <div className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-text-primary">Candidates & Submissions</h2>

        {applications.length === 0 ? (
          <div className="bg-surface border border-border shadow-card rounded-2xl p-12 text-center max-w-xl mx-auto space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <User size={22} />
            </div>
            <h3 className="font-serif text-lg font-bold text-text-primary">No applications yet</h3>
            <p className="text-xs text-text-secondary">
              This task hasn't received any submissions yet. Keep checking this page!
            </p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-background/50 text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                    <th className="py-4 px-6">Candidate</th>
                    <th className="py-4 px-6">Submission Status</th>
                    <th className="py-4 px-6">Pipeline Status</th>
                    <th className="py-4 px-6">Applied Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-text-primary">
                  {applications.map((app) => {
                    const statusColor = STATUS_COLOR_MAP[app.status];
                    return (
                      <tr key={app._id} className="hover:bg-background/25 transition-all">
                        {/* Candidate Info */}
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-semibold">{app.candidateId.name}</p>
                            <p className="text-xs text-text-secondary mt-0.5">
                              {app.candidateId.email}
                            </p>
                          </div>
                        </td>

                        {/* Submission status */}
                        <td className="py-4 px-6">
                          {app.submission ? (
                            <span className="inline-flex items-center gap-1 text-xs text-success font-semibold">
                              <FileText size={14} />
                              <span>Work Submitted</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                              <HelpCircle size={14} />
                              <span>Applied Only</span>
                            </span>
                          )}
                        </td>

                        {/* Pipeline status select */}
                        <td className="py-4 px-6">
                          <span
                            style={{
                              backgroundColor: statusColor.bg,
                              color: statusColor.text,
                              borderColor: statusColor.border,
                            }}
                            className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                          >
                            {app.status}
                          </span>
                        </td>

                        {/* Applied date */}
                        <td className="py-4 px-6 text-xs text-text-secondary">
                          {new Date(app.appliedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>

                        {/* Action details */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="inline-flex items-center space-x-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-background transition-all shadow-sm cursor-pointer"
                          >
                            <span>Evaluate Work</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Evaluation Modal / Slider */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className="bg-surface border border-border shadow-modal rounded-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-border bg-background/50 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-text-primary">
                  Evaluate Submission
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Candidate: {selectedApp.candidateId.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedApp(null);
                  setAiError("");
                }}
                className="text-text-secondary hover:text-text-primary text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Candidate Info Card */}
              <div className="bg-background/40 border border-border rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-text-secondary uppercase">
                  Candidate Profile
                </h4>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">
                      {selectedApp.candidateId.name}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {selectedApp.candidateId.bio || "No biography provided."}
                    </p>
                    {selectedApp.candidateId.skills &&
                      selectedApp.candidateId.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {selectedApp.candidateId.skills.map((skill) => (
                            <span
                              key={skill}
                              className="text-[10px] font-semibold bg-surface border border-border px-2 py-0.5 rounded text-text-primary"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Submission content */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="text-xs font-bold text-text-secondary uppercase">
                    Work Submission Details
                  </h4>
                  {selectedApp.submission && (
                    <span className="text-[10px] text-text-secondary">
                      Submitted:{" "}
                      {new Date(selectedApp.submission.submittedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                {!selectedApp.submission ? (
                  <div className="bg-background/20 rounded-lg p-6 text-center text-xs text-text-secondary border border-dashed border-border">
                    The candidate has applied to this task but has not yet submitted their proof-of-work.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Text Answer */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-text-secondary">Text Answer / Solution Description:</p>
                      <div className="bg-background/50 rounded-lg p-4 border border-border text-sm text-text-primary leading-relaxed whitespace-pre-line font-sans">
                        {selectedApp.submission.textAnswer}
                      </div>
                    </div>

                    {/* Links & Files */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedApp.submission.link && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-text-secondary">Solution URL Link:</p>
                          <a
                            href={selectedApp.submission.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-secondary dark:text-blue-400 font-semibold hover:underline bg-background/50 px-3 py-2 rounded-md border border-border w-full"
                          >
                            <span>Open Submission URL</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                      {selectedApp.submission.fileUrl && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-text-secondary">Solution File attachment:</p>
                          <div className="inline-flex items-center gap-1.5 text-xs text-text-primary bg-background/50 px-3 py-2 rounded-md border border-border w-full">
                            <FileText size={12} className="text-accent" />
                            <span className="truncate">{selectedApp.submission.fileUrl}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Manual Review Module */}
              {selectedApp.submission && (
                <div className="border-t border-border pt-4 space-y-4">
                  {selectedApp.submission.review && !isEditingReview ? (
                    <div className="bg-background/40 border border-border rounded-xl p-4 space-y-2">
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
                                idx < (selectedApp.submission?.review?.rating || 0)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-text-primary leading-relaxed italic font-serif">
                        "{selectedApp.submission.review.comment}"
                      </p>
                      <div className="pt-1">
                        <button
                          onClick={() => setIsEditingReview(true)}
                          className="text-[10px] font-semibold text-secondary dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Edit Review
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-background/20 border border-border rounded-xl p-4 space-y-4">
                      <h4 className="text-xs font-bold text-text-secondary uppercase">
                        Add Review & Score Work
                      </h4>
                      {reviewError && (
                        <div className="text-xs text-danger font-semibold bg-danger/5 border border-danger-dark/15 rounded p-2.5">
                          {reviewError}
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-text-secondary">Work Rating:</span>
                        <div className="flex items-center gap-1 text-accent">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setHumanRating(star)}
                              className="hover:scale-110 active:scale-95 transition-all text-accent focus:outline-none cursor-pointer"
                            >
                              <Star
                                size={ star <= humanRating ? 18 : 18 }
                                fill={star <= humanRating ? "currentColor" : "none"}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="humanComment" className="block text-xs font-semibold text-text-primary">
                          Review Comments
                        </label>
                        <textarea
                          id="humanComment"
                          rows={3}
                          placeholder="Provide constructive review comments for the candidate's submission..."
                          value={humanComment}
                          onChange={(e) => setHumanComment(e.target.value)}
                          className="block w-full px-3 py-2 rounded-md border border-border bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveReview}
                          disabled={reviewLoading || !humanComment.trim()}
                          className="rounded-md bg-primary hover:bg-primary-dark text-white font-semibold py-1.5 px-4 text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {reviewLoading ? "Saving..." : "Save Evaluation"}
                        </button>
                        {selectedApp.submission.review && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingReview(false);
                              setHumanComment(selectedApp.submission?.review?.comment || "");
                              setHumanRating(selectedApp.submission?.review?.rating || 5);
                            }}
                            className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-background transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status Update segment */}
              <div className="space-y-4 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-text-secondary uppercase">
                    Candidate Pipeline Status
                  </h4>
                  <span
                    style={{
                      backgroundColor: STATUS_COLOR_MAP[selectedApp.status].bg,
                      color: STATUS_COLOR_MAP[selectedApp.status].text,
                      borderColor: STATUS_COLOR_MAP[selectedApp.status].border,
                    }}
                    className="text-[10px] font-bold px-2 py-1 rounded border capitalize"
                  >
                    Current: {selectedApp.status}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Select / Reject Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleStatusChange(selectedApp._id, "Offered")}
                      disabled={selectedApp.status === "Offered"}
                      className="flex items-center justify-center gap-1.5 rounded-md bg-success hover:bg-success-dark text-white font-semibold py-2 px-3 text-xs transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Select Candidate
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedApp._id, "Rejected")}
                      disabled={selectedApp.status === "Rejected"}
                      className="flex items-center justify-center gap-1.5 rounded-md bg-danger hover:bg-danger-dark text-white font-semibold py-2 px-3 text-xs transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Reject Candidate
                    </button>
                  </div>

                  {/* Manual Dropdown Selector for fine grain control */}
                  <div className="flex items-center gap-2 pt-1.5 border-t border-border/40">
                    <span className="text-[11px] text-text-secondary">Change Pipeline Stage:</span>
                    <select
                      value={selectedApp.status}
                      onChange={(e) =>
                        handleStatusChange(selectedApp._id, e.target.value as ApplicationStatus)
                      }
                      className="text-[11px] font-bold px-2.5 py-1.5 rounded-md border border-border bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent transition-all cursor-pointer capitalize"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Reviewed">Reviewed</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Interview">Interview</option>
                      <option value="Offered">Offered</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grok AI Review Module */}
              {selectedApp.submission && (
                <div className="border-t border-border pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={16} className="text-accent" />
                      <h4 className="text-xs font-bold text-text-secondary uppercase">
                        AI-Generated Evaluation (Grok-Beta)
                      </h4>
                    </div>
                    {aiLoading && (
                      <span className="text-[10px] font-semibold text-accent flex items-center gap-1 animate-pulse">
                        <Loader2 size={12} className="animate-spin" />
                        Analyzing...
                      </span>
                    )}
                  </div>

                  {aiError && (
                    <div className="text-xs text-danger font-semibold bg-danger/5 border border-danger-dark/15 rounded p-2.5">
                      {aiError}
                    </div>
                  )}

                  {selectedApp.submission.aiReview ? (
                    <div className="bg-primary/5 dark:bg-blue-950/20 border border-secondary/20 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/25 uppercase">
                          AI Assessment
                        </span>
                        <div className="flex items-center gap-0.5 text-accent">
                          {[...Array(5)].map((_, idx) => (
                            <Star
                              key={idx}
                              size={12}
                              fill={
                                idx < (selectedApp.submission?.aiReview?.rating || 0)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-text-primary leading-relaxed italic">
                        "{selectedApp.submission.aiReview.comment}"
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        handleGenerateAiFeedback(selectedApp.submission?._id || "")
                      }
                      disabled={aiLoading}
                      className="w-full flex items-center justify-center gap-2 rounded-md border border-accent bg-accent/5 hover:bg-accent/15 text-accent-dark font-semibold py-2.5 px-4 text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles size={14} />
                      <span>Request Grok AI Feedback & Rating</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border bg-background/50 px-6 py-4 flex justify-end">
              <button
                onClick={() => {
                  setSelectedApp(null);
                  setAiError("");
                }}
                className="rounded-md border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary hover:bg-background transition-all shadow-sm cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom themed in-app Confirmation Dialog for Offer / Reject status changes */}
      {confirmStatusModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div
            className="bg-surface border border-border shadow-modal rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-border bg-background/50 px-6 py-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-text-primary">
                {confirmStatusModal.newStatus === "Offered" ? "Confirm Candidate Selection" : "Confirm Candidate Rejection"}
              </h3>
              <button
                onClick={() => setConfirmStatusModal({ isOpen: false, appId: "", newStatus: "Applied" })}
                className="text-text-secondary hover:text-text-primary text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  confirmStatusModal.newStatus === "Offered" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                }`}>
                  <User size={18} />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">
                    Candidate: {applications.find(a => a._id === confirmStatusModal.appId)?.candidateId?.name || "Candidate"}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Pipeline Stage: {confirmStatusModal.newStatus}
                  </p>
                </div>
              </div>
              <p className="text-sm text-text-primary leading-relaxed mt-2">
                {confirmStatusModal.newStatus === "Offered"
                  ? `Are you sure you want to select this candidate and make them an offer? This will update their pipeline status to Offered and send an email notification.`
                  : `Are you sure you want to reject this candidate? This will update their pipeline status to Rejected and notify them of the decision.`}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border bg-background/50 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmStatusModal({ isOpen: false, appId: "", newStatus: "Applied" })}
                className="rounded-md border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary hover:bg-background transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  executeStatusChange(confirmStatusModal.appId, confirmStatusModal.newStatus);
                  setConfirmStatusModal({ isOpen: false, appId: "", newStatus: "Applied" });
                }}
                className={`rounded-md px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer ${
                  confirmStatusModal.newStatus === "Offered"
                    ? "bg-success hover:bg-success-dark"
                    : "bg-danger hover:bg-danger-dark"
                }`}
              >
                {confirmStatusModal.newStatus === "Offered" ? "Confirm Offer" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom themed in-app Confirmation Dialog for Task Deletion */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div
            className="bg-surface border border-border shadow-modal rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-border bg-background/50 px-6 py-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-text-primary">
                Confirm Delete Task
              </h3>
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setDeleteError("");
                }}
                disabled={deleteLoading}
                className="text-text-secondary hover:text-text-primary text-sm font-bold p-1 cursor-pointer disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0">
                  <Trash2 size={18} />
                </div>
                <div>
                  <p className="font-semibold text-text-primary line-clamp-1">
                    {task.title}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Category: {task.category}
                  </p>
                </div>
              </div>
              <p className="text-sm text-text-primary leading-relaxed mt-2">
                Are you sure you want to delete this task? This action is permanent and will delete all submissions and evaluations associated with it.
              </p>
              {deleteError && (
                <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded p-2.5">
                  {deleteError}
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border bg-background/50 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setDeleteError("");
                }}
                disabled={deleteLoading}
                className="rounded-md border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary hover:bg-background transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={deleteLoading}
                className="rounded-md px-4 py-2 text-xs font-semibold text-white bg-danger hover:bg-danger-dark transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleteLoading && <Loader2 size={12} className="animate-spin" />}
                <span>{deleteLoading ? "Deleting..." : "Delete Task"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
