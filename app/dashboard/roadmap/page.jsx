"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Check, ChevronDown, ChevronUp, ExternalLink, Loader2,
  RotateCcw, Sparkles, Trophy, MapPin, Clock, Lightbulb,
  ArrowRight, Target, AlertTriangle,
} from "lucide-react";
import MilestoneCompletionEffect from "@/components/MilestoneCompletionEffect";

// ── Confirm Modal ─────────────────────────────────────────────────

function ConfirmModal({ open, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
            onClick={onCancel}
          />
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base mb-1">Start fresh?</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      This will delete your current roadmap and all progress. You can generate a new one right after.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 px-6 pb-5">
                <Button variant="outline" className="flex-1" onClick={onCancel}>
                  Cancel
                </Button>
                <Button variant="destructive" className="flex-1" onClick={onConfirm}>
                  Delete & restart
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Helpers ───────────────────────────────────────────────────────

function getAllMilestones(phases = []) {
  return phases.flatMap((p) => p.milestones ?? []);
}

// ── Setup data ────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  "Student / Recent Graduate",
  "Frontend Developer (React / Vue / Angular)",
  "Backend Developer (Java / Spring)",
  "Backend Developer (Node.js)",
  "Backend Developer (Python / Django / FastAPI)",
  "Backend Developer (Go / Rust)",
  "Full Stack Developer",
  "Mobile Developer (Android / Kotlin)",
  "Mobile Developer (iOS / Swift)",
  "Mobile Developer (React Native / Flutter)",
  "Data Scientist / ML Engineer",
  "Data Engineer",
  "DevOps / Cloud Engineer",
  "QA / Test Engineer",
  "Security Engineer",
  "Embedded / Systems Engineer",
  "Product Manager",
  "HR Generalist",
  "Technical Recruiter",
  "Career Switcher (non-tech background)",
  "Other",
];

const EXP_OPTIONS = [
  "Less than 1 year",
  "1–2 years",
  "2–3 years",
  "3–5 years",
  "5–8 years",
  "8+ years",
];


const TARGET_ROLE_OPTIONS = [
  "Frontend Developer",
  "Senior Frontend Developer",
  "React Developer",
  "Angular / Vue Developer",
  "Backend Developer",
  "Senior Backend Developer",
  "Java Developer",
  "Node.js Developer",
  "Python Developer",
  "Full Stack Developer",
  "Senior Full Stack Developer",
  "Mobile Developer (Android)",
  "Mobile Developer (iOS)",
  "React Native / Flutter Developer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Data Engineer",
  "DevOps / SRE Engineer",
  "Cloud Engineer (AWS / GCP / Azure)",
  "Software Development Engineer (SDE-1)",
  "Software Development Engineer (SDE-2)",
  "Senior Software Engineer",
  "Staff / Principal Engineer",
  "Engineering Manager",
  "QA / Automation Engineer",
  "Security Engineer",
  "Product Manager",
  "Senior Product Manager",
  "HR Generalist",
  "HR Business Partner",
  "Technical Recruiter",
  "Talent Acquisition Manager",
];

// ── Styled Select ─────────────────────────────────────────────────

function StyledSelect({ label, value, onChange, options, placeholder, required }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition appearance-none cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

// ── Setup Screen ──────────────────────────────────────────────────

function SetupScreen({ onGenerate, loading }) {
  const [currentRole, setCurrentRole] = useState("");
  const [experience, setExperience] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [targetRole, setTargetRole] = useState("");

  const canSubmit = currentRole && experience && currentCompany && targetRole;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const currentStatus = `${currentRole} with ${experience} of experience, currently working at ${currentCompany}`;
    onGenerate({ currentStatus, targetRole });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-lg mx-auto pt-10 pb-20 px-4"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-5"
        >
          <MapPin className="h-8 w-8 text-primary" />
        </motion.div>
        <h1 className="text-3xl font-black tracking-tight mb-2">Your Learning Roadmap</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
          Tell us where you are and where you want to go — AI will build a personalized step-by-step preparation plan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <StyledSelect
          label="Current role"
          value={currentRole}
          onChange={setCurrentRole}
          options={ROLE_OPTIONS}
          placeholder="What do you currently do?"
          required
        />

        <StyledSelect
          label="Years of experience"
          value={experience}
          onChange={setExperience}
          options={EXP_OPTIONS}
          placeholder="How many years of experience?"
          required
        />

        <div className="space-y-2">
          <label className="text-sm font-semibold">Current company</label>
          <Input
            placeholder="e.g. TCS, Infosys, Google, My Startup…"
            value={currentCompany}
            onChange={(e) => setCurrentCompany(e.target.value)}
            required
            className="h-12"
          />
        </div>

        <StyledSelect
          label="Target role"
          value={targetRole}
          onChange={setTargetRole}
          options={TARGET_ROLE_OPTIONS}
          placeholder="What role are you aiming for?"
          required
        />

        <Button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full h-12 gap-2 text-base mt-2"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating your roadmap…</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Generate My Roadmap</>
          )}
        </Button>
      </form>
    </motion.div>
  );
}

