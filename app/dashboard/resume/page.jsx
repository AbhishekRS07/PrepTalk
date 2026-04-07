"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FileText, Upload, Zap, ChevronDown, ChevronUp, AlertCircle,
  CheckCircle2, AlertTriangle, XCircle, Loader2, RotateCcw,
  Target, Shield, TrendingUp, Lightbulb, Tag, ArrowRight,
} from "lucide-react";

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 120, strokeWidth = 10, label }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = score != null ? (score / 100) * circ : 0;
  const color =
    score == null ? "text-muted-foreground/40"
    : score >= 80 ? "text-emerald-400"
    : score >= 60 ? "text-amber-400"
    : "text-red-400";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="currentColor" strokeWidth={strokeWidth}
            className="text-border/40" />
          <motion.circle cx={size / 2} cy={size / 2} r={r}
            fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
            stroke="currentColor" className={color}
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.2, ease: "easeOut" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-black", color)}>
            {score != null ? score : "—"}
          </span>
          {score != null && <span className="text-[10px] text-muted-foreground">/100</span>}
        </div>
      </div>
      {label && <p className="text-xs text-muted-foreground font-medium">{label}</p>}
    </div>
  );
}

// ── Section score bar ─────────────────────────────────────────────────────────

function SectionBar({ label, score, status, feedback }) {
  const [open, setOpen] = useState(false);
  const statusIcon =
    status === "good" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    : status === "needs_work" ? <AlertTriangle className="h-4 w-4 text-amber-400" />
    : <XCircle className="h-4 w-4 text-red-400" />;
  const barColor =
    score >= 80 ? "bg-emerald-500"
    : score >= 60 ? "bg-amber-500"
    : "bg-red-500";

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors"
      >
        {statusIcon}
        <span className="flex-1 text-sm font-medium text-left">{label}</span>
        <span className="text-sm font-bold tabular-nums">{score}</span>
        <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden mx-2">
          <motion.div
            className={cn("h-full rounded-full", barColor)}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-3 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-2">
              {feedback}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Upload zone ───────────────────────────────────────────────────────────────

function UploadZone({ file, setFile, hasSaved }) {
  const inputRef = useRef();
  const [drag, setDrag] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") setFile(f);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer",
        drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/30",
        file && "border-emerald-500/50 bg-emerald-500/5 cursor-default"
      )}
    >
      <input ref={inputRef} type="file" accept=".pdf" className="hidden"
        onChange={(e) => setFile(e.target.files[0] || null)} />
      {file ? (
        <div className="flex items-center justify-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <FileText className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setFile(null); }}
            className="ml-auto text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="font-semibold text-sm mb-1">Drop your resume PDF here</p>
          <p className="text-xs text-muted-foreground">
            {hasSaved ? "Or use your saved resume below" : "Click to browse"}
          </p>
        </>
      )}
    </div>
  );
}

// ── Priority badge ────────────────────────────────────────────────────────────

