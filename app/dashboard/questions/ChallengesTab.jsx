"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSessionState } from "@/lib/useSessionState";
import {
  Sparkles, Loader2, Play, CheckCircle2, XCircle, Bookmark,
  BookmarkCheck, RefreshCw, ChevronDown, ChevronUp, Lightbulb,
  AlertCircle, Trophy, Info, ArrowLeft,
} from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// ── Constants ──────────────────────────────────────────────────────

export const CHALLENGE_CATEGORIES = [
  { id: "business",    label: "Business Logic" },
  { id: "oop",         label: "OOP & Classes" },
  { id: "state",       label: "State Machine" },
  { id: "strings",     label: "String Processing" },
  { id: "finance",     label: "Math & Finance" },
  { id: "data",        label: "Data Processing" },
  { id: "scheduling",  label: "Scheduling & Calendar" },
  { id: "inventory",   label: "Inventory & Orders" },
  { id: "auth",        label: "User & Permissions" },
  { id: "pricing",     label: "Pricing & Discounts" },
];

export const CHALLENGE_EXPERIENCE_LEVELS = [
  { label: "Fresher", value: "0" },
  { label: "1–2 yrs", value: "1" },
  { label: "3–5 yrs", value: "3" },
  { label: "5+ yrs",  value: "5" },
];

export const CHALLENGE_LANGUAGES = [
  { label: "JavaScript", value: "javascript" },
  { label: "Python",     value: "python"     },
];

export const DIFFICULTY_COLOR = {
  Easy:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  Hard:   "text-red-400 bg-red-500/10 border-red-500/25",
};

// ── Shared helpers ─────────────────────────────────────────────────

export async function runChallengeTests(code, language, testCases) {
  const res = await fetch("/api/challenges/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language, testCases }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to run tests");
  return data;
}

// ── Test Result Row ────────────────────────────────────────────────

