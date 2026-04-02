"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Brain,
  Mic,
  BarChart3,
  Code2,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from "lucide-react";

// ── Animation Variants ─────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

// ── Data ───────────────────────────────────────────────────────
const features = [
  {
    icon: Brain,
    title: "AI-Generated Questions",
    desc: "Questions tailored to your role, tech stack, and experience level — powered by Llama 3.",
  },
  {
    icon: Mic,
    title: "Voice Recording",
    desc: "Answer naturally using your microphone. Your speech is transcribed in real time.",
  },
  {
    icon: BarChart3,
    title: "Instant Feedback",
    desc: "Get a rating and actionable improvement tips for every answer, right after the interview.",
  },
  {
    icon: BookOpen,
    title: "Interview Q&A Bank",
    desc: "Browse AI-generated interview questions by job profile and experience level. New set every time.",
  },
  {
    icon: Code2,
    title: "DSA Practice + IDE",
    desc: "Solve AI-generated DSA problems by topic and experience — with a built-in VS Code-style editor and live code execution.",
  },
];

const steps = [
  { num: "01", title: "Create an interview", desc: "Enter your job role, tech stack, and years of experience." },
  { num: "02", title: "Answer the questions", desc: "Record your answers question by question at your own pace." },
  { num: "03", title: "Review your feedback", desc: "See AI-rated answers and specific tips to sharpen your skills." },
];

const stats = [
  { value: "5+", label: "Questions per session" },
  { value: "AI", label: "Powered feedback" },
  { value: "∞", label: "Practice sessions" },
  { value: "100%", label: "Free to use" },
];

// ── Components ─────────────────────────────────────────────────
function Navbar({ onGetStarted }) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 inset-x-0 z-50 glass border-b border-border/50"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" width={32} height={32} alt="PrepTalk" />
          <span className="font-bold text-lg tracking-tight">PrepTalk</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={onGetStarted}>Sign in</Button>
          <Button size="sm" onClick={onGetStarted} className="gap-1">
            Get started <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}

function Hero({ onGetStarted }) {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-8"
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI-powered mock interviews
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
        >
          Ace your next{" "}
          <span className="gradient-text">interview</span>
          <br />with AI practice
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          PrepTalk generates custom interview questions for your role, records
          your answers, and gives you instant AI feedback — so you walk into
          every interview fully prepared.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button size="lg" onClick={onGetStarted} className="gap-2 px-8 h-12 text-base shadow-lg shadow-primary/25">
            Start practicing free
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="h-12 text-base">
            See how it works
          </Button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto"
        >
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold gradient-text">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-secondary/40">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-4xl font-bold tracking-tight">Everything you need to prepare</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg hover:shadow-primary/5 transition-shadow"
            >
              <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mb-5">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ onGetStarted }) {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-4xl font-bold tracking-tight">Three steps to interview-ready</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className="relative"
            >
              <span className="text-7xl font-black text-border select-none">{s.num}</span>
              <div className="-mt-4">
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* What you get checklist */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-accent rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div>
            <h3 className="text-2xl font-bold mb-4">What you get with every session</h3>
            <ul className="space-y-3">
              {[
                "Tailored mock interview questions for your exact role",
                "Real-time speech-to-text transcription",
                "Per-answer AI rating out of 10",
                "Specific improvement suggestions",
                "Full feedback report with model answers",
                "Interview Q&A bank by profile & experience",
                "DSA problems with built-in IDE & code execution",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button size="lg" onClick={onGetStarted} className="gap-2 px-8 h-12 text-base shadow-lg shadow-primary/25 flex-shrink-0">
            Try it now — it's free
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" width={24} height={24} alt="PrepTalk" />
          <span className="font-semibold text-sm">PrepTalk</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} PrepTalk. Built with AI to help you land your dream job.
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
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
      <Features />
      <HowItWorks onGetStarted={handleGetStarted} />
      <Footer />
    </div>
  );
}
