"use client";

import { useState, useRef, useCallback, useId, useEffect } from "react";
import { useSessionState, useSessionSet } from "@/lib/useSessionState";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, Sparkles, Loader2, AlertCircle, Bookmark,
  BookmarkCheck, ChevronDown, Globe, Bot, Building2,
  Upload, FileText, X, CheckCircle2, BookOpen, Save,
  Plus, Layers, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { extractText } from "unpdf";

// ── Helpers ───────────────────────────────────────────────────────
const diffColor = {
  Easy:   "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  Medium: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  Hard:   "text-red-500 bg-red-500/10 border-red-500/20",
};

const topicColors = [
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
    topicColorMap[topic] = topicColors[topicColorIdx % topicColors.length];
    topicColorIdx++;
  }
  return topicColorMap[topic];
};
const resetTopicColors = () => {
  Object.keys(topicColorMap).forEach((k) => delete topicColorMap[k]);
  topicColorIdx = 0;
};

// One color per company slot
const COMPANY_COLORS = [
  { bg: "bg-blue-500/10",   text: "text-blue-500",   border: "border-blue-500/30",   dot: "bg-blue-500" },
  { bg: "bg-violet-500/10", text: "text-violet-500", border: "border-violet-500/30", dot: "bg-violet-500" },
  { bg: "bg-emerald-500/10",text: "text-emerald-500",border: "border-emerald-500/30",dot: "bg-emerald-500" },
  { bg: "bg-amber-500/10",  text: "text-amber-500",  border: "border-amber-500/30",  dot: "bg-amber-500" },
];

function companyColor(idx) {
  return COMPANY_COLORS[idx % COMPANY_COLORS.length];
}

// ── Loading steps ─────────────────────────────────────────────────
const STEPS = [
  { id: "parse",   label: "Reading job descriptions…",        icon: FileText },
  { id: "search",  label: "Searching the web for real questions…", icon: Globe },
  { id: "curate",  label: "Building unified question bank…",  icon: Sparkles },
];

