"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus,
  BarChart3, Brain, CheckCircle2,
  ArrowRight, Loader2, Mic, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────

const ratingColor = (r) => {
  if (r >= 7.5) return "#10b981";
  if (r >= 5)   return "#f59e0b";
  return "#ef4444";
};

const TYPE_META = {
  mock:   { label: "Mock",   color: "#8b5cf6", bg: "#8b5cf620" },
  live:   { label: "Live",   color: "#10b981", bg: "#10b98120" },
  resume: { label: "Resume", color: "#f59e0b", bg: "#f59e0b20" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// ── Custom Tooltip ────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const type = payload[0]?.payload?.type;
  const meta = type ? TYPE_META[type] : null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-medium mb-1">{label}</p>
      {meta && (
        <p className="mb-0.5" style={{ color: meta.color }}>
          <span className="font-semibold">{meta.label}</span>
        </p>
      )}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color, index }) {
  return (
    <motion.div variants={fadeUp} custom={index}
      className="relative bg-card border border-border rounded-2xl p-6 overflow-hidden group hover:border-primary/30 transition-colors duration-300">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: color + "20", transform: "translate(30%, -30%)" }} />
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: color + "18" }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black tracking-tight mb-0.5">{value}</p>
      <p className="text-sm font-medium">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </motion.div>
  );
}

// ── Type badge ────────────────────────────────────────────────────

function TypeBadge({ type }) {
  const meta = TYPE_META[type] || TYPE_META.mock;
  const Icon = type === "live" ? Mic : type === "resume" ? FileText : BarChart3;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ color: meta.color, background: meta.bg }}>
      <Icon className="h-2.5 w-2.5" />
      {meta.label}
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────────

function EmptyState({ router }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-32 text-center">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <BarChart3 className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold mb-2">No data yet</h2>
      <p className="text-muted-foreground text-sm max-w-sm mb-6 leading-relaxed">
        Complete at least one interview to start seeing your progress analytics.
      </p>
      <Button onClick={() => router.push("/dashboard")} className="gap-2">
        Start an interview <ArrowRight className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}

// ── Dot colored by type ───────────────────────────────────────────

