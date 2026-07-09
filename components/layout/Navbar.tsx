"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Sun, Moon, LogOut, Menu, X, ShieldAlert } from "lucide-react";

interface NavbarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: "candidate" | "company" | "admin";
  } | null;
}

export default function Navbar({ user: initialUser }: NavbarProps) {
  const [user, setUser] = useState(initialUser);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Load and toggle theme
  useEffect(() => {
    const isDark =
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        router.refresh();
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isLinkActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="glass sticky top-0 z-50 w-full border-b border-border shadow-sm">
      <div className="container-custom flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <Link
            href="/"
            className="font-serif text-2xl font-bold tracking-tight text-primary dark:text-text-primary flex items-center gap-2"
          >
            <span className="text-accent">μ</span>
            <span>MicroIntern</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-6">
            {user?.role === "candidate" && (
              <>
                <Link
                  href="/candidate/tasks"
                  className={`text-sm font-medium transition-colors hover:text-accent-dark ${
                    isLinkActive("/candidate/tasks")
                      ? "text-accent border-b-2 border-accent pb-1 pt-1"
                      : "text-text-secondary"
                  }`}
                >
                  Browse Tasks
                </Link>
                <Link
                  href="/candidate/dashboard"
                  className={`text-sm font-medium transition-colors hover:text-accent-dark ${
                    isLinkActive("/candidate/dashboard")
                      ? "text-accent border-b-2 border-accent pb-1 pt-1"
                      : "text-text-secondary"
                  }`}
                >
                  Dashboard
                </Link>
              </>
            )}
            {user?.role === "company" && (
              <>
                <Link
                  href="/company/dashboard"
                  className={`text-sm font-medium transition-colors hover:text-accent-dark ${
                    isLinkActive("/company/dashboard")
                      ? "text-accent border-b-2 border-accent pb-1 pt-1"
                      : "text-text-secondary"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/company/tasks/new"
                  className={`text-sm font-medium transition-colors hover:text-accent-dark ${
                    isLinkActive("/company/tasks/new")
                      ? "text-accent border-b-2 border-accent pb-1 pt-1"
                      : "text-text-secondary"
                  }`}
                >
                  Post a Task
                </Link>
              </>
            )}
            {user?.role === "admin" && (
              <Link
                href="/admin/dashboard"
                className={`text-sm font-semibold tracking-wide transition-colors text-danger dark:text-red-400 hover:opacity-85 flex items-center gap-1.5 ${
                  isLinkActive("/admin/dashboard")
                    ? "border-b-2 border-danger dark:border-red-400 pb-0.5"
                    : ""
                }`}
              >
                <ShieldAlert size={16} />
                Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* Right Nav Options */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="rounded-md p-2 text-text-secondary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs font-semibold text-text-primary">{user.name}</p>
                <p className="text-[10px] text-text-secondary capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 rounded-md border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-text-primary hover:bg-black/5 dark:hover:bg-white/5 shadow-sm transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <Link
                href="/login"
                className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-primary text-white text-xs font-semibold px-4 py-2 hover:bg-primary-dark shadow-btn transition-colors cursor-pointer"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-md p-2 text-text-secondary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-surface md:hidden px-4 py-3 space-y-3 shadow-md">
          {user?.role === "candidate" && (
            <>
              <Link
                href="/candidate/tasks"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                Browse Tasks
              </Link>
              <Link
                href="/candidate/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                Dashboard
              </Link>
            </>
          )}
          {user?.role === "company" && (
            <>
              <Link
                href="/company/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                Dashboard
              </Link>
              <Link
                href="/company/tasks/new"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                Post a Task
              </Link>
            </>
          )}
          {user?.role === "admin" && (
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-danger dark:text-red-400"
            >
              Admin Panel
            </Link>
          )}

          <div className="border-t border-border pt-3">
            {user ? (
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-text-primary">{user.name}</p>
                  <p className="text-[10px] text-text-secondary capitalize">{user.role}</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 rounded-md border border-border bg-surface py-2 text-xs font-semibold text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center rounded-md border border-border py-2 text-xs font-semibold text-text-secondary hover:text-text-primary"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center rounded-md bg-primary text-white py-2 text-xs font-semibold hover:bg-primary-dark"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
