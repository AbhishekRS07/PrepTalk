"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Loader2,
  Sparkles,
  RefreshCw,
  Code2,
  BrainCircuit,
  Play,
  X,
  Terminal,
  CheckCircle2,
  XCircle,
  ChevronLeft,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { chatSession } from "../../../lib/GorqAIModal";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// ── Constants ────────────────────────────────────────────────────

const PROFILES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "React Developer",
  "Node.js Developer",
  "Python Developer",
  "Java Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Android Developer",
  "iOS Developer",
  "QA Engineer",
  "System Design",
  "Product Manager",
];

const EXPERIENCE_LEVELS = [
  { label: "Fresher", value: "0" },
  { label: "1–2 yrs", value: "1" },
  { label: "3–5 yrs", value: "3" },
  { label: "5+ yrs", value: "5" },
];

const DSA_TOPICS = [
  "Arrays",
  "Strings",
  "Linked List",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "Recursion",
  "Sorting & Searching",
  "Stack & Queue",
  "Hashing",
];

const LANGUAGES = [
  { label: "Python",     value: "python",     compiler: "cpython-3.12.7",  defaultCode: `# Write your solution here\ndef solution():\n    pass\n\nprint(solution())` },
  { label: "JavaScript", value: "javascript", compiler: "nodejs-20.17.0",  defaultCode: `// Write your solution here\nfunction solution() {\n\n}\n\nconsole.log(solution());` },
  { label: "C++",        value: "c++",        compiler: "gcc-13.2.0",      defaultCode: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}` },
  { label: "C",          value: "c",          compiler: "gcc-13.2.0-c",    defaultCode: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}` },
  { label: "Go",         value: "go",         compiler: "go-1.23.2",       defaultCode: `package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your solution here\n    fmt.Println()\n}` },
];

const difficultyColor = {
  Easy: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  Medium: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
  Hard: "text-red-500 bg-red-500/10 border-red-500/20",
};

// ── Wandbox API (free, no API key) ───────────────────────────────

async function runCode(compiler, code, stdin = "") {
  const res = await fetch("https://wandbox.org/api/compile.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ compiler, code, stdin }),
  });
  return await res.json();
}

// ── IDE Panel ────────────────────────────────────────────────────

