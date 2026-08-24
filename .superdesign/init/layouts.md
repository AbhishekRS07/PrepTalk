# layouts.md — Shared Layout Components

Scope note: covers the root layout, the dashboard section layout, and every component those layouts render directly (header/nav, cross-cutting modal), since these are shared across every page under their respective trees. The landing page (`app/page.js`) does NOT use a shared layout component for its nav/footer — it defines its own `Navbar` and `Footer` as local functions inside the page file (see `pages.md` and the note at the bottom of this file).

---

## Root Layout
- File: `app/layout.js`
- Renders: `<html>`/`<body>` shell, loads the `Inter` font (`--font-inter` CSS var, used app-wide except the landing page), wraps the whole app in `ThemeProvider` (next-themes, class-based dark mode, `storageKey="preptalk-theme"`) and `AuthProvider` (Supabase auth context), mounts a global `Toaster` (sonner, top-center) and Google Analytics. Applies on every route in the app.

```jsx
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { GoogleAnalytics } from "@next/third-parties/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "PrepTalk — AI Mock Interviews",
  description: "Prepare for your interviews with AI-powered mock sessions",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="preptalk-theme"
        >
          <AuthProvider>
            <Toaster richColors position="top-center" />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
    </html>
  );
}
```

### Dependency: ThemeProvider
- File: `components/theme-provider.jsx`
- Renders: thin wrapper around `next-themes`' `ThemeProvider`.

```jsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### Dependency: AuthProvider (context, not a visual layout, but wraps every page)
- File: `context/AuthContext.jsx`
- Provides: `user`, `loading`, `supabase` client, `profile`, `setProfile`, `fetchProfile` via React context (`useAuth()` hook), backed by `@supabase/ssr` browser client (`utils/supabase/client.js`).

```jsx
"use client";
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null); // { username }
  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async (email) => {
    if (!email) return;
    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    // onAuthStateChange fires immediately with INITIAL_SESSION — no need for
    // a separate getUser() call, which would cause concurrent token refresh
    // and trigger the Web Lock "stolen" error.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) fetchProfile(session.user.email);
      else setProfile(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, loading, supabase, profile, setProfile, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

```js
// utils/supabase/client.js
import { createBrowserClient } from "@supabase/ssr";

// Singleton — prevents multiple instances competing for the auth token lock
let client;

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return client;
}
```

---

## Dashboard Layout (App Shell for `/dashboard/*`)
- File: `app/dashboard/layout.jsx`
- Renders: sticky `Header` (nav bar), a global `UsernameModal` overlay, and a `<main>` content well with responsive horizontal margins (`mx-5 md:mx-20 lg:mx-36 py-10`). Applies to every route under `/dashboard/**`.

```jsx
import React from "react";
import Header from "./_components/Header";
import UsernameModal from "./_components/UsernameModal";

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <UsernameModal />
      <main className="mx-5 md:mx-20 lg:mx-36 py-10">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
```

---

## Header (Dashboard Top Nav)
- File: `app/dashboard/_components/Header.jsx`
- Renders: sticky glassmorphic top bar with logo/home-link, desktop nav links (Dashboard, Questions, Analytics, Leaderboard, Upgrade, How it works), `ThemeToggle`, an avatar dropdown menu (roadmap/interview-tracker/journal/behavioral/resume/settings links, inline username edit form, sign-out), and a full mobile slide-in drawer (framer-motion) with its own nav list + footer actions. Appears on every dashboard page via `DashboardLayout`.

```jsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { LogOut, Pencil, Loader2, CheckCircle2, Menu, X, MapPin, CalendarDays, BookOpen, Settings, Brain, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/questions", label: "Questions" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/upgrade", label: "Upgrade" },
  { href: "/dashboard/how", label: "How it works" },
];

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
    <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-border space-y-2">
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

// ── Header ────────────────────────────────────────────────────────

const Header = () => {
  const path = usePathname();
  const router = useRouter();
  const { user, supabase, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [path]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="mx-5 md:mx-20 lg:mx-36 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.svg" width={32} height={32} alt="PrepTalk" />
            <span className="font-bold text-base tracking-tight hidden sm:block">PrepTalk</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  path === href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Avatar + dropdown */}
            <div className="relative">
              <button
                onClick={() => { setMenuOpen((p) => !p); setEditingUsername(false); }}
                className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {initials}
              </button>

              {menuOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      {profile?.username && (
                        <p className="text-sm font-semibold">@{profile.username}</p>
                      )}
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>

                    <Link
                      href="/dashboard/roadmap"
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <MapPin className="h-4 w-4 text-primary" />
                      My Roadmap
                    </Link>
                    <Link
                      href="/dashboard/interviews"
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <CalendarDays className="h-4 w-4 text-primary" />
                      Interview Tracker
                    </Link>
                    <Link
                      href="/dashboard/journal"
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <BookOpen className="h-4 w-4 text-primary" />
                      Interview Journal
                    </Link>
                    <Link
                      href="/dashboard/behavioral"
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <Brain className="h-4 w-4 text-primary" />
                      Behavioral Coach
                    </Link>
                    <Link
                      href="/dashboard/resume"
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <FileText className="h-4 w-4 text-primary" />
                      Resume Analyzer
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Settings
                    </Link>

                    {!editingUsername ? (
                      <button
                        onClick={() => setEditingUsername(true)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                        {profile?.username ? "Change username" : "Set username"}
                      </button>
                    ) : (
                      <EditUsernameForm onDone={() => setEditingUsername(false)} />
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors border-t border-border mt-1"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen((p) => !p)}
              className="md:hidden h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-card border-l border-border flex flex-col md:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {initials}
                  </div>
                  <div>
                    {profile?.username && (
                      <p className="text-sm font-semibold">@{profile.username}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navLinks.map(({ href, label }, i) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                  >
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                        path === href
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      {label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Drawer footer */}
              <div className="px-3 py-4 border-t border-border shrink-0 space-y-2">
                <Link
                  href="/dashboard/roadmap"
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm hover:bg-secondary transition-colors"
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  My Roadmap
                </Link>
                <Link
                  href="/dashboard/interviews"
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm hover:bg-secondary transition-colors"
                >
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Interview Tracker
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm hover:bg-secondary transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Settings
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); setMenuOpen(true); }}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm hover:bg-secondary transition-colors"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                  {profile?.username ? "Change username" : "Set username"}
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
```

(`Header` also depends on `ThemeToggle` — full source in `components.md`.)

---

## UsernameModal (global cross-cutting overlay)
- File: `app/dashboard/_components/UsernameModal.jsx`
- Renders: full-screen blocking modal that force-prompts a new user (logged in, profile loaded, no username set yet) to pick a username before continuing. Mounted directly in `DashboardLayout`, so it can appear over any dashboard page.

```jsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Loader2, CheckCircle2 } from "lucide-react";

export default function UsernameModal() {
  const { user, profile, setProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Only show if user is logged in and has no username yet
  const show = user && profile !== null && !profile?.username && !done;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, username }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    setProfile({ username: data.username });
    setDone(true);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-2xl"
          >
            {/* Icon */}
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 mx-auto">
              <Trophy className="h-7 w-7 text-primary" />
            </div>

            <h2 className="text-xl font-black tracking-tight text-center mb-1">Choose your username</h2>
            <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
              Your username appears on the leaderboard. Pick something memorable.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Input
                  placeholder="e.g. coder_ab"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  className="text-center text-base font-medium"
                />
                <p className="text-xs text-muted-foreground text-center">
                  3–20 chars · letters, numbers, underscores only
                </p>
              </div>

              {error && (
                <p className="text-xs text-destructive text-center">{error}</p>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading || !username.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Set Username
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## Note: Landing page has NO shared layout file
`app/page.js` does not use `RootLayout`-level nav components beyond the global `app/layout.js` shell above (fonts/theme/auth/toaster). Its own `Navbar` and `Footer` are defined as **local functions inside `app/page.js` itself** (not separate files), styled with the page-scoped `.pt-landing` dark terminal theme. See `pages.md` for the full landing-page structure and `extractable-components.md` for why they're still worth extracting as reusable layout components.