function LoadingSteps({ step }) {
  const current = STEPS.findIndex((s) => s.id === step);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 py-8">
      <p className="text-center text-sm text-muted-foreground mb-6">This usually takes 15–25 seconds</p>
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <motion.div key={s.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border transition-colors duration-500",
              active ? "bg-primary/8 border-primary/25" :
              done   ? "bg-emerald-500/5 border-emerald-500/20" :
                       "bg-card border-border opacity-40"
            )}>
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
              active ? "bg-primary/15" : done ? "bg-emerald-500/15" : "bg-secondary")}>
              {done   ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
               : active ? <Loader2 className="h-4 w-4 text-primary animate-spin" />
               : <s.icon className="h-4 w-4 text-muted-foreground" />}
            </div>
            <span className={cn("text-sm font-medium",
              active ? "text-foreground" : done ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
              {s.label}
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ── Company Entry Slot ────────────────────────────────────────────
function CompanySlot({ entry, index, total, onChange, onRemove }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [fileError, setFileError] = useState("");
  const col = companyColor(index);

  // Keep a ref to the latest entry so async PDF extraction never uses a stale closure
  const entryRef = useRef(entry);
  useEffect(() => { entryRef.current = entry; }, [entry]);

  const handleFile = useCallback(async (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") { setFileError("Only PDF files are supported."); return; }
    if (f.size > 5 * 1024 * 1024) { setFileError("File must be under 5 MB."); return; }
    setFileError("");
    setFile(f);
    try {
      const ab = await f.arrayBuffer();
      const { text } = await extractText(new Uint8Array(ab), { mergePages: true });
      onChange({ ...entryRef.current, jd: text?.trim() || "" });
    } catch {
      setFileError("Could not read PDF — try pasting the JD as text.");
    }
  }, [onChange]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className={cn("border rounded-2xl p-5 space-y-4", col.border, col.bg)}
    >
      {/* Slot header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0", col.dot)}>
            {index + 1}
          </span>
          <span className={cn("text-sm font-bold", col.text)}>Company {index + 1}</span>
        </div>
        {total > 1 && (
          <button onClick={onRemove}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Company name */}
      <Input
        placeholder="Company name (optional — we'll infer from JD)"
        value={entry.company}
        onChange={(e) => onChange({ ...entry, company: e.target.value })}
        className="bg-background/60"
      />

      {/* JD input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold font-mono text-muted-foreground uppercase tracking-wide">Job Description</label>
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Upload className="h-3 w-3" /> Upload PDF
          </button>
        </div>

        <AnimatePresence>
          {file && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-2.5 bg-background/50 border border-border/50 rounded-lg">
              <FileText className={cn("h-3.5 w-3.5 shrink-0", col.text)} />
              <p className="text-xs font-medium flex-1 truncate">{file.name}</p>
              <button onClick={() => { setFile(null); onChange({ ...entry, jd: "" }); }}
                className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
              <CheckCircle2 className={cn("h-3.5 w-3.5 shrink-0", col.text)} />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={cn("relative rounded-xl border-2 bg-background/40 transition-all duration-200",
            dragging ? "border-primary bg-primary/5" : "border-border/50")}
        >
          <textarea
            value={entry.jd}
            onChange={(e) => onChange({ ...entry, jd: e.target.value })}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); setDragging(false); }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            placeholder="Paste the job description here… or drag & drop a PDF"
            rows={7}
            className="w-full bg-transparent px-4 py-3 text-sm resize-none focus:outline-none leading-relaxed placeholder:text-muted-foreground/50 rounded-xl"
          />
          {dragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/5 rounded-xl pointer-events-none">
              <p className="text-sm font-semibold text-primary">Drop PDF here</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{entry.jd.length} characters</p>
          {fileError && <p className="text-xs text-destructive">{fileError}</p>}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])} />
    </motion.div>
  );
}

// ── Question Card ─────────────────────────────────────────────────
function QuestionCard({ item, index, resultMetas, isBookmarked, onToggle }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleBookmark = async (e) => {
    e.stopPropagation();
    setSaving(true);
    await onToggle(item);
    setSaving(false);
  };

  const isCommon = item.isCommon || (item.companies?.length > 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "border rounded-2xl overflow-hidden transition-colors duration-300",
        isBookmarked ? "border-primary/30 bg-primary/3" :
        isCommon     ? "border-amber-500/25 bg-amber-500/3" :
                       "border-border hover:border-primary/20"
      )}
    >
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-start justify-between gap-3 p-5 text-left hover:bg-secondary/40 transition-colors">
        <div className="flex items-start gap-3 min-w-0">
          <span className="shrink-0 h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold mt-0.5">
            {index + 1}
          </span>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium leading-relaxed">{item.question}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {isCommon && (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  <Layers className="h-2.5 w-2.5" /> Common
                </span>
              )}
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
              {/* Company tags */}
              {(item.companies || []).map((c, i) => {
                const metaIdx = resultMetas.findIndex(
                  (m) => (m.company || "").toLowerCase() === c.toLowerCase()
                );
                const col = companyColor(metaIdx >= 0 ? metaIdx : i);
                return (
                  <span key={c} className={cn(
                    "flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border",
                    col.bg, col.text, col.border
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", col.dot)} />
                    {c}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <button onClick={handleBookmark} disabled={saving}
            title={isBookmarked ? "Remove from Study tab" : "Save to Study tab"}
            className={cn("p-1.5 rounded-lg transition-colors",
              isBookmarked ? "text-primary hover:text-primary/60" : "text-muted-foreground/30 hover:text-muted-foreground")}>
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
                <p className="text-xs font-semibold font-mono text-primary uppercase tracking-wide">Model Answer</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Default entry factory ─────────────────────────────────────────
let slotId = 0;
const newEntry = () => ({ id: ++slotId, company: "", jd: "" });

// ── Page ──────────────────────────────────────────────────────────
export default function JDPrepPage() {
  const { user } = useAuth();

  const [entries, setEntries] = useSessionState("jdprep_entries", [newEntry()]);
  const [result,  setResult]  = useSessionState("jdprep_result", null);
  const [bookmarked, setBookmarked] = useSessionSet("jdprep_bookmarked");

  const [loadingStep, setLoadingStep] = useState(null);
  const [error, setError] = useState("");
  const [savingAll, setSavingAll] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "common" | companyName

  const abortRef = useRef(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const isLoading = loadingStep !== null;

  // ── Entry management ───────────────────────────────────────────
  const addEntry = () => {
    if (entries.length >= 4) return;
    setEntries((prev) => [...prev, newEntry()]);
  };

  const removeEntry = (id) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const updateEntry = (id, updated) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));

  // ── Research ───────────────────────────────────────────────────
  const handleResearch = async () => {
    if (!user) {
      setError("Please sign in to generate questions.");
      return;
    }
    for (const e of entries) {
      const jd = e.jd.trim();
      if (!jd || jd.length < 50) {
        setError(`Job description for ${e.company || `Company ${entries.indexOf(e) + 1}`} is too short (min 50 chars).`);
        return;
      }
      if (jd.length > 20000) {
        setError(`Job description for ${e.company || `Company ${entries.indexOf(e) + 1}`} is too long (max 20,000 chars).`);
        return;
      }
    }
    setError("");
    setResult(null);
    setBookmarked(new Set());
    setFilter("all");
    resetTopicColors();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    setLoadingStep("parse");
    await new Promise((r) => setTimeout(r, 800));
    setLoadingStep("search");

    try {
      const resPromise = fetch("/api/jd-prep/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companies: entries.map((e) => ({ jd: e.jd, company: e.company.trim() || undefined })),
        }),
        signal: controller.signal,
      });

      await new Promise((r) => setTimeout(r, 5000));
      setLoadingStep("curate");

      const res = await resPromise;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Research failed");
      setResult(data);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      clearTimeout(timeoutId);
      setLoadingStep(null);
    }
  };

  // ── Bookmark ───────────────────────────────────────────────────
  const handleToggleBookmark = async (item) => {
    const profile = result?.companies?.length
      ? result.companies.map((m) => m.company || "Company").join(" / ")
      : "JD Research";
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: item.question, answer: item.answer, profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bookmark failed");
      setBookmarked((prev) => {
        const next = new Set(prev);
        data.bookmarked ? next.add(item.question) : next.delete(item.question);
        return next;
      });
    } catch {
      setError("Failed to save bookmark — please try again.");
    }
  };

  const handleSaveAll = async () => {
    if (!result?.questions) return;
    setSavingAll(true);
    try {
      for (const q of result.questions.filter((q) => !bookmarked.has(q.question))) {
        await handleToggleBookmark(q);
      }
    } finally {
      setSavingAll(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setBookmarked(new Set());
    setEntries([newEntry()]);
    setError("");
    setFilter("all");
    resetTopicColors();
  };

  // ── Filtered questions ─────────────────────────────────────────
  const questions = result?.questions || [];
  const filteredQuestions = filter === "all"    ? questions
    : filter === "common" ? questions.filter((q) => q.isCommon || (q.companies?.length > 1))
    : questions.filter((q) => (q.companies || []).some((c) => c.toLowerCase() === filter.toLowerCase()));

  const commonCount   = questions.filter((q) => q.isCommon || (q.companies?.length > 1)).length;
  const allSaved      = questions.length > 0 && questions.every((q) => bookmarked.has(q.question));
  const isMulti       = entries.length > 1;
  const resultMetas   = result?.companies || [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto pb-20">

      {/* Back */}
      <Link href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">JD Interview Prep</h1>
          <p className="text-sm text-muted-foreground">
            Add one or more job descriptions — get a unified, deduplicated question bank
          </p>
        </div>
      </div>

      {/* ── Input form ── */}
      {!result && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* Company slots */}
          <AnimatePresence mode="popLayout">
            {entries.map((entry, idx) => (
              <CompanySlot
                key={entry.id}
                entry={entry}
                index={idx}
                total={entries.length}
                onChange={(updated) => updateEntry(entry.id, updated)}
                onRemove={() => removeEntry(entry.id)}
              />
            ))}
          </AnimatePresence>

          {/* Add company */}
          {entries.length < 4 && (
            <button onClick={addEntry}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200">
              <Plus className="h-4 w-4" />
              Add another company
              <span className="text-xs opacity-60">({entries.length}/4)</span>
            </button>
          )}

          {/* Multi-company callout */}
          {isMulti && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl">
              <Layers className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Multi-company mode:</span> common questions across companies will be merged into a single, comprehensive question — eliminating duplicates and reducing noise.
              </p>
            </motion.div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <Button onClick={handleResearch}
            disabled={entries.some((e) => e.jd.trim().length < 50 || e.jd.trim().length > 20000)}
            className="w-full gap-2 h-11">
            <Globe className="h-4 w-4" />
            {isMulti ? `Search & Build Unified Question Bank (${entries.length} companies)` : "Search & Generate Question Bank"}
          </Button>

          {/* What to expect */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <p className="text-sm font-semibold">What happens next</p>
            <div className="space-y-2">
              {[
                { icon: FileText,  text: "AI reads each JD and extracts the company, role, and tech stack" },
                { icon: Globe,     text: "Searches Glassdoor, Blind, LeetCode Discuss for real questions from each company — in parallel" },
                { icon: Layers,    text: isMulti ? "Common topics are merged into one question — no duplicates, no repetition" : "Synthesizes 15 curated questions — sourced + JD-tailored, with model answers" },
                { icon: Sparkles,  text: isMulti ? "Generates one unified bank of 20–28 questions with company tags on each" : "Each question has a model answer and difficulty rating" },
                { icon: BookOpen,  text: "Save any or all questions to your Study tab (Bookmarks)" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Loading ── */}
      {isLoading && <LoadingSteps step={loadingStep} />}

      {/* ── Results ── */}
      {result && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

          {/* Result header */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            {/* Company pills row */}
            <div className="flex flex-wrap gap-2">
              {resultMetas.map((m, i) => {
                const col = companyColor(i);
                return (
                  <div key={i} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold", col.bg, col.border, col.text)}>
                    <span className={cn("h-2 w-2 rounded-full", col.dot)} />
                    {m.company || `Company ${i + 1}`}
                    <span className="font-normal text-xs opacity-70">· {m.seniority} {m.role}</span>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span><span className="font-bold text-foreground">{questions.length}</span> questions total</span>
              {commonCount > 0 && (
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3 text-amber-500" />
                  <span className="font-bold text-foreground">{commonCount}</span> common across companies
                </span>
              )}
              <span><span className="font-bold text-foreground">{questions.filter(q => q.sourced).length}</span> web-sourced</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" /> New Search
              </Button>
              <Button size="sm" onClick={handleSaveAll} disabled={savingAll || allSaved} className="gap-1.5 text-xs">
                {savingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : allSaved ? <BookmarkCheck className="h-3.5 w-3.5" />
                  : <Save className="h-3.5 w-3.5" />}
                {allSaved ? "All saved" : "Save all to Study"}
              </Button>
            </div>
          </div>

          {/* Filter bar */}
          {resultMetas.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: `All (${questions.length})` },
                { id: "common", label: `Common (${commonCount})`, icon: Layers },
                ...resultMetas.map((m, i) => ({
                  id: m.company || `Company ${i + 1}`,
                  label: m.company || `Company ${i + 1}`,
                  metaIdx: i,
                  _key: `company-filter-${i}`,
                })),
              ].map((f) => {
                const isActive = filter === f.id;
                const col = f.metaIdx !== undefined ? companyColor(f.metaIdx) : null;
                return (
                  <button key={f._key ?? f.id} onClick={() => setFilter(f.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                      isActive
                        ? col ? cn(col.bg, col.text, col.border) : "bg-primary/15 text-primary border-primary/30"
                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/25"
                    )}>
                    {f.icon && <f.icon className="h-3 w-3" />}
                    {col && <span className={cn("h-1.5 w-1.5 rounded-full", col.dot)} />}
                    {f.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Questions */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredQuestions.length === 0 ? (
                <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center text-sm text-muted-foreground py-10">
                  No questions match this filter.
                </motion.p>
              ) : (
                filteredQuestions.map((q, i) => (
                  <QuestionCard
                    key={`${q.question}-${i}`}
                    item={q}
                    index={i}
                    resultMetas={resultMetas}
                    isBookmarked={bookmarked.has(q.question)}
                    onToggle={handleToggleBookmark}
                  />
                ))
              )}
            </AnimatePresence>
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
