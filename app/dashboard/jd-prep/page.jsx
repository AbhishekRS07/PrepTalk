"use client";

import { useState, useRef, useCallback } from "react";
import { useSessionState, useSessionSet } from "@/lib/useSessionState";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, Sparkles, Loader2, AlertCircle, Bookmark,
  BookmarkCheck, ChevronDown, Globe, Bot, Building2,
  Upload, FileText, X, CheckCircle2, BookOpen, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { extractText } from "unpdf";

// ── Difficulty colors ─────────────────────────────────────────────
const diffColor = {
  Easy:   "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  Medium: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  Hard:   "text-red-500 bg-red-500/10 border-red-500/20",
};

const topicColor = [
  "bg-violet-500/10 text-violet-500 border-violet-500/20",
  "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  "bg-pink-500/10 text-pink-500 border-pink-500/20",
  "bg-orange-500/10 text-orange-500 border-orange-500/20",
];
const topicColorMap = {};
let topicColorIdx = 0;
const getTopicColor = (topic) => {
  if (!topicColorMap[topic]) {
    topicColorMap[topic] = topicColor[topicColorIdx % topicColor.length];
    topicColorIdx++;
  }
  return topicColorMap[topic];
};

// ── Loading steps component ───────────────────────────────────────
const STEPS = [
  { id: "parse",    label: "Reading job description…",         icon: FileText },
  { id: "search",   label: "Searching the web for real questions…", icon: Globe },
  { id: "curate",   label: "Curating your question bank…",     icon: Sparkles },
];

