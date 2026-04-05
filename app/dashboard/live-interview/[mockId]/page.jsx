"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, CheckCircle2, TrendingUp, BarChart3,
  ChevronDown, ChevronUp, Mic, Loader2, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const bandColor = (band) => {
  if (!band) return "#6b7280";
  const b = (band || "").toLowerCase();
  if (b === "excellent") return "#10b981";
  if (b === "good") return "#3b82f6";
  if (b === "average") return "#f59e0b";
  return "#ef4444";
};

const ratingBadgeColor = (r) => {
  if (r === "Strong") return "#10b981";
  if (r === "Average") return "#f59e0b";
  return "#ef4444";
};

export default function LiveInterviewDetailPage() {
  const { mockId } = useParams();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topicExpanded, setTopicExpanded] = useState(false);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  useEffect(() => {
    if (!mockId) return;
    fetch(`/api/live-interview/session?mockId=${mockId}`)
      .then((r) => r.json())
      .then((d) => { setSession(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [mockId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session || session.error) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Session not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const { debrief, messages = [], role, experience, createdAt } = session;
  const color = bandColor(debrief?.overallBand);
  const exchanges = messages.filter((m) => m.role === "user").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto pb-20 space-y-6"
    >
      {/* Back */}
      <button onClick={() => router.push("/dashboard")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Mic className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight">{role}</h1>
          <p className="text-xs text-muted-foreground">{experience} yr exp · {exchanges} exchanges · {createdAt}</p>
        </div>
      </div>

      {debrief ? (
        <>
          {/* Score card */}
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center gap-3">
            <div className="h-20 w-20 rounded-full border-4 flex items-center justify-center"
              style={{ borderColor: color }}>
              <span className="text-2xl font-black" style={{ color }}>{debrief.score}</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Live Interview Result</p>
              <h2 className="text-2xl font-black tracking-tight">{debrief.overallBand}</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">{debrief.summary}</p>
            </div>
          </div>

          {/* Strengths + improvements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-semibold">Strengths</h3>
              </div>
              <ul className="space-y-2">
                {debrief.strengths?.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold">Areas to improve</h3>
              </div>
              <ul className="space-y-2">
                {debrief.improvements?.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Topic breakdown */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setTopicExpanded((p) => !p)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold hover:bg-secondary/30 transition-colors"
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Topic Breakdown
              </span>
              {topicExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <AnimatePresence>
              {topicExpanded && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="divide-y divide-border border-t border-border">
                    {debrief.topicBreakdown?.map((t, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-3">
                        <span className="text-sm">{t.topic}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground hidden sm:block">{t.note}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: ratingBadgeColor(t.rating), background: ratingBadgeColor(t.rating) + "18" }}>
                            {t.rating}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
          No debrief available for this session.
        </div>
      )}

      {/* Transcript */}
      {messages.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <button
            onClick={() => setTranscriptExpanded((p) => !p)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold hover:bg-secondary/30 transition-colors"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Full Transcript
            </span>
            {transcriptExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <AnimatePresence>
            {transcriptExpanded && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-5 py-4 space-y-3 border-t border-border max-h-96 overflow-y-auto">
                  {messages.map((m, i) => (
                    <div key={i} className={cn("flex", m.role === "assistant" ? "justify-start" : "justify-end")}>
                      <div className={cn(
                        "max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                        m.role === "assistant"
                          ? "bg-secondary text-foreground"
                          : "bg-primary text-primary-foreground"
                      )}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <Button variant="outline" className="w-full gap-2" onClick={() => router.push("/dashboard")}>
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Button>
    </motion.div>
  );
}