function IDEPanel({ problem, onClose }) {
  const [lang, setLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].defaultCode);
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);

  const handleLangChange = (l) => {
    setLang(l);
    setCode(l.defaultCode);
    setOutput(null);
    setStdin("");
  };

  const handleRun = async () => {
    setRunning(true);
    setOutput(null);
    try {
      const result = await runCode(lang.compiler, code, stdin);
      setOutput(result);
    } catch (err) {
      console.error("Run error:", err);
      setOutput({ program_error: "Failed to connect to execution engine." });
    } finally {
      setRunning(false);
    }
  };

  const stdout = output?.program_output || output?.program_message || "";
  const stderr = output?.compiler_error || output?.program_error || "";
  const exitCode = output ? parseInt(output?.status ?? "0") : null;
  const success = output && exitCode === 0 && !stderr;

  return (
    <div className="flex flex-col h-full">
      {/* IDE Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold truncate">{problem.title}</span>
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border shrink-0", difficultyColor[problem.difficulty])}>
            {problem.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Language selector */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                onClick={() => handleLangChange(l)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  lang.value === l.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={handleRun} disabled={running} className="gap-1.5">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {running ? "Running…" : "Run"}
          </Button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Split: problem + editor */}
      <div className="flex flex-1 min-h-0 divide-x divide-border">
        {/* Problem description */}
        <div className="w-2/5 overflow-y-auto p-5 space-y-4 text-sm">
          <div>
            <h2 className="font-bold text-base mb-1">{problem.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
          </div>

          {problem.examples?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Examples</p>
              {problem.examples.map((ex, i) => (
                <div key={i} className="bg-secondary/50 rounded-xl p-3 font-mono text-xs space-y-1">
                  <p><span className="text-muted-foreground">Input:</span> {ex.input}</p>
                  <p><span className="text-muted-foreground">Output:</span> {ex.output}</p>
                  {ex.explanation && <p className="text-muted-foreground italic">{ex.explanation}</p>}
                </div>
              ))}
            </div>
          )}

          {problem.constraints?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Constraints</p>
              <ul className="space-y-1">
                {problem.constraints.map((c, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {problem.hint && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-primary mb-1">Hint</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{problem.hint}</p>
            </div>
          )}
        </div>

        {/* Editor + output */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <MonacoEditor
              height="100%"
              language={lang.value === "c++" ? "cpp" : lang.value}
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                automaticLayout: true,
                padding: { top: 12 },
                fontFamily: "JetBrains Mono, Fira Code, monospace",
              }}
            />
          </div>

          {/* Stdin */}
          <div className="border-t border-border px-3 py-2 bg-card">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Stdin (optional)</p>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              rows={2}
              placeholder="Enter input here…"
              className="w-full text-xs font-mono bg-secondary/40 border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {/* Output */}
          <div className="border-t border-border bg-[#1e1e1e] shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
              <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Output</span>
              {output && (
                success
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-auto" />
                  : <XCircle className="h-3.5 w-3.5 text-red-500 ml-auto" />
              )}
            </div>
            <div className="px-4 py-3 font-mono text-xs min-h-[60px] max-h-[120px] overflow-y-auto">
              {!output && <span className="text-white/30">Run your code to see output here.</span>}
              {output && !stdout && !stderr && <span className="text-white/40 italic">No output produced.</span>}
              {stdout && <pre className="text-emerald-400 whitespace-pre-wrap">{stdout}</pre>}
              {stderr && <pre className="text-red-400 whitespace-pre-wrap">{stderr}</pre>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DSA Question Card ─────────────────────────────────────────────

function DSAQuestionCard({ problem, index, onSolve }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-border rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{problem.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{problem.topic}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full border", difficultyColor[problem.difficulty])}>
            {problem.difficulty}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-4 border-t border-border space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{problem.description}</p>

              {problem.examples?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Example</p>
                  <div className="bg-secondary/50 rounded-xl p-3 font-mono text-xs space-y-1">
                    <p><span className="text-muted-foreground">Input:</span> {problem.examples[0].input}</p>
                    <p><span className="text-muted-foreground">Output:</span> {problem.examples[0].output}</p>
                  </div>
                </div>
              )}

              <Button size="sm" onClick={() => onSolve(problem)} className="gap-2">
                <Code2 className="h-3.5 w-3.5" />
                Solve in IDE
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── DSA Tab ───────────────────────────────────────────────────────

function DSATab() {
  const [topic, setTopic] = useState("");
  const [experience, setExperience] = useState("0");
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [activeProblem, setActiveProblem] = useState(null);

  const generate = async () => {
    if (!topic) return;
    setLoading(true);
    setActiveProblem(null);
    try {
      const expLabel = EXPERIENCE_LEVELS.find(l => l.value === experience)?.label || "Fresher";
      const prompt = `Generate 8 DSA problems on "${topic}" for a ${expLabel} developer. Reply ONLY with a JSON array. Each object must have these exact keys:
"title" (string), "difficulty" (exactly "Easy" or "Medium" or "Hard"), "topic" (string), "description" (string, max 2 sentences, no special characters or newlines), "examples" (array of 2 objects each with "input" string and "output" string), "constraints" (array of 2 strings), "hint" (string, 1 sentence).
Use only standard ASCII. No markdown, no code blocks, no explanation outside the JSON array.`;

      const result = await chatSession.sendMessage(prompt);
      const text = await result.response.text();

      // Strip markdown fences
      let s = text.replace(/```[\w]*\n?/g, "").replace(/```/g, "");

      // Fix invalid backslash escapes before slicing
      s = s.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");

      // Find opening bracket
      const start = s.indexOf("[");
      if (start === -1) throw new Error("No JSON array found");
      s = s.slice(start);

      // Try parsing directly first
      let parsed = null;
      try {
        parsed = JSON.parse(s);
      } catch (_) {
        // Response may be truncated — find last complete object by trimming to last `},`  or `}` before `]`
        // Strategy: find last occurrence of complete object closing
        const lastComplete = Math.max(s.lastIndexOf("},"), s.lastIndexOf("}\n]"), s.lastIndexOf("} ]"));
        if (lastComplete !== -1) {
          const recovered = s.slice(0, lastComplete + 1) + "]";
          try {
            parsed = JSON.parse(recovered);
          } catch (_2) {
            // Last resort: extract individual objects with regex
            const objects = [];
            const objRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
            let m;
            while ((m = objRegex.exec(s)) !== null) {
              try { objects.push(JSON.parse(m[0])); } catch (_3) {}
            }
            if (objects.length === 0) throw new Error("Could not recover any valid problems");
            parsed = objects;
          }
        }
      }

      setProblems(parsed);
      setGenerated(true);
    } catch (err) {
      console.error("DSA generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (activeProblem) {
    return (
      <div className="border border-border rounded-2xl overflow-hidden" style={{ height: "78vh" }}>
        <IDEPanel problem={activeProblem} onClose={() => setActiveProblem(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Topic */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Topic</label>
            <select
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setGenerated(false); setProblems([]); }}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select a topic…</option>
              {DSA_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Experience */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Experience Level</label>
            <div className="flex gap-2">
              {EXPERIENCE_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  onClick={() => { setExperience(lvl.value); setGenerated(false); setProblems([]); }}
                  className={cn(
                    "flex-1 h-10 rounded-lg border text-xs font-medium transition-colors",
                    experience === lvl.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={generate} disabled={!topic || loading} className="w-full gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generating problems…" : "Generate DSA Problems"}
        </Button>
      </div>

      {/* Problems list */}
      <AnimatePresence mode="wait">
        {problems.length > 0 && (
          <motion.div
            key={topic + experience}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {topic} · {EXPERIENCE_LEVELS.find(l => l.value === experience)?.label}
              </p>
              <button
                onClick={generate}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> Regenerate
              </button>
            </div>
            {problems.map((p, i) => (
              <DSAQuestionCard key={i} problem={p} index={i} onSolve={setActiveProblem} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!generated && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <Code2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Select a topic and experience level to generate DSA problems.</p>
        </div>
      )}
    </div>
  );
}

// ── Interview Q&A Tab ─────────────────────────────────────────────

function QACard({ item, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-border rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
            {index + 1}
          </span>
          <span className="text-sm font-medium leading-relaxed">{item.question}</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 mt-0.5 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-border">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Answer</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InterviewQATab() {
  const [profile, setProfile] = useState("");
  const [experience, setExperience] = useState("0");
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = async (nextPage = 0) => {
    if (!profile) return;
    setLoading(true);
    try {
      const prompt = `Generate exactly 10 interview questions and answers for the role of "${profile}" with ${experience} year(s) of experience. These should be ${nextPage === 0 ? "fundamental" : "different from common/basic"} questions. Reply ONLY as a JSON array with objects having "question" (string) and "answer" (string, 2-4 sentences). No markdown, no explanation.`;
      const result = await chatSession.sendMessage(prompt);
      const raw = (await result.response.text()).replace(/```json/g, "").replace(/```/g, "").trim();
      setQuestions(JSON.parse(raw));
      setPage(nextPage);
      setGenerated(true);
    } catch (err) {
      console.error("Generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Job Profile</label>
            <select
              value={profile}
              onChange={(e) => { setProfile(e.target.value); setGenerated(false); setQuestions([]); }}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select a profile…</option>
              {PROFILES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Experience Level</label>
            <div className="flex gap-2">
              {EXPERIENCE_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  onClick={() => { setExperience(lvl.value); setGenerated(false); setQuestions([]); }}
                  className={cn(
                    "flex-1 h-10 rounded-lg border text-xs font-medium transition-colors",
                    experience === lvl.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button onClick={() => generate(0)} disabled={!profile || loading} className="w-full gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generating…" : "Generate 10 Questions"}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {questions.length > 0 && (
          <motion.div key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {profile} · {EXPERIENCE_LEVELS.find(l => l.value === experience)?.label} · Set {page + 1}
              </p>
              <span className="text-xs text-muted-foreground">{questions.length} questions</span>
            </div>
            {questions.map((q, i) => <QACard key={`${page}-${i}`} item={q} index={i} />)}
            <Button variant="outline" className="w-full gap-2 mt-2" onClick={() => generate(page + 1)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Next 10 Questions
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {!generated && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <BrainCircuit className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Select a profile and generate questions to start studying.</p>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────

const TABS = [
  { id: "qa", label: "Interview Q&A", icon: BrainCircuit },
  { id: "dsa", label: "DSA Practice", icon: Code2 },
];

export default function QuestionsPage() {
  const [tab, setTab] = useState("qa");

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Question Bank</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Study curated interview Q&A and practice DSA problems with an in-browser IDE.
        </p>
      </div>

      <div className="inline-flex bg-secondary rounded-xl p-1 gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all",
              tab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "qa" ? <InterviewQATab /> : <DSATab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
