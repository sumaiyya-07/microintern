"use client";

import { useEffect, useState } from "react";
import { Users, Briefcase, Ban, CheckCircle, ShieldAlert, Loader2, Search } from "lucide-react";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: "candidate" | "company" | "admin";
  isActive: boolean;
  createdAt: string;
}

interface CompanyInfo {
  name: string;
  companyName: string;
  email: string;
}

interface TaskItem {
  _id: string;
  title: string;
  category: string;
  deadline: string;
  isActive: boolean;
  createdAt: string;
  companyId?: CompanyInfo;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"users" | "tasks">("users");
  
  // Data states
  const [users, setUsers] = useState<UserItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch users
      const usersRes = await fetch("/api/admin/users");
      const usersResult = await usersRes.json();
      if (usersRes.ok) setUsers(usersResult.data);

      // Fetch tasks
      const tasksRes = await fetch("/api/admin/tasks");
      const tasksResult = await tasksRes.json();
      if (tasksRes.ok) setTasks(tasksResult.data);
    } catch (error) {
      console.error("Failed to load admin dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle user state
  const handleToggleUser = async (userId: string, currentActive: boolean) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to update user status");
      }

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: !currentActive } : u))
      );
    } catch (error: any) {
      alert(error.message || "Failed to update user status");
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle task state
  const handleToggleTask = async (taskId: string, currentActive: boolean) => {
    setActionLoading(taskId);
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to update task status");
      }

      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, isActive: !currentActive } : t))
      );
    } catch (error: any) {
      alert(error.message || "Failed to update task status");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter lists based on search query
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.companyId?.companyName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container-custom py-10 space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="font-serif text-4xl font-extrabold tracking-tight text-text-primary flex items-center gap-2.5">
            <ShieldAlert className="text-danger dark:text-red-400" size={32} />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-sm text-text-secondary">
            Manage system directories, moderate active task postings, and deactivate compromised or invalid accounts.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tabs toggle */}
        <div className="grid grid-cols-2 gap-2.5 p-1 bg-surface border border-border rounded-lg w-full sm:w-auto">
          <button
            onClick={() => {
              setActiveTab("users");
              setSearchQuery("");
            }}
            className={`flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Users size={14} />
            <span>User Accounts ({users.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("tasks");
              setSearchQuery("");
            }}
            className={`flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "tasks"
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Briefcase size={14} />
            <span>Active Tasks ({tasks.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder={activeTab === "users" ? "Search users by name/email..." : "Search tasks by title/company..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3.5 py-2 rounded-md border border-border bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
          />
        </div>
      </div>

      {/* Main panel listings */}
      {loading ? (
        /* Loader state */
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 size={36} className="animate-spin text-accent" />
          <p className="text-sm font-semibold text-text-secondary animate-pulse">
            Retrieving directories...
          </p>
        </div>
      ) : activeTab === "users" ? (
        /* Users directory table */
        <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/50 text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">System Role</th>
                  <th className="py-4 px-6">Registered Date</th>
                  <th className="py-4 px-6">Account Status</th>
                  <th className="py-4 px-6 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-text-primary">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-6 text-center text-text-secondary italic">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-background/25 transition-all">
                      <td className="py-4 px-6 font-semibold">{user.name}</td>
                      <td className="py-4 px-6 text-text-secondary">{user.email}</td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-0.5 rounded border border-border bg-background text-[10px] font-semibold uppercase tracking-wide">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-text-secondary">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            user.isActive ? "text-success" : "text-danger"
                          }`}
                        >
                          {user.isActive ? (
                            <>
                              <CheckCircle size={14} />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <Ban size={14} />
                              <span>Deactivated</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          disabled={actionLoading === user._id}
                          onClick={() => handleToggleUser(user._id, user.isActive)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
                            user.isActive
                              ? "border-danger/30 bg-danger/5 text-danger hover:bg-danger/15"
                              : "border-success/30 bg-success/5 text-success hover:bg-success/15"
                          }`}
                        >
                          {actionLoading === user._id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : user.isActive ? (
                            "Deactivate Account"
                          ) : (
                            "Reactivate Account"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tasks directory table */
        <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/50 text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                  <th className="py-4 px-6">Task Title</th>
                  <th className="py-4 px-6">Creator Company</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Deadline Date</th>
                  <th className="py-4 px-6">Listing Status</th>
                  <th className="py-4 px-6 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-text-primary">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-6 text-center text-text-secondary italic">
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task._id} className="hover:bg-background/25 transition-all">
                      <td className="py-4 px-6 font-semibold truncate max-w-xs" title={task.title}>
                        {task.title}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-text-primary">
                            {task.companyId?.companyName || task.companyId?.name || "Unknown"}
                          </p>
                          <p className="text-[10px] text-text-secondary">
                            {task.companyId?.email || ""}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-text-secondary">{task.category}</td>
                      <td className="py-4 px-6 text-text-secondary">
                        {new Date(task.deadline).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            task.isActive ? "text-success" : "text-danger"
                          }`}
                        >
                          {task.isActive ? (
                            <>
                              <CheckCircle size={14} />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <Ban size={14} />
                              <span>Hidden / Blocked</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          disabled={actionLoading === task._id}
                          onClick={() => handleToggleTask(task._id, task.isActive)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
                            task.isActive
                              ? "border-danger/30 bg-danger/5 text-danger hover:bg-danger/15"
                              : "border-success/30 bg-success/5 text-success hover:bg-success/15"
                          }`}
                        >
                          {actionLoading === task._id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : task.isActive ? (
                            "Hide / Block Task"
                          ) : (
                            "Unhide / Reactivate"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
