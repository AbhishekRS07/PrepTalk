"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Brain,
  Mic,
  Code2,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  FileText,
  MapPin,
  Check,
  ScanText,
} from "lucide-react";

// 3D ambient particle network behind the hero — client-only, no SSR
const TerminalParticleField = dynamic(() => import("@/components/TerminalParticleField"), {
  ssr: false,
  loading: () => null,
});

// ── Tilt wrapper — gives the hero panel real depth on mouse move ──
function TiltPanel({ children }) {
  const ref = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), { stiffness: 200, damping: 22 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), { stiffness: 200, damping: 22 });
  const shadowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [20, -20]), { stiffness: 200, damping: 22 });
  const shadowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [16, -16]), { stiffness: 200, damping: 22 });

  const handleMove = (e) => {
    if (shouldReduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ perspective: 1400 }}
      className="relative"
    >
      <motion.div
        aria-hidden
        className="absolute inset-3 rounded-2xl bg-black/50 blur-xl -z-10"
        style={shouldReduceMotion ? undefined : { x: shadowX, y: shadowY }}
      />
      <motion.div style={shouldReduceMotion ? undefined : { rotateX, rotateY }}>
        {children}
      </motion.div>
    </div>
  );
}

// ── Animation Variants ─────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7 } },
};

const cardEntrance = {
  hidden: { opacity: 0, y: 48, scale: 0.94 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Data ───────────────────────────────────────────────────────
const features = [
  {
    icon: Brain,
    file: "mock-interview.ts",
    title: "AI Mock Interviews",
    desc: "Questions tailored to your role, tech stack, and experience level — answered by voice or text with instant AI feedback.",
  },
  {
    icon: Mic,
    file: "live-interviewer.ts",
    title: "Live AI Interviewer",
    desc: "Have a real back-and-forth conversation with an AI that probes weak answers, asks follow-ups, and adapts in real time.",
  },
  {
    icon: FileText,
    file: "resume-questions.ts",
    title: "Resume-based Questions",
    desc: "Upload your resume and get questions grounded in your actual projects, companies, and skills — not generic prompts.",
  },
  {
    icon: Code2,
    file: "dsa-practice.ts",
    title: "DSA Practice + IDE",
    desc: "Solve AI-generated DSA problems by topic and experience — with a built-in VS Code-style editor and live code execution.",
  },
  {
    icon: MapPin,
    file: "roadmap.ts",
    title: "AI Learning Roadmap",
    desc: "Get a personalized step-by-step preparation plan based on your current role and target job — with milestone tracking and PrepTalk feature links at every step.",
  },
  {
    icon: ScanText,
    file: "ats-analyzer.ts",
    title: "Resume ATS Analyzer",
    desc: "Upload your resume and get an ATS score, keyword gap analysis, section-by-section feedback, and a priority-sorted action plan — with an optional JD match mode.",
  },
];

const steps = [
  {
    num: "01",
    title: "Choose your format",
    desc: "Pick from Mock Interview, Live AI Interviewer, or Resume-based — each designed for a different practice style.",
  },
  {
    num: "02",
    title: "Practice like it's real",
    desc: "Answer by voice or text. The AI asks follow-ups, probes weak spots, and keeps the conversation natural.",
  },
  {
    num: "03",
    title: "Get your debrief",
    desc: "Receive a full breakdown — scores, strengths, areas to improve, and topic-by-topic ratings.",
  },
];

const stats = [
  { value: "5+", label: "Questions per session" },
  { value: "∞", label: "Practice sessions" },
  { value: "100%", label: "Free to use" },
];

// Cycling words for the animated headline
const headlineWords = [
  "interview",
  "coding round",
  "system design",
  "tech screen",
  "behavioral round",
  "HR round",
];

// Marquee keywords
const marqueeItems = [
  "React", "System Design", "TypeScript", "AWS", "Python",
  "DSA", "Behavioral", "Talent Acquisition", "Frontend", "Backend",
  "Full Stack", "DevOps", "HRIS", "Kubernetes", "LeetCode",
  "Employee Relations", "GraphQL", "Docker", "Recruiting", "Product",
];

// ── Navbar ─────────────────────────────────────────────────────
function Navbar({ onGetStarted }) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 inset-x-0 z-50 bg-[var(--pt-ink)]/90 backdrop-blur-md border-b border-[var(--pt-line)]"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" width={28} height={28} alt="PrepTalk" priority />
          <span className="pt-mono font-semibold text-lg tracking-tight text-[var(--pt-chalk)]">
            PrepTalk<span className="pt-cursor-blink text-[var(--pt-signal)]">_</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 pt-mono text-sm text-[var(--pt-mist)]">
          <a href="#features" className="hover:text-[var(--pt-chalk)] transition-colors">
            features
          </a>
          <a href="#how-it-works" className="hover:text-[var(--pt-chalk)] transition-colors">
            how-it-works
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onGetStarted}
            className="pt-mono text-[var(--pt-mist)] hover:text-[var(--pt-chalk)] hover:bg-[var(--pt-panel)]"
          >
            sign in
          </Button>
          <Button
            size="sm"
            onClick={onGetStarted}
            className="pt-mono gap-1 bg-[var(--pt-signal)] text-[var(--pt-ink)] hover:bg-[var(--pt-signal)]/90 focus-visible:ring-[var(--pt-signal)]"
          >
            get started <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}