function PriorityBadge({ priority }) {
  return (
    <span className={cn(
      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
      priority === "high" ? "bg-red-500/15 text-red-400"
      : priority === "medium" ? "bg-amber-500/15 text-amber-400"
      : "bg-emerald-500/15 text-emerald-400"
    )}>
      {priority}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ResumePage() {
  const { user, profile } = useAuth();
  const hasSaved = !!profile?.resume_text;

  const [file, setFile] = useState(null);
  const [useSaved, setUseSaved] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [jdOpen, setJdOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [showRewrite, setShowRewrite] = useState(false);

  const canAnalyze = file || (useSaved && hasSaved);

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    const fd = new FormData();
    if (!useSaved && file) fd.append("file", file);
    fd.append("useSaved", useSaved ? "true" : "false");
    if (jobDescription.trim()) fd.append("jobDescription", jobDescription.trim());

    try {
      const res = await fetch("/api/resume/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Analysis failed"); return; }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setFile(null);
    setUseSaved(false);
    setJobDescription("");
    setError("");
  };

  const SECTION_LABELS = {
    contactInfo: "Contact Info",
    summary: "Professional Summary",
    experience: "Work Experience",
    skills: "Skills",
    education: "Education",
    formatting: "Formatting & ATS",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-black tracking-tight">Resume Analyzer</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Get an ATS score, keyword gaps, and actionable fixes — instantly.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key="upload" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Upload */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                Upload Resume
              </p>
              <UploadZone file={file} setFile={(f) => { setFile(f); setUseSaved(false); }} hasSaved={hasSaved} />

              {hasSaved && (
                <button
                  onClick={() => { setUseSaved((p) => !p); setFile(null); }}
                  className={cn(
                    "mt-3 w-full flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                    useSaved
                      ? "border-primary/50 bg-primary/5 text-primary"
                      : "border-border hover:border-primary/30 hover:bg-secondary/30"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Use saved resume from my profile
                  {useSaved && <CheckCircle2 className="h-4 w-4 ml-auto text-primary" />}
                </button>
              )}
            </div>

            {/* Job description (optional) */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
              <button
                onClick={() => setJdOpen((p) => !p)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Job Description</span>
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">optional — but improves results</span>
                </div>
                {jdOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              <AnimatePresence>
                {jdOpen && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 border-t border-border/50 pt-4">
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here to get keyword match analysis and tailored suggestions…"
                        rows={6}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {jobDescription.length} chars — first 1,500 used for analysis
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={!canAnalyze || loading}
              className="w-full h-12 text-sm font-bold gap-2"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Analyzing your resume…</>
              ) : (
                <><Zap className="h-4 w-4" />Analyze Resume</>
              )}
            </Button>
            {!canAnalyze && (
              <p className="text-xs text-muted-foreground text-center mt-2">Upload a PDF or use your saved resume to continue</p>
            )}
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {/* Score overview */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-4">
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overall Analysis</p>
                <button onClick={reset} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Analyze another
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 mb-6">
                <ScoreRing score={result.overallScore} label="Overall" />
                <ScoreRing score={result.atsScore} label="ATS Pass Rate" />
                {result.relevanceScore != null && (
                  <ScoreRing score={result.relevanceScore} label="JD Match" />
                )}
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground italic">"{result.verdict}"</p>
              </div>
            </div>

            {/* Section scores */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Section Breakdown</p>
              <div className="space-y-2">
                {Object.entries(result.sections || {}).map(([key, val]) => (
                  <SectionBar key={key} label={SECTION_LABELS[key] || key} score={val.score} status={val.status} feedback={val.feedback} />
                ))}
              </div>
            </div>

            {/* Strengths & Issues */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {result.keyStrengths?.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Key Strengths</p>
                  </div>
                  <ul className="space-y-2">
                    {result.keyStrengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.criticalIssues?.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Critical Issues</p>
                  </div>
                  <ul className="space-y-2">
                    {result.criticalIssues.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Keywords (only if JD was provided) */}
            {(result.missingKeywords?.length > 0 || result.presentKeywords?.length > 0) && (
              <div className="bg-card border border-border rounded-2xl p-6 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Keyword Analysis</p>
                </div>

                {result.presentKeywords?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-emerald-400 mb-2">Found in your resume</p>
                    <div className="flex flex-wrap gap-2">
                      {result.presentKeywords.map((kw, i) => (
                        <span key={i} className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-full font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.missingKeywords?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-400 mb-2">Missing from your resume</p>
                    <div className="flex flex-wrap gap-2">
                      {result.missingKeywords.map((kw, i) => (
                        <span key={i} className="text-xs bg-red-500/15 text-red-400 border border-red-500/25 px-2.5 py-1 rounded-full font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Improvements */}
            {result.improvements?.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Action Items</p>
                </div>
                <div className="space-y-3">
                  {result.improvements
                    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
                    .map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30">
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <PriorityBadge priority={item.priority} />
                            <span className="text-xs text-muted-foreground">{item.section}</span>
                          </div>
                          <p className="text-sm">{item.suggestion}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Rewritten summary */}
            {result.rewrittenSummary && (
              <div className="bg-card border border-border rounded-2xl p-6 mb-4">
                <button
                  onClick={() => setShowRewrite((p) => !p)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-400" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Suggested Summary Rewrite</p>
                  </div>
                  {showRewrite ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                <AnimatePresence>
                  {showRewrite && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <p className="text-sm leading-relaxed">{result.rewrittenSummary}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Analyze another CTA */}
            <Button variant="outline" onClick={reset} className="w-full h-11 gap-2 text-sm">
              <RotateCcw className="h-4 w-4" />
              Analyze Another Resume
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
