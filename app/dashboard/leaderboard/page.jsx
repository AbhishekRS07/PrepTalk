"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Trophy, Medal, Loader2, BarChart3, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const ratingColor = (r) => {
  if (r >= 7.5) return "#10b981";
  if (r >= 5)   return "#f59e0b";
  return "#ef4444";
};

const MEDAL = {
  1: { icon: "🥇", color: "text-yellow-400",  bg: "bg-yellow-400/10 border-yellow-400/30" },
  2: { icon: "🥈", color: "text-slate-300",   bg: "bg-slate-400/10 border-slate-400/30" },
  3: { icon: "🥉", color: "text-amber-600",   bg: "bg-amber-600/10 border-amber-600/30" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => { setRows(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const myEmail = user?.email;
  const myRow = rows.find((r) => r.email === myEmail);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Leaderboard</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Ranked by overall average score across all interview formats.
        </p>
      </motion.div>

      {/* My rank banner */}
      {myRow && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between bg-primary/8 border border-primary/25 rounded-2xl px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Your rank</p>
              <p className="text-xs text-muted-foreground">{myRow.displayName} · {myRow.totalSessions} sessions</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black" style={{ color: ratingColor(myRow.avg) }}>
              #{myRow.rank}
            </p>
            <p className="text-xs text-muted-foreground">{myRow.avg}/10 avg</p>
          </div>
        </motion.div>
      )}

      {/* Top 3 podium */}
      {rows.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[rows[1], rows[0], rows[2]].map((r, i) => {
            if (!r) return null;
            const heights = ["h-28", "h-36", "h-28"];
            const medal = MEDAL[r.rank];
            return (
              <motion.div
                key={r.email}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className={cn(
                  "relative flex flex-col items-center justify-end rounded-2xl border p-4 pb-5",
                  medal.bg,
                  r.email === myEmail && "ring-2 ring-primary"
                )}
                style={{ minHeight: heights[i] === "h-36" ? 144 : 112 }}
              >
                <span className="text-3xl mb-1">{medal.icon}</span>
                <p className={cn("text-sm font-black", medal.color)}>{r.displayName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.avg}/10</p>
                <p className="text-xs text-muted-foreground">{r.totalSessions} sessions</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      {rows.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
          <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No data yet. Complete an interview to appear here.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border grid grid-cols-12 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="col-span-1">#</span>
            <span className="col-span-5">User</span>
            <span className="col-span-3 text-right">Avg Score</span>
            <span className="col-span-3 text-right">Sessions</span>
          </div>
          <div className="divide-y divide-border">
            {rows.map((r, i) => {
              const isMe = r.email === myEmail;
              const medal = MEDAL[r.rank];
              return (
                <motion.div
                  key={r.email}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  className={cn(
                    "grid grid-cols-12 items-center px-5 py-3.5 transition-colors",
                    isMe ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-secondary/30"
                  )}
                >
                  {/* Rank */}
                  <span className="col-span-1">
                    {medal ? (
                      <span className="text-base">{medal.icon}</span>
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">{r.rank}</span>
                    )}
                  </span>

                  {/* Name */}
                  <div className="col-span-5 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-primary">
                        {r.displayName.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className={cn("text-sm font-semibold", isMe && "text-primary")}>
                        {r.displayName}
                        {isMe && <span className="ml-1.5 text-xs font-normal text-primary/70">(you)</span>}
                      </p>
                      {!r.username && (
                        <p className="text-xs text-muted-foreground/50">no username</p>
                      )}
                    </div>
                  </div>

                  {/* Avg */}
                  <span className="col-span-3 text-right text-sm font-black"
                    style={{ color: ratingColor(r.avg) }}>
                    {r.avg}/10
                  </span>

                  {/* Sessions */}
                  <span className="col-span-3 text-right text-sm text-muted-foreground">
                    {r.totalSessions}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
