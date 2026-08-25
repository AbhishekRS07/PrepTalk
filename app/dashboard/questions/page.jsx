"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSessionState, useSessionSet } from "@/lib/useSessionState";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Loader2,
  Sparkles,
  // (also used as Challenges tab icon)
  RefreshCw,
  Code2,
  BrainCircuit,
  Play,
  X,
  Terminal,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  Bot,
  User,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { RoleCombobox } from "../../../components/ui/role-combobox";
import { cn } from "@/lib/utils";
import { fadeUp, listContainer, listItem } from "@/lib/animations";
import ChallengesTab, { CHALLENGE_CATEGORIES, ChallengeIDE, ChallengeDescription } from "./ChallengesTab";

async function generateText(prompt) {
  const res = await fetch("/api/questions/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Generation failed");
  return data.text;
}

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// ── Constants ─────────────────────────────────────────────────────

const PROFILES = [
  "Junior Developer","Mid-Level Developer","Senior Developer","Technical Lead",
  "Frontend Developer","Backend Developer","Full Stack Developer","React Developer",
  "Node.js Developer","Python Developer","Java Developer","DevOps Engineer",
  "Data Scientist","Machine Learning Engineer","Android Developer","iOS Developer",
  "QA Engineer","System Design","Product Manager",
  "HR Generalist","Technical Recruiter","HR Business Partner",
];

const EXPERIENCE_LEVELS = [
  { label: "Fresher", value: "0" },
  { label: "1–2 yrs", value: "1" },
  { label: "3–5 yrs", value: "3" },
  { label: "5+ yrs", value: "5" },
];

const DSA_TOPICS = [
  "Arrays", "Strings", "Linked List", "Trees", "Binary Trees", "Binary Search Trees",
  "Graphs", "Dynamic Programming", "Recursion", "Backtracking",
  "Sorting & Searching", "Binary Search", "Stack & Queue", "Hashing",
  "Heaps & Priority Queue", "Two Pointers", "Sliding Window",
  "Greedy", "Divide & Conquer", "Bit Manipulation",
  "Trie", "Segment Tree", "Matrix & 2D Arrays", "Math & Number Theory",
];

const LANGUAGES = [
  { label: "Python",     value: "python",     compiler: "cpython-3.12.7",  defaultCode: `# Write your solution here\ndef solution():\n    pass\n\nprint(solution())` },
  { label: "JavaScript", value: "javascript", compiler: "nodejs-20.17.0",  defaultCode: `// Write your solution here\nfunction solution() {\n\n}\n\nconsole.log(solution());` },
  { label: "C++",        value: "c++",        compiler: "gcc-13.2.0",      defaultCode: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}` },
  { label: "C",          value: "c",          compiler: "gcc-13.2.0-c",    defaultCode: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}` },
  { label: "Go",         value: "go",         compiler: "go-1.23.2",       defaultCode: `package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your solution here\n    fmt.Println()\n}` },
];

const difficultyColor = {
  Easy:   "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  Medium: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
  Hard:   "text-red-600 bg-red-500/10 border-red-500/20 dark:text-red-400",
};

// ── Wandbox API ───────────────────────────────────────────────────

async function runCode(compiler, code, stdin = "") {
  const res = await fetch("https://wandbox.org/api/compile.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ compiler, code, stdin }),
  });
  return await res.json();
}

// ── IDE Panel ─────────────────────────────────────────────────────