// ── Generating Animation ──────────────────────────────────────────

const GEN_STEPS = [
  "Analyzing your target role…",
  "Mapping required skills…",
  "Building your phase plan…",
  "Assigning PrepTalk features…",
  "Finalising your roadmap…",
];

function GeneratingScreen() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, GEN_STEPS.length - 1)), 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-32 px-4 gap-8"
    >
      {/* Pulsing orb */}
      <div className="relative">
        <motion.div
          className="h-20 w-20 rounded-full bg-primary/20"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="text-center space-y-3 max-w-xs">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-base font-semibold"
          >
            {GEN_STEPS[step]}
          </motion.p>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5">
          {GEN_STEPS.map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i <= step ? "bg-primary w-4" : "bg-border w-1.5"
              )}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Particle Burst ────────────────────────────────────────────────

const BURST_COLORS = ["#10b981", "#8b5cf6", "#f59e0b", "#3b82f6", "#ec4899", "#06b6d4"];

function ParticleBurst({ active }) {
  const particles = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * 360;
    const dist = 22 + (i % 3) * 10;
    return {
      x: Math.cos((angle * Math.PI) / 180) * dist,
      y: Math.sin((angle * Math.PI) / 180) * dist,
      color: BURST_COLORS[i % BURST_COLORS.length],
      size: i % 2 === 0 ? 5 : 3,
    };
  });

  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }}>
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: p.size, height: p.size,
                background: p.color,
                top: "50%", left: "50%",
                marginTop: -p.size / 2, marginLeft: -p.size / 2,
                boxShadow: `0 0 6px 2px ${p.color}80`,
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{ x: p.x, y: p.y, scale: 0, opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: i * 0.01 }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Achievement Toast ─────────────────────────────────────────────

