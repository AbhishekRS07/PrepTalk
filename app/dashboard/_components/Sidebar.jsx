"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import {
  LogOut, Pencil, Loader2, CheckCircle2, Menu, X, Settings,
  LayoutDashboard, ListChecks, BarChart3, Trophy, MapPin,
  CalendarDays, BookOpen, Brain, FileText, Crown, CircleHelp,
  ChevronsLeft, ChevronsRight, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

// Order matches the app's actual feature priority — Dashboard first, then the
// tools people reach for daily, grouped only where it aids scanning.
const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Practice",
    items: [
      { href: "/dashboard/questions", label: "Questions", icon: ListChecks },
    ],
  },
  {
    label: "Progress",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
      { href: "/dashboard/roadmap", label: "My Roadmap", icon: MapPin },
      { href: "/dashboard/interviews", label: "Interview Tracker", icon: CalendarDays },
      { href: "/dashboard/journal", label: "Interview Journal", icon: BookOpen },
    ],
  },
  {
    label: "Coaching",
    items: [
      { href: "/dashboard/behavioral", label: "Behavioral Coach", icon: Brain },
      { href: "/dashboard/resume", label: "Resume Analyzer", icon: FileText },
    ],
  },
];

const FOOTER_LINKS = [
  { href: "/dashboard/upgrade", label: "Upgrade", icon: Crown },
  { href: "/dashboard/how", label: "How it works", icon: CircleHelp },
];

const COLLAPSE_KEY = "preptalk_sidebar_collapsed";

// ── Inline username edit form ─────────────────────────────────────

function EditUsernameForm({ onDone }) {
  const { user, setProfile } = useAuth();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, username: value }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Error"); setLoading(false); return; }
    setProfile({ username: data.username });
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-border space-y-2">
      <p className="text-xs font-medium">Change username</p>
      <Input
        placeholder="new_username"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 text-sm"
        autoFocus
        required
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1 h-7 text-xs gap-1" disabled={loading || !value.trim()}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ── Nav link (shared between desktop rail and mobile drawer) ──────

function NavItem({ href, label, icon: Icon, active, collapsed, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl text-sm font-medium transition-colors",
        collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────

const Sidebar = () => {
  const path = usePathname();
  const router = useRouter();
  const { user, supabase, profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [usernameSheetOpen, setUsernameSheetOpen] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);

  // Restore collapsed preference after mount (avoids SSR/client mismatch).
  useEffect(() => {
    const saved = window.localStorage.getItem(COLLAPSE_KEY);
    if (saved === "1") setCollapsed(true);
    setHydrated(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

  // Close mobile menu / account popover on route change
  useEffect(() => { setMobileOpen(false); setAccountOpen(false); setUsernameSheetOpen(false); }, [path]);

  // Lock body scroll when the mobile drawer or username sheet is open
  useEffect(() => {
    document.body.style.overflow = (mobileOpen || usernameSheetOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen, usernameSheetOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  const isActive = (href) => path === href;

  return (
    <>
      {/* ── Desktop rail ─────────────────────────────────────────── */}
      <aside
        className={cn(
          "hidden md:flex flex-col shrink-0 border-r border-border bg-card/40 sticky top-0 h-screen transition-[width] duration-200 ease-out",
          hydrated ? (collapsed ? "w-[76px]" : "w-64") : "w-64"
        )}
      >
        {/* Logo + collapse toggle */}
        <div className={cn("flex items-center h-16 shrink-0 border-b border-border", collapsed ? "justify-center px-2" : "justify-between px-4")}>
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <Image src="/logo.svg" width={28} height={28} alt="PrepTalk" className="shrink-0" />
            {!collapsed && <span className="font-bold text-base tracking-tight truncate">PrepTalk</span>}
          </Link>
          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_SECTIONS.map((section, i) => (
            <div key={i} className="space-y-1">
              {section.label && !collapsed && (
                <p className="px-3 text-[11px] font-semibold font-mono uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => (
                <NavItem key={item.href} {...item} active={isActive(item.href)} collapsed={collapsed} />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer links (Upgrade / How it works) */}
        <div className="px-3 py-3 border-t border-border space-y-1">
          {FOOTER_LINKS.map((item) => (
            <NavItem key={item.href} {...item} active={isActive(item.href)} collapsed={collapsed} />
          ))}
        </div>

        {/* Expand toggle when collapsed */}
        {collapsed && (
          <button
            onClick={toggleCollapsed}
            className="mx-3 mb-2 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        )}

        {/* Account */}
        <div className="relative border-t border-border p-3">
          <button
            onClick={() => { setAccountOpen((p) => !p); setEditingUsername(false); }}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-xl hover:bg-secondary transition-colors",
              collapsed ? "justify-center p-1.5" : "p-1.5"
            )}
          >
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 text-left">
                {profile?.username && <p className="text-xs font-semibold truncate">@{profile.username}</p>}
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
            {!collapsed && <ChevronUp className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", accountOpen && "rotate-180")} />}
          </button>

          <AnimatePresence>
            {accountOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "absolute bottom-full mb-2 w-56 bg-card border border-border rounded-xl shadow-lg py-1 z-50",
                    collapsed ? "left-full ml-2" : "left-3"
                  )}
                >
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Theme</span>
                    <ThemeToggle />
                  </div>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setAccountOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </Link>

                  {!editingUsername ? (
                    <button
                      onClick={() => setEditingUsername(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                      {profile?.username ? "Change username" : "Set username"}
                    </button>
                  ) : (
                    <EditUsernameForm onDone={() => setEditingUsername(false)} />
                  )}

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors border-t border-border mt-1"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-50 glass border-b border-border/50">
        <div className="mx-5 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.svg" width={32} height={32} alt="PrepTalk" />
            <span className="font-bold text-base tracking-tight">PrepTalk</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen((p) => !p)}
              className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-card border-l border-border flex flex-col md:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    {profile?.username && <p className="text-sm font-semibold truncate">@{profile.username}</p>}
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {NAV_SECTIONS.map((section, si) => (
                  <div key={si} className="space-y-1">
                    {section.label && (
                      <p className="px-3 text-[11px] font-semibold font-mono uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                        {section.label}
                      </p>
                    )}
                    {section.items.map((item, i) => (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                      >
                        <NavItem {...item} active={isActive(item.href)} collapsed={false} onClick={() => setMobileOpen(false)} />
                      </motion.div>
                    ))}
                  </div>
                ))}
                <div className="space-y-1 pt-2 border-t border-border">
                  {FOOTER_LINKS.map((item) => (
                    <NavItem key={item.href} {...item} active={isActive(item.href)} collapsed={false} onClick={() => setMobileOpen(false)} />
                  ))}
                </div>
              </nav>

              {/* Drawer footer */}
              <div className="px-3 py-4 border-t border-border shrink-0 space-y-1">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-sm hover:bg-secondary transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Settings
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); setUsernameSheetOpen(true); }}
                  className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-sm hover:bg-secondary transition-colors"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                  {profile?.username ? "Change username" : "Set username"}
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Username editor triggered from the mobile drawer footer */}
      <AnimatePresence>
        {usernameSheetOpen && (
          <div className="md:hidden fixed inset-0 z-[60] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
              onClick={() => setUsernameSheetOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full bg-card rounded-t-2xl"
            >
              <EditUsernameForm onDone={() => setUsernameSheetOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
