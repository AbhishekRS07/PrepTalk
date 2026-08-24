"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Brain,
  Mic,
  Code2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronDown,
  FileText,
  MapPin,
  Check,
  ScanText,
} from "lucide-react";

// Load 3D canvas only on client — no SSR
const HeroCanvas = dynamic(() => import("@/components/HeroCanvas"), {
  ssr: false,
  loading: () => null,
});

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

// ── Data ───────────────────────────────────────────────────────
const features = [
  {
    icon: Brain,
    title: "AI Mock Interviews",
    desc: "Questions tailored to your role, tech stack, and experience level — answered by voice or text with instant AI feedback.",
  },
  {
    icon: Mic,
    title: "Live AI Interviewer",
    desc: "Have a real back-and-forth conversation with an AI that probes weak answers, asks follow-ups, and adapts in real time.",
  },
  {
    icon: FileText,
    title: "Resume-based Questions",
    desc: "Upload your resume and get questions grounded in your actual projects, companies, and skills — not generic prompts.",
  },
  {
    icon: Code2,
    title: "DSA Practice + IDE",
    desc: "Solve AI-generated DSA problems by topic and experience — with a built-in VS Code-style editor and live code execution.",
  },
  {
    icon: MapPin,
    title: "AI Learning Roadmap",
    desc: "Get a personalized step-by-step preparation plan based on your current role and target job — with milestone tracking and PrepTalk feature links at every step.",
  },
  {
    icon: ScanText,
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
];

// Marquee keywords
const marqueeItems = [
  "React", "Node.js", "System Design", "TypeScript", "AWS",
  "Python", "DSA", "Behavioral", "Frontend", "Backend",
  "Full Stack", "DevOps", "SQL", "Go", "Kubernetes",
  "LeetCode", "Spring Boot", "GraphQL", "Docker", "Redis",
];

// ── Navbar ─────────────────────────────────────────────────────
function Navbar({ onGetStarted }) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 inset-x-0 z-50 glass border-b border-border/50"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" width={32} height={32} alt="PrepTalk" priority />
          <span className="font-bold text-lg tracking-tight">PrepTalk</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How it works
          </a>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={onGetStarted}>
            Sign in
          </Button>
          <Button size="sm" onClick={onGetStarted} className="gap-1">
            Get started <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}

