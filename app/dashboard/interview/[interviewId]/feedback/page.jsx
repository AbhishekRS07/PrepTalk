"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../../../../components/ui/button";
import {
  ChevronDown,
  Home,
  RotateCcw,
  Trophy,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────
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

// ── Score Ring ─────────────────────────────────────────────────
function ScoreRing({ score }) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const progress = (score / 10) * circumference;
  const { label, color } = getScoreLabel(score);

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-secondary" />
        <motion.circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          className={cn(
            score >= 8 ? "text-emerald-500" :
            score >= 6 ? "text-amber-500" :
            score >= 4 ? "text-orange-500" : "text-red-500"
          )}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-4xl font-black"
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground">out of 10</span>
      </div>
    </div>
  );
}

// ── Answer Item ─────────────────────────────────────────────────
function FeedbackItem({ item, index }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={cn("border rounded-2xl overflow-hidden", item.skipped ? "border-dashed border-muted-foreground/30" : "border-border")}
    >
      {/* Trigger */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn("shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold", item.skipped ? "bg-muted text-muted-foreground" : "bg-secondary")}>
            {index + 1}
          </span>
          <span className={cn("text-sm font-medium truncate", item.skipped && "text-muted-foreground")}>
            {item.question}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {item.skipped ? (
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Skipped</span>
          ) : (
            <span className={cn("text-sm font-bold", getRatingColor(item.rating))}>
              {item.rating}/10
            </span>
          )}
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
          />
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
              {!item.skipped && (
                <>
                  {/* Rating badge */}
                  <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border", getRatingBg(item.rating))}>
                    {parseFloat(item.rating) >= 7
                      ? <CheckCircle2 className="h-3.5 w-3.5" />
                      : <XCircle className="h-3.5 w-3.5" />}
                    <span className={getRatingColor(item.rating)}>
                      Rating: {item.rating}/10
                    </span>
                  </div>

                  {/* Your answer */}
                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Your Answer</p>
                    <p className="text-sm leading-relaxed">{item.userAns || "No answer recorded."}</p>
                  </div>
                </>
              )}

              {item.skipped && (
                <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-secondary/20 p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Not Answered</p>
                  <p className="text-sm text-muted-foreground">You skipped this question. Review the model answer below to prepare for next time.</p>
                </div>
              )}

              {/* Model answer */}
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5 uppercase tracking-wide">Model Answer</p>
                <p className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-100">{item.correctAns}</p>
              </div>

              {/* Feedback */}
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

// ── Page ───────────────────────────────────────────────────────
const Feedback = ({ params }) => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    GetFeedback();
  }, []);

  const GetFeedback = async () => {
    try {
      // Fetch saved answers
      const answersRes = await fetch(`/api/answer/${params.interviewId}`);
      const answers = await answersRes.json();

      // Fetch the original interview questions
      const interviewRes = await fetch(`/api/interview/${params.interviewId}`);
      const interviewRows = interviewRes.ok ? [await interviewRes.json()] : [];

      let allQuestions = [];
      if (interviewRows.length > 0) {
        try {
          const raw = interviewRows[0].jsonMockResp;
          const cleaned = raw.replace(/^[^{[]*/, "").replace(/[^}\]]*$/, "").trim();
          const valid = cleaned.startsWith("[") ? cleaned : `[${cleaned}]`;
          allQuestions = JSON.parse(valid);
        } catch (e) {
          console.error("Failed to parse interview questions:", e);
        }
      }

      // Merge: for each original question, find matching saved answer or mark as skipped
      const answerMap = {};
      answers.forEach((a) => { answerMap[a.question] = a; });

      const merged = allQuestions.map((q, i) => {
        const saved = answerMap[q.question];
        if (saved) return saved;
        // Skipped question — no answer recorded
        return {
          id: `skipped-${i}`,
          question: q.question,
          correctAns: q.answer,
          userAns: null,
          feedback: null,
          rating: null,
          skipped: true,
        };
      });

      const list = merged.length > 0 ? merged : answers;
      setFeedbackList(list);

      const answered = list.filter((item) => !item.skipped && item.rating);
      if (answered.length > 0) {
        const total = answered.reduce((sum, item) => sum + parseFloat(item.rating || 0), 0);
        setAverageRating((total / answered.length).toFixed(1));
      }
    } catch (err) {
      console.error("Error fetching feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (feedbackList.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center px-4">
        <div className="text-5xl mb-4">🤔</div>
        <h2 className="text-2xl font-bold mb-2">No feedback found</h2>
        <p className="text-muted-foreground mb-8 text-sm">
          It looks like no answers were recorded for this interview. Try starting the interview again.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Try Again
          </Button>
          <Button onClick={() => router.replace("/dashboard")} className="gap-2">
            <Home className="h-4 w-4" /> Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { label, color } = getScoreLabel(parseFloat(averageRating));
  const answeredCount = feedbackList.filter((item) => !item.skipped).length;
  const skippedCount = feedbackList.filter((item) => item.skipped).length;

  return (
    <div className="max-w-5xl mx-auto py-10 px-5 md:px-10 space-y-8">
      {/* Score card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8"
      >
        <ScoreRing score={parseFloat(averageRating)} />

        <div className="text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Interview Complete
            </span>
          </div>
          <h1 className="text-3xl font-black mb-1">
            {parseFloat(averageRating) >= 7 ? "Great job!" : "Keep it up!"}
          </h1>
          <p className={cn("text-lg font-bold mb-3", color)}>{label}</p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            You answered {answeredCount} of {feedbackList.length} question{feedbackList.length !== 1 ? "s" : ""}.
            {skippedCount > 0 && ` ${skippedCount} skipped.`}{" "}
            Review each answer below to see where you can improve.
          </p>
        </div>
      </motion.div>

      {/* Per-question breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Question Breakdown
        </h2>
        <div className="space-y-3">
          {feedbackList.map((item, index) => (
            <FeedbackItem key={item.id || index} item={item} index={index} />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-8">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => router.replace(`/dashboard/interview/${params.interviewId}/start`)}
        >
          <RotateCcw className="h-4 w-4" /> Retry Interview
        </Button>
        <Button
          className="flex-1 gap-2"
          onClick={() => router.replace("/dashboard")}
        >
          <Home className="h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Feedback;
