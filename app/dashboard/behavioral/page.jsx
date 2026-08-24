"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RoleCombobox } from "@/components/ui/role-combobox";
import { cn } from "@/lib/utils";
import {
  Sparkles, RefreshCw, ChevronDown, ChevronUp,
  Check, X, Lightbulb, AlertTriangle, Star,
  Mic, MicOff, Loader2, ArrowRight, Brain,
  MessageSquare, Target, TrendingUp, RotateCcw,
  Crown, Handshake, Trophy, Compass, Scale, Rocket,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────

const JOB_ROLES = [
  "Full Stack Developer", "Frontend Developer", "Backend Developer",
  "React Developer", "Node.js Developer", "Python Developer", "Java Developer",
  "Mobile Developer (Android)", "Mobile Developer (iOS)",
  "Data Scientist", "Machine Learning Engineer", "DevOps Engineer", "QA Engineer",
  "System Design", "Product Manager", "Senior Product Manager",
  "HR Generalist", "HR Business Partner", "Technical Recruiter", "Talent Acquisition Manager",
];

const CATEGORIES = [
  { id: "leadership",    label: "Leadership",          icon: Crown,     desc: "Ownership, influence, driving outcomes" },
  { id: "conflict",      label: "Conflict & Teamwork",  icon: Handshake, desc: "Disagreements, collaboration, difficult people" },
  { id: "failure",       label: "Failure & Growth",     icon: TrendingUp,desc: "Mistakes, setbacks, what you learned" },
  { id: "achievement",   label: "Achievement",          icon: Trophy,    desc: "Proudest wins, impact, going beyond" },
  { id: "ambiguity",     label: "Ambiguity & Change",   icon: Compass,   desc: "Uncertainty, pivoting, unclear requirements" },
  { id: "prioritization",label: "Prioritization",       icon: Scale,     desc: "Trade-offs, deadlines, competing priorities" },
  { id: "initiative",    label: "Initiative",           icon: Rocket,    desc: "Going beyond, proactive improvements" },
  { id: "feedback",      label: "Receiving Feedback",   icon: MessageSquare, desc: "Criticism, coaching, adapting your approach" },
];

const EXPERIENCE_LEVELS = [
  "Entry-level (0–2 years)",
  "Mid-level (2–5 years)",
  "Senior (5–8 years)",
  "Staff / Lead (8+ years)",
];

const STAR_COLORS = {
  strong:  { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25", label: "Strong" },
  weak:    { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25",   label: "Weak" },
  missing: { text: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/25",     label: "Missing" },
};

// ── STAR Guide Panel ──────────────────────────────────────────────

function StarGuide({ guide }) {
  const parts = [
    { key: "situation", label: "S — Situation", color: "text-blue-400",    bg: "bg-blue-500/8",   border: "border-blue-500/20" },
    { key: "task",      label: "T — Task",      color: "text-violet-400",  bg: "bg-violet-500/8", border: "border-violet-500/20" },
    { key: "action",    label: "A — Action",    color: "text-emerald-400", bg: "bg-emerald-500/8",border: "border-emerald-500/20" },
    { key: "result",    label: "R — Result",    color: "text-amber-400",   bg: "bg-amber-500/8",  border: "border-amber-500/20" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {parts.map(({ key, label, color, bg, border }) => (
        <div key={key} className={cn("rounded-xl border p-3", bg, border)}>
          <p className={cn("text-xs font-black mb-1", color)}>{label}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{guide[key]}</p>
        </div>
      ))}
    </div>
  );
}

// ── Score Ring ────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 10);
  const colorClass = score >= 7.5
    ? "text-emerald-600 dark:text-emerald-400"
    : score >= 5
    ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg width={64} height={64} viewBox="0 0 64 64">
        <circle cx={32} cy={32} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="text-border/60" />
        <motion.circle cx={32} cy={32} r={r} fill="none"
          stroke="currentColor" strokeWidth={5} strokeLinecap="round"
          className={colorClass}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-base font-black font-mono tabular-nums", colorClass)}>{score}</span>
      </div>
    </div>
  );
}

// ── STAR Breakdown Card ───────────────────────────────────────────

function StarBreakdown({ breakdown }) {
  const parts = [
    { key: "situation", label: "Situation" },
    { key: "task",      label: "Task" },
    { key: "action",    label: "Action" },
    { key: "result",    label: "Result" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {parts.map(({ key, label }) => {
        const item = breakdown[key];
        const style = STAR_COLORS[item?.quality] ?? STAR_COLORS.weak;
        return (
          <div key={key} className={cn("rounded-xl border p-3", style.bg, style.border)}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-black">{label}</p>
              <span className={cn("text-xs font-bold", style.text)}>{style.label}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{item?.comment}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Feedback Panel ────────────────────────────────────────────────

function FeedbackPanel({ feedback, onRetry, onNext }) {
  const [showImproved, setShowImproved] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Score + verdict */}
      <div className="flex items-center gap-4 bg-card border border-border rounded-2xl p-5">
        <ScoreRing score={feedback.score} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider mb-1">STAR Score</p>
          <p className="font-bold text-sm leading-snug">{feedback.verdict}</p>
        </div>
      </div>

      {/* STAR breakdown */}
      <div className="space-y-2">
        <p className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider">STAR Breakdown</p>
        <StarBreakdown breakdown={feedback.starBreakdown} />
      </div>

      {/* Strengths */}
      {feedback.strengths?.length > 0 && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" /> What worked
          </p>
          <ul className="space-y-1">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {feedback.improvements?.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" /> What to improve
          </p>
          <ul className="space-y-1">
            {feedback.improvements.map((s, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improved answer */}
      {feedback.improvedAnswer && (
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setShowImproved((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors text-sm font-semibold"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> See a stronger answer
            </span>
            {showImproved ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <AnimatePresence initial={false}>
            {showImproved && (
              <motion.div
                initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                transition={{ duration: 0.25 }} className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-1 border-t border-border/40">
                  <p className="text-sm text-muted-foreground leading-relaxed italic">"{feedback.improvedAnswer}"</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1 gap-1.5" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" /> Try again
        </Button>
        <Button className="flex-1 gap-1.5" onClick={onNext}>
          Next question <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ── Answer Input ──────────────────────────────────────────────────

function AnswerInput({ onSubmit, loading }) {
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const finalRef = useRef("");

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    finalRef.current = answer;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += t + " ";
        else interim += t;
      }
      setAnswer((finalRef.current + interim).trim());
    };
    rec.onerror = (e) => { if (e.error !== "aborted") setListening(false); };
    rec.onend = () => { if (recRef.current === rec) setListening(false); };
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [answer]);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answer.trim()) return;
    onSubmit(answer.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Answer using the STAR method — describe the Situation, your Task, the Actions you took, and the Result…"
          rows={6}
          className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition leading-relaxed placeholder:text-muted-foreground/50 pr-14"
        />
        {/* Mic button */}
        <button
          type="button"
          onClick={listening ? stopListening : startListening}
          className={cn(
            "absolute bottom-3 right-3 h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
            listening ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          )}
          title={listening ? "Stop recording" : "Answer by voice"}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
      </div>

      {listening && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-red-400">
          <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          Listening… speak your answer, click mic to stop
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{answer.split(/\s+/).filter(Boolean).length} words</p>
        <Button type="submit" disabled={!answer.trim() || loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Get STAR feedback
        </Button>
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function BehavioralPage() {
  const [role, setRole]               = useState("");
  const [experience, setExperience]   = useState("Mid-level (2-5 years)");
  const [selectedCat, setSelectedCat] = useState(null);
  const [question, setQuestion]       = useState(null);
  const [feedback, setFeedback]       = useState(null);
  const [loadingQ, setLoadingQ]       = useState(false);
  const [loadingF, setLoadingF]       = useState(false);
  const [showGuide, setShowGuide]     = useState(true);
  const [currentAnswer, setCurrentAnswer] = useState("");

  const generateQuestion = async (catId) => {
    setSelectedCat(catId);
    setQuestion(null);
    setFeedback(null);
    setLoadingQ(true);
    try {
      const res = await fetch("/api/behavioral/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: catId, role, experience }),
      });
      if (res.ok) setQuestion(await res.json());
    } finally {
      setLoadingQ(false);
    }
  };

  const handleAnswer = async (answer) => {
    setCurrentAnswer(answer);
    setLoadingF(true);
    try {
      const res = await fetch("/api/behavioral/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.question, answer, category: selectedCat }),
      });
      if (res.ok) setFeedback(await res.json());
    } finally {
      setLoadingF(false);
    }
  };

  const handleRetry  = () => { setFeedback(null); };
  const handleNext   = () => { setFeedback(null); setQuestion(null); generateQuestion(selectedCat); };
  const handleReset  = () => { setFeedback(null); setQuestion(null); setSelectedCat(null); };

  const cat = CATEGORIES.find((c) => c.id === selectedCat);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-20">

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Behavioral Practice</h1>
          <p className="text-sm text-muted-foreground">
            Practice STAR-method answers with AI coaching — pick a category and get instant structured feedback.
          </p>
        </div>
      </div>

      {/* Setup */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-4">
        <p className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider">Your context (optional)</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Target role</label>
            <RoleCombobox
              options={JOB_ROLES}
              placeholder="e.g. Senior Engineer, HR Generalist"
              value={role}
              onChange={setRole}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Experience</label>
            <select value={experience} onChange={(e) => setExperience(e.target.value)}
              className="w-full h-9 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer">
              {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Category grid */}
      {!selectedCat && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider mb-3">Choose a category</p>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => generateQuestion(cat.id)}
                className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <cat.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm group-hover:text-primary transition-colors">{cat.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cat.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Active question flow */}
      <AnimatePresence mode="wait">
        {selectedCat && (
          <motion.div key="question-flow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Category badge + back */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {cat?.icon && <cat.icon className="h-4 w-4 text-primary" />}
                <span className="font-bold text-sm">{cat?.label}</span>
              </div>
              <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <RotateCcw className="h-3.5 w-3.5" /> Change category
              </button>
            </div>

            {/* Loading question */}
            {loadingQ && (
              <div className="flex flex-col items-center py-16 gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                  <Sparkles className="h-8 w-8 text-primary" />
                </motion.div>
                <p className="text-sm text-muted-foreground">Generating your question…</p>
              </div>
            )}

            {/* Question + guide */}
            {question && !loadingQ && (
              <div className="space-y-4">
                {/* Question card */}
                <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-3">
                  <p className="text-xs font-bold font-mono text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Interview Question
                  </p>
                  <p className="font-semibold text-base leading-snug">{question.question}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">{question.context}</p>

                  {/* Tips + red flags */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {question.tips?.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Tips
                        </p>
                        {question.tips.map((t, i) => (
                          <p key={i} className="text-xs text-muted-foreground flex gap-1.5">
                            <span className="text-emerald-600 dark:text-emerald-400 shrink-0">·</span>{t}
                          </p>
                        ))}
                      </div>
                    )}
                    {question.redFlags?.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Avoid
                        </p>
                        {question.redFlags.map((f, i) => (
                          <p key={i} className="text-xs text-muted-foreground flex gap-1.5">
                            <span className="text-red-600 dark:text-red-400 shrink-0">·</span>{f}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Example opener */}
                  {question.exampleOpener && (
                    <div className="bg-secondary/40 rounded-xl px-3 py-2.5 mt-1">
                      <p className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" /> Strong opener
                      </p>
                      <p className="text-xs text-foreground/80 italic">"{question.exampleOpener}…"</p>
                    </div>
                  )}

                  {/* Next question button */}
                  <div className="flex justify-end">
                    <button onClick={() => generateQuestion(selectedCat)}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                      <RefreshCw className="h-3.5 w-3.5" /> Different question
                    </button>
                  </div>
                </div>

                {/* STAR guide toggle */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowGuide((p) => !p)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-secondary/30 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider">
                      <Target className="h-4 w-4" /> STAR framework guide
                    </span>
                    {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {showGuide && (
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                        transition={{ duration: 0.25 }} className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-border/40 pt-3">
                          <StarGuide guide={question.starGuide} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Answer input or feedback */}
                {!feedback ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider">Your answer</p>
                    <AnswerInput onSubmit={handleAnswer} loading={loadingF} />
                    {loadingF && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Evaluating your STAR structure…
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" /> Feedback
                    </p>
                    <FeedbackPanel feedback={feedback} onRetry={handleRetry} onNext={handleNext} />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