function TypeDot(props) {
  const { cx, cy, payload } = props;
  const meta = TYPE_META[payload?.type] || TYPE_META.mock;
  return (
    <circle cx={cx} cy={cy} r={5} fill={meta.color}
      stroke="#fff" strokeWidth={2} />
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`/api/analytics?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.totalInterviews === 0) return <EmptyState router={router} />;

  const ImprovementIcon = data.improvement > 0 ? TrendingUp : data.improvement < 0 ? TrendingDown : Minus;
  const improvementColor = data.improvement > 0 ? "#10b981" : data.improvement < 0 ? "#ef4444" : "#6b7280";

  const stats = [
    {
      icon: Brain,
      label: "Interviews completed",
      value: data.totalInterviews,
      sub: "across all formats",
      color: "#8b5cf6",
    },
    {
      icon: CheckCircle2,
      label: "Questions answered",
      value: data.totalQuestions,
      sub: "with AI feedback",
      color: "#3b82f6",
    },
    {
      icon: BarChart3,
      label: "Overall avg rating",
      value: `${data.overallAvg} / 10`,
      sub: ratingLabel(data.overallAvg),
      color: ratingColor(data.overallAvg),
    },
    {
      icon: ImprovementIcon,
      label: "Improvement",
      value: `${data.improvement > 0 ? "+" : ""}${data.improvement}%`,
      sub: data.totalInterviews >= 4 ? "first vs recent sessions" : "need 4+ sessions to measure",
      color: improvementColor,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <motion.div initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
        <motion.h1 variants={fadeUp} className="text-3xl font-black tracking-tight">
          Your Progress
        </motion.h1>
        <motion.p variants={fadeUp} className="text-muted-foreground text-sm mt-1">
          Track how your interview performance improves over time — across all formats.
        </motion.p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={stagger} initial="hidden" animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatCard key={s.label} {...s} index={i} />)}
      </motion.div>

      {/* By type */}
      {data.byType?.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-1">Performance by format</h2>
          <p className="text-xs text-muted-foreground mb-5">Average score across interview types</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.byType.map((t) => (
              <div key={t.type} className="rounded-xl p-4 flex items-center gap-4"
                style={{ background: t.color + "10", border: `1px solid ${t.color}30` }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: t.color + "20" }}>
                  {t.type === "Live" ? (
                    <Mic className="h-5 w-5" style={{ color: t.color }} />
                  ) : t.type === "Resume" ? (
                    <FileText className="h-5 w-5" style={{ color: t.color }} />
                  ) : (
                    <BarChart3 className="h-5 w-5" style={{ color: t.color }} />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.label}</p>
                  <p className="text-xl font-black" style={{ color: t.color }}>{t.avg}<span className="text-xs font-normal text-muted-foreground ml-0.5">/10</span></p>
                  <p className="text-xs text-muted-foreground">{t.count} session{t.count !== 1 ? "s" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Rating trend */}
      {data.trend.length >= 1 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-base font-semibold">Rating trend</h2>
            <div className="flex items-center gap-3">
              {Object.values(TYPE_META).map((m) => (
                <span key={m.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full inline-block" style={{ background: m.color }} />
                  {m.label}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-6">Average score per session — dots colored by format</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone" dataKey="avg" name="Avg rating"
                stroke="hsl(var(--primary))" strokeWidth={2}
                dot={<TypeDot />}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
          {data.trend.length === 1 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Complete more interviews to see your trend
            </p>
          )}
        </motion.div>
      )}

      {/* By role */}
      {data.byRole.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
          className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-1">Performance by role</h2>
          <p className="text-xs text-muted-foreground mb-6">Average rating across all job profiles</p>
          {data.byRole.every((r) => r.avg === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BarChart3 className="h-8 w-8 mb-3 opacity-20" />
              <p className="text-sm">No rating data yet for completed sessions.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.byRole} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="role" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="avg" name="Avg rating" radius={[6, 6, 0, 0]} minPointSize={4}
                  label={{ position: "top", fontSize: 11, fill: "hsl(var(--muted-foreground))", formatter: (v) => v > 0 ? v : "" }}>
                  {data.byRole.map((entry, i) => (
                    <Cell key={i} fill={entry.avg > 0 ? ratingColor(entry.avg) : "hsl(var(--border))"} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      )}

      {/* Recent sessions */}
      {data.recent.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
          className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold">Recent sessions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Your last {data.recent.length} completed interviews across all formats</p>
          </div>
          <div className="divide-y divide-border">
            {data.recent.map((s, i) => (
              <motion.div key={s.mockId} variants={fadeUp} initial="hidden" animate="visible" custom={i}
                className="flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-primary">{i + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{s.role}</p>
                      <TypeBadge type={s.type} />
                    </div>
                    <p className="text-xs text-muted-foreground">{s.date} · {s.questions} {s.type === "live" ? "exchanges" : "questions"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {s.avg > 0 ? (
                      <>
                        <p className="text-sm font-bold" style={{ color: ratingColor(s.avg) }}>{s.avg}/10</p>
                        <p className="text-xs text-muted-foreground">{ratingLabel(s.avg)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-muted-foreground">—</p>
                        <p className="text-xs text-muted-foreground">No rating saved</p>
                      </>
                    )}
                  </div>
                  <Button variant="ghost" size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs gap-1"
                    onClick={() => {
                      if (s.type === "live") {
                        router.push(`/dashboard/live-interview/${s.mockId}`);
                      } else {
                        router.push(`/dashboard/interview/${s.mockId}/feedback`);
                      }
                    }}>
                    View <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ratingLabel(r) {
  if (r >= 8.5) return "Excellent";
  if (r >= 7)   return "Good";
  if (r >= 5)   return "Average";
  if (r >= 3)   return "Needs work";
  return "Keep practicing";
}
