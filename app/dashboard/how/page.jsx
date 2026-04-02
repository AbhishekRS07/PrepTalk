"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Mic,
  BarChart3,
  PlusCircle,
  Play,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Code2,
  Terminal,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const steps = [
  {
    number: "01",
    icon: PlusCircle,
    title: "Create an Interview",
    description:
      "Enter the job role, job description, and your years of experience. Our AI instantly generates 5 tailored interview questions specific to your profile.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    details: [
      "Specify the exact job title you're applying for",
      "Paste the job description for hyper-relevant questions",
      "Set your experience level so difficulty matches your background",
    ],
  },
  {
    number: "02",
    icon: Mic,
    title: "Answer with Your Voice",
    description:
      "Use your microphone to answer each question naturally, just like a real interview. Navigate between questions at your own pace.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    details: [
      "Click 'Record Answer' to start speaking",
      "Your speech is transcribed live so you can verify it",
      "Move to the next question — your answer saves automatically",
    ],
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Get AI Feedback",
    description:
      "After the interview ends, receive a detailed report with a score, model answers, and personalized feedback on every question.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    details: [
      "Each answer is rated out of 10 by our AI model",
      "Compare your answer against the ideal model answer",
      "Read targeted feedback on exactly what to improve",
    ],
  },
  {
    number: "04",
    icon: BookOpen,
    title: "Study the Question Bank",
    description:
      "Beyond mock interviews, use the Question Bank to study AI-generated interview Q&A and solve DSA problems — all tailored to your experience level.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    details: [
      "Pick any job profile and get 10 fresh interview Q&A instantly",
      "Select a DSA topic and experience level for targeted problems",
      "Write and run your solution in the built-in IDE — supports Python, JavaScript, C++, C, and Go",
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
    body: "You can practice the same interview multiple times to track your improvement.",
  },
  {
    icon: CheckCircle2,
    title: "Review skipped",
    body: "Even if you skip a question, the model answer still appears in your feedback report.",
  },
  {
    icon: BookOpen,
    title: "Use the Q&A bank",
    body: "Before your mock interview, study the Q&A bank for your role to warm up and build confidence.",
  },
  {
    icon: Terminal,
    title: "Practice DSA daily",
    body: "Pick a topic and experience level each day — the AI generates fresh problems every time you generate.",
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
          AI-Powered Mock Interviews
        </div>
        <h1 className="text-4xl font-black tracking-tight">How PrepTalk Works</h1>
        <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
          Go from zero to interview-ready in three simple steps. PrepTalk uses AI to simulate real
          interviews and give you the feedback you need to land the job.
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
          Create your first mock interview in under a minute and start getting AI feedback today.
        </p>
        <Button
          size="lg"
          className="gap-2 mt-2"
          onClick={() => router.push("/dashboard")}
        >
          <Sparkles className="h-4 w-4" />
          Go to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}