// ── Marquee Band ───────────────────────────────────────────────
function MarqueeBand() {
  const shouldReduceMotion = useReducedMotion();
  const doubled = [...marqueeItems, ...marqueeItems];
  return (
    <div className="relative overflow-hidden py-4 border-y border-[var(--pt-line)] bg-[var(--pt-panel)]/50">
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[var(--pt-ink)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[var(--pt-ink)] to-transparent z-10 pointer-events-none" />

      <motion.div
        animate={shouldReduceMotion ? {} : { x: ["0%", "-50%"] }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        className="flex gap-10 w-max pt-mono"
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="text-sm text-[var(--pt-mist)] whitespace-nowrap flex items-center gap-2.5"
          >
            <span className="w-1 h-1 rounded-full bg-[var(--pt-signal)] flex-shrink-0" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Hero ───────────────────────────────────────────────────────
function Hero({ onGetStarted }) {
  const { scrollY } = useScroll();
  const contentY = useTransform(scrollY, [0, 900], [0, -60]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  const [wordIdx, setWordIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setWordIdx((i) => (i + 1) % headlineWords.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16 px-6">
      {/* 3D particle network — ambient depth, drifting data points */}
      <div className="absolute inset-0 pointer-events-none">
        <TerminalParticleField />
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-[var(--pt-ink)] to-transparent" />
      </div>

      {/* Ambient glow — quiet, single source */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[var(--pt-signal)]/[0.04] rounded-full blur-[160px] pointer-events-none" />

      <motion.div
        style={{ y: contentY, opacity: heroOpacity }}
        className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-[1.1fr,0.9fr] gap-16 items-center w-full"
      >
        {/* ── Left: copy ── */}
        <div>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="pt-mono text-xs text-[var(--pt-signal)] mb-6"
          >
            {"// live practice, real signal"}
          </motion.p>

          <h1 className="pt-mono font-bold tracking-tight leading-[1.1] text-4xl sm:text-5xl md:text-6xl text-[var(--pt-chalk)] mb-6">
            Rehearse your next{" "}
            <span className="inline-block relative">
              <AnimatePresence mode="wait">
                <motion.span
                  key={headlineWords[wordIdx]}
                  initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block text-[var(--pt-signal)]"
                >
                  {headlineWords[wordIdx]}
                </motion.span>
              </AnimatePresence>
            </span>
            ,<br />
            scored like it&apos;s real.
          </h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="pt-sans text-base md:text-lg text-[var(--pt-mist)] max-w-lg leading-relaxed mb-10"
          >
            Mock interviews, live AI conversation, and resume-tailored questions —
            every answer scored the moment you finish talking.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-14"
          >
            <Button
              size="lg"
              onClick={onGetStarted}
              className="pt-mono gap-2 px-8 h-12 text-sm bg-[var(--pt-signal)] text-[var(--pt-ink)] hover:bg-[var(--pt-signal)]/90 focus-visible:ring-[var(--pt-signal)]"
            >
              start practicing free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
              }
              className="pt-mono h-12 text-sm border-[var(--pt-line)] text-[var(--pt-chalk)] bg-transparent hover:bg-[var(--pt-panel)]"
            >
              see how it works
            </Button>
          </motion.div>

          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-3 gap-4 max-w-md"
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-[var(--pt-line)] bg-[var(--pt-panel)]/60 px-3 py-4 text-center"
              >
                <div className="pt-mono text-2xl font-bold text-[var(--pt-signal)]">{s.value}</div>
                <div className="pt-sans text-[11px] text-[var(--pt-mist)] mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right: live session panel (signature element) ── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="relative">
          <div className="absolute -inset-8 bg-[var(--pt-signal)]/10 blur-3xl -z-10 pointer-events-none" />

          <TiltPanel>
          <div className="relative rounded-2xl border border-[var(--pt-line)] bg-[var(--pt-panel)] overflow-hidden shadow-2xl">
            {/* window chrome */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--pt-line)]">
              <span className="h-2 w-2 rounded-full bg-[var(--pt-mist)]/30" />
              <span className="h-2 w-2 rounded-full bg-[var(--pt-mist)]/30" />
              <span className="h-2 w-2 rounded-full bg-[var(--pt-mist)]/30" />
              <span className="pt-mono text-xs text-[var(--pt-mist)] ml-2">session.log</span>
              <span className="ml-auto flex items-center gap-1.5 pt-mono text-[10px] text-[var(--pt-signal)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--pt-signal)] animate-pulse" />
                live
              </span>
            </div>

            <div className="p-6 space-y-5 pt-mono text-sm">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
                className="space-y-1.5"
              >
                <p className="text-[var(--pt-signal)] text-xs">AI —</p>
                <p className="text-[var(--pt-chalk)] leading-relaxed">
                  &quot;Tell me about a time you disagreed with a teammate.&quot;
                </p>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="flex items-center gap-2"
              >
                <div className="flex items-end gap-[3px] h-4">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className="pt-wave-bar w-[3px] h-full rounded-full bg-[var(--pt-signal)]"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
                <span className="text-[var(--pt-mist)] text-xs">listening…</span>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
                className="space-y-1.5"
              >
                <p className="text-[var(--pt-mist)] text-xs">YOU —</p>
                <p className="text-[var(--pt-chalk)] leading-relaxed">
                  &quot;In my last project, a teammate wanted to skip code review to hit a deadline. I…&quot;
                </p>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3}
                className="flex items-center gap-3 rounded-lg border border-[var(--pt-line)] bg-[var(--pt-ink)] px-4 py-3"
              >
                <span className="text-[var(--pt-signal)] font-bold text-lg">8/10</span>
                <span className="text-[var(--pt-mist)] text-xs leading-snug">
                  Strong structure — quantify the impact next time.
                </span>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={4}
                className="space-y-1.5"
              >
                <p className="text-[var(--pt-ember)] text-xs">AI — follow-up</p>
                <p className="text-[var(--pt-chalk)]/80 leading-relaxed">
                  &quot;How would you handle it differently today?&quot;
                </p>
              </motion.div>
            </div>
          </div>
          </TiltPanel>
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        style={{ opacity: heroOpacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 pt-mono text-[var(--pt-mist)]"
      >
        <span className="text-xs tracking-wide">scroll to explore</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Feature Card ───────────────────────────────────────────────
function FeatureCard({ feature, index }) {
  return (
    <motion.div
      variants={cardEntrance}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      custom={index}
      className="h-full rounded-xl border border-[var(--pt-line)] bg-[var(--pt-panel)] overflow-hidden transition-colors duration-300 hover:border-[var(--pt-signal)]/50"
    >
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[var(--pt-line)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--pt-mist)]/30" />
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--pt-mist)]/30" />
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--pt-mist)]/30" />
        <span className="pt-mono text-[11px] text-[var(--pt-mist)] ml-1.5">{feature.file}</span>
      </div>

      <div className="p-6">
        <div className="h-10 w-10 rounded-lg bg-[var(--pt-signal)]/10 flex items-center justify-center mb-4">
          <feature.icon className="h-5 w-5 text-[var(--pt-signal)]" />
        </div>
        <h3 className="pt-sans text-base font-semibold text-[var(--pt-chalk)] mb-2">{feature.title}</h3>
        <p className="pt-sans text-[var(--pt-mist)] leading-relaxed text-sm">{feature.desc}</p>
      </div>
    </motion.div>
  );
}

// ── Features Section ───────────────────────────────────────────
function Features() {
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-16 max-w-xl"
        >
          <p className="pt-mono text-xs text-[var(--pt-signal)] mb-3">{"// what's inside"}</p>
          <h2 className="pt-mono text-3xl md:text-4xl font-bold text-[var(--pt-chalk)] tracking-tight mb-4">
            Six tools, one practice loop.
          </h2>
          <p className="pt-sans text-[var(--pt-mist)] leading-relaxed">
            Every format ends the same way — a score, and exactly what to fix next.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Roadmap Spotlight ──────────────────────────────────────────
function RoadmapSpotlight({ onGetStarted }) {
  const roadmapSteps = [
    { label: "Tell us your current role & target job" },
    { label: "AI builds a personalized 5–10 milestone plan" },
    { label: "Each milestone links to the right PrepTalk feature" },
    { label: "Check off milestones as you complete them" },
    { label: "Celebrate — and walk into your interview ready" },
  ];

  const milestones = [
    { done: true, label: "Update resume & profiles", tag: "done" },
    { done: true, label: "Core React patterns deep-dive", tag: "done" },
    { done: false, label: "System design fundamentals", tag: "up next", current: true },
    { done: false, label: "Mock interview × 5 sessions", tag: "" },
    { done: false, label: "Behavioural & leadership prep", tag: "" },
  ];

  return (
    <section className="relative py-28 px-6 border-t border-[var(--pt-line)]">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left: text */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="pt-mono text-xs text-[var(--pt-signal)] mb-3">{"// where to start"}</p>
            <h2 className="pt-mono text-3xl md:text-4xl font-bold text-[var(--pt-chalk)] tracking-tight mb-5 leading-tight">
              Your personal <span className="text-[var(--pt-signal)]">learning roadmap</span>
            </h2>
            <p className="pt-sans text-[var(--pt-mist)] leading-relaxed mb-8">
              Don&apos;t know where to start? Tell PrepTalk where you are and where you want to
              go — the AI generates a step-by-step preparation plan calibrated to your exact
              skill gap, with every milestone linked to a specific feature.
            </p>

            <ul className="space-y-3 mb-10">
              {roadmapSteps.map((s, i) => (
                <motion.li
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i * 0.5}
                  className="pt-sans flex items-center gap-3 text-sm text-[var(--pt-chalk)]/90"
                >
                  <span className="h-5 w-5 rounded-full bg-[var(--pt-signal)]/10 border border-[var(--pt-signal)]/30 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-[var(--pt-signal)]" strokeWidth={3} />
                  </span>
                  {s.label}
                </motion.li>
              ))}
            </ul>

            <Button
              onClick={onGetStarted}
              className="pt-mono gap-2 px-8 h-12 bg-[var(--pt-signal)] text-[var(--pt-ink)] hover:bg-[var(--pt-signal)]/90 focus-visible:ring-[var(--pt-signal)]"
            >
              get my roadmap
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Right: mock roadmap card */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="relative"
          >
            <div className="absolute -inset-6 bg-[var(--pt-signal)]/[0.06] blur-3xl rounded-3xl pointer-events-none" />

            <div className="relative rounded-2xl border border-[var(--pt-line)] bg-[var(--pt-panel)] p-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-[var(--pt-line)]">
                <div className="relative h-14 w-14 shrink-0">
                  <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
                    <circle cx={28} cy={28} r={22} fill="none" stroke="var(--pt-line)" strokeWidth={5} />
                    <circle
                      cx={28}
                      cy={28}
                      r={22}
                      fill="none"
                      strokeWidth={5}
                      strokeLinecap="round"
                      strokeDasharray={138}
                      strokeDashoffset={69}
                      stroke="var(--pt-signal)"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center pt-mono text-xs font-bold text-[var(--pt-chalk)]">
                    50%
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="pt-mono text-[11px] text-[var(--pt-signal)] font-bold mb-0.5">target role</p>
                  <p className="pt-sans font-semibold text-base text-[var(--pt-chalk)] truncate">
                    Senior Frontend Dev
                  </p>
                  <div className="h-1.5 rounded-full bg-[var(--pt-line)] mt-2 overflow-hidden">
                    <div className="h-full w-1/2 rounded-full bg-[var(--pt-signal)]" />
                  </div>
                </div>
              </div>

              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 border ${
                      m.done
                        ? "bg-[var(--pt-signal)] border-[var(--pt-signal)]"
                        : m.current
                        ? "border-[var(--pt-signal)] bg-[var(--pt-signal)]/10"
                        : "border-[var(--pt-line)] bg-transparent"
                    }`}
                  >
                    {m.done && <Check className="h-3 w-3 text-[var(--pt-ink)]" strokeWidth={3} />}
                    {m.current && <div className="h-1.5 w-1.5 rounded-full bg-[var(--pt-signal)]" />}
                  </div>
                  <span
                    className={`pt-sans text-sm flex-1 ${
                      m.done ? "line-through text-[var(--pt-mist)]" : "text-[var(--pt-chalk)]/90"
                    }`}
                  >
                    {m.label}
                  </span>
                  {m.tag && (
                    <span
                      className={`pt-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.done
                          ? "text-[var(--pt-signal)] bg-[var(--pt-signal)]/10"
                          : "text-[var(--pt-chalk)] bg-[var(--pt-line)]"
                      }`}
                    >
                      {m.tag}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── How It Works ───────────────────────────────────────────────
function HowItWorks({ onGetStarted }) {
  const logLines = [
    { t: "00:00", l: "session started — role: senior frontend" },
    { t: "00:47", l: "answer scored 8/10 — strong on trade-offs" },
    { t: "01:32", l: "follow-up asked — probing for depth" },
    { t: "02:10", l: "session saved to your dashboard" },
  ];

  return (
    <section
      id="how-it-works"
      className="relative py-32 px-6 border-t border-[var(--pt-line)] bg-[var(--pt-panel)]/30"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-20 max-w-xl"
        >
          <p className="pt-mono text-xs text-[var(--pt-signal)] mb-3">{"// the loop"}</p>
          <h2 className="pt-mono text-3xl md:text-4xl font-bold text-[var(--pt-chalk)] tracking-tight">
            Three steps to interview&#8209;ready
          </h2>
        </motion.div>

        {/* Steps — a real ordered sequence, numbering earns its place */}
        <div className="grid md:grid-cols-3 gap-10 mb-20">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i * 0.8}
            >
              <div className="pt-mono text-sm text-[var(--pt-signal)] mb-4">$ {s.num}</div>
              <h3 className="pt-sans text-xl font-semibold text-[var(--pt-chalk)] mb-3">{s.title}</h3>
              <p className="pt-sans text-[var(--pt-mist)] text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* session.log recap — bookends the hero's live transcript */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative rounded-2xl border border-[var(--pt-line)] bg-[var(--pt-panel)] overflow-hidden"
        >
          <div className="flex items-center gap-2 px-6 py-3 border-b border-[var(--pt-line)]">
            <span className="h-2 w-2 rounded-full bg-[var(--pt-mist)]/30" />
            <span className="h-2 w-2 rounded-full bg-[var(--pt-mist)]/30" />
            <span className="h-2 w-2 rounded-full bg-[var(--pt-mist)]/30" />
            <span className="pt-mono text-xs text-[var(--pt-mist)] ml-2">session.log</span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 p-8 md:p-12">
            <ul className="space-y-3 pt-mono text-xs md:text-sm">
              {logLines.map((row) => (
                <li key={row.t} className="flex items-baseline gap-3">
                  <span className="text-[var(--pt-mist)]">[{row.t}]</span>
                  <span className="text-[var(--pt-chalk)]/90">{row.l}</span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              onClick={onGetStarted}
              className="pt-mono gap-2 px-9 h-12 text-sm bg-[var(--pt-signal)] text-[var(--pt-ink)] hover:bg-[var(--pt-signal)]/90 focus-visible:ring-[var(--pt-signal)] flex-shrink-0"
            >
              try it now — it&apos;s free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-[var(--pt-line)] py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" width={22} height={22} alt="PrepTalk" />
          <span className="pt-mono font-semibold text-sm text-[var(--pt-chalk)]">PrepTalk</span>
        </div>
        <p className="pt-sans text-xs text-[var(--pt-mist)]">
          © {new Date().getFullYear()} PrepTalk. Practice makes ready.
        </p>
        <div className="flex items-center gap-4 pt-mono text-xs text-[var(--pt-mist)]">
          <a href="#features" className="hover:text-[var(--pt-chalk)] transition-colors">
            features
          </a>
          <a href="#how-it-works" className="hover:text-[var(--pt-chalk)] transition-colors">
            how-it-works
          </a>
        </div>
      </div>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const handleGetStarted = () => router.push("/dashboard");

  return (
    <div className="pt-landing min-h-screen bg-[var(--pt-ink)] text-[var(--pt-chalk)]">
      <Navbar onGetStarted={handleGetStarted} />
      <Hero onGetStarted={handleGetStarted} />
      <MarqueeBand />
      <Features />
      <RoadmapSpotlight onGetStarted={handleGetStarted} />
      <HowItWorks onGetStarted={handleGetStarted} />
      <Footer />
    </div>
  );
}
