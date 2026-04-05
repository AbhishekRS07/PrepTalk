"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { LogOut, Pencil, Loader2, CheckCircle2, Menu, X } from "lucide-react";
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
