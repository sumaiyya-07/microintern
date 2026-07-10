"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, UserCheck, Eye, Trash2, Loader2 } from "lucide-react";

interface TaskMetadata {
  _id: string;
  title: string;
  description: string;
  category: string;
  deadline: string;
  isActive: boolean;
  isExpired: boolean;
  status: string;
  applicantCount: number;
}

export default function DashboardTaskList({ initialTasks }: { initialTasks: TaskMetadata[] }) {
  const [tasks, setTasks] = useState<TaskMetadata[]>(initialTasks);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async (taskId: string) => {
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
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.message || "Failed to delete task");
    } finally {
      setDeleteLoading(false);
    }
  };

  const selectedTask = tasks.find((t) => t._id === confirmDeleteId);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tasks.map((task) => (
          <div
            key={task._id}
            className="bg-surface border border-border rounded-xl shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between overflow-hidden animate-in fade-in duration-200"
          >
            {/* Card Top */}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <span className="inline-block text-[10px] font-bold tracking-wider uppercase text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/25">
                  {task.category}
                </span>
                <span
                  className={`inline-block text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                    task.isActive && !task.isExpired
                      ? "text-success border-success/30 bg-success/5"
                      : "text-text-secondary border-border bg-background"
                  }`}
                >
                  {!task.isActive
                    ? "Deactivated"
                    : task.isExpired
                    ? "Expired"
                    : task.status === "open"
                    ? "Open"
                    : "Closed"}
                </span>
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-text-primary hover:text-accent-dark transition-colors line-clamp-1">
                  <Link href={`/company/tasks/${task._id}`}>{task.title}</Link>
                </h3>
                <p className="text-xs text-text-secondary mt-1.5 line-clamp-2">
                  {task.description}
                </p>
              </div>
            </div>

            {/* Card Bottom Meta */}
            <div className="border-t border-border bg-background px-6 py-4 flex items-center justify-between text-xs text-text-secondary">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1" title="Deadline">
                  <Clock size={14} />
                  <span>
                    {new Date(task.deadline).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-1" title="Applicants count">
                  <UserCheck size={14} />
                  <span className="font-semibold text-text-primary">
                    {task.applicantCount} {task.applicantCount === 1 ? "applicant" : "applicants"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/company/tasks/${task._id}`}
                  className="flex items-center space-x-1 text-xs font-semibold text-secondary dark:text-blue-400 hover:text-accent-dark transition-colors cursor-pointer"
                >
                  <span>View Candidates</span>
                  <Eye size={14} />
                </Link>

                <button
                  onClick={() => setConfirmDeleteId(task._id)}
                  className="text-text-secondary hover:text-danger font-semibold transition-colors cursor-pointer flex items-center gap-1 p-1 hover:bg-danger/10 rounded"
                  title="Delete Task"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal for Task Deletion */}
      {confirmDeleteId && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
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
                  setConfirmDeleteId(null);
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
                    {selectedTask.title}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Category: {selectedTask.category}
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
                  setConfirmDeleteId(null);
                  setDeleteError("");
                }}
                disabled={deleteLoading}
                className="rounded-md border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary hover:bg-background transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
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
    </>
  );
}