// ── Marquee Band ───────────────────────────────────────────────
function MarqueeBand() {
  const doubled = [...marqueeItems, ...marqueeItems];
  return (
    <div className="relative overflow-hidden py-4 border-y border-border/40 bg-secondary/20 backdrop-blur-sm">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        className="flex gap-10 w-max"
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="text-sm font-medium text-muted-foreground whitespace-nowrap flex items-center gap-2.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
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

  // 3D canvas drifts down slower than scroll — creates parallax depth
  const canvasY = useTransform(scrollY, [0, 900], [0, 260]);
  // Content floats upward on scroll
  const contentY = useTransform(scrollY, [0, 900], [0, -90]);
  // Entire hero fades as user scrolls away
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  // Mouse spotlight
  const [spot, setSpot] = useState({ x: 50, y: 50, visible: false });
  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpot({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      visible: true,
    });
  }, []);
  const handleMouseLeave = useCallback(() => setSpot((s) => ({ ...s, visible: false })), []);

  // Animated headline word
  const [wordIdx, setWordIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setWordIdx((i) => (i + 1) % headlineWords.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── 3D Canvas (parallax layer) ── */}
      <motion.div style={{ y: canvasY }} className="absolute inset-0">
        <HeroCanvas />

        {/* Bottom fade — seamless transition to next section */}
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-background to-transparent pointer-events-none" />

        {/* Top-left glow blob */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

        {/* Top-right glow blob */}
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* ── Mouse spotlight ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[1] transition-opacity duration-500"
        style={{
          opacity: spot.visible ? 1 : 0,
          background: `radial-gradient(700px circle at ${spot.x}% ${spot.y}%, rgba(139,92,246,0.10), transparent 55%)`,
        }}
      />

      {/* ── Hero Content (parallax layer 2) ── */}
      <motion.div
        style={{ y: contentY, opacity: heroOpacity }}
        className="relative z-10 max-w-5xl mx-auto text-center px-6 pt-28 pb-20"
      >
        {/* Badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/8 text-sm font-medium mb-8 backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI-powered mock interviews
        </motion.div>

        {/* Headline with animated word — rendered immediately for LCP */}
        <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[1.05] mb-6 animate-fade-up">
          Ace your next{" "}
          <span className="inline-block relative">
            <AnimatePresence mode="wait">
              <motion.span
                key={headlineWords[wordIdx]}
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="gradient-text inline-block"
              >
                {headlineWords[wordIdx]}
              </motion.span>
            </AnimatePresence>
          </span>
          <br />
          with AI practice
        </h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Mock interviews, live AI conversations, and resume-tailored questions
          — all with instant feedback so you walk into every interview
          fully prepared.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button
            size="lg"
            onClick={onGetStarted}
            className="gap-2 px-9 h-13 text-base shadow-2xl shadow-primary/30 glow-primary"
          >
            Start practicing free
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() =>
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="h-13 text-base border-border/60 backdrop-blur-sm"
          >
            See how it works
          </Button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-4 max-w-xl mx-auto"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1.5 py-4 px-3 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/40"
            >
              <span className="text-3xl font-black gradient-text">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Scroll Indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        style={{ opacity: heroOpacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-muted-foreground/60"
      >
        <span className="text-xs tracking-wide">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Feature Card (3D tilt on hover) ───────────────────────────
const cardEntrance = {
  hidden: { opacity: 0, y: 48, scale: 0.94 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      delay: i * 0.1,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

function FeatureCard({ feature, index }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
    el.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg) translateY(-6px) translateZ(10px)`;
    el.style.transition = "none";
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "";
    el.style.transition = "transform 0.55s cubic-bezier(0.22,1,0.36,1)";
  };

  return (
    <motion.div
      variants={cardEntrance}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      custom={index}
      className="group relative h-full"
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover glow halo */}
      <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/25 via-violet-500/15 to-transparent blur-sm -z-10 pointer-events-none" />

      {/* Card */}
      <div className="relative h-full bg-card border border-border rounded-2xl p-8 group-hover:border-primary/40 transition-colors duration-300 overflow-hidden cursor-default">
        {/* Shimmer sweep */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

        {/* Icon — scale + rotate on hover via CSS */}
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 ease-out">
          <feature.icon className="h-6 w-6 text-primary" />
        </div>

        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
        <p className="text-muted-foreground leading-relaxed text-sm">{feature.desc}</p>
      </div>
    </motion.div>
  );
}

// ── Features Section ───────────────────────────────────────────
function Features() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Decorative blobs move horizontally on scroll (parallax)
  const blobRightX = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const blobLeftX = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative py-32 px-6 overflow-hidden"
    >
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-40 dark:opacity-20 pointer-events-none" />

      {/* Parallax glow blobs */}
      <motion.div
        style={{ x: blobRightX }}
        className="absolute -right-40 top-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-primary/6 rounded-full blur-[80px] pointer-events-none"
      />
      <motion.div
        style={{ x: blobLeftX }}
        className="absolute -left-40 top-1/3 w-[360px] h-[360px] bg-violet-600/6 rounded-full blur-[80px] pointer-events-none"
      />

      <div className="max-w-6xl mx-auto relative">
        {/* Section header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Features
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Everything you need to prepare
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            One platform to transform how you prepare for every stage of the
            interview process.
          </p>
        </motion.div>

        {/* Feature cards grid */}
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

  return (
    <section className="relative py-28 px-6 overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 dot-grid opacity-30 dark:opacity-15 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left: text */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 leading-tight">
              Your personal{" "}
              <span className="gradient-text">learning roadmap</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Don&apos;t know where to start? Tell PrepTalk where you are and where you want to go — the AI generates a step-by-step preparation plan calibrated to your exact skill gap, with every milestone linked to a specific feature.
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
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="h-6 w-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                  </span>
                  {s.label}
                </motion.li>
              ))}
            </ul>

            <Button onClick={onGetStarted} className="gap-2 px-8 h-12 glow-primary shadow-2xl shadow-primary/30">
              Get my roadmap
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
            {/* Glow behind card */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/15 to-emerald-500/10 blur-3xl rounded-3xl" />

            <div className="relative rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xl">
              {/* Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <div className="relative h-14 w-14 shrink-0">
                  <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
                    <circle cx={28} cy={28} r={22} fill="none" stroke="currentColor" strokeWidth={5} className="text-border/60" />
                    <circle cx={28} cy={28} r={22} fill="none" strokeWidth={5} strokeLinecap="round"
                      strokeDasharray={138} strokeDashoffset={69}
                      stroke="url(#lp-grad)" />
                    <defs>
                      <linearGradient id="lp-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-black">50%</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-primary font-bold mb-0.5">TARGET ROLE</p>
                  <p className="font-black text-base truncate">Senior Frontend Dev</p>
                  <div className="h-1.5 rounded-full bg-border/50 mt-2 overflow-hidden">
                    <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-violet-500 to-emerald-500" style={{ boxShadow: "0 0 8px rgba(139,92,246,0.5)" }} />
                  </div>
                </div>
              </div>

              {/* Mock milestones */}
              {[
                { done: true,  label: "Update resume & profiles",    tag: "Done" },
                { done: true,  label: "Core React patterns deep-dive", tag: "Done" },
                { done: false, label: "System design fundamentals",   tag: "Up next", current: true },
                { done: false, label: "Mock interview × 5 sessions",  tag: "" },
                { done: false, label: "Behavioural & leadership prep", tag: "" },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                    m.done ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    : m.current ? "border-2 border-primary bg-primary/10"
                    : "border-2 border-border bg-card"
                  }`}>
                    {m.done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                    {m.current && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <span className={`text-sm flex-1 ${m.done ? "line-through text-muted-foreground/60" : ""}`}>{m.label}</span>
                  {m.tag && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      m.done ? "text-emerald-400 bg-emerald-500/10"
                      : "text-primary bg-primary/10 border border-primary/20"
                    }`}>{m.tag}</span>
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
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Background glow parallax
  const bgGlowY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative py-32 px-6 overflow-hidden bg-secondary/25"
    >
      {/* Parallax glow */}
      <motion.div
        style={{ y: bgGlowY }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary/5 rounded-full blur-[120px]" />
      </motion.div>

      <div className="max-w-6xl mx-auto relative">
        {/* Section header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Three steps to interview&#8209;ready
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-10 mb-20">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i * 0.8}
              className="flex flex-col items-center md:items-start text-center md:text-left"
            >
              {/* Number badge */}
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
                <span className="text-xl font-black text-primary">{s.num}</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA checklist box */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent p-10 md:p-14"
        >
          {/* Corner glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/12 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-600/8 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-6">
                What you get with every session
              </h3>
              <ul className="space-y-3">
                {[
                  "Per-answer AI rating out of 10 with improvement tips",
                  "No scheduling, no interviewer — practice on your own time",
                  "Every session saved so you can track improvement over time",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              size="lg"
              onClick={onGetStarted}
              className="gap-2 px-9 h-13 text-base shadow-2xl shadow-primary/30 glow-primary flex-shrink-0"
            >
              Try it now — it&apos;s free
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
    <footer className="border-t border-border py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" width={24} height={24} alt="PrepTalk" />
          <span className="font-semibold text-sm">PrepTalk</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} PrepTalk. Built with AI to help you land
          your dream job.
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-foreground transition-colors"
          >
            How it works
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
    <div className="min-h-screen bg-background text-foreground">
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
