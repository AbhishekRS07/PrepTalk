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
