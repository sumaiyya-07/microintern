import Link from "next/link";
import { getSession } from "@/lib/auth/jwt";
import Navbar from "@/components/layout/Navbar";
import { ArrowRight, Sparkles, UserCheck, Briefcase, FileCode, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const session = await getSession();

  // Custom CTAs depending on session state
  let primaryCtaHref = "/signup";
  let primaryCtaText = "Get Started Now";
  let secondaryCtaHref = "/login";
  let secondaryCtaText = "Sign In";

  if (session) {
    if (session.role === "candidate") {
      primaryCtaHref = "/candidate/tasks";
      primaryCtaText = "Browse Open Tasks";
      secondaryCtaHref = "/candidate/dashboard";
      secondaryCtaText = "Candidate Dashboard";
    } else if (session.role === "company") {
      primaryCtaHref = "/company/tasks/new";
      primaryCtaText = "Post a Micro-Task";
      secondaryCtaHref = "/company/dashboard";
      secondaryCtaText = "Company Dashboard";
    } else if (session.role === "admin") {
      primaryCtaHref = "/admin/dashboard";
      primaryCtaText = "Admin Control Panel";
      secondaryCtaHref = "/admin/dashboard";
      secondaryCtaText = "Go to Panel";
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <Navbar user={session as any} />

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center py-20 lg:py-28 relative overflow-hidden">
        {/* Subtle accent blob */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 dark:bg-accent/3 rounded-full blur-[100px] pointer-events-none" />

        <div className="container-custom relative z-10 text-center space-y-8 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-xs font-bold text-accent-dark dark:text-accent shadow-sm animate-pulse">
            <Sparkles size={14} />
            <span>Redefining hiring from the ground up</span>
          </div>

          <div className="space-y-4">
            <h1 className="font-serif text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-text-primary">
              Work First. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent-dark to-secondary">
                Hire Later.
              </span>
            </h1>
            <p className="font-sans text-base md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Ditch resumes, generic interview questions, and pedigree bias. Post real, actionable micro-tasks, review proof-of-work submissions, and hire developers based on execution.
            </p>
          </div>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href={primaryCtaHref}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-md bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 px-8 shadow-btn hover:shadow-glow text-sm transition-all cursor-pointer"
            >
              <span>{primaryCtaText}</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href={secondaryCtaHref}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-md border border-border bg-surface hover:bg-background text-text-primary font-semibold py-3.5 px-8 shadow-sm text-sm transition-all cursor-pointer"
            >
              <span>{secondaryCtaText}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition Segment */}
      <section className="bg-surface border-t border-border py-20 relative">
        <div className="container-custom space-y-12">
          <div className="text-center space-y-2.5 max-w-xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">
              The Execution Hiring Loop
            </h2>
            <p className="text-sm text-text-secondary font-sans leading-relaxed">
              How MicroIntern filters candidates through actionable skills evaluation instead of legacy credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="bg-background border border-border rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent shrink-0">
                <Briefcase size={20} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif text-xl font-bold text-text-primary">1. Post a Micro-Task</h3>
                <p className="text-xs text-text-secondary leading-relaxed font-sans">
                  Companies outline specific, concrete features, UX implementations, or scripts needed.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-background border border-border rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent shrink-0">
                <FileCode size={20} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif text-xl font-bold text-text-primary">2. Submit Code or UX</h3>
                <p className="text-xs text-text-secondary leading-relaxed font-sans">
                  Candidates implement the code or mockups, submitting GitHub repositories or links.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-background border border-border rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent shrink-0">
                <Trophy size={20} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif text-xl font-bold text-text-primary">3. Evaluate & Hire</h3>
                <p className="text-xs text-text-secondary leading-relaxed font-sans">
                  Hiring managers evaluate execution using Grok-Beta AI assessments, shortlisted candidates progress instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer segment */}
      <footer className="border-t border-border bg-background py-8 text-center text-xs text-text-secondary font-sans">
        <div className="container-custom flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 MicroIntern Inc. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/login" className="hover:text-text-primary transition-colors">
              Platform
            </Link>
            <Link href="/admin/login" className="hover:text-text-primary transition-colors text-danger">
              System Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
