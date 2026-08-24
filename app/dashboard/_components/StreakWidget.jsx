"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Target, ChevronUp, ChevronDown, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const GOAL_KEY = "preptalk_weekly_goal";
const DEFAULT_GOAL = 3;

export default function StreakWidget() {
  const [data, setData] = useState(null);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  useEffect(() => {
    const saved = parseInt(localStorage.getItem(GOAL_KEY), 10);
    if (!isNaN(saved) && saved > 0) setGoal(saved);

    fetch("/api/streak")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  const changeGoal = (delta) => {
    const next = Math.max(1, Math.min(14, goal + delta));
    setGoal(next);
    localStorage.setItem(GOAL_KEY, next);
  };

  if (!data) return null;

  const { streak, weekSessions, lastSessionDaysAgo, totalSessions } = data;
  const pct = Math.min(100, Math.round((weekSessions / goal) * 100));
  const goalMet = weekSessions >= goal;
  const showNudge = lastSessionDaysAgo !== null && lastSessionDaysAgo >= 3 && !nudgeDismissed;

  return (
    <div className="space-y-3">
      {/* Nudge banner */}
      <AnimatePresence>
        {showNudge && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3"
          >
            <div className="flex items-center gap-2.5">
              <Zap className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {lastSessionDaysAgo === 3
                  ? "You haven't practiced in 3 days — don't break your momentum!"
                  : `${lastSessionDaysAgo} days since your last session. Time to get back in the zone!`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <Link href="/dashboard"
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline whitespace-nowrap">
                Practice now
              </Link>
              <button onClick={() => setNudgeDismissed(true)} className="text-amber-500/60 hover:text-amber-500 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">

        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-2xl border p-4 overflow-hidden",
            streak > 0
              ? "bg-orange-500/5 border-orange-500/20"
              : "bg-card border-border"
          )}
        >
          {streak > 0 && (
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
          )}
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className={cn("h-5 w-5", streak > 0 ? "text-orange-500" : "text-muted-foreground/30")} />
            <span className={cn(
              "text-2xl font-black tabular-nums",
              streak > 0 ? "text-orange-500" : "text-muted-foreground"
            )}>
              {streak}
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Day streak
          </p>
          {streak >= 7 && (
            <span className="mt-1 text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
              🔥 On fire!
            </span>
          )}
        </motion.div>

        {/* Weekly goal */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-2xl border p-4 overflow-hidden col-span-1",
            goalMet
              ? "bg-emerald-500/5 border-emerald-500/20"
              : "bg-card border-border"
          )}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Target className={cn("h-4 w-4", goalMet ? "text-emerald-500" : "text-primary")} />
            <span className={cn("text-2xl font-black tabular-nums", goalMet ? "text-emerald-500" : "text-foreground")}>
              {weekSessions}<span className="text-base font-medium text-muted-foreground">/{goal}</span>
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mt-1 mb-2">
            <motion.div
              className={cn("h-full rounded-full", goalMet ? "bg-emerald-500" : "bg-primary")}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mb-1">This week's goal</p>
          {/* Goal adjuster */}
          <div className="flex items-center gap-1">
            <button onClick={() => changeGoal(-1)} className="h-4 w-4 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <ChevronDown className="h-3 w-3" />
            </button>
            <span className="text-[10px] text-muted-foreground px-1">goal</span>
            <button onClick={() => changeGoal(1)} className="h-4 w-4 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <ChevronUp className="h-3 w-3" />
            </button>
          </div>
        </motion.div>

        {/* Total sessions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-4"
        >
          <span className="text-2xl font-black text-foreground tabular-nums">{totalSessions}</span>
          <p className="text-xs text-muted-foreground text-center mt-1">Total sessions</p>
        </motion.div>

      </div>
    </div>
  );
}