function LoadingSteps({ step }) {
  const current = STEPS.findIndex((s) => s.id === step);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 py-8"
    >
      <p className="text-center text-sm text-muted-foreground mb-6">
        This usually takes 10–20 seconds
      </p>
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border transition-colors duration-500",
              active ? "bg-primary/8 border-primary/25" :
              done   ? "bg-emerald-500/5 border-emerald-500/20" :
                       "bg-card border-border opacity-40"
            )}
          >
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
              active ? "bg-primary/15" : done ? "bg-emerald-500/15" : "bg-secondary"
            )}>
              {done
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                : active
                ? <Loader2 className="h-4 w-4 text-primary animate-spin" />
                : <s.icon className="h-4 w-4 text-muted-foreground" />
              }
            </div>
            <span className={cn(
              "text-sm font-medium",
              active ? "text-foreground" : done ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
            )}>
              {s.label}
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ── Question Card ─────────────────────────────────────────────────
function QuestionCard({ item, index, isBookmarked, onToggle }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleBookmark = async (e) => {
    e.stopPropagation();
    setSaving(true);
    await onToggle(item);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "border rounded-2xl overflow-hidden transition-colors duration-300",
        isBookmarked ? "border-primary/30 bg-primary/3" : "border-border hover:border-primary/20"
      )}
    >
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-start justify-between gap-3 p-5 text-left hover:bg-secondary/40 transition-colors">
        <div className="flex items-start gap-3 min-w-0">
          <span className="shrink-0 h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold mt-0.5">
            {index + 1}
          </span>
          <div className="min-w-0 space-y-1.5">
            <p className="text-sm font-medium leading-relaxed">{item.question}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", diffColor[item.difficulty] || diffColor.Medium)}>
                {item.difficulty}
              </span>
              <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border", getTopicColor(item.topic))}>
                {item.topic}
              </span>
              {item.sourced && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Globe className="h-2.5 w-2.5" /> Web sourced
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <button
            onClick={handleBookmark}
            disabled={saving}
            title={isBookmarked ? "Remove from Study tab" : "Save to Study tab"}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              isBookmarked ? "text-primary hover:text-primary/60" : "text-muted-foreground/30 hover:text-muted-foreground"
            )}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" />
              : isBookmarked ? <BookmarkCheck className="h-4 w-4" />
              : <Bookmark className="h-4 w-4" />}
          </button>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden">
            <div className="px-5 pb-5 pt-1 border-t border-border">
              <div className="flex items-center gap-1.5 mb-2 mt-3">
                <Bot className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">Model Answer</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function JDPrepPage() {
  const { user } = useAuth();

  const [jd, setJd]           = useSessionState("jdprep_jd", "");
  const [company, setCompany] = useSessionState("jdprep_company", "");
  const [result, setResult]   = useSessionState("jdprep_result", null);
  const [bookmarked, setBookmarked] = useSessionSet("jdprep_bookmarked");

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [loadingStep, setLoadingStep] = useState(null);
  const [error, setError] = useState("");
  const [savingAll, setSavingAll] = useState(false);

  // ── File handling ──────────────────────────────────────────────
  const handleFile = useCallback(async (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") { setError("Only PDF files are supported."); return; }
    if (f.size > 5 * 1024 * 1024) { setError("File must be under 5 MB."); return; }
    setError("");
    setFile(f);
    // Extract text from PDF and put it in the textarea
    try {
      const ab = await f.arrayBuffer();
      const { text } = await extractText(new Uint8Array(ab), { mergePages: true });
      setJd(text?.trim() || "");
    } catch {
      setError("Could not read PDF — try pasting the JD as text.");
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // ── Research ───────────────────────────────────────────────────
  const handleResearch = async () => {
    if (!jd.trim() || jd.trim().length < 50) {
      setError("Please paste a job description (at least 50 characters).");
      return;
    }
    setError("");
    setResult(null);
    setBookmarked(new Set());

    // Simulate visible step progression
    setLoadingStep("parse");
    await new Promise((r) => setTimeout(r, 800));
    setLoadingStep("search");

    try {
      // The actual API call happens during "search" + "curate" steps
      const resPromise = fetch("/api/jd-prep/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, company: company.trim() || undefined }),
      });

      // Show "curate" step after a delay
      await new Promise((r) => setTimeout(r, 5000));
      setLoadingStep("curate");

      const res = await resPromise;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Research failed");
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoadingStep(null);
    }
  };

  // ── Bookmark ───────────────────────────────────────────────────
  const handleToggleBookmark = async (item) => {
    const profile = result
      ? `JD: ${result.company || company || "Company"} — ${result.role}`
      : "JD Research";
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: item.question, answer: item.answer, profile }),
    });
    const data = await res.json();
    setBookmarked((prev) => {
      const next = new Set(prev);
      data.bookmarked ? next.add(item.question) : next.delete(item.question);
      return next;
    });
  };

  const handleSaveAll = async () => {
    if (!result?.questions) return;
    setSavingAll(true);
    const unbookmarked = result.questions.filter((q) => !bookmarked.has(q.question));
    for (const q of unbookmarked) {
      await handleToggleBookmark(q);
    }
    setSavingAll(false);
  };

  const isLoading = loadingStep !== null;
  const allSaved = result && result.questions.every((q) => bookmarked.has(q.question));
  const sourcedCount = result?.questions?.filter((q) => q.sourced).length || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto pb-20">

      {/* Back */}
      <Link href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
          <Building2 className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">JD Interview Prep</h1>
          <p className="text-sm text-muted-foreground">
            Paste a job description — we search the web for real questions asked by that company
          </p>
        </div>
      </div>

      {!result && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Company name (optional) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Company Name <span className="text-muted-foreground font-normal">(optional — we'll infer from JD)</span>
            </label>
            <Input
              placeholder="e.g. Smallcase, Zepto, Google…"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          {/* JD input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Job Description</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload PDF instead
              </button>
            </div>

            {/* PDF drop zone — only shown if no text yet */}
            <AnimatePresence>
              {file && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/25 rounded-xl mb-2">
                  <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                  <p className="text-sm font-medium flex-1 truncate">{file.name}</p>
                  <button onClick={() => { setFile(null); setJd(""); }} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                </motion.div>
              )}
            </AnimatePresence>

            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              className={cn(
                "relative rounded-xl border-2 transition-all duration-200",
                dragging ? "border-blue-500 bg-blue-500/5" : "border-border"
              )}
            >
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the full job description here…&#10;&#10;Or drag & drop a PDF onto this area"
                rows={12}
                className="w-full bg-transparent px-4 py-3 text-sm resize-none focus:outline-none leading-relaxed placeholder:text-muted-foreground/50 rounded-xl"
              />
              {dragging && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-500/5 rounded-xl pointer-events-none">
                  <p className="text-sm font-semibold text-blue-500">Drop PDF here</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{jd.length} characters</p>
          </div>

          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])} />

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <Button onClick={handleResearch} disabled={jd.trim().length < 50} className="w-full gap-2 h-11">
            <Globe className="h-4 w-4" />
            Search & Generate Question Bank
          </Button>

          {/* What to expect */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <p className="text-sm font-semibold">What happens next</p>
            <div className="space-y-2">
              {[
                { icon: FileText, text: "AI reads the JD and extracts the company, role, and tech stack" },
                { icon: Globe,    text: "Searches Glassdoor, Blind, LeetCode Discuss for real questions asked by that company" },
                { icon: Sparkles, text: "Synthesizes 15 curated questions — sourced + JD-tailored, with model answers" },
                { icon: BookOpen, text: "Save any or all questions to your Study tab (Bookmarks) for later" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Icon className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && <LoadingSteps step={loadingStep} />}

      {/* Results */}
      {result && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Result header */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <h2 className="font-black text-lg">
                    {result.company || company || "Company"} — {result.role}
                  </h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  {result.seniority && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-medium">
                      {result.seniority}
                    </span>
                  )}
                  {(result.techStack || []).slice(0, 5).map((t) => (
                    <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {result.questions?.length} questions · {sourcedCount} sourced from web · {result.questions?.length - sourcedCount} JD-tailored
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => { setResult(null); setBookmarked(new Set()); setJd(""); setCompany(""); }}
                  className="gap-1.5 text-xs">
                  <ArrowLeft className="h-3.5 w-3.5" /> New JD
                </Button>
                <Button size="sm" onClick={handleSaveAll} disabled={savingAll || allSaved}
                  className="gap-1.5 text-xs">
                  {savingAll
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : allSaved
                    ? <BookmarkCheck className="h-3.5 w-3.5" />
                    : <Save className="h-3.5 w-3.5" />
                  }
                  {allSaved ? "All saved" : "Save all to Study"}
                </Button>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-3">
            {(result.questions || []).map((q, i) => (
              <QuestionCard
                key={i}
                item={q}
                index={i}
                isBookmarked={bookmarked.has(q.question)}
                onToggle={handleToggleBookmark}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="text-center pt-4">
            <Link href="/dashboard/questions"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <BookOpen className="h-4 w-4" />
              View all saved questions in Study tab →
            </Link>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
