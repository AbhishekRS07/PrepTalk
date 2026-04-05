"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Everything you need to get started — no credit card required.",
    icon: Sparkles,
    iconColor: "text-muted-foreground",
    iconBg: "bg-secondary",
    badge: null,
    current: true,
    features: [
      "5 mock interviews",
      "Live AI interviewer (conversational)",
      "Resume-based interviews (PDF upload)",
      "5 questions per mock session",
      "Voice + text answers",
      "AI feedback & model answers",
      "Progress analytics across all formats",
      "Q&A bank & DSA practice IDE",
    ],
    unavailable: [],
    cta: "Current Plan",
    ctaVariant: "outline",
  },
  {
    name: "Pro",
    price: "₹299",
    period: "per month",
    description: "For serious job seekers who want unlimited practice.",
    icon: Zap,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    badge: "Most Popular",
    current: false,
    features: [
      "Unlimited mock interviews",
      "Unlimited live AI sessions",
      "Unlimited resume-based interviews",
      "Up to 10 questions per mock session",
      "Priority AI response speed",
      "Advanced analytics & export",
      "Download feedback as PDF",
      "Everything in Free",
    ],
    unavailable: [],
    cta: "Coming Soon",
    ctaVariant: "default",
  },
  {
    name: "Team",
    price: "₹799",
    period: "per month",
    description: "For placement cells, bootcamps, and coaching institutes.",
    icon: Crown,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    badge: null,
    current: false,
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Shared interview bank",
      "Team performance dashboard",
      "Custom question sets",
      "Priority support",
    ],
    unavailable: [],
    cta: "Coming Soon",
    ctaVariant: "outline",
  },
];

const faqs = [
  {
    q: "Is the free plan really free?",
    a: "Yes — no credit card required. You get 5 mock interviews, unlimited live AI sessions, resume uploads, and full analytics at no cost.",
  },
  {
    q: "What's the difference between Mock and Live interviews?",
    a: "Mock interviews generate questions upfront that you answer one by one. Live interviews are conversational — the AI asks questions, probes your answers, and follows up in real time, like a real interviewer.",
  },
  {
    q: "How do resume-based interviews work?",
    a: "Upload your resume as a PDF. The AI reads your actual projects, companies, and skills and generates questions specific to your background — not generic prompts.",
  },
  {
    q: "What AI model powers the feedback?",
    a: "PrepTalk uses Llama 3.3 70B via Groq for fast, high-quality feedback, live conversation, and resume analysis.",
  },
  {
    q: "When will Pro and Team plans launch?",
    a: "We're actively working on paid plans. Join the waitlist to be notified when they go live.",
  },
  {
    q: "Can I use PrepTalk on mobile?",
    a: "Yes — the app is fully responsive. Microphone access for voice answers and speech recognition works on modern mobile browsers too.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function UpgradePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-16">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3 pt-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-2">
          <Crown className="h-3.5 w-3.5" />
          Plans & Pricing
        </div>
        <h1 className="text-4xl font-black tracking-tight">Simple, transparent pricing</h1>
        <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
          Start for free and upgrade when you need more. No hidden fees, no surprises.
        </p>
      </motion.div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {plans.map((plan, i) => {
          const Icon = plan.icon;
          return (
            <motion.div
              key={plan.name}
              custom={i}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className={cn(
                "relative bg-card border rounded-3xl p-7 flex flex-col gap-6",
                plan.name === "Pro"
                  ? "border-primary shadow-lg shadow-primary/10 md:-mt-4 md:pb-11"
                  : "border-border"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              {/* Header */}
              <div className="space-y-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", plan.iconBg)}>
                  <Icon className={cn("h-5 w-5", plan.iconColor)} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{plan.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-sm text-muted-foreground mb-1">/ {plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.ctaVariant}
                className="w-full"
                disabled={plan.current || plan.cta === "Coming Soon"}
              >
                {plan.cta}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* FAQ */}
      <div>
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-6 text-center"
        >
          Frequently asked questions
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.q}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-card border border-border rounded-2xl p-5 space-y-1.5"
            >
              <p className="font-semibold text-sm">{faq.q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-card border border-border rounded-3xl p-10 text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium">
          <Zap className="h-3.5 w-3.5" />
          Pro plan coming soon
        </div>
        <h2 className="text-2xl font-black">Want early access to Pro?</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          We're launching paid plans soon. Be the first to know and get a launch discount.
        </p>
        <Button size="lg" className="gap-2 mt-2" disabled>
          <Sparkles className="h-4 w-4" />
          Join Waitlist — Coming Soon
        </Button>
      </motion.div>
    </div>
  );
}
