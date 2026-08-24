"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RoleCombobox } from "@/components/ui/role-combobox";
import {
  Mic, MicOff, Send, CircleStop, Loader2, ArrowLeft,
  Sparkles, CheckCircle2, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, BarChart3, Volume2, VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

const JOB_ROLES = [
  "Full Stack Developer", "Frontend Developer", "Backend Developer",
  "React Developer", "Node.js Developer", "Python Developer", "Java Developer",
  "Mobile Developer (Android)", "Mobile Developer (iOS)",
  "Data Scientist", "Machine Learning Engineer", "DevOps Engineer", "QA Engineer",
  "System Design", "Product Manager", "Senior Product Manager",
  "HR Generalist", "HR Business Partner", "Technical Recruiter", "Talent Acquisition Manager",
];

// ── TTS hook ──────────────────────────────────────────────────────

function useTTS() {
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  const speak = useCallback((text) => {
    if (mutedRef.current || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    // Prefer a natural English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ||
      voices.find((v) => v.lang.startsWith("en-US")) ||
      voices[0];
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }, []);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) window.speechSynthesis?.cancel();
  }, []);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, muted, toggleMute, cancel };
}

// ── STT hook ──────────────────────────────────────────────────────

function useSTT(onTranscript) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef(null);
  const finalRef = useRef(""); // accumulates confirmed final segments

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  }, []);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    finalRef.current = "";
    const rec = new SR();
    rec.continuous = true;      // ← keep recording until user clicks stop
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalRef.current += t + " ";
        } else {
          interim += t;
        }
      }
      onTranscript((finalRef.current + interim).trim());
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted") setListening(false);
    };
    rec.onend = () => {
      // Only update state if this rec instance is still the active one
      if (recRef.current === rec) setListening(false);
    };
    rec.start();
    recRef.current = rec;
    setListening(true);
  }, [onTranscript]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
}

// ── Setup Screen ──────────────────────────────────────────────────

