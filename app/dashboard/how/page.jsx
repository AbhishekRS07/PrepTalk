"use client";

import { motion } from "framer-motion";
import {
  Sparkles, Mic, BarChart3, PlusCircle, Play,
  MessageSquare, CheckCircle2, ArrowRight, BookOpen,
  Code2, Terminal, FileText, TrendingUp, Brain, MapPin,
  CalendarCheck, Zap, ScanText, Users,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useRouter } from "next/navigation";
import { fadeUp } from "@/lib/animations";

const steps = [
  {
    number: "01",
    icon: PlusCircle,
    title: "Mock Interview",
    description:
      "Enter the job role, tech stack, and your years of experience. The AI generates tailored questions and you answer by voice or text — one question at a time.",
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
      "Browse AI-generated interview Q&A by role — technical roles get DSA problems too — outside of a full interview session. Great for quick warm-ups or targeted practice.",
    details: [
      "Pick any job profile and get 10 fresh interview Q&A instantly",
      "Select a DSA topic and experience level for targeted problems",
      "Write and run your solution in the built-in IDE — supports Python, JavaScript, C++, C, and Go",
      "Use the AI hint panel inside the IDE if you get stuck",
    ],
  },
  {
    number: "06",
    icon: MapPin,
    title: "AI Learning Roadmap",
    description:
      "Not sure where to start? Generate a personalized preparation roadmap in seconds. Tell PrepTalk your current role and target job — the AI builds a step-by-step plan calibrated to your exact skill gap.",
    details: [
      "Select your current role, years of experience, company, and target position",
      "AI generates 5–10 milestones across multiple phases — no generic templates",
      "Each milestone links directly to the most relevant PrepTalk feature (mock interview, live AI, DSA, etc.)",
      "Check off milestones as you complete them — progress is saved to your account",
      "Regenerate anytime if your goal changes",
    ],
  },
  {
    number: "07",
    icon: CalendarCheck,
    title: "Interview Tracker",
    description:
      "Log every upcoming and completed interview in one place. PrepTalk auto-generates a personalized day-by-day prep plan calibrated to your interview date.",
    details: [
      "Add interviews with company, role, round type, and date — or mark existing ones as upcoming",
      "Get a daily schedule of theory topics, DSA problems, and coding challenges leading up to the interview",
      "Each day links directly to the Question Bank or Challenges tab with pre-selected topics",
      "Check off individual days as you complete them — progress persists across sessions",
      "Mark interviews as done, reschedule, or archive them at any time",
    ],
  },
  {
    number: "08",
    icon: Zap,
    title: "Coding Challenges",
    description:
      "Practice real-world business logic problems — not just algorithmic puzzles. AI generates scenario-based coding challenges for the category and experience level you choose.",
    details: [
      "Choose a category (Full Stack, DSA, System Design, etc.) and your experience level",
      "AI generates a fresh challenge each time — with description, requirements, and function signature",
      "Write your solution in the built-in Monaco IDE; switch freely between JavaScript and Python",
      "Run your code against AI-generated test cases and see pass/fail results instantly",
      "Bookmark any challenge to revisit it later from the Bookmarks tab with your code preserved",
    ],
  },
  {
    number: "09",
    icon: ScanText,
    title: "Resume ATS Analyzer",
    description:
      "Upload your resume and get a detailed ATS score, keyword gap analysis, and a prioritized action plan — with an optional job description match mode.",
    details: [
      "Drag and drop your PDF resume or use the one already saved to your profile",
      "Get three scores: Overall, ATS Compatibility, and JD Relevance (if JD is pasted)",
      "See a section-by-section breakdown — summary, experience, skills, education — with inline feedback",
      "View present vs. missing keywords with color-coded chips",
      "Get a priority-sorted list of improvements and an AI-rewritten summary you can copy directly",
    ],
  },
  {
    number: "10",
    icon: Users,
    title: "Behavioral Coach",
    description:
      "Build confidence for behavioral rounds with AI-powered STAR-method coaching tailored to your role and experience level.",
    details: [
      "Practice the most common behavioral questions: leadership, conflict, ownership, collaboration",
      "AI evaluates your answer against the STAR framework and rates each component",
      "Get a model STAR answer to compare against your own",
      "Focus on specific competencies relevant to your target role level",
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
  {
    icon: MapPin,
    title: "Use the roadmap",
    body: "If you're unsure where to start, generate your AI roadmap first — it'll tell you exactly which PrepTalk feature to use at each stage.",
  },
  {
    icon: CalendarCheck,
    title: "Track every interview",
    body: "Add each interview as soon as you hear back — the earlier you log it, the more prep days the tracker can schedule for you.",
  },
  {
    icon: Zap,
    title: "Challenge yourself daily",
    body: "Do one coding challenge per day from the Challenges tab — vary category and level to build a broad problem-solving toolkit.",
  },
  {
    icon: ScanText,
    title: "Analyze before applying",
    body: "Run your resume through the ATS Analyzer before sending each application — paste the JD for a tailored keyword match score.",
  },
];

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
          Ten tools, one platform
        </div>
        <h1 className="text-4xl font-black tracking-tight">How PrepTalk Works</h1>
        <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
          Ten tools that take you from your first mock question to a scheduled,
          day-by-day prep plan — whether you&apos;re prepping for a technical round
          or an HR interview. Here&apos;s exactly how each one works.
        </p>
      </motion.div>

      {/* Jump to — this is a long reference page, let people skip to the tool they came for */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center"
      >
        {steps.map((step) => (
          <a
            key={step.number}
            href={`#step-${step.number}`}
            className="shrink-0 flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors whitespace-nowrap"
          >
            <step.icon className="h-3 w-3" />
            {step.title}
          </a>
        ))}
      </motion.div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.number}
              id={`step-${step.number}`}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              className="border border-border bg-card rounded-2xl p-7 flex flex-col sm:flex-row gap-6 scroll-mt-20"
            >
              {/* Left */}
              <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-3 shrink-0">
                <span className="text-5xl font-black text-muted-foreground/20 leading-none">
                  {step.number}
                </span>
                <div className="p-2.5 rounded-xl border border-primary/20 bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>

              {/* Right */}
              <div className="flex-1 space-y-3">
                <h2 className="text-xl font-bold">{step.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                <ul className="space-y-1.5">
                  {step.details.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
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
                whileInView="visible"
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
          Generate your roadmap, pick a format, and start practicing — all free.
        </p>
        <Button size="lg" className="gap-2 mt-2" onClick={() => router.push("/dashboard")}>
          <Sparkles className="h-4 w-4" />
          Go to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}
