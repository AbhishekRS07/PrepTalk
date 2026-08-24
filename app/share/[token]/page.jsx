"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Trophy, MessageSquare,
  CheckCircle2, XCircle, Loader2, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

// ── Helpers (same as feedback page) ──────────────────────────────

const getRatingColor = (rating) => {
  const r = parseFloat(rating);
  if (r >= 7) return "text-emerald-600 dark:text-emerald-400";
  if (r >= 5) return "text-amber-600 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
};

const getRatingBg = (rating) => {
  const r = parseFloat(rating);
  if (r >= 7) return "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
  if (r >= 5) return "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800";
  return "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800";
};

const getScoreLabel = (score) => {
  if (score >= 8) return { label: "Excellent", color: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 6) return { label: "Good", color: "text-amber-600 dark:text-amber-400" };
  if (score >= 4) return { label: "Needs Work", color: "text-orange-500 dark:text-orange-400" };
  return { label: "Keep Practicing", color: "text-red-500 dark:text-red-400" };
};

// ── Score Ring ────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const progress = (score / 10) * circumference;
  const { label, color } = getScoreLabel(score);

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-secondary" />
        <motion.circle
          cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          className={cn(
            score >= 8 ? "text-emerald-500" : score >= 6 ? "text-amber-500" :
            score >= 4 ? "text-orange-500" : "text-red-500"
          )}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }} className="text-3xl font-black font-mono">
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground">out of 10</span>
      </div>
    </div>
  );
}

// ── Feedback Item ─────────────────────────────────────────────────

function FeedbackItem({ item, index }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={cn("border rounded-2xl overflow-hidden", item.skipped ? "border-dashed border-muted-foreground/30" : "border-border")}
    >
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-secondary/50 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn("shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold",
            item.skipped ? "bg-muted text-muted-foreground" : "bg-secondary")}>
            {index + 1}
          </span>
          <span className={cn("text-sm font-medium truncate", item.skipped && "text-muted-foreground")}>
            {item.question}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {item.skipped
            ? <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Skipped</span>
            : <span className={cn("text-sm font-bold", getRatingColor(item.rating))}>{item.rating}/10</span>
          }
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden">
            <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
              {!item.skipped && (
                <>
                  <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border", getRatingBg(item.rating))}>
                    {parseFloat(item.rating) >= 7
                      ? <CheckCircle2 className="h-3.5 w-3.5" />
                      : <XCircle className="h-3.5 w-3.5" />}
                    <span className={getRatingColor(item.rating)}>Rating: {item.rating}/10</span>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Answer Given</p>
                    <p className="text-sm leading-relaxed">{item.userAns || "No answer recorded."}</p>
                  </div>
                </>
              )}
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5 uppercase tracking-wide">Model Answer</p>
                <p className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-100">{item.correctAns}</p>
              </div>
              {!item.skipped && item.feedback && (
                <div className="rounded-xl border border-primary/20 bg-accent p-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">AI Feedback</p>
                  </div>
                  <p className="text-sm leading-relaxed text-accent-foreground">{item.feedback}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function SharePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-center px-4">
        <Lock className="h-10 w-10 text-muted-foreground/30" />
        <h1 className="text-xl font-bold">Link not found or expired</h1>
        <p className="text-sm text-muted-foreground">This shared interview may have been removed.</p>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">Go to PrepTalk</Link>
      </div>
    );
  }

  const { role, experience, avgRating, items } = data;
  const { label, color } = getScoreLabel(parseFloat(avgRating));
  const answeredCount = items.filter((i) => !i.skipped).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.svg" width={24} height={24} alt="PrepTalk" />
            <span className="font-bold text-sm">PrepTalk</span>
          </Link>
          <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
            Shared Interview Result
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-10 space-y-8">
        {/* Score card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
          <ScoreRing score={parseFloat(avgRating)} />
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-semibold font-mono text-muted-foreground uppercase tracking-widest">
                Interview Result
              </span>
            </div>
            <h1 className="text-2xl font-black mb-1">{role}</h1>
            <p className="text-sm text-muted-foreground mb-1">{experience} year{experience !== "1" ? "s" : ""} experience</p>
            <p className={cn("text-lg font-bold mb-3", color)}>{label}</p>
            <p className="text-sm text-muted-foreground">
              {answeredCount} of {items.length} question{items.length !== 1 ? "s" : ""} answered.
            </p>
          </div>
        </motion.div>

        {/* Questions */}
        <div>
          <h2 className="text-sm font-semibold font-mono text-muted-foreground uppercase tracking-widest mb-4">
            Question Breakdown
          </h2>
          <div className="space-y-3">
            {items.map((item, i) => (
              <FeedbackItem key={i} item={item} index={i} />
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center py-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">Want to practice your own mock interviews?</p>
          <Link href="/sign-in"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
            Try PrepTalk free →
          </Link>
        </div>
      </main>
    </div>
  );
}