export function TestResultRow({ result }) {
  const [open, setOpen] = useState(!result.passed);
  return (
    <div className={cn(
      "rounded-xl border overflow-hidden text-sm",
      result.passed ? "border-emerald-500/25 bg-emerald-500/5" : "border-red-500/25 bg-red-500/5"
    )}>
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left">
        {result.passed
          ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          : <XCircle      className="h-4 w-4 text-red-400 shrink-0" />}
        <span className="flex-1 font-medium text-xs">{result.label}</span>
        <span className={cn("text-xs font-bold", result.passed ? "text-emerald-400" : "text-red-400")}>
          {result.passed ? "PASS" : "FAIL"}
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-3 space-y-1.5 border-t border-border/50 pt-2">
              <div className="flex items-start gap-2 text-xs">
                <span className="text-muted-foreground w-16 shrink-0">Got:</span>
                <code className={cn("font-mono", result.passed ? "text-emerald-400" : "text-red-400")}>
                  {JSON.stringify(result.got)}
                </code>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <span className="text-muted-foreground w-16 shrink-0">Expected:</span>
                <code className="font-mono text-foreground">{JSON.stringify(result.expected)}</code>
              </div>
              {result.explanation && (
                <p className="text-xs text-muted-foreground italic pt-1 border-t border-border/30">
                  {result.explanation}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Challenge IDE (reusable — used in ChallengesTab + BookmarksTab) ──

export function ChallengeIDE({ challenge, code, setCode, lang, onLangChange,
  testResults, setTestResults, compileError, setCompileError }) {
  const [running, setRunning] = useState(false);
  const [error, setError]     = useState("");

  const runTests = async () => {
    setRunning(true); setTestResults(null); setCompileError(""); setError("");
    try {
      const data = await runChallengeTests(code, lang, challenge.testCases);
      setTestResults(data.results);
      if (data.compileError) setCompileError(data.compileError);
    } catch (err) {
      setError(err.message);
    } finally { setRunning(false); }
  };

  const passCount = testResults ? testResults.filter(r => r.passed).length : 0;
  const allPassed = testResults && passCount === testResults.length;

  return (
    <div className="space-y-4">
      {/* Editor card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            {CHALLENGE_LANGUAGES.map(l => (
              <button key={l.value} onClick={() => onLangChange(l.value)}
                className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  lang === l.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                {l.label}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={runTests} disabled={running || !code.trim()} className="gap-1.5 h-8 text-xs">
            {running
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Running…</>
              : <><Play className="h-3.5 w-3.5" />Run Tests</>}
          </Button>
        </div>
        <div style={{ height: 360 }}>
          <MonacoEditor
            height="100%"
            language={lang === "python" ? "python" : "javascript"}
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v || "")}
            options={{
              fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false,
              lineNumbers: "on", automaticLayout: true, padding: { top: 12 },
              fontFamily: "JetBrains Mono, Fira Code, monospace",
            }}
          />
        </div>
      </div>

      {/* Errors */}
      {(error || compileError) && (
        <div className="bg-red-500/5 border border-red-500/25 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-red-400 mb-1">Error</p>
          <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap">{error || compileError}</pre>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {testResults && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border font-medium text-sm",
              allPassed
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            )}>
              {allPassed ? <Trophy className="h-5 w-5" /> : <Info className="h-5 w-5" />}
              <span>{allPassed ? `All ${passCount} tests passed!` : `${passCount} / ${testResults.length} tests passed`}</span>
            </div>
            <div className="space-y-2">
              {testResults.map((r, i) => <TestResultRow key={i} result={r} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Challenge description panel ────────────────────────────────────

export function ChallengeDescription({ challenge }) {
  const [hintsOpen, setHintsOpen] = useState(false);
  return (
    <div className="space-y-4">
      {/* Description + requirements */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{challenge.description}</p>
        </div>
        {challenge.requirements?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Requirements</p>
            <ul className="space-y-1.5">
              {challenge.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-primary mt-0.5 shrink-0 font-bold">{i + 1}.</span>{req}
                </li>
              ))}
            </ul>
          </div>
        )}
        {challenge.functionSignature && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Function Signature</p>
            <code className="block bg-secondary/60 rounded-xl px-3 py-2 text-xs font-mono text-primary">
              {challenge.functionSignature}
            </code>
            {challenge.paramDescriptions && (
              <div className="mt-2 space-y-1">
                {Object.entries(challenge.paramDescriptions).map(([param, desc]) => (
                  <p key={param} className="text-xs text-muted-foreground">
                    <code className="text-primary font-mono">{param}</code> — {desc}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test scenarios */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Test Scenarios ({challenge.testCases?.length})
        </p>
        <div className="space-y-2">
          {challenge.testCases?.map((tc, i) => (
            <div key={i} className="rounded-xl bg-secondary/40 px-3 py-2.5 text-xs">
              <p className="font-medium mb-1">{tc.label}</p>
              <p className="text-muted-foreground">
                Expected: <code className="text-amber-400 font-mono">{JSON.stringify(tc.expected)}</code>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Hints */}
      {challenge.hints?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <button onClick={() => setHintsOpen(p => !p)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hints</span>
            </div>
            {hintsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {hintsOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <ul className="px-5 pb-4 space-y-2 border-t border-border/50 pt-3">
                  {challenge.hints.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-amber-400 shrink-0 font-bold mt-0.5">{i + 1}.</span>{h}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Main ChallengesTab ─────────────────────────────────────────────

export default function ChallengesTab({ initialCategory = null, initialLevel = null, seed = null }) {
  // ── Persistent session state ─────────────────────────────────────
  const [category, setCategory]     = useSessionState("ch_category", "");
  const [level, setLevel]           = useSessionState("ch_level", "3");
  const [challenge, setChallenge]   = useSessionState("ch_challenge", null);
  const [lang, setLang]             = useSessionState("ch_lang", "javascript");
  const [codeJs, setCodeJs]         = useSessionState("ch_code_js", "");
  const [codePy, setCodePy]         = useSessionState("ch_code_py", "");
  const [testResults, setTestResults] = useSessionState("ch_results", null);
  const [compileError, setCompileError] = useSessionState("ch_compile_error", "");

  // ── Ephemeral UI state ───────────────────────────────────────────
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showSetup, setShowSetup] = useState(false);

  // ── Bookmarks from localStorage ──────────────────────────────────
  const [bookmarks, setBookmarks] = useState(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("challenge_bookmarks") || "[]"); } catch { return []; }
  });

  const didInit = useRef(false);

  // Derived: current code based on active language
  const code    = lang === "python" ? codePy : codeJs;
  const setCode = (v) => lang === "python" ? setCodePy(v) : setCodeJs(v);

  const handleLangChange = (newLang) => {
    setLang(newLang);
    setTestResults(null);
    setCompileError("");
  };

  // On mount: apply URL params if they override session
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (initialCategory) setCategory(initialCategory);
    if (initialLevel)    setLevel(initialLevel);

    if (seed && initialCategory) {
      const cacheKey = `challenge_cache_${seed}`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) { applyChallenge(JSON.parse(cached)); return; }
      } catch {}
      generate(initialCategory, initialLevel || "3", seed);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyChallenge = (c) => {
    setChallenge(c);
    setCodeJs(c.starterCode?.javascript || "");
    setCodePy(c.starterCode?.python || "");
    setTestResults(null);
    setCompileError("");
  };

  const generate = async (cat, lvl, cacheSeed) => {
    const activeCat = cat ?? category;
    const activeLvl = lvl ?? level;
    if (!activeCat) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/challenges/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: CHALLENGE_CATEGORIES.find(c => c.id === activeCat)?.label || activeCat,
          level: activeLvl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      applyChallenge(data);
      setCategory(activeCat);
      setLevel(activeLvl);
      if (cacheSeed) localStorage.setItem(`challenge_cache_${cacheSeed}`, JSON.stringify(data));
      setShowSetup(false);
    } catch (err) {
      setError(err.message || "Generation failed. Please try again.");
    } finally { setLoading(false); }
  };

  const toggleBookmark = () => {
    if (!challenge) return;
    const bSeed = challenge.title.toLowerCase().replace(/\s+/g, "_");
    const isBookmarked = bookmarks.some(b => b.seed === bSeed);
    const next = isBookmarked
      ? bookmarks.filter(b => b.seed !== bSeed)
      : [...bookmarks, {
          seed: bSeed,
          challenge,
          code_js: codeJs,
          code_py: codePy,
          bookmarkedAt: new Date().toISOString(),
        }];
    setBookmarks(next);
    localStorage.setItem("challenge_bookmarks", JSON.stringify(next));
  };

  const isBookmarked = challenge
    ? bookmarks.some(b => b.seed === challenge.title.toLowerCase().replace(/\s+/g, "_"))
    : false;

  // ── Setup view ───────────────────────────────────────────────────
  const setupView = (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="relative bg-card border border-border rounded-2xl p-6 space-y-6 overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/4 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</label>
        <div className="flex flex-wrap gap-2">
          {CHALLENGE_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className={cn("px-3 py-1.5 rounded-xl border text-xs font-medium transition-all",
                category === c.id
                  ? "bg-primary/15 border-primary/50 text-primary shadow-sm"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Experience Level</label>
        <div className="flex gap-2">
          {CHALLENGE_EXPERIENCE_LEVELS.map(lvl => (
            <button key={lvl.value} onClick={() => setLevel(lvl.value)}
              className={cn("flex-1 h-10 rounded-xl border text-xs font-medium transition-all",
                level === lvl.value
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}>
              {lvl.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      <Button onClick={() => generate()} disabled={!category || loading} className="w-full h-12 gap-2 font-bold">
        {loading
          ? <><Loader2 className="h-4 w-4 animate-spin" />Generating challenge…</>
          : <><Sparkles className="h-4 w-4" />Generate Challenge</>}
      </Button>
    </motion.div>
  );

  if (!challenge && !loading) return <div className="space-y-4">{setupView}</div>;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Crafting your challenge…</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Back button */}
      <button
        onClick={() => { setChallenge(null); setTestResults(null); setCompileError(""); setShowSetup(false); }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Challenges
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-black">{challenge.title}</h2>
          {challenge.difficulty && (
            <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full border", DIFFICULTY_COLOR[challenge.difficulty])}>
              {challenge.difficulty}
            </span>
          )}
          <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
            {CHALLENGE_CATEGORIES.find(c => c.id === category)?.label || challenge.category}
          </span>
          <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
            {CHALLENGE_EXPERIENCE_LEVELS.find(l => l.value === level)?.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleBookmark}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all",
              isBookmarked
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            )}>
            {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
            {isBookmarked ? "Saved" : "Save"}
          </button>
          <button onClick={() => setShowSetup(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
            <RefreshCw className="h-3.5 w-3.5" />
            New challenge
          </button>
        </div>
      </div>

      {/* Inline setup toggle */}
      <AnimatePresence>
        {showSetup && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pb-2">{setupView}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <ChallengeDescription challenge={challenge} />
        </div>
        <div className="lg:col-span-3">
          <ChallengeIDE
            challenge={challenge}
            code={code}
            setCode={setCode}
            lang={lang}
            onLangChange={handleLangChange}
            testResults={testResults}
            setTestResults={setTestResults}
            compileError={compileError}
            setCompileError={setCompileError}
          />
        </div>
      </div>
    </motion.div>
  );
}
