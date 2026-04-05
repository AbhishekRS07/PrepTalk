"use client";

import { motion } from "framer-motion";
import {
  Sparkles, Mic, BarChart3, PlusCircle, Play,
  MessageSquare, CheckCircle2, ArrowRight, BookOpen,
  Code2, Terminal, FileText, TrendingUp, Brain,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const steps = [
  {
    number: "01",
    icon: PlusCircle,
    title: "Mock Interview",
    description:
      "Enter the job role, tech stack, and your years of experience. The AI generates tailored questions and you answer by voice or text — one question at a time.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    details: [
      "Specify the exact job title and paste the job description for hyper-relevant questions",
      "Record answers by microphone — transcribed in real time — or type them",
      "Navigate between questions freely; answers save automatically",
      "End the interview to get a full feedback report with AI ratings and model answers",
    ],
  },
  {
    number: "02",
    icon: Mic,
    title: "Live AI Interviewer",
    description:
      "Have a real back-and-forth conversation with an AI that behaves like a senior interviewer — asking one question at a time, probing vague answers, and following up on weak spots.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    details: [
      "Questions are read aloud — answer by speaking (mic button) or typing",
      "The AI adapts based on your answers — no fixed script",
      "A mute button lets you disable the AI voice if you prefer silence",
      "End anytime to get a debrief: score, strengths, improvements, and topic breakdown",
    ],
  },
  {
    number: "03",
    icon: FileText,
    title: "Resume-based Interview",
    description:
      "Upload your resume as a PDF and the AI generates questions grounded in your actual experience — your projects, companies, skills, and timelines.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    details: [
      "Drag and drop your PDF resume — the AI reads it and extracts your background",
      "Optionally specify a target role; otherwise the AI infers it from your resume",
      "Questions reference real things you built — not generic prompts",
      "Flows into the same feedback system as mock interviews",
    ],
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Progress Analytics",
    description:
      "Every session — mock, live, or resume-based — feeds into your analytics dashboard where you can track improvement over time across roles and formats.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    details: [
      "Overall avg score, total sessions, and improvement % across all formats",
      "Rating trend chart with dots color-coded by interview type",
      "Performance breakdown by role and by format (Mock / Live / Resume)",
      "Recent sessions list with one-click access to any feedback or debrief",
    ],
  },
  {
    number: "05",
    icon: BookOpen,
    title: "Question Bank",
    description:
      "Browse AI-generated interview Q&A and DSA problems outside of a full interview session — great for quick warm-ups or targeted practice.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    details: [
      "Pick any job profile and get 10 fresh interview Q&A instantly",
      "Select a DSA topic and experience level for targeted problems",
      "Write and run your solution in the built-in IDE — supports Python, JavaScript, C++, C, and Go",
      "Use the AI hint panel inside the IDE if you get stuck",
    ],
  },
];

const tips = [
  {
    icon: Mic,
    title: "Speak clearly",
    body: "Speak at a normal pace in a quiet environment for the best transcription accuracy.",
  },
  {
    icon: MessageSquare,
    title: "Answer fully",
    body: "Give answers of at least a few sentences — short answers receive lower ratings.",
  },
  {
    icon: Play,
    title: "Retry anytime",
    body: "You can redo the same interview multiple times to track improvement.",
  },
  {
    icon: FileText,
    title: "Keep resume updated",
    body: "Use a current, text-based PDF for resume interviews — scanned image PDFs can't be read.",
  },
  {
    icon: Brain,
    title: "Mix formats",
    body: "Use Mock for drilling topics, Live for realistic pressure, and Resume for role-specific prep.",
  },
  {
    icon: Terminal,
    title: "Practice DSA daily",
    body: "Pick a topic and experience level each day — the AI generates fresh problems every time.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
};

export default function HowItWorksPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-16">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3 pt-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          Three ways to practice
        </div>
        <h1 className="text-4xl font-black tracking-tight">How PrepTalk Works</h1>
        <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
          Three interview formats, one feedback system. Practice the way that fits your prep stage
          — then track your progress across all of them.
        </p>
      </motion.div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.number}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              className={cn(
                "border rounded-2xl p-7 flex flex-col sm:flex-row gap-6",
                step.border,
                step.bg
              )}
            >
              {/* Left */}
              <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-3 shrink-0">
                <span className="text-5xl font-black text-muted-foreground/20 leading-none">
                  {step.number}
                </span>
                <div className={cn("p-2.5 rounded-xl border", step.bg, step.border)}>
                  <Icon className={cn("h-5 w-5", step.color)} />
                </div>
              </div>

              {/* Right */}
              <div className="flex-1 space-y-3">
                <h2 className={cn("text-xl font-bold", step.color)}>{step.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                <ul className="space-y-1.5">
                  {step.details.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm">
                      <ArrowRight className={cn("h-4 w-4 shrink-0 mt-0.5", step.color)} />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tips */}
      <div>
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-5"
        >
          Tips for best results
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tips.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <motion.div
                key={tip.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-card border border-border rounded-2xl p-5 flex gap-4"
              >
                <div className="p-2 rounded-lg bg-secondary shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-0.5">{tip.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-card border border-border rounded-3xl p-10 text-center space-y-4"
      >
        <h2 className="text-2xl font-black">Ready to practice?</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Start with a mock interview, try a live session, or upload your resume — all free.
        </p>
        <Button size="lg" className="gap-2 mt-2" onClick={() => router.push("/dashboard")}>
          <Sparkles className="h-4 w-4" />
          Go to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}
