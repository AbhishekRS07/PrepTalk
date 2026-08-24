"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  BookOpen, Plus, Trash2, Pencil, ChevronDown, ChevronUp,
  CalendarDays, Building2, Check, X, Lightbulb, MessageSquare,
  TrendingUp, Sparkles, Clock, ArrowUpRight,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────

const ROUND_TYPES = [
  { value: "technical",     label: "Technical" },
  { value: "system_design", label: "System Design" },
  { value: "behavioral",    label: "Behavioral / HR" },
  { value: "dsa",           label: "DSA / Coding" },
  { value: "phone_screen",  label: "Phone Screen" },
  { value: "final",         label: "Final Round" },
];

const FEELINGS = [
  { value: "great", label: "Went great",  emoji: "🔥", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  { value: "good",  label: "Pretty good", emoji: "😊", color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/25" },
  { value: "okay",  label: "Was okay",    emoji: "😐", color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25" },
  { value: "rough", label: "Was rough",   emoji: "😬", color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/25" },
];

const OUTCOMES = [
  { value: "waiting",  label: "Waiting",    emoji: "⏳", color: "text-muted-foreground" },
  { value: "offer",    label: "Got offer",  emoji: "🎉", color: "text-emerald-600 dark:text-emerald-400" },
  { value: "rejected", label: "Rejected",   emoji: "❌", color: "text-red-600 dark:text-red-400" },
  { value: "withdrew", label: "Withdrew",   emoji: "🚪", color: "text-muted-foreground" },
  { value: "next",     label: "Next round", emoji: "➡️", color: "text-blue-600 dark:text-blue-400" },
];

const FEELING_MAP  = Object.fromEntries(FEELINGS.map((f) => [f.value, f]));
const OUTCOME_MAP  = Object.fromEntries(OUTCOMES.map((o) => [o.value, o]));
const ROUND_LABELS = Object.fromEntries(ROUND_TYPES.map((r) => [r.value, r.label]));

function formatDate(str) {
  return new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Textarea auto-resize ──────────────────────────────────────────

function AutoTextarea({ value, onChange, placeholder, className, minRows = 3 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={minRows}
      className={cn(
        "w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition leading-relaxed placeholder:text-muted-foreground/50",
        className
      )}
    />
  );
}

// ── Journal Form (add + edit) ─────────────────────────────────────

function JournalForm({ initial, onSave, onCancel }) {
  const [company, setCompany]               = useState(initial?.company || "");
  const [role, setRole]                     = useState(initial?.role || "");
  const [date, setDate]                     = useState(initial?.interview_date || new Date().toISOString().split("T")[0]);
  const [roundType, setRoundType]           = useState(initial?.round_type || "technical");
  const [feeling, setFeeling]               = useState(initial?.feeling || "okay");
  const [questionsAsked, setQuestionsAsked] = useState(initial?.questions_asked || "");
  const [howItWent, setHowItWent]           = useState(initial?.how_it_went || "");
  const [whatToImprove, setWhatToImprove]   = useState(initial?.what_to_improve || "");
  const [outcome, setOutcome]               = useState(initial?.outcome || "waiting");
  const [loading, setLoading]               = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave({ company, role, interview_date: date, round_type: roundType, feeling, questions_asked: questionsAsked, how_it_went: howItWent, what_to_improve: whatToImprove, outcome });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Row 1 — company + role */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Company *</label>
          <Input placeholder="e.g. Stripe" value={company} onChange={(e) => setCompany(e.target.value)} required className="h-10" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Role *</label>
          <Input placeholder="e.g. SDE-2" value={role} onChange={(e) => setRole(e.target.value)} required className="h-10" />
        </div>
      </div>

      {/* Row 2 — date + round */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Date *</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-10" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Round type</label>
          <select value={roundType} onChange={(e) => setRoundType(e.target.value)}
            className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer">
            {ROUND_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>

      {/* How did it feel */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">How did it go?</label>
        <div className="grid grid-cols-4 gap-2">
          {FEELINGS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFeeling(f.value)}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all",
                feeling === f.value ? cn(f.bg, f.color, f.border) : "border-border hover:bg-secondary"
              )}
            >
              <span className="text-lg">{f.emoji}</span>
              <span className="hidden sm:block">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Questions asked */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" /> What were you asked?
        </label>
        <AutoTextarea
          value={questionsAsked}
          onChange={setQuestionsAsked}
          placeholder={"• Tell me about a time you handled conflict on a team\n• Design a URL shortener\n• Two Sum, then follow-up with space optimization…"}
          minRows={4}
        />
      </div>

      {/* How it went */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> How did it go? <span className="text-muted-foreground/50">(your reflection)</span>
        </label>
        <AutoTextarea
          value={howItWent}
          onChange={setHowItWent}
          placeholder="What went well? What felt natural? Where did you get stuck or lose confidence?…"
          minRows={3}
        />
      </div>

      {/* What to improve */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" /> What to improve next time
        </label>
        <AutoTextarea
          value={whatToImprove}
          onChange={setWhatToImprove}
          placeholder="Be more specific with STAR examples, practice DP problems, slow down when explaining system design…"
          minRows={3}
        />
      </div>

      {/* Outcome */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">Outcome</label>
        <div className="flex flex-wrap gap-2">
          {OUTCOMES.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setOutcome(o.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all",
                outcome === o.value
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "border-border hover:bg-secondary text-muted-foreground"
              )}
            >
              <span>{o.emoji}</span> {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1 gap-1.5" disabled={loading || !company || !role || !date}>
          {loading ? <Clock className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {initial ? "Save changes" : "Add entry"}
        </Button>
      </div>
    </form>
  );
}

// ── Journal Entry Card ────────────────────────────────────────────

function JournalCard({ entry, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const feeling = FEELING_MAP[entry.feeling] ?? FEELING_MAP.okay;
  const outcome = OUTCOME_MAP[entry.outcome] ?? OUTCOME_MAP.waiting;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-secondary/20 transition-colors"
      >
        {/* Feeling emoji */}
        <div className={cn(
          "h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0 border",
          feeling.bg, feeling.border
        )}>
          {feeling.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-bold text-base">{entry.company}</span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-sm text-muted-foreground">{entry.role}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />{formatDate(entry.interview_date)}
            </span>
            <span className="bg-secondary px-2 py-0.5 rounded-full">{ROUND_LABELS[entry.round_type] || entry.round_type}</span>
            <span className={cn("font-semibold", outcome.color)}>{outcome.emoji} {outcome.label}</span>
          </div>

          {/* Preview of first field */}
          {!expanded && entry.questions_asked && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1 italic">
              "{entry.questions_asked.split("\n")[0]}"
            </p>
          )}
        </div>

        <div className="shrink-0 text-muted-foreground mt-1">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-border/40 pt-4">
              {entry.questions_asked && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> What you were asked
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">{entry.questions_asked}</p>
                </div>
              )}

              {entry.how_it_went && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Reflection
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">{entry.how_it_went}</p>
                </div>
              )}

              {entry.what_to_improve && (
                <div className="space-y-1.5 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5" /> What to improve
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">{entry.what_to_improve}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {confirmDelete ? (
                  <>
                    <Button size="sm" variant="destructive" className="gap-1.5 text-xs h-8"
                      onClick={() => { onDelete(entry.id); setConfirmDelete(false); }}>
                      <Trash2 className="h-3.5 w-3.5" /> Yes, delete
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setConfirmDelete(false)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => onEdit(entry)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1.5 text-xs h-8 text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(true)}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────

function StatsBar({ entries }) {
  if (entries.length === 0) return null;
  const total    = entries.length;
  const offers   = entries.filter((e) => e.outcome === "offer").length;
  const great    = entries.filter((e) => e.feeling === "great" || e.feeling === "good").length;
  const improve  = entries.filter((e) => e.what_to_improve).length;

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {[
        { label: "Total entries", value: total,   color: "text-foreground" },
        { label: "Offers",        value: offers,  color: "text-emerald-600 dark:text-emerald-400" },
        { label: "Felt good",     value: great,   color: "text-blue-600 dark:text-blue-400" },
        { label: "With notes",    value: improve, color: "text-amber-600 dark:text-amber-400" },
      ].map((s) => (
        <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
          <div className={cn("text-2xl font-black font-mono", s.color)}>{s.value}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function JournalPage() {
  const { user } = useAuth();
  const [entries, setEntries]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editEntry, setEditEntry] = useState(null);

  const fetchEntries = useCallback(async () => {
    const res = await fetch("/api/journal");
    if (res.ok) setEntries(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.email) fetchEntries();
  }, [user?.email, fetchEntries]);

  const handleAdd = async (data) => {
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const newEntry = await res.json();
      setEntries((prev) => [newEntry, ...prev]);
    }
    setShowForm(false);
  };

  const handleEdit = async (data) => {
    const res = await fetch("/api/journal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editEntry.id, ...data }),
    });
    if (res.ok) {
      const updated = await res.json();
      setEntries((prev) => prev.map((e) => e.id === editEntry.id ? updated : e));
    }
    setEditEntry(null);
  };

  const handleDelete = async (id) => {
    await fetch("/api/journal", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 px-4 pt-6">

      {/* Page header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Interview Journal</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Record every real interview — questions asked, reflections, and what to improve.
            </p>
          </div>
        </div>
        {!showForm && !editEntry && (
          <Button onClick={() => setShowForm(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Add entry
          </Button>
        )}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="bg-card border border-border rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-base">New Journal Entry</h2>
                <p className="text-xs text-muted-foreground">Log what happened while it's fresh</p>
              </div>
            </div>
            <JournalForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit form */}
      <AnimatePresence>
        {editEntry && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="bg-card border border-primary/30 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-base">Edit Entry</h2>
                <p className="text-xs text-muted-foreground">{editEntry.company} · {editEntry.role}</p>
              </div>
            </div>
            <JournalForm initial={editEntry} onSave={handleEdit} onCancel={() => setEditEntry(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <StatsBar entries={entries} />

      {/* Entries */}
      {entries.length === 0 && !showForm ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-black mb-2">Your journal is empty</h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-6 leading-relaxed">
            After every real interview, log what you were asked, how it went, and what you'd do differently. Patterns emerge fast.
          </p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Log your first interview
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {entries.map((entry) => (
              <JournalCard
                key={entry.id}
                entry={entry}
                onEdit={(e) => { setEditEntry(e); setShowForm(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