function AchievementToast({ show, title }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.85 }}
          animate={{ opacity: 1, y: -38, scale: 1 }}
          exit={{ opacity: 0, y: -52, scale: 0.9 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-1/2 -translate-x-1/2 top-0 z-40 pointer-events-none whitespace-nowrap"
        >
          <div className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xl shadow-emerald-500/40">
            <Check className="h-3 w-3" strokeWidth={3} />
            Milestone Complete!
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Milestone Item ────────────────────────────────────────────────

function MilestoneItem({ milestone, isCompleted, isCurrent, isLast, phaseCompleted, onToggle, phaseColor }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(isCurrent);
  const prevCompletedRef = useRef(isCompleted);
  const [justCompleted, setJustCompleted] = useState(false);
  const [cardFlash, setCardFlash] = useState(false);
  const [showThreeEffect, setShowThreeEffect] = useState(false);
  const hideEffect = useCallback(() => setShowThreeEffect(false), []);

  useEffect(() => {
    if (isCompleted && !prevCompletedRef.current) {
      setJustCompleted(true);
      setCardFlash(true);
      setShowThreeEffect(true);
      setTimeout(() => setJustCompleted(false), 700);
      setTimeout(() => setCardFlash(false), 900);
    }
    prevCompletedRef.current = isCompleted;
  }, [isCompleted]);

  return (
    <>
      {showThreeEffect && (
        <MilestoneCompletionEffect onDone={hideEffect} />
      )}
      <div className="flex gap-4">
        {/* Left: dot + line */}
        <div className="flex flex-col items-center" style={{ minWidth: 32 }}>
          {/* Dot */}
          <div className="relative flex items-center justify-center mt-5">
            {/* Achievement toast */}
            <AchievementToast show={justCompleted} title={milestone.title} />
            {/* Particle burst */}
            <ParticleBurst active={justCompleted} />

            {/* Completion glow ring */}
            <AnimatePresence>
              {justCompleted && (
                <motion.div
                  className="absolute rounded-full border-2 border-emerald-400"
                  initial={{ width: 28, height: 28, opacity: 1 }}
                  animate={{ width: 60, height: 60, opacity: 0 }}
                  exit={{}}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{ top: "50%", left: "50%", x: "-50%", y: "-50%" }}
                />
              )}
            </AnimatePresence>

            {/* Pulse ring for current */}
            {isCurrent && !isCompleted && (
              <motion.div
                className="absolute rounded-full bg-primary/20"
                style={{ width: 36, height: 36 }}
                animate={{ scale: [1, 1.7, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            <motion.button
              onClick={() => onToggle(milestone.id)}
              animate={justCompleted ? { scale: [1, 1.5, 0.85, 1.12, 1] } : { scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", times: [0, 0.3, 0.6, 0.8, 1] }}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center z-10 relative cursor-pointer transition-all duration-300",
                isCompleted
                  ? "bg-emerald-500 shadow-[0_0_16px_4px_rgba(16,185,129,0.5)]"
                  : isCurrent
                  ? "bg-primary/15 border-2 border-primary hover:bg-primary/25"
                  : "bg-card border-2 border-border hover:border-primary/50 hover:bg-primary/5"
              )}
              title={isCompleted ? "Mark incomplete" : "Mark complete"}
            >
              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  </motion.div>
                ) : isCurrent ? (
                  <motion.div key="current" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <div className="h-2 w-2 rounded-full bg-border" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Connecting line */}
          {!isLast && (
            <div className="relative w-[2px] flex-1 mt-1 mb-1 min-h-[2.5rem] bg-border/40 overflow-hidden rounded-full">
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-emerald-400 to-emerald-600 origin-top rounded-full"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: isCompleted ? 1 : 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                style={{ boxShadow: isCompleted ? "0 0 6px rgba(16,185,129,0.6)" : "none" }}
              />
              <AnimatePresence>
                {justCompleted && (
                  <motion.div
                    className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_5px_rgba(16,185,129,1)]"
                    initial={{ top: "0%", opacity: 1 }}
                    animate={{ top: "100%", opacity: 0 }}
                    exit={{}}
                    transition={{ duration: 0.6, ease: "easeIn", delay: 0.12 }}
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right: card */}
        <div className="flex-1 pb-5">
          <motion.div
            layout
            animate={cardFlash ? {
              boxShadow: ["0 0 0px 0px rgba(16,185,129,0)", "0 0 24px 8px rgba(16,185,129,0.3)", "0 0 0px 0px rgba(16,185,129,0)"],
            } : {}}
            transition={{ duration: 0.8 }}
            className={cn(
              "rounded-2xl border overflow-hidden transition-all duration-300",
              isCompleted
                ? "border-emerald-500/25 bg-emerald-500/5"
                : isCurrent
                ? "border-primary/35 bg-primary/5 shadow-sm shadow-primary/10"
                : "border-border/70 bg-card hover:border-border hover:shadow-sm"
            )}
          >
            {/* Colored left accent */}
            <div className={cn(
              "flex",
              isCompleted ? "border-l-[3px] border-emerald-500/60" :
              isCurrent   ? "border-l-[3px] border-primary/70" :
                            "border-l-[3px] border-transparent"
            )}>
              {/* Card header */}
              <button
                onClick={() => setExpanded((p) => !p)}
                className="flex-1 flex items-start justify-between gap-3 p-4 text-left hover:bg-secondary/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} /> Done
                      </span>
                    )}
                    {isCurrent && !isCompleted && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                        <ArrowRight className="h-2.5 w-2.5" /> Up next
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />~{milestone.estimatedDays}d
                    </span>
                  </div>
                  <p className={cn(
                    "font-semibold text-sm leading-snug",
                    isCompleted && "line-through text-muted-foreground/70"
                  )}>
                    {milestone.title}
                  </p>
                </div>
                <div className="shrink-0 mt-1 text-muted-foreground">
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>
            </div>

            {/* Expanded content */}
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-4 border-t border-border/40">
                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed pt-3">
                      {milestone.description}
                    </p>

                    {/* Tasks */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">What to do</p>
                      <ul className="space-y-2">
                        {milestone.tasks?.map((task, ti) => (
                          <li key={ti} className="flex items-start gap-2.5 text-sm">
                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tip */}
                    {milestone.tip && (
                      <div className="flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2.5">
                        <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">{milestone.tip}</p>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      {milestone.appAction && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 flex-1 h-auto min-h-9 py-1.5 whitespace-normal text-center"
                          onClick={() => router.push(milestone.appAction.path)}
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          {milestone.appAction.label}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={isCompleted ? "outline" : "default"}
                        className={cn("gap-1.5 flex-1 h-9", isCompleted && "text-muted-foreground")}
                        onClick={() => onToggle(milestone.id)}
                      >
                        {isCompleted ? (
                          <><RotateCcw className="h-3.5 w-3.5" /> Mark Incomplete</>
                        ) : (
                          <><Check className="h-3.5 w-3.5" /> Mark Complete</>
                        )}
                      </Button>
                    </div>

                    {milestone.appAction?.hint && (
                      <p className="text-xs text-muted-foreground/70 italic leading-relaxed flex items-start gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {milestone.appAction.hint}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </>
  );
}

// ── Phase Section ─────────────────────────────────────────────────

const PHASE_COLORS = [
  { bg: "bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/30", glow: "rgba(139,92,246,0.3)" },
  { bg: "bg-blue-500/15",   text: "text-blue-400",   border: "border-blue-500/30",   glow: "rgba(59,130,246,0.3)" },
  { bg: "bg-emerald-500/15",text: "text-emerald-400",border: "border-emerald-500/30",glow: "rgba(16,185,129,0.3)" },
  { bg: "bg-amber-500/15",  text: "text-amber-400",  border: "border-amber-500/30",  glow: "rgba(245,158,11,0.3)" },
  { bg: "bg-pink-500/15",   text: "text-pink-400",   border: "border-pink-500/30",   glow: "rgba(236,72,153,0.3)" },
];

function PhaseSection({ phase, completedIds, currentMilestoneId, onToggle, index }) {
  const total = phase.milestones?.length ?? 0;
  const done = phase.milestones?.filter((m) => completedIds.has(m.id)).length ?? 0;
  const allDone = done === total;
  const color = PHASE_COLORS[index % PHASE_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Phase header */}
      <div className="flex items-center gap-3 mb-5">
        {/* Phase number badge */}
        <div className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 border",
          color.bg, color.text, color.border
        )}>
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">{phase.emoji}</span>
            <h2 className="text-base font-bold">{phase.title}</h2>
            {allDone && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1"
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} /> Phase complete
              </motion.span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{phase.description}</p>
        </div>

        <span className={cn("text-xs font-bold tabular-nums shrink-0", allDone ? "text-emerald-400" : "text-muted-foreground")}>
          {done}/{total}
        </span>
      </div>

      {/* Milestones */}
      <div className="ml-1">
        {phase.milestones?.map((milestone, i) => (
          <MilestoneItem
            key={milestone.id}
            milestone={milestone}
            isCompleted={completedIds.has(milestone.id)}
            isCurrent={milestone.id === currentMilestoneId}
            isLast={i === phase.milestones.length - 1}
            phaseCompleted={allDone}
            onToggle={onToggle}
            phaseColor={color}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Progress Ring ─────────────────────────────────────────────────

function ProgressRing({ pct }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <div className="relative shrink-0">
      <svg width={96} height={96} viewBox="0 0 96 96">
        <circle cx={48} cy={48} r={r} fill="none" stroke="currentColor" strokeWidth={7}
          className="text-border/60" />
        <motion.circle
          cx={48} cy={48} r={r} fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          transform="rotate(-90 48 48)"
        />
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-black font-mono tabular-nums">{pct}%</span>
      </div>
    </div>
  );
}

// ── Roadmap View ──────────────────────────────────────────────────

function RoadmapView({ data, completedIds, onToggle, onReset }) {
  const all = getAllMilestones(data.phases);
  const total = all.length;
  const done = all.filter((m) => completedIds.has(m.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const currentMilestone = all.find((m) => !completedIds.has(m.id));

  return (
    <div className="max-w-2xl mx-auto pb-20 pt-6">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl mb-8 p-px bg-gradient-to-br from-primary/25 via-emerald-500/20 to-primary/12"
      >
        <div className="rounded-2xl bg-card/95 backdrop-blur p-6">
          {/* Subtle glow blob */}
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-5 relative">
            <ProgressRing pct={pct} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="inline-flex items-center gap-1 text-xs font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <Target className="h-3 w-3" /> TARGET ROLE
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight leading-tight">{data.target_role}</h1>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{data.current_status}</p>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-2 bg-border/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums shrink-0 text-emerald-400">{done}<span className="text-muted-foreground font-normal">/{total}</span></span>
              </div>
            </div>

            <button
              onClick={onReset}
              title="Regenerate roadmap"
              className="shrink-0 self-start h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* All done celebration */}
      <AnimatePresence>
        {pct === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative overflow-hidden rounded-2xl p-6 mb-8 text-center border border-emerald-500/30 bg-gradient-to-br from-emerald-500/8 to-primary/8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-primary/5" />
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative"
            >
              <Trophy className="h-12 w-12 text-amber-400 mx-auto mb-3 drop-shadow-lg" />
            </motion.div>
            <h2 className="text-xl font-black mb-1 relative">Roadmap Complete!</h2>
            <p className="text-sm text-muted-foreground relative">You've mastered every milestone — time to ace that interview!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phases */}
      <div className="space-y-12">
        {data.phases?.map((phase, i) => (
          <PhaseSection
            key={phase.id}
            phase={phase}
            index={i}
            completedIds={completedIds}
            currentMilestoneId={currentMilestone?.id}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function RoadmapPage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState("loading"); // loading | setup | generating | roadmap
  const [roadmapData, setRoadmapData] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const saveTimeoutRef = useRef(null);
  const prevPctRef = useRef(0);

  // Load existing roadmap on mount
  useEffect(() => {
    if (!user?.email) return;
    fetch("/api/roadmap")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.phases) {
          setRoadmapData(data);
          setCompletedIds(new Set(data.completed_ids ?? []));
          setPhase("roadmap");
        } else {
          setPhase("setup");
        }
      })
      .catch(() => setPhase("setup"));
  }, [user?.email]);

  const handleGenerate = async ({ currentStatus, targetRole }) => {
    setPhase("generating");
    try {
      const res = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStatus, targetRole }),
      });
      if (!res.ok) throw new Error("Generate failed");
      const data = await res.json();
      if (!data?.phases) throw new Error("Invalid response");
      // Use the generate response directly — no re-fetch needed
      setRoadmapData({ phases: data.phases, target_role: targetRole, current_status: currentStatus, completed_ids: [] });
      setCompletedIds(new Set());
      setPhase("roadmap");
    } catch {
      setPhase("setup");
    }
  };

  const handleToggle = useCallback((milestoneId) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(milestoneId)) next.delete(milestoneId);
      else next.add(milestoneId);

      // Debounced save
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        await fetch("/api/roadmap", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completedIds: [...next] }),
        });

        // Confetti on 100%
        const all = getAllMilestones(roadmapData?.phases ?? []);
        if (next.size === all.length && prevPctRef.current < 100) {
          const confetti = (await import("canvas-confetti")).default;
          confetti({ particleCount: 180, spread: 90, origin: { y: 0.55 }, colors: ["#8b5cf6", "#10b981", "#f59e0b", "#3b82f6"] });
        }
        const all2 = getAllMilestones(roadmapData?.phases ?? []);
        prevPctRef.current = Math.round((next.size / all2.length) * 100);
      }, 400);

      return next;
    });
  }, [roadmapData]);

  const handleReset = () => setConfirmOpen(true);

  const handleConfirmReset = async () => {
    setConfirmOpen(false);
    await fetch("/api/roadmap", { method: "DELETE" });
    setRoadmapData(null);
    setCompletedIds(new Set());
    setPhase("setup");
  };

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4">
      <ConfirmModal
        open={confirmOpen}
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmOpen(false)}
      />
      <AnimatePresence mode="wait">
        {phase === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SetupScreen onGenerate={handleGenerate} loading={false} />
          </motion.div>
        )}
        {phase === "generating" && (
          <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GeneratingScreen />
          </motion.div>
        )}
        {phase === "roadmap" && roadmapData && (
          <motion.div key="roadmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RoadmapView
              data={roadmapData}
              completedIds={completedIds}
              onToggle={handleToggle}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