function SetupScreen({ onStart }) {
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [techStack, setTechStack] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto pt-16 pb-20 px-4"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Mic className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Live Interview</h1>
          <p className="text-sm text-muted-foreground">Conversational AI interviewer — no scripts</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-2">
        <p className="text-sm font-medium">How it works</p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            The AI interviews you in real time — asks questions, probes your answers
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            Questions are read aloud — speak or type your answers
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            End anytime to get a full debrief with score and feedback
          </li>
        </ul>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (role && experience && techStack) onStart({ role, experience, techStack });
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Role you're interviewing for</label>
          <RoleCombobox
            options={JOB_ROLES}
            placeholder="e.g. Frontend Engineer, HR Business Partner"
            required
            value={role}
            onChange={setRole}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Years of experience</label>
          <Input type="number" min="0" max="40" placeholder="e.g. 2" required value={experience} onChange={(e) => setExperience(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Key skills</label>
          <Input placeholder="e.g. React, TypeScript — or Recruiting, onboarding, HRIS" required value={techStack} onChange={(e) => setTechStack(e.target.value)} />
        </div>
        <Button type="submit" className="w-full gap-2 mt-2">
          <Sparkles className="h-4 w-4" />
          Start Interview
        </Button>
      </form>
    </motion.div>
  );
}

// ── Debrief Screen ────────────────────────────────────────────────

const bandStyles = (band) => {
  if (!band) return { text: "text-muted-foreground", border: "border-border" };
  const b = band.toLowerCase();
  if (b === "excellent") return { text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500" };
  if (b === "good")      return { text: "text-blue-600 dark:text-blue-400",       border: "border-blue-500" };
  if (b === "average")   return { text: "text-amber-600 dark:text-amber-400",     border: "border-amber-500" };
  return { text: "text-red-600 dark:text-red-400", border: "border-red-500" };
};

const ratingBadgeClasses = (r) => {
  if (r === "Strong")  return "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40";
  if (r === "Average") return "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40";
  return "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40";
};

function DebriefScreen({ debrief, onBack }) {
  const router = useRouter();
  const band = bandStyles(debrief.overallBand);
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto pt-10 pb-20 px-4 space-y-6"
    >
      {/* Score */}
      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center gap-3">
        <div className={cn("h-20 w-20 rounded-full border-4 flex items-center justify-center", band.border)}>
          <span className={cn("text-2xl font-black font-mono", band.text)}>{debrief.score}</span>
        </div>
        <div>
          <p className="text-xs font-semibold font-mono uppercase tracking-widest text-muted-foreground mb-1">Interview Complete</p>
          <h2 className="text-2xl font-black tracking-tight">{debrief.overallBand}</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">{debrief.summary}</p>
        </div>
      </div>

      {/* Strengths + improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {debrief.strengths.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Areas to improve</h3>
          </div>
          <ul className="space-y-2">
            {debrief.improvements.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Topic breakdown */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setExpanded((p) => !p)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold hover:bg-secondary/30 transition-colors"
        >
          <span className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Topic Breakdown
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="divide-y divide-border border-t border-border">
                {debrief.topicBreakdown.map((t, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm">{t.topic}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground hidden sm:block">{t.note}</span>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", ratingBadgeClasses(t.rating))}>
                        {t.rating}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 gap-2" onClick={onBack}>
          <Mic className="h-4 w-4" />
          New Interview
        </Button>
        <Button className="flex-1 gap-2" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Button>
      </div>
    </motion.div>
  );
}

// ── Chat bubble ───────────────────────────────────────────────────

function ChatBubble({ msg, isLast, isSpeaking }) {
  const isAI = msg.role === "assistant";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex", isAI ? "justify-start" : "justify-end")}
    >
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed relative",
        isAI
          ? "bg-card border border-border text-foreground rounded-tl-sm"
          : "bg-primary text-primary-foreground rounded-tr-sm"
      )}>
        {msg.content}
        {isAI && isLast && isSpeaking && (
          <span className="inline-flex items-center gap-0.5 ml-2">
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className="inline-block h-2 w-0.5 bg-primary/60 rounded-full"
                animate={{ scaleY: [1, 2.5, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function LiveInterviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [phase, setPhase] = useState("setup");
  const [config, setConfig] = useState(null);
  const [mockId] = useState(() =>
    typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  );
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ending, setEnding] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [debrief, setDebrief] = useState(null);
  const bottomRef = useRef(null);
  const { speak, muted, toggleMute, cancel } = useTTS();

  const handleTranscript = useCallback((t) => setInput(t), []);
  const { listening, supported: sttSupported, start: startListening, stop: stopListening } = useSTT(handleTranscript);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Speak new AI messages
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role !== "assistant") return;
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(last.content);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    const voices = window.speechSynthesis?.getVoices() ?? [];
    const preferred =
      voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ||
      voices.find((v) => v.lang.startsWith("en-US")) ||
      voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    if (!muted && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [messages, muted]);

  // Cancel speech on unmount
  useEffect(() => () => cancel(), [cancel]);

  const startInterview = async (cfg) => {
    setConfig(cfg);
    setPhase("interview");
    setLoading(true);
    const res = await fetch("/api/interview/converse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [], ...cfg, action: "start" }),
    });
    const data = await res.json();
    setMessages([{ role: "assistant", content: data.reply }]);
    setLoading(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (listening) stopListening();
    setInput("");
    cancel(); // stop speaking when user replies

    const updated = [...messages, { role: "user", content: text }];
    setMessages(updated);
    setLoading(true);

    const res = await fetch("/api/interview/converse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: updated, ...config, action: "continue" }),
    });
    const data = await res.json();
    setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    setLoading(false);
  };

  const endInterview = async () => {
    if (ending || messages.length < 2) return;
    setEnding(true);
    cancel();

    // Get debrief
    const res = await fetch("/api/interview/converse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, ...config, action: "debrief" }),
    });
    const data = await res.json();
    const debriefData = data.debrief;

    // Save to DB
    await fetch("/api/live-interview/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mockId,
        role: config.role,
        experience: config.experience,
        techStack: config.techStack,
        messages,
        debrief: debriefData,
        createdBy: user?.email,
      }),
    });

    setDebrief(debriefData);
    setPhase("debrief");
    setEnding(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetInterview = () => {
    setPhase("setup");
    setMessages([]);
    setConfig(null);
    setDebrief(null);
  };

  if (phase === "setup") {
    return (
      <div>
        <button onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 ml-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <SetupScreen onStart={startInterview} />
      </div>
    );
  }

  if (phase === "debrief") {
    return <DebriefScreen debrief={debrief} onBack={resetInterview} />;
  }

  const exchangeCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mic className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{config?.role}</p>
            <p className="text-xs text-muted-foreground">
              {config?.experience} yr exp · {exchangeCount} {exchangeCount === 1 ? "exchange" : "exchanges"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute TTS */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute} title={muted ? "Unmute AI voice" : "Mute AI voice"}>
            {muted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            disabled={ending || messages.length < 2}
            onClick={endInterview}
            className="gap-1.5"
          >
            {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CircleStop className="h-4 w-4" />}
            End & Get Debrief
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence>
          {messages.map((m, i) => (
            <ChatBubble
              key={i}
              msg={m}
              isLast={i === messages.length - 1}
              isSpeaking={isSpeaking && !loading}
            />
          ))}
        </AnimatePresence>
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur px-4 py-4">
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          {/* Mic button */}
          {sttSupported && (
            <Button
              type="button"
              variant={listening ? "destructive" : "outline"}
              size="icon"
              className={cn("h-10 w-10 shrink-0", listening && "animate-pulse")}
              onClick={listening ? stopListening : startListening}
              title={listening ? "Stop recording" : "Speak your answer"}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={listening ? "Listening… speak your answer" : "Type your answer… (Enter to send, Shift+Enter for new line)"}
            rows={2}
            className="resize-none flex-1 text-sm"
            disabled={loading}
          />

          <Button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-4 mt-2">
          {sttSupported ? (
            <p className="text-xs text-muted-foreground">
              {listening
                ? "Recording — click mic to stop"
                : "Mic button to speak · Enter to send"}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Answer naturally — press Enter to send</p>
          )}
        </div>
      </div>
    </div>
  );
}
