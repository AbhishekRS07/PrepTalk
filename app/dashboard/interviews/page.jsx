"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CalendarDays, Plus, Trash2, CheckCircle2, XCircle,
  Clock, Building2, Briefcase, ChevronDown, ChevronUp,
  ArrowRight, Sparkles, AlertTriangle, BookOpen,
  Mic, Brain, Code2, FileText, TrendingUp, MapPin,
  Trophy, Flame, RotateCcw,
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────

const ROUND_TYPES = [
  { value: "technical",     label: "Technical",       color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
  { value: "system_design", label: "System Design",   color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { value: "behavioral",    label: "Behavioral / HR", color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
  { value: "dsa",           label: "DSA / Coding",    color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20" },
  { value: "phone_screen",  label: "Phone Screen",    color: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-500/20" },
  { value: "final",         label: "Final Round",     color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
];

const ROUND_MAP = Object.fromEntries(ROUND_TYPES.map((r) => [r.value, r]));

// Daily prep plans by round type
const PREP_PLANS = {
  technical: [
    { focus: "Core concepts review", icon: Brain,      link: "/dashboard", hint: "Start a Mock Interview targeting your role" },
    { focus: "DSA warm-up",          icon: Code2,      link: "/dashboard/questions?tab=dsa&topics=Arrays,Strings&experience=3", hint: "Solve 3–5 problems in the Question Bank" },
    { focus: "Practical challenge",  icon: Sparkles,   link: "/dashboard/questions?tab=challenges", challenge: { category: "business", level: "3" }, hint: "Solve a real-world business logic coding challenge" },
    { focus: "System design basics", icon: BookOpen,   link: "/dashboard/questions", hint: "Review system design Q&A" },
    { focus: "Live practice round",  icon: Mic,        link: "/dashboard/live-interview", hint: "Do a full Live AI Interview session" },
    { focus: "Weak spots drill",     icon: TrendingUp, link: "/dashboard/analytics", hint: "Check Analytics — retry low-scoring topics" },
    { focus: "Final mock + rest",    icon: Trophy,     link: "/dashboard", hint: "One last timed mock — then rest and sleep early" },
  ],
  system_design: [
    { focus: "Scalability fundamentals", icon: Brain,    link: "/dashboard/questions", hint: "Study system design Q&A in the question bank" },
    { focus: "Common patterns",          icon: BookOpen, link: "/dashboard/questions", hint: "Review caching, load balancing, DB sharding" },
    { focus: "Mock design interview",    icon: Mic,      link: "/dashboard/live-interview", hint: "Practice a full Live AI system design session" },
    { focus: "Trade-off practice",       icon: Code2,    link: "/dashboard/questions", hint: "Focus on trade-off based Q&A" },
    { focus: "Deep dive: one system",    icon: Sparkles, link: "/dashboard/questions", hint: "Pick one system (Twitter, Uber, etc.) and go deep" },
    { focus: "Live mock + review",       icon: Mic,      link: "/dashboard/live-interview", hint: "Second full live session — review the debrief carefully" },
    { focus: "Rest + light revision",    icon: Trophy,   link: "/dashboard", hint: "Light review only — no heavy new material" },
  ],
  behavioral: [
    { focus: "STAR method practice",   icon: Brain,   link: "/dashboard/live-interview", hint: "Live session with focus on behavioural questions" },
    { focus: "Leadership stories",     icon: Sparkles,link: "/dashboard/live-interview", hint: "Prepare 3 stories on leadership & ownership" },
    { focus: "Conflict & teamwork",    icon: BookOpen,link: "/dashboard/questions",      hint: "Review common behavioral Q&A" },
    { focus: "Company values research",icon: Building2,link: "/dashboard/jd-prep",       hint: "Run JD Prep — research company culture & values" },
    { focus: "Mock behavioral round",  icon: Mic,     link: "/dashboard/live-interview", hint: "Full Live AI interview — behavioral focus" },
    { focus: "Polish your answers",    icon: FileText, link: "/dashboard/live-interview", hint: "Refine your top 5 stories — time each one" },
    { focus: "Rest & confidence",      icon: Trophy,  link: "/dashboard", hint: "You're prepared — rest and stay calm" },
  ],
  dsa: [
    { focus: "Arrays & strings",       icon: Code2,      link: "/dashboard/questions?tab=dsa&topics=Arrays,Strings&experience=3", hint: "Solve 5 array/string problems in the IDE" },
    { focus: "Trees & graphs",         icon: Code2,      link: "/dashboard/questions?tab=dsa&topics=Trees,Graphs&experience=3", hint: "Solve 5 tree/graph problems" },
    { focus: "Dynamic programming",    icon: Brain,      link: "/dashboard/questions?tab=dsa&topics=Dynamic Programming,Recursion&experience=3", hint: "Focus on DP — start with 1D, then 2D" },
    { focus: "Practical challenge",    icon: Sparkles,   link: "/dashboard/questions?tab=challenges", challenge: { category: "pricing", level: "3" }, hint: "Real-world coding problem — pricing, calculators, logic" },
    { focus: "Sliding window & heaps", icon: Code2,      link: "/dashboard/questions?tab=dsa&topics=Stack & Queue,Hashing&experience=3", hint: "Two pointer, sliding window, priority queue" },
    { focus: "Weak topic deep dive",   icon: TrendingUp, link: "/dashboard/analytics", hint: "Check Analytics — which topics are you scoring low?" },
    { focus: "Final timed mock",       icon: Trophy,     link: "/dashboard/questions?tab=dsa&topics=Arrays,Trees,Dynamic Programming&experience=3", hint: "Mixed hard problems, 1 hour — then rest" },
  ],
  phone_screen: [
    { focus: "Role overview & pitch",  icon: Brain,   link: "/dashboard", hint: "Prepare your self-intro and 'tell me about yourself'" },
    { focus: "Key technical concepts", icon: Code2,   link: "/dashboard/questions", hint: "Review top Q&A for your role in the question bank" },
    { focus: "Live practice",          icon: Mic,     link: "/dashboard/live-interview", hint: "Do one Live AI session to build speaking confidence" },
    { focus: "Final Q prep + rest",    icon: Trophy,  link: "/dashboard", hint: "Prepare 3 questions to ask the interviewer" },
  ],
  final: [
    { focus: "Full mock interview",    icon: Brain,      link: "/dashboard", hint: "End-to-end mock interview — all question types" },
    { focus: "DSA speed practice",     icon: Code2,      link: "/dashboard/questions?tab=dsa&topics=Arrays,Trees,Dynamic Programming&experience=3", hint: "3 medium problems under time pressure" },
    { focus: "System design mock",     icon: BookOpen,   link: "/dashboard/live-interview", hint: "Live session — system design focused" },
    { focus: "Practical challenge",    icon: Sparkles,   link: "/dashboard/questions?tab=challenges", challenge: { category: "oop", level: "5" }, hint: "Real-world OOP or state-machine challenge" },
    { focus: "Behavioral stories",     icon: Mic,        link: "/dashboard/live-interview", hint: "Polish your STAR stories" },
    { focus: "Weak areas targeted",    icon: TrendingUp, link: "/dashboard/analytics", hint: "Check Analytics — target your lowest scoring topics" },
    { focus: "Rest & mental reset",    icon: Trophy,     link: "/dashboard", hint: "No new studying — you're ready. Sleep early." },
  ],
};

function getDailyPlan(roundType, totalDays) {
  const plan = PREP_PLANS[roundType] ?? PREP_PLANS.technical;
  if (totalDays <= 0) return [];
  return plan.slice(0, Math.min(totalDays, plan.length));
}

function daysBetween(dateA, dateB) {
  const a = new Date(dateA); a.setHours(0, 0, 0, 0);
  const b = new Date(dateB); b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// Returns { startDate, totalDays } — created once, never changes
function getPlanMeta(interviewId, daysLeft) {
  if (typeof window === "undefined") return { startDate: todayStr(), totalDays: daysLeft };
  const key = `plan_meta_${interviewId}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  const meta = { startDate: todayStr(), totalDays: Math.max(1, daysLeft) };
  try { localStorage.setItem(key, JSON.stringify(meta)); } catch {}
  return meta;
}

function getDaysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

// ── Countdown Badge ───────────────────────────────────────────────

function CountdownBadge({ days }) {
  if (days < 0)  return <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">Past</span>;
  if (days === 0) return <span className="text-xs font-bold text-red-400 bg-red-500/15 border border-red-500/25 px-2.5 py-1 rounded-full animate-pulse">Today!</span>;
  if (days === 1) return <span className="text-xs font-bold text-orange-400 bg-orange-500/15 border border-orange-500/25 px-2.5 py-1 rounded-full">Tomorrow</span>;
  if (days <= 3)  return <span className="text-xs font-bold text-amber-400 bg-amber-500/15 border border-amber-500/25 px-2.5 py-1 rounded-full">{days} days</span>;
  if (days <= 7)  return <span className="text-xs font-bold text-blue-400 bg-blue-500/15 border border-blue-500/25 px-2.5 py-1 rounded-full">{days} days</span>;
  return <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">{days} days</span>;
}

// ── Add Interview Modal ───────────────────────────────────────────

function AddInterviewModal({ open, onClose, onAdd }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [date, setDate] = useState("");
  const [roundType, setRoundType] = useState("technical");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => { setCompany(""); setRole(""); setDate(""); setRoundType("technical"); setNotes(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onAdd({ company, role, interview_date: date, round_type: roundType, notes });
    setLoading(false);
    reset();
    onClose();
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base">Add Upcoming Interview</h2>
                    <p className="text-xs text-muted-foreground">We'll build your daily prep plan automatically</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Company</label>
                    <Input placeholder="e.g. Stripe, Google" value={company}
                      onChange={(e) => setCompany(e.target.value)} required className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Role</label>
                    <Input placeholder="e.g. SDE-2, Frontend" value={role}
                      onChange={(e) => setRole(e.target.value)} required className="h-10" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Interview Date</label>
                    <Input type="date" min={minDate} value={date}
                      onChange={(e) => setDate(e.target.value)} required className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Round Type</label>
                    <select value={roundType} onChange={(e) => setRoundType(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer">
                      {ROUND_TYPES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Notes <span className="text-muted-foreground/50">(optional)</span></label>
                  <Input placeholder="e.g. 45-min round, focus on React + TS" value={notes}
                    onChange={(e) => setNotes(e.target.value)} className="h-10" />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 gap-1.5" disabled={loading || !company || !role || !date}>
                    {loading ? <span className="animate-spin">⏳</span> : <Plus className="h-4 w-4" />}
                    Add Interview
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Interview Card ────────────────────────────────────────────────

function InterviewCard({ interview, onUpdate, onDelete }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [confirming, setConfirming] = useState(null);

  // ── Stable plan meta (fixed on first view, never changes) ────────
  const daysUntil = getDaysUntil(interview.interview_date);
  const planMeta  = getPlanMeta(interview.id, daysUntil); // {startDate, totalDays}

  // How many days have passed since the plan started
  const daysSinceStart  = Math.max(0, daysBetween(planMeta.startDate, todayStr()));
  const currentDayIndex = Math.min(daysSinceStart, planMeta.totalDays - 1);

  const round   = ROUND_MAP[interview.round_type] ?? ROUND_MAP.technical;
  const plan    = getDailyPlan(interview.round_type, planMeta.totalDays);
  const todayTask = plan[currentDayIndex];
  const isPast  = daysUntil < 0;
  const isUrgent = daysUntil >= 0 && daysUntil <= 3;

  // ── Per-day done tracking ────────────────────────────────────────
  const lsKey = `prep_days_done_${interview.id}`;
  const [doneDays, setDoneDays] = useState(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem(lsKey) : null;
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const toggleDay = (index) => {
    setDoneDays((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      try { localStorage.setItem(lsKey, JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  // Build stable link for a plan task (challenge tasks get interview-scoped seed)
  const taskLink = (task, dayIndex) => {
    if (!task.challenge) return task.link;
    const seed = `${interview.id}_day${dayIndex}`;
    return `${task.link}?tab=challenges&category=${task.challenge.category}&level=${task.challenge.level}&seed=${seed}`;
  };

  const allDone = plan.length > 0 && plan.every((_, i) => doneDays.has(i));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "rounded-2xl border overflow-hidden transition-colors",
        interview.status === "done"      ? "border-emerald-500/25 bg-emerald-500/5 opacity-70" :
        interview.status === "cancelled" ? "border-border/40 opacity-50" :
        isUrgent && !isPast             ? "border-amber-500/40 bg-amber-500/5" :
        isPast                          ? "border-border/40 opacity-60" :
                                          "border-border bg-card"
      )}
    >
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", round.bg, round.color, round.border)}>
                {round.label}
              </span>
              <CountdownBadge days={daysUntil} />
              {interview.status === "done" && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">✓ Done</span>
              )}
              {interview.status === "cancelled" && (
                <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Cancelled</span>
              )}
            </div>
            <h3 className="font-black text-lg leading-tight">{interview.company}</h3>
            <p className="text-sm text-muted-foreground">{interview.role}</p>
          </div>

          {/* Big countdown */}
          {interview.status === "upcoming" && !isPast && (
            <div className="shrink-0 text-right">
              <div className={cn(
                "text-3xl font-black tabular-nums leading-none",
                daysUntil === 0 ? "text-red-400" : daysUntil <= 3 ? "text-amber-400" : "text-primary"
              )}>
                {daysUntil}
              </div>
              <div className="text-xs text-muted-foreground">{daysUntil === 1 ? "day" : "days"}</div>
            </div>
          )}
        </div>

        {/* Date + notes */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />{formatDate(interview.interview_date)}
          </span>
          {interview.notes && (
            <span className="truncate max-w-[200px]">{interview.notes}</span>
          )}
        </div>

        {/* Today's focus — only for upcoming */}
        {interview.status === "upcoming" && todayTask && !isPast && (
          <div className={cn(
            "mt-3 flex items-center gap-2 border rounded-xl px-3 py-2.5 transition-colors",
            doneDays.has(currentDayIndex)
              ? "bg-emerald-500/5 border-emerald-500/25"
              : "bg-primary/8 border-primary/20"
          )}>
            {doneDays.has(currentDayIndex)
              ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              : <Flame className="h-4 w-4 text-primary shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs font-bold", doneDays.has(currentDayIndex) ? "text-emerald-400 line-through" : "text-primary")}>
                Day {currentDayIndex + 1}: {todayTask.focus}
              </p>
              <p className="text-xs text-muted-foreground truncate">{todayTask.hint}</p>
            </div>
            {!doneDays.has(currentDayIndex) && (
              <button
                onClick={() => router.push(taskLink(todayTask, currentDayIndex))}
                className="shrink-0 text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                Go <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expand / collapse daily plan */}
      {interview.status === "upcoming" && plan.length > 0 && (
        <>
          <button
            onClick={() => setExpanded((p) => !p)}
            className="w-full flex items-center justify-between px-5 py-2.5 border-t border-border/50 text-xs font-semibold text-muted-foreground hover:bg-secondary/30 transition-colors"
          >
            <span>
              {plan.length}-day prep plan
              {doneDays.size > 0 && (
                <span className="ml-2 text-emerald-400">
                  · {Math.min(doneDays.size, plan.length)}/{plan.length} done
                </span>
              )}
            </span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 space-y-2 border-t border-border/40">
                  {plan.map((task, i) => {
                    const Icon    = task.icon;
                    const isToday = i === currentDayIndex;
                    const isPastDay = i < currentDayIndex;
                    const isDone  = doneDays.has(i);
                    const link    = taskLink(task, i);
                    return (
                      <div key={i} className={cn(
                        "flex items-center gap-3 p-2.5 rounded-xl transition-all",
                        isDone
                          ? "bg-emerald-500/5 border border-emerald-500/20 opacity-70"
                          : isToday
                          ? "bg-primary/8 border border-primary/20"
                          : isPastDay
                          ? "opacity-50 border border-transparent"
                          : "hover:bg-secondary/30 border border-transparent"
                      )}>
                        {/* Day check button */}
                        <button
                          onClick={() => toggleDay(i)}
                          className={cn(
                            "shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                            isDone
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : isToday
                              ? "border-primary hover:bg-primary/20"
                              : "border-border hover:border-primary/50"
                          )}
                          title={isDone ? "Mark as not done" : "Mark day as done"}
                        >
                          {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </button>

                        <Icon className={cn(
                          "h-4 w-4 shrink-0",
                          isDone ? "text-emerald-400" : isToday ? "text-primary" : "text-muted-foreground"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs font-semibold",
                            isDone ? "line-through text-muted-foreground"
                            : isToday ? "text-primary"
                            : undefined
                          )}>
                            Day {i + 1}: {task.focus}
                            {isToday && !isDone && <span className="ml-1.5 text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-bold">TODAY</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{task.hint}</p>
                        </div>
                        {!isDone && (
                          <button
                            onClick={() => router.push(link)}
                            className="shrink-0 text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Action buttons */}
      {interview.status === "upcoming" && (
        <div className="px-5 pb-4 flex gap-2 border-t border-border/50 pt-3">
          {confirming === "done" ? (
            <>
              <Button size="sm" className="flex-1 h-8 gap-1 text-xs bg-emerald-500 hover:bg-emerald-600"
                onClick={() => { onUpdate(interview.id, "done"); setConfirming(null); }}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Confirm interview done
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setConfirming(null)}>Cancel</Button>
            </>
          ) : confirming === "delete" ? (
            <>
              <Button size="sm" variant="destructive" className="flex-1 h-8 gap-1 text-xs"
                onClick={() => { onDelete(interview.id); setConfirming(null); }}>
                <Trash2 className="h-3.5 w-3.5" /> Yes, delete
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setConfirming(null)}>Cancel</Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant={allDone ? "default" : "outline"}
                className={cn(
                  "flex-1 h-8 gap-1 text-xs transition-all",
                  allDone && "bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                )}
                onClick={() => setConfirming("done")}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {allDone ? "All prep done — mark interview done" : "Interview done"}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground"
                onClick={() => onUpdate(interview.id, "cancelled")}>
                <XCircle className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive hover:text-destructive"
                onClick={() => setConfirming("delete")}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      )}

      {/* Restore button for done */}
      {interview.status === "done" && (
        <div className="px-5 pb-4 flex gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
            onClick={() => onUpdate(interview.id, "upcoming")}>
            <RotateCcw className="h-3.5 w-3.5" /> Mark as upcoming
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive"
            onClick={() => onDelete(interview.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Restore button for cancelled */}
      {interview.status === "cancelled" && (
        <div className="px-5 pb-4 flex gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
            onClick={() => onUpdate(interview.id, "upcoming")}>
            <RotateCcw className="h-3.5 w-3.5" /> Restore
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive"
            onClick={() => onDelete(interview.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ── Empty State ───────────────────────────────────────────────────

function EmptyState({ onAdd }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <CalendarDays className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-black mb-2">No interviews scheduled</h2>
      <p className="text-muted-foreground text-sm max-w-xs mb-6 leading-relaxed">
        Add an upcoming interview and we'll build a day-by-day prep plan so you walk in fully prepared.
      </p>
      <Button onClick={onAdd} className="gap-2">
        <Plus className="h-4 w-4" /> Add your first interview
      </Button>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function InterviewsPage() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchInterviews = useCallback(async () => {
    const res = await fetch("/api/upcoming-interviews");
    if (res.ok) setInterviews(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.email) fetchInterviews();
  }, [user?.email, fetchInterviews]);

  const handleAdd = async (data) => {
    const res = await fetch("/api/upcoming-interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const newItem = await res.json();
      setInterviews((prev) => [...prev, newItem].sort(
        (a, b) => new Date(a.interview_date) - new Date(b.interview_date)
      ));
    }
  };

  const handleUpdate = async (id, status) => {
    const res = await fetch("/api/upcoming-interviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setInterviews((prev) => prev.map((iv) => iv.id === id ? updated : iv));
    }
  };

  const handleDelete = async (id) => {
    await fetch("/api/upcoming-interviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setInterviews((prev) => prev.filter((iv) => iv.id !== id));
  };

  const upcoming   = interviews.filter((iv) => iv.status === "upcoming" && getDaysUntil(iv.interview_date) >= 0);
  const past       = interviews.filter((iv) => iv.status === "upcoming" && getDaysUntil(iv.interview_date) < 0);
  const done       = interviews.filter((iv) => iv.status === "done");
  const cancelled  = interviews.filter((iv) => iv.status === "cancelled");

  const nextUp = upcoming[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 px-4 pt-6">
      <AddInterviewModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Interview Tracker</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {upcoming.length > 0
              ? `${upcoming.length} upcoming · auto daily prep plan`
              : "Add an interview to get your prep plan"}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {/* Next interview hero banner */}
      {nextUp && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl mb-6 p-px"
          style={{ background: "linear-gradient(135deg, #8b5cf640 0%, #10b98130 100%)" }}
        >
          <div className="rounded-2xl bg-card/95 p-5">
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/8 blur-2xl pointer-events-none" />
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Next up
            </p>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">{nextUp.company}</h2>
                <p className="text-sm text-muted-foreground">{nextUp.role} · {ROUND_MAP[nextUp.round_type]?.label}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />{formatDate(nextUp.interview_date)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className={cn(
                  "text-5xl font-black tabular-nums leading-none",
                  getDaysUntil(nextUp.interview_date) <= 1 ? "text-red-400" :
                  getDaysUntil(nextUp.interview_date) <= 3 ? "text-amber-400" : "text-primary"
                )}>
                  {getDaysUntil(nextUp.interview_date)}
                </div>
                <div className="text-xs text-muted-foreground">days left</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Upcoming interviews */}
      {upcoming.length === 0 && past.length === 0 && done.length === 0 && cancelled.length === 0 ? (
        <EmptyState onAdd={() => setModalOpen(true)} />
      ) : (
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <div className="space-y-3">
              {upcoming.map((iv) => (
                <InterviewCard key={iv.id} interview={iv} onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {(past.length > 0 || done.length > 0 || cancelled.length > 0) && (
            <div className="space-y-3 pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Past & Completed</p>
              {[...past, ...done, ...cancelled].map((iv) => (
                <InterviewCard key={iv.id} interview={iv} onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
