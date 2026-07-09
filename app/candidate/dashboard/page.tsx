import Link from "next/link";
import { getSession } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/connect";
import Application from "@/lib/models/Application";
import Submission from "@/lib/models/Submission";
import Review from "@/lib/models/Review";
import { Calendar, CirclePlus, ClipboardList, Clock, Star, Sparkles, Building, ExternalLink, ArrowRight } from "lucide-react";
import { STATUS_COLOR_MAP } from "@/lib/constants/statusColors";

export const dynamic = "force-dynamic";

export default async function CandidateDashboard() {
  const session = await getSession();

  await dbConnect();

  // 1. Fetch own applications
  const applications = await Application.find({ candidateId: session?.id })
    .populate({
      path: "taskId",
      populate: {
        path: "companyId",
        select: "name companyName companyDescription",
      },
    })
    .sort({ updatedAt: -1 });

  const appIds = applications.map((app) => app._id);

  // 2. Fetch submissions for these applications
  const submissions = await Submission.find({ applicationId: { $in: appIds } });
  const submissionIds = submissions.map((sub) => sub._id);

  // 3. Fetch reviews for these submissions
  const reviews = await Review.find({ submissionId: { $in: submissionIds } });

  // 4. Merge data
  const dashboardData = applications.map((app) => {
    const task = app.taskId as any;
    const submission = submissions.find(
      (sub) => sub.applicationId.toString() === app._id.toString()
    );

    let review = null;
    let aiReview = null;

    if (submission) {
      review = reviews.find(
        (rev) => rev.submissionId.toString() === submission._id.toString() && !rev.isAiGenerated
      ) || null;
      aiReview = reviews.find(
        (rev) => rev.submissionId.toString() === submission._id.toString() && rev.isAiGenerated
      ) || null;
    }

    return {
      ...app.toObject(),
      _id: app._id.toString(),
      task: task
        ? {
            ...task.toObject(),
            _id: task._id.toString(),
          }
        : null,
      submission: submission
        ? {
            ...submission.toObject(),
            review,
            aiReview,
          }
        : null,
    };
  });

  return (
    <div className="container-custom py-10 space-y-8">
      {/* Dashboard Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-extrabold tracking-tight text-text-primary">
            Candidate Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            Track your open applications, view company decisions, and review work feedback.
          </p>
        </div>
        <div>
          <Link
            href="/candidate/tasks"
            className="inline-flex items-center space-x-2 rounded-md bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-4 shadow-btn hover:shadow-glow transition-all text-sm cursor-pointer"
          >
            <ClipboardList size={16} />
            <span>Browse Open Tasks</span>
          </Link>
        </div>
      </div>

      {/* Applications Listing section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="font-serif text-2xl font-bold text-text-primary">Your Applications</h2>
          <span className="text-xs font-semibold text-text-secondary bg-surface px-2.5 py-1 rounded-full border border-border">
            {applications.length} Applied Task{applications.length === 1 ? "" : "s"}
          </span>
        </div>

        {dashboardData.length === 0 ? (
          /* Empty State */
          <div className="bg-surface border border-border shadow-card rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 mt-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <ClipboardList size={22} />
            </div>
            <h3 className="font-serif text-xl font-bold text-text-primary">No applications yet</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              You haven't applied to any tasks yet. Browse active requirements, complete their micro-tasks, and prove your capabilities!
            </p>
            <div className="pt-2">
              <Link
                href="/candidate/tasks"
                className="inline-flex items-center space-x-2 rounded-md bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 shadow-btn hover:shadow-glow transition-all text-xs"
              >
                <span>Browse Tasks</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          /* Cards Grid List */
          <div className="space-y-6">
            {dashboardData.map((app) => {
              if (!app.task) return null;
              const statusColor = STATUS_COLOR_MAP[app.status as keyof typeof STATUS_COLOR_MAP];
              
              return (
                <div
                  key={app._id}
                  className="bg-surface border border-border rounded-xl shadow-card hover:shadow-card-hover transition-all overflow-hidden p-6 md:p-8 space-y-6"
                >
                  {/* Top info */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-block text-[10px] font-bold tracking-wider uppercase text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/25">
                          {app.task.category}
                        </span>
                        <span
                          style={{
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            borderColor: statusColor.border,
                          }}
                          className="inline-block text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border"
                        >
                          {app.status}
                        </span>
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-text-primary hover:text-accent-dark transition-colors">
                        <Link href={`/candidate/tasks/${app.task._id}`}>{app.task.title}</Link>
                      </h3>
                      <div className="flex items-center space-x-1.5 text-xs text-text-secondary">
                        <Building size={14} className="text-accent" />
                        <span>{app.task.companyId?.companyName || app.task.companyId?.name}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-text-secondary self-start md:self-center">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>Applied on: {new Date(app.appliedAt).toLocaleDateString()}</span>
                      </div>
                      <span className="hidden sm:inline text-border">|</span>
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>Deadline: {new Date(app.task.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submission detail overview */}
                  <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Solution Answer snippet */}
                    <div className="md:col-span-2 space-y-2">
                      <h4 className="text-xs font-bold text-text-secondary uppercase">Your Submission</h4>
                      {app.submission ? (
                        <div className="space-y-2">
                          <p className="text-xs text-text-primary bg-background/50 border border-border rounded-lg p-3 line-clamp-3 leading-relaxed">
                            {app.submission.textAnswer}
                          </p>
                          {app.submission.link && (
                            <a
                              href={app.submission.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary dark:text-blue-400 hover:underline"
                            >
                              <span>Solution Link</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="bg-background/20 rounded-lg p-4 text-center text-xs text-text-secondary border border-dashed border-border">
                          No work solution submitted yet.{" "}
                          <Link
                            href={`/candidate/tasks/${app.task._id}`}
                            className="text-secondary dark:text-blue-400 font-semibold hover:underline"
                          >
                            Submit Work solution now
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Feedback and reviews panel */}
                    <div className="space-y-3 bg-background/30 rounded-xl p-4 border border-border flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2.5">
                          Evaluation & Feedback
                        </h4>
                        
                        <div className="space-y-3.5">
                          {app.submission?.review && (
                            <div className="space-y-1.5 border-b border-border/40 pb-2.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-text-primary uppercase tracking-wide">Company Review</span>
                                <div className="flex items-center text-accent">
                                  {[...Array(5)].map((_, idx) => (
                                    <Star
                                      key={idx}
                                      size={10}
                                      fill={
                                        idx < (app.submission?.review?.rating || 0)
                                          ? "currentColor"
                                          : "none"
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-[11px] text-text-primary italic leading-normal line-clamp-3 font-serif">
                                "{app.submission.review.comment}"
                              </p>
                            </div>
                          )}

                          {app.submission?.aiReview && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="flex items-center gap-1 font-bold text-accent uppercase tracking-wide">
                                  <Sparkles size={11} />
                                  AI Review
                                </span>
                                <div className="flex items-center text-accent">
                                  {[...Array(5)].map((_, idx) => (
                                    <Star
                                      key={idx}
                                      size={10}
                                      fill={
                                        idx < (app.submission?.aiReview?.rating || 0)
                                          ? "currentColor"
                                          : "none"
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-[11px] text-text-primary leading-normal line-clamp-3">
                                "{app.submission.aiReview.comment}"
                              </p>
                            </div>
                          )}

                          {!app.submission?.review && !app.submission?.aiReview && (
                            <p className="text-xs text-text-secondary italic">
                              Waiting for company review.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Detail Link */}
                      <div className="text-right border-t border-border/60 pt-2.5 mt-2">
                        <Link
                          href={`/candidate/tasks/${app.task._id}`}
                          className="text-xs font-semibold text-secondary dark:text-blue-400 hover:text-accent-dark transition-colors inline-flex items-center gap-0.5"
                        >
                          <span>{app.submission ? "Update Solution" : "Submit Work"}</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
