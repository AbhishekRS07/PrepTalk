"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import QuestionsSection from "./_components/QuestionsSection";
import RecordAns from "./_components/RecordAns";
import { Button } from "../../../../../components/ui/button";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, CircleStop,
  Loader2, X, Timer, TimerOff,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../../../components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ── Timer presets ─────────────────────────────────────────────────
const PRESETS = [
  { label: "Off",    seconds: 0 },
  { label: "1 min",  seconds: 60 },
  { label: "2 min",  seconds: 120 },
  { label: "3 min",  seconds: 180 },
];

// ── Countdown display ─────────────────────────────────────────────
function CountdownTimer({ seconds, total }) {
  if (!total) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct = total > 0 ? seconds / total : 0;
  const isWarning = seconds <= 30 && seconds > 10;
  const isDanger  = seconds <= 10;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isDanger ? "danger" : isWarning ? "warning" : "normal"}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono font-bold transition-colors duration-300",
          isDanger
            ? "bg-red-500/10 border-red-500/40 text-red-500"
            : isWarning
            ? "bg-amber-500/10 border-amber-500/40 text-amber-500"
            : "bg-secondary border-border text-foreground"
        )}
      >
        {/* Circular progress */}
        <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0 -rotate-90">
          <circle cx="9" cy="9" r="7" fill="none" strokeWidth="2"
            className="stroke-border" />
          <circle cx="9" cy="9" r="7" fill="none" strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * 7}`}
            strokeDashoffset={`${2 * Math.PI * 7 * (1 - pct)}`}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-1000",
              isDanger ? "stroke-red-500" : isWarning ? "stroke-amber-500" : "stroke-primary"
            )}
          />
        </svg>
        <motion.span
          key={seconds}
          animate={isDanger ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </motion.span>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Timer preset picker ───────────────────────────────────────────
function TimerPicker({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const current = PRESETS.find((p) => p.seconds === selected) || PRESETS[0];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((p) => !p)}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
        title="Set question timer"
      >
        {selected > 0 ? <Timer className="h-4 w-4" /> : <TimerOff className="h-4 w-4" />}
        <span className="hidden sm:inline text-xs">{current.label}</span>
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[100px]"
            >
              {PRESETS.map((p) => (
                <button
                  key={p.seconds}
                  onClick={() => { onChange(p.seconds); setOpen(false); }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors hover:bg-secondary",
                    selected === p.seconds && "text-primary font-semibold"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

const StartInterview = () => {
  const params = useParams();
  const [interviewData, setInterviewData] = useState();
  const [prepTalks, setPrepTalks] = useState([]);
  const [active, setActive] = useState(0);
  const [ending, setEnding] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const recordAnsRef = useRef();
  const router = useRouter();

  // Timer state
  const [timerDuration, setTimerDuration] = useState(0); // 0 = off
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    GetInterviewDetails();
  }, [params.interviewId]);

  // Reset + start timer whenever question changes or duration changes
  useEffect(() => {
    clearInterval(timerRef.current);
    if (timerDuration <= 0) { setTimeLeft(0); return; }
    setTimeLeft(timerDuration);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [active, timerDuration]);

  // Auto-advance when timer hits 0
  useEffect(() => {
    if (timerDuration <= 0 || timeLeft > 0) return;
    // Small delay so user sees 00:00
    const t = setTimeout(() => {
      if (active < prepTalks.length - 1) {
        handleNext();
      } else {
        handleEndInterview();
      }
    }, 800);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const GetInterviewDetails = async () => {
    try {
      const res = await fetch(`/api/interview/${params.interviewId}`);
      if (!res.ok) return;
      const data = await res.json();
      const raw = data.jsonMockResp;
      const cleaned = raw.replace(/^[^{[]*/, "").replace(/[^}\]]*$/, "").trim();
      const valid = cleaned.startsWith("[") ? cleaned : `[${cleaned}]`;
      setPrepTalks(JSON.parse(valid));
      setInterviewData(data);
    } catch (err) {
      console.error("Error fetching interview:", err);
    }
  };

  const handleNext = async () => {
    setNavigating(true);
    clearInterval(timerRef.current);
    if (recordAnsRef.current) await recordAnsRef.current.saveCurrentAnswer();
    setActive((p) => p + 1);
    setNavigating(false);
  };

  const handlePrev = async () => {
    setNavigating(true);
    clearInterval(timerRef.current);
    if (recordAnsRef.current) await recordAnsRef.current.saveCurrentAnswer();
    setActive((p) => p - 1);
    setNavigating(false);
  };

  const handleEndInterview = async () => {
    setEnding(true);
    clearInterval(timerRef.current);
    if (recordAnsRef.current) await recordAnsRef.current.saveCurrentAnswer();
    router.push("/dashboard/interview/" + interviewData?.mockId + "/feedback");
  };

  const progress = prepTalks.length
    ? Math.round(((active + 1) / prepTalks.length) * 100)
    : 0;

  // Interview questions haven't loaded yet — render a loading state instead of the
  // full layout with an empty "1 / 0" progress bar and a blank question card, which
  // looked broken/sparse for the brief window before GetInterviewDetails() resolves.
  if (!interviewData || prepTalks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur border-b border-border px-5 md:px-20 lg:px-36 py-3">
        <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto">

          {/* Left: progress */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {active + 1} / {prepTalks.length}
            </span>
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>

          {/* Right: timer + controls */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Timer display */}
            {timerDuration > 0 && (
              <CountdownTimer seconds={timeLeft} total={timerDuration} />
            )}

            {/* Timer picker */}
            <TimerPicker selected={timerDuration} onChange={setTimerDuration} />

            {/* Quit */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Quit</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Quit interview?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your progress won't be saved and no feedback will be generated. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep going</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => router.push("/dashboard")}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Quit without saving
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Prev */}
            <Button
              variant="outline"
              size="sm"
              disabled={active === 0 || navigating}
              onClick={handlePrev}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Prev</span>
            </Button>

            {/* Next / End */}
            {active < prepTalks.length - 1 ? (
              <Button size="sm" onClick={handleNext} disabled={navigating} className="gap-1">
                {navigating
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><span className="hidden sm:inline">Next</span><ChevronRight className="h-4 w-4" /></>
                }
              </Button>
            ) : (
              <Button size="sm" variant="destructive" onClick={handleEndInterview} disabled={ending} className="gap-1.5">
                {ending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><CircleStop className="h-4 w-4" /><span className="hidden sm:inline">End Interview</span></>
                }
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 px-5 md:px-20 lg:px-36 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card border border-border rounded-2xl p-6 min-h-80"
          >
            <QuestionsSection
              mockInterQuestion={prepTalks}
              active={active}
              onQuestionClick={setActive}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <RecordAns
              ref={recordAnsRef}
              mockInterQuestion={prepTalks}
              active={active}
              interviewData={interviewData}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StartInterview;
