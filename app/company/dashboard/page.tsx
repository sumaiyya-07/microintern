import Link from "next/link";
import { getSession } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/connect";
import Task from "@/lib/models/Task";
import Application from "@/lib/models/Application";
import { Calendar, CirclePlus, ClipboardList, Clock, Eye, Briefcase, UserCheck } from "lucide-react";
import { STATUS_COLOR_MAP } from "@/lib/constants/statusColors";
import DashboardTaskList from "./DashboardTaskList";

export const dynamic = "force-dynamic";

export default async function CompanyDashboard() {
  const session = await getSession();
  
  await dbConnect();
  
  // 1. Fetch own tasks
  const tasks = await Task.find({ companyId: session?.id }).sort({ createdAt: -1 });
  
  // 2. Fetch all applications for these tasks
  const taskIds = tasks.map((t) => t._id);
  const applications = await Application.find({ taskId: { $in: taskIds } });
  
  // 3. Count status frequencies
  const stats = {
    Applied: 0,
    Reviewed: 0,
    Shortlisted: 0,
    Interview: 0,
    Offered: 0,
    Rejected: 0,
  };
  
  applications.forEach((app) => {
    const status = app.status as keyof typeof stats;
    if (stats[status] !== undefined) {
      stats[status]++;
    }
  });

  // 4. Attach application count and status to tasks
  const tasksWithMetadata = tasks.map((task) => {
    const taskApps = applications.filter(
      (app) => app.taskId.toString() === task._id.toString()
    );
    return {
      _id: task._id.toString(),
      companyId: task.companyId.toString(),
      title: task.title,
      description: task.description,
      category: task.category,
      deadline: task.deadline.toISOString(),
      rewardText: task.rewardText || "",
      status: task.status,
      isActive: task.isActive,
      applicantCount: taskApps.length,
      isExpired: new Date(task.deadline) < new Date(),
    };
  });

  return (
    <div className="container-custom py-10 space-y-10">
      {/* Welcome Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-extrabold tracking-tight text-text-primary">
            Company Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            Manage your open roles, evaluate candidate work, and track applications.
          </p>
        </div>
        <div>
          <Link
            href="/company/tasks/new"
            className="inline-flex items-center space-x-2 rounded-md bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-4 shadow-btn hover:shadow-glow transition-all text-sm cursor-pointer"
          >
            <CirclePlus size={16} />
            <span>Post a Task</span>
          </Link>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(stats).map(([statusKey, count]) => {
          const color = STATUS_COLOR_MAP[statusKey as keyof typeof STATUS_COLOR_MAP];
          return (
            <div
              key={statusKey}
              style={{
                borderColor: color.border,
              }}
              className="bg-surface border rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                {statusKey}
              </span>
              <div className="flex items-baseline justify-between mt-2.5">
                <span className="text-2xl font-serif font-bold text-text-primary">
                  {count}
                </span>
                <span
                  style={{
                    backgroundColor: color.bg,
                    color: color.text,
                  }}
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold border border-current/10"
                >
                  Status
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task management segment */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="font-serif text-2xl font-bold text-text-primary">Your Posted Tasks</h2>
          <span className="text-xs font-semibold text-text-secondary bg-surface px-2.5 py-1 rounded-full border border-border">
            {tasks.length} Total Tasks
          </span>
        </div>

        {tasksWithMetadata.length === 0 ? (
          /* Empty State */
          <div className="bg-surface border border-border shadow-card rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 mt-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Briefcase size={22} />
            </div>
            <h3 className="font-serif text-xl font-bold text-text-primary">No tasks posted yet</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Create your first micro-task requirement to start receiving proof-of-work applications instead of resumes.
            </p>
            <div className="pt-2">
              <Link
                href="/company/tasks/new"
                className="inline-flex items-center space-x-2 rounded-md bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 shadow-btn hover:shadow-glow transition-all text-xs"
              >
                <CirclePlus size={14} />
                <span>Create Task</span>
              </Link>
            </div>
          </div>
        ) : (
          <DashboardTaskList initialTasks={tasksWithMetadata as any} />
        )}
      </div>
    </div>
  );
}