function IDEPanel({ problem, onClose, onMarkSolved, isSolved }) {
  const [lang, setLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].defaultCode);
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);

  // ── AI Chat state ──────────────────────────────────────────────
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hey! I'm your AI hint assistant for **${problem.title}**. Ask me anything — I'll guide you with hints without giving away the full solution. 💡`,
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLangChange = (l) => { setLang(l); setCode(l.defaultCode); setOutput(null); setStdin(""); };

  const handleRun = async () => {
    setRunning(true); setOutput(null);
    try {
      const result = await runCode(lang.compiler, code, stdin);
      setOutput(result);
    } catch (err) {
      setOutput({ program_error: "Failed to connect to execution engine." });
    } finally { setRunning(false); }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    const userMsg = chatInput.trim();
    if (!userMsg || chatLoading) return;

    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const history = newMessages
        .slice(-6) // last 3 turns for context
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n");

      const prompt = `You are an AI coding assistant embedded in a DSA practice IDE. Your job is to help the user solve problems through hints and guidance — NEVER give the full working solution unless the user explicitly asks for it multiple times.

Problem: ${problem.title}
Description: ${problem.description}
Difficulty: ${problem.difficulty}
Constraints: ${problem.constraints?.join(", ") || "none"}
Language: ${lang.label}

