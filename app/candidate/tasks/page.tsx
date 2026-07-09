"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, LayoutGrid, Calendar, Gift, ChevronRight, Briefcase } from "lucide-react";

interface CompanyInfo {
  name: string;
  companyName: string;
}

interface Task {
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

export default function BrowseTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [triggerFetch, setTriggerFetch] = useState(0);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (search) queryParams.set("search", search);
        if (category && category !== "all") queryParams.set("category", category);

        const res = await fetch(`/api/tasks?${queryParams.toString()}`);
        const result = await res.json();
        if (res.ok) {
          setTasks(result.data);
        }
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [triggerFetch, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTriggerFetch((p) => p + 1);
  };

  return (
    <div className="container-custom py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-4xl font-extrabold tracking-tight text-text-primary">
          Browse Open Tasks
        </h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          Find real micro-tasks, submit completed code/designs, and get hired on proof-of-work.
        </p>
      </div>

      {/* Filters & Search Block */}
      <div className="flex flex-col sm:flex-row gap-4 bg-surface border border-border rounded-xl p-4 shadow-card">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search by keywords (e.g. landing page, Figma, API)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 text-xs transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Category select */}
        <div className="sm:w-64">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full px-3 py-2.5 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Software Development">Software Development</option>
            <option value="UI/UX Design">UI/UX Design</option>
            <option value="Data & Analytics">Data & Analytics</option>
            <option value="Content & Writing">Content & Writing</option>
            <option value="Marketing & Growth">Marketing & Growth</option>
          </select>
        </div>
      </div>

      {/* Tasks listing */}
      {loading ? (
        /* Skeletons */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface border border-border/80 rounded-xl h-56 flex flex-col justify-between p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div className="h-5 w-24 bg-border/60 rounded-full" />
                  <div className="h-4 w-12 bg-border/40 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-3/4 bg-border rounded" />
                  <div className="h-4 w-full bg-border/50 rounded" />
                </div>
              </div>
              <div className="h-10 w-full bg-border/30 rounded mt-4" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        /* Empty state */
        <div className="bg-surface border border-border shadow-card rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <Briefcase size={22} />
          </div>
          <h3 className="font-serif text-xl font-bold text-text-primary">No matching tasks found</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            There are no active tasks available matching your search parameters. Try broadening your keywords or changing categories.
          </p>
        </div>
      ) : (
        /* Task Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="bg-surface border border-border rounded-xl shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Card Header & Content */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-block text-[10px] font-bold tracking-wider uppercase text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/25">
                    {task.category}
                  </span>
                  {task.rewardText && (
                    <span className="flex items-center space-x-1 text-[11px] font-bold text-success-dark">
                      <Gift size={13} className="text-success" />
                      <span>{task.rewardText}</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-serif text-lg font-bold text-text-primary line-clamp-1">
                    {task.title}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Posted by:{" "}
                    <strong className="text-text-primary font-semibold">
                      {task.companyId?.companyName || task.companyId?.name}
                    </strong>
                  </p>
                  <p className="text-xs text-text-secondary mt-3 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="border-t border-border bg-background px-6 py-4 flex items-center justify-between text-xs text-text-secondary">
                <div className="flex items-center space-x-1.5" title="Deadline">
                  <Calendar size={14} />
                  <span>
                    Closes:{" "}
                    <strong className="text-text-primary font-semibold">
                      {new Date(task.deadline).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </strong>
                  </span>
                </div>

                <Link
                  href={`/candidate/tasks/${task._id}`}
                  className="flex items-center space-x-1 text-xs font-semibold text-secondary dark:text-blue-400 hover:text-accent-dark transition-colors cursor-pointer"
                >
                  <span>Apply Now</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