User's current code:
\`\`\`${lang.value}
${code}
\`\`\`

Conversation so far:
${history}

Respond helpfully in 2-4 sentences. Give hints, explain concepts, point out bugs without fixing them outright, or suggest an approach. Keep it concise and encouraging.`;

      const res = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.text || "Sorry, I couldn't generate a response." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const stdout   = output?.program_output || output?.program_message || "";
  const stderr   = output?.compiler_error || output?.program_error   || "";
  const exitCode = output ? parseInt(output?.status ?? "0") : null;
  const success  = output && exitCode === 0 && !stderr;

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card shrink-0 flex-wrap md:flex-nowrap">
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold truncate">{problem.title}</span>
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border shrink-0", difficultyColor[problem.difficulty])}>
            {problem.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            {LANGUAGES.map((l) => (
              <button key={l.value} onClick={() => handleLangChange(l)}
                className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  lang.value === l.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>
                {l.label}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={handleRun} disabled={running} className="gap-1.5">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {running ? "Running…" : "Run"}
          </Button>
          {/* AI Chat toggle */}
          <button
            onClick={() => setChatOpen((p) => !p)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
              chatOpen
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            )}
          >
            <Bot className="h-3.5 w-3.5" />
            AI Hint
          </button>
          <button
            onClick={() => { onMarkSolved?.(problem); onClose(); }}
            title={isSolved ? "Already marked solved" : "Mark as solved"}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
              isSolved
                ? "bg-emerald-500/15 text-emerald-500 cursor-default"
                : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isSolved ? "Solved" : "Mark Solved"}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden md:divide-x divide-border">
        {/* Problem description */}
        <div className="w-full md:w-2/5 max-h-[45vh] md:max-h-none overflow-y-auto p-5 space-y-4 text-sm border-b md:border-b-0 border-border shrink-0 md:shrink">
          <div>
            <h2 className="font-bold text-base mb-1">{problem.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
          </div>
          {problem.examples?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold font-mono uppercase tracking-wide text-muted-foreground">Examples</p>
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
              <p className="text-xs font-semibold font-mono uppercase tracking-wide text-muted-foreground mb-1.5">Constraints</p>
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
        <div className="flex-1 flex flex-col min-h-[50vh] md:min-h-0">
          <div className="flex-1 min-h-0">
            <MonacoEditor height="100%" language={lang.value === "c++" ? "cpp" : lang.value}
              theme="vs-dark" value={code} onChange={(v) => setCode(v || "")}
              options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false,
                lineNumbers: "on", automaticLayout: true, padding: { top: 12 },
                fontFamily: "JetBrains Mono, Fira Code, monospace" }}
            />
          </div>
          <div className="border-t border-border px-3 py-2 bg-card">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Stdin (optional)</p>
            <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={2}
              placeholder="Enter input here…"
              className="w-full text-xs font-mono bg-secondary/40 border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div className="border-t border-border bg-[#1e1e1e] shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
              <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Output</span>
              {output && (success
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

        {/* ── AI Chat Panel ── */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col min-h-[45vh] md:min-h-0 w-full md:w-80 overflow-hidden bg-card border-t md:border-t-0 md:border-l border-border shrink-0"
            >
              {/* Chat header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">AI Hint Assistant</p>
                    <p className="text-[10px] text-muted-foreground">Powered by Groq · hints only</p>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("shrink-0 h-6 w-6 rounded-full flex items-center justify-center mt-0.5",
                      msg.role === "user" ? "bg-primary/20" : "bg-primary/10")}>
                      {msg.role === "user"
                        ? <User className="h-3 w-3 text-primary" />
                        : <Bot className="h-3 w-3 text-primary" />
                      }
                    </div>
                    <div className={cn("max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-secondary text-foreground rounded-tl-sm"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2">
                    <div className="shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick prompts */}
              {messages.length === 1 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                  {["Give me a hint", "What approach should I use?", "Why is my code wrong?"].map((q) => (
                    <button key={q} onClick={() => setChatInput(q)}
                      className="text-[10px] px-2.5 py-1 rounded-full border border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleChat} className="flex items-end gap-2 p-3 border-t border-border shrink-0">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(e); } }}
                  placeholder="Ask for a hint…"
                  rows={2}
                  className="flex-1 text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 leading-relaxed"
                />
                <button type="submit" disabled={!chatInput.trim() || chatLoading}
                  className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-primary/90 transition-colors">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── DSA Question Card ─────────────────────────────────────────────

function DSAQuestionCard({ problem, index, onSolve, isSolved }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div variants={listItem} className={cn(
      "group border rounded-2xl overflow-hidden transition-colors duration-300",
      isSolved
        ? "border-emerald-500/30 bg-emerald-500/3 hover:border-emerald-500/50"
        : "border-border hover:border-primary/30"
    )}>
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-secondary/40 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn(
            "shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300",
            isSolved
              ? "bg-emerald-500/20 text-emerald-500"
              : "bg-secondary group-hover:bg-primary/10"
          )}>
            {isSolved ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
          </span>
          <div className="min-w-0">
            <p className={cn("text-sm font-medium truncate", isSolved && "line-through text-muted-foreground")}>{problem.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{problem.topic}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isSolved && (
            <span className="text-xs font-semibold text-emerald-500 hidden sm:inline">Solved</span>
          )}
          <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full border", difficultyColor[problem.difficulty])}>
            {problem.difficulty}
          </span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden">
            <div className="px-5 pb-5 pt-4 border-t border-border space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{problem.description}</p>
              {problem.examples?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold font-mono uppercase tracking-wide text-muted-foreground">Example</p>
                  <div className="bg-secondary/50 rounded-xl p-3 font-mono text-xs space-y-1">
                    <p><span className="text-muted-foreground">Input:</span> {problem.examples[0].input}</p>
                    <p><span className="text-muted-foreground">Output:</span> {problem.examples[0].output}</p>
                  </div>
                </div>
              )}
              <Button size="sm" onClick={() => onSolve(problem)} className="gap-2">
                <Code2 className="h-3.5 w-3.5" /> Solve in IDE
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── DSA Tab ───────────────────────────────────────────────────────

function DSATab({ initialTopics = [], initialExperience = null, autoGenerate = false }) {
  const [topics, setTopics]         = useSessionState("dsa_topics", []);
  const [experience, setExperience] = useSessionState("dsa_experience", "0");
  const [problems, setProblems]     = useSessionState("dsa_problems", []);
  const [loading, setLoading]       = useState(false);
  const [generated, setGenerated]   = useSessionState("dsa_generated", false);
  const [activeProblem, setActiveProblem] = useState(null);
  const [solved, setSolved]         = useSessionSet("dsa_solved");
  const [filter, setFilter]         = useSessionState("dsa_filter", "all");
  const [genError, setGenError]     = useState("");
  const didAutoGenerate             = useRef(false);

  const handleMarkSolved = (problem) => {
    setSolved((prev) => new Set([...prev, problem.title]));
  };

  const toggleTopic = (t) => {
    setTopics((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
    setGenerated(false);
    setProblems([]);
  };

  const generateWithExperience = async (topicsOverride, experienceOverride) => {
    const activeTopics = topicsOverride ?? topics;
    const activeExp    = experienceOverride ?? experience;
    if (activeTopics.length === 0) return;
    setLoading(true); setActiveProblem(null); setGenError("");
    try {
      const expLabel = EXPERIENCE_LEVELS.find(l => l.value === activeExp)?.label || "Fresher";
      const topicStr = activeTopics.length === 1
        ? `"${activeTopics[0]}"`
        : activeTopics.map((t) => `"${t}"`).join(", ");
      const prompt = `Generate 8 DSA problems covering these topics: ${topicStr}. For a ${expLabel} developer. Distribute problems evenly across topics if multiple are given.

Reply ONLY with a valid JSON array — no markdown, no code fences, no explanation.
Each element must have EXACTLY these keys:
- "title": short problem name (string)
- "difficulty": exactly one of "Easy", "Medium", "Hard"
- "topic": which topic this problem is from (string)
- "description": 1-2 sentences, plain ASCII only, no newlines
- "examples": array of exactly 2 objects, each with "input" (string) and "output" (string)
- "constraints": array of exactly 2 strings
- "hint": one sentence hint (string)`;

      const raw = await generateText(prompt);

      // Strip markdown fences
      let s = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

      // Extract the array boundaries
      const start = s.indexOf("[");
      const end   = s.lastIndexOf("]");
      if (start === -1 || end === -1 || end <= start) {
        throw new Error("Response did not contain a JSON array");
      }
      s = s.slice(start, end + 1);

      // Fix stray backslashes that break JSON
      s = s.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");

      let parsed;
      try {
        parsed = JSON.parse(s);
      } catch {
        // Try fixing trailing commas before ] or }
        const fixed = s.replace(/,(\s*[}\]])/g, "$1");
        parsed = JSON.parse(fixed); // let it throw naturally if still broken
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Parsed result is not a non-empty array");
      }

      setProblems(parsed); setGenerated(true);
    } catch (err) {
      console.error("DSA generation error:", err);
      setGenError("Generation failed — the AI returned an unexpected response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generate = (topicsOverride) => generateWithExperience(topicsOverride, null);

  // Apply initialTopics/initialExperience from URL params and auto-generate once
  useEffect(() => {
    if (initialTopics.length > 0 && !didAutoGenerate.current) {
      didAutoGenerate.current = true;
      setTopics(initialTopics);
      setGenerated(false);
      setProblems([]);
      const expToUse = initialExperience ?? experience;
      if (initialExperience) setExperience(initialExperience);
      if (autoGenerate) {
        // generate() reads experience from state which may not be updated yet — pass it directly
        generateWithExperience(initialTopics, expToUse);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (activeProblem) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
        className="border border-border rounded-2xl overflow-hidden" style={{ height: "78vh" }}>
        <IDEPanel
          problem={activeProblem}
          onClose={() => setActiveProblem(null)}
          onMarkSolved={handleMarkSolved}
          isSolved={solved.has(activeProblem.title)}
        />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls card */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
        className="relative bg-card border border-border rounded-2xl p-6 space-y-5 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/4 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Topic multi-select chips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold font-mono text-muted-foreground uppercase tracking-wide">
              Topics
            </label>
            {topics.length > 0 && (
              <button onClick={() => { setTopics([]); setGenerated(false); setProblems([]); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {DSA_TOPICS.map((t) => (
              <button key={t} onClick={() => toggleTopic(t)}
                className={cn(
                  "px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200",
                  topics.includes(t)
                    ? "bg-primary/15 border-primary/50 text-primary shadow-sm"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}>
                {t}
              </button>
            ))}
          </div>
          {topics.length === 0 && (
            <p className="text-xs text-muted-foreground">Select one or more topics to practice</p>
          )}
          {topics.length > 0 && (
            <p className="text-xs text-primary font-medium">{topics.length} topic{topics.length > 1 ? "s" : ""} selected</p>
          )}
        </div>

        {/* Experience level */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold font-mono text-muted-foreground uppercase tracking-wide">Experience Level</label>
          <div className="flex gap-2">
            {EXPERIENCE_LEVELS.map((lvl) => (
              <button key={lvl.value} onClick={() => { setExperience(lvl.value); setGenerated(false); setProblems([]); }}
                className={cn("flex-1 h-10 rounded-lg border text-xs font-medium transition-all duration-200",
                  experience === lvl.value
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}>
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {genError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            <XCircle className="h-4 w-4 shrink-0" />{genError}
          </div>
        )}
        <Button onClick={() => generate()} disabled={topics.length === 0 || loading} className="relative w-full gap-2 overflow-hidden group/btn">
          <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generating problems…" : `Generate DSA Problems${topics.length > 1 ? ` (${topics.length} topics)` : ""}`}
        </Button>
      </motion.div>

      {/* Problems list */}
      <AnimatePresence mode="wait">
        {problems.length > 0 && (
          <motion.div key={topics.join(",") + experience} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Header row */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible"
              className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {/* Filter pills */}
                {[
                  { id: "all",      label: `All (${problems.length})` },
                  { id: "unsolved", label: `Unsolved (${problems.length - solved.size})` },
                  { id: "solved",   label: `Solved (${solved.size})` },
                ].map(({ id, label }) => (
                  <button key={id} onClick={() => setFilter(id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                      filter === id
                        ? id === "solved"
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500"
                          : "bg-primary/10 border-primary/30 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}>
                    {label}
                  </button>
                ))}
              </div>
              <button onClick={() => generate()} disabled={loading}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} /> Regenerate
              </button>
            </motion.div>
            <motion.div variants={listContainer} initial="hidden" animate="visible" className="space-y-3">
              {problems
                .filter((p) =>
                  filter === "solved" ? solved.has(p.title) :
                  filter === "unsolved" ? !solved.has(p.title) : true
                )
                .map((p, i) => (
                  <DSAQuestionCard
                    key={p.title}
                    problem={p}
                    index={problems.indexOf(p)}
                    onSolve={setActiveProblem}
                    isSolved={solved.has(p.title)}
                  />
                ))}
            </motion.div>
            {filter === "unsolved" && problems.filter(p => !solved.has(p.title)).length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500/40" />
                <p className="text-sm font-medium">All problems solved!</p>
                <button onClick={() => generate()} className="text-xs text-primary hover:underline mt-1">Generate new problems</button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!generated && !loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="text-center py-20 text-muted-foreground">
          <div className="animate-float">
            <Code2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
          </div>
          <p className="text-sm">Select one or more topics and generate DSA problems.</p>
        </motion.div>
      )}
    </div>
  );
}

// ── Q&A Card ──────────────────────────────────────────────────────

function QACard({ item, index, isBookmarked, onToggleBookmark }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!onToggleBookmark) return;
    setSaving(true);
    await onToggleBookmark(item);
    setSaving(false);
  };

  return (
    <motion.div variants={listItem}
      className="group border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors duration-300">
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-secondary/40 transition-colors">
        <div className="flex items-start gap-3">
          <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 flex items-center justify-center text-xs font-bold mt-0.5 transition-colors duration-300">
            {index + 1}
          </span>
          <span className="text-sm font-medium leading-relaxed">{item.question}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {onToggleBookmark && (
            <button
              onClick={handleBookmark}
              disabled={saving}
              title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isBookmarked
                  ? "text-primary hover:text-primary/70"
                  : "text-muted-foreground/30 hover:text-muted-foreground"
              )}
            >
              {saving
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : isBookmarked
                ? <BookmarkCheck className="h-4 w-4" />
                : <Bookmark className="h-4 w-4" />
              }
            </button>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="shrink-0">
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
              <p className="text-xs font-semibold font-mono text-primary uppercase tracking-wide mb-2">Answer</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Interview Q&A Tab ─────────────────────────────────────────────

function InterviewQATab() {
  const { user } = useAuth();
  const [profile, setProfile]       = useSessionState("qa_profile", "");
  const [experience, setExperience] = useSessionState("qa_experience", "0");
  const [questions, setQuestions]   = useSessionState("qa_questions", []);
  const [page, setPage]             = useSessionState("qa_page", 0);
  const [loading, setLoading]       = useState(false);
  const [generated, setGenerated]   = useSessionState("qa_generated", false);
  const [bookmarked, setBookmarked] = useSessionSet("qa_bookmarked");

  // Fetch bookmarks on mount — only if session cache is empty
  useEffect(() => {
    if (!user?.email || bookmarked.size > 0) return;
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBookmarked(new Set(data.map((b) => b.question)));
      })
      .catch(() => {});
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleBookmark = async (item) => {
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

  const generate = async (nextPage = 0) => {
    if (!profile) return;
    setLoading(true);
    try {
      const prompt = `Generate exactly 10 interview questions and answers for the role of "${profile}" with ${experience} year(s) of experience. These should be ${nextPage === 0 ? "fundamental" : "different from common/basic"} questions. Reply ONLY as a JSON array with objects having "question" (string) and "answer" (string, 2-4 sentences). No markdown, no explanation.`;
      const raw = (await generateText(prompt)).replace(/```json/g, "").replace(/```/g, "").trim();
      setQuestions(JSON.parse(raw)); setPage(nextPage); setGenerated(true);
    } catch (err) { console.error("Generation error:", err); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Controls card */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
        className="relative bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/4 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold font-mono text-muted-foreground uppercase tracking-wide">Job Profile</label>
            <RoleCombobox
              options={PROFILES}
              placeholder="Select a profile…"
              value={profile}
              onChange={(val) => { setProfile(val); setGenerated(false); setQuestions([]); }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold font-mono text-muted-foreground uppercase tracking-wide">Experience Level</label>
            <div className="flex gap-2">
              {EXPERIENCE_LEVELS.map((lvl) => (
                <button key={lvl.value} onClick={() => { setExperience(lvl.value); setGenerated(false); setQuestions([]); }}
                  className={cn("flex-1 h-10 rounded-lg border text-xs font-medium transition-all duration-200",
                    experience === lvl.value
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}>
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button onClick={() => generate(0)} disabled={!profile || loading} className="relative w-full gap-2 overflow-hidden group/btn">
          <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generating…" : "Generate 10 Questions"}
        </Button>
      </motion.div>

      {/* Questions list */}
      <AnimatePresence mode="wait">
        {questions.length > 0 && (
          <motion.div key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div variants={fadeUp} initial="hidden" animate="visible"
              className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold font-mono text-muted-foreground uppercase tracking-wide">
                {profile} · {EXPERIENCE_LEVELS.find(l => l.value === experience)?.label} · Set {page + 1}
              </p>
              <span className="text-xs text-muted-foreground">{questions.length} questions</span>
            </motion.div>
            <motion.div variants={listContainer} initial="hidden" animate="visible" className="space-y-3">
              {questions.map((q, i) => (
                <QACard
                  key={`${page}-${i}`}
                  item={q}
                  index={i}
                  isBookmarked={bookmarked.has(q.question)}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="mt-4">
              <Button variant="outline" className="w-full gap-2" onClick={() => generate(page + 1)} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Next 10 Questions
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!generated && !loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="text-center py-20 text-muted-foreground">
          <div className="animate-float">
            <BrainCircuit className="h-12 w-12 mx-auto mb-4 opacity-20" />
          </div>
          <p className="text-sm">Select a profile and generate questions to start studying.</p>
        </motion.div>
      )}
    </div>
  );
}

// ── Bookmark Card ─────────────────────────────────────────────────

function BookmarkCard({ item, index, onRemove }) {
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleRemove = async (e) => {
    e.stopPropagation();
    setRemoving(true);
    await onRemove();
  };

  return (
    <motion.div variants={listItem}
      className="group border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors duration-300">
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-secondary/40 transition-colors">
        <div className="flex items-start gap-3">
          <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-relaxed">{item.question}</p>
            {item.profile && (
              <p className="text-xs text-muted-foreground mt-0.5">{item.profile}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <button
            onClick={handleRemove}
            disabled={removing}
            title="Remove bookmark"
            className="p-1.5 rounded-lg text-primary hover:text-primary/60 transition-colors"
          >
            {removing
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <BookmarkCheck className="h-4 w-4" />
            }
          </button>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
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
              <p className="text-xs font-semibold font-mono text-primary uppercase tracking-wide mb-2">Answer</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Bookmarks Tab ─────────────────────────────────────────────────

function TheoryBookmarks({ isActive }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email || !isActive) return;
    setLoading(true);
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((data) => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.email, isActive]);

  const handleRemove = async (bookmark) => {
    await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: bookmark.question, answer: bookmark.answer, profile: bookmark.profile }),
    });
    setItems((prev) => prev.filter((b) => b.id !== bookmark.id));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="text-center py-20 text-muted-foreground">
        <div className="animate-float">
          <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-20" />
        </div>
        <p className="text-sm font-medium">No theory bookmarks yet.</p>
        <p className="text-xs mt-1 opacity-70">Save questions from the Interview Q&amp;A tab to study them here.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs font-semibold font-mono text-muted-foreground uppercase tracking-wide">
        {items.length} saved question{items.length !== 1 ? "s" : ""}
      </p>
      <motion.div variants={listContainer} initial="hidden" animate="visible" className="space-y-3">
        {items.map((b, i) => (
          <BookmarkCard key={b.id} item={b} index={i} onRemove={() => handleRemove(b)} />
        ))}
      </motion.div>
    </div>
  );
}

function CodingBookmarkCard({ entry, onRemove }) {
  // Support both new format { seed, challenge, code_js, code_py } and old format { ...challengeFields }
  const challenge = entry.challenge ?? entry;
  const [expanded, setExpanded] = useState(false);
  const [lang, setLang] = useState("javascript");
  const [testResults, setTestResults] = useState(null);
  const [compileError, setCompileError] = useState(null);

  // Store code per language locally for this card
  const [codeJs, setCodeJs] = useState(entry.code_js || challenge?.starterCode?.javascript || "");
  const [codePy, setCodePy] = useState(entry.code_py || challenge?.starterCode?.python || "");
  const derivedCode = lang === "python" ? codePy : codeJs;
  const setDerivedCode = lang === "python" ? setCodePy : setCodeJs;

  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <Code2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">{challenge?.title || "Coding Challenge"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {challenge?.category} · {challenge?.difficulty}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", expanded && "rotate-180")} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t p-4 space-y-4">
              <ChallengeDescription challenge={challenge} />
              <ChallengeIDE
                challenge={challenge}
                code={derivedCode}
                setCode={setDerivedCode}
                lang={lang}
                onLangChange={setLang}
                testResults={testResults}
                setTestResults={setTestResults}
                compileError={compileError}
                setCompileError={setCompileError}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CodingBookmarks() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("challenge_bookmarks");
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, []);

  const handleRemove = (seed) => {
    setItems((prev) => {
      const next = prev.filter((b) => b.seed !== seed);
      localStorage.setItem("challenge_bookmarks", JSON.stringify(next));
      return next;
    });
  };

  if (items === null) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="text-center py-20 text-muted-foreground">
        <div className="animate-float">
          <Code2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
        </div>
        <p className="text-sm font-medium">No coding bookmarks yet.</p>
        <p className="text-xs mt-1 opacity-70">Bookmark challenges from the Challenges tab to practice them here.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs font-semibold font-mono text-muted-foreground uppercase tracking-wide">
        {items.length} saved challenge{items.length !== 1 ? "s" : ""}
      </p>
      <div className="space-y-3">
        {items.map((entry, i) => (
          <CodingBookmarkCard key={entry.seed || entry.title || i} entry={entry} onRemove={() => handleRemove(entry.seed)} />
        ))}
      </div>
    </div>
  );
}

const BOOKMARK_SUBTABS = [
  { id: "theory", label: "Theory", icon: BrainCircuit },
  { id: "coding", label: "Coding", icon: Code2 },
];

function BookmarksTab({ isActive }) {
  const [subTab, setSubTab] = useSessionState("bookmarks_subtab", "theory");

  return (
    <div className="space-y-6">
      {/* Sub-tab switcher */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
        {BOOKMARK_SUBTABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              subTab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {subTab === "theory" && <TheoryBookmarks isActive={isActive} />}
      {subTab === "coding" && <CodingBookmarks />}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

const TABS = [
  { id: "qa",         label: "Interview Q&A",  icon: BrainCircuit },
  { id: "dsa",        label: "DSA Practice",   icon: Code2 },
  { id: "challenges", label: "Challenges",     icon: Sparkles },
  { id: "bookmarks",  label: "Bookmarks",      icon: Bookmark },
];

function QuestionsContent() {
  const searchParams  = useSearchParams();
  const urlTab        = searchParams.get("tab");
  const urlTopics     = searchParams.get("topics")
    ? searchParams.get("topics").split(",").map((t) => decodeURIComponent(t.trim())).filter(Boolean)
    : [];
  const urlExperience  = searchParams.get("experience") || null;
  const urlCategory    = searchParams.get("category")   || null;
  const urlSeed        = searchParams.get("seed")        || null;

  const [tab, setTab] = useSessionState("questions_tab", urlTab || "qa");

  // If URL specifies a tab, override session state on first render
  useEffect(() => {
    if (urlTab) setTab(urlTab);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Back */}
      <Link href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
        <motion.h1 variants={fadeUp}
          className="text-3xl font-black tracking-tight">
          Question Bank
        </motion.h1>
        <motion.p variants={fadeUp} className="text-muted-foreground text-sm mt-1">
          Study curated interview Q&amp;A and practice DSA problems with an in-browser IDE.
        </motion.p>
      </motion.div>

      {/* Tab switcher — CSS sliding pill */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
        <div className="relative inline-flex bg-secondary rounded-xl p-1">
          {/* Sliding background pill */}
          {(() => {
            const idx = TABS.findIndex((t) => t.id === tab);
            return (
              <div
                className="absolute top-1 bottom-1 rounded-lg bg-background shadow-sm transition-all duration-300"
                style={{
                  width: `calc(${100 / TABS.length}% - ${8 / TABS.length}px)`,
                  transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
                  transform: `translateX(calc(${idx * 100}% + ${idx * 4}px))`,
                }}
              />
            );
          })()}
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn(
                "relative z-10 flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap",
                tab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab content — always mounted to preserve state */}
      <div className={tab === "qa" ? undefined : "hidden"}><InterviewQATab /></div>
      <div className={tab === "dsa" ? undefined : "hidden"}>
        <DSATab initialTopics={urlTopics} initialExperience={urlExperience} autoGenerate={urlTopics.length > 0} />
      </div>
      <div className={tab === "challenges" ? undefined : "hidden"}>
        <ChallengesTab
          initialCategory={urlCategory}
          initialLevel={urlExperience}
          seed={urlSeed}
        />
      </div>
      <div className={tab === "bookmarks" ? undefined : "hidden"}><BookmarksTab isActive={tab === "bookmarks"} /></div>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div />}>
      <QuestionsContent />
    </Suspense>
  );
}
