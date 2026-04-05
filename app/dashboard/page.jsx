"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AddNewInterview from "./_components/AddNewInterview";
import LiveInterviewCard from "./_components/LiveInterviewCard";
import ResumeInterviewCard from "./_components/ResumeInterviewCard";
import JDPrepCard from "./_components/JDPrepCard";
import InterviewList from "./_components/InterviewList";
import LiveInterviewList from "./_components/LiveInterviewList";
import StreakWidget from "./_components/StreakWidget";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { BarChart3, Mic, FileText } from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const lineVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

const tabs = [
  { id: "mock",   label: "Mock Interviews",   icon: BarChart3 },
  { id: "live",   label: "Live Interviews",   icon: Mic },
  { id: "resume", label: "Resume Interviews", icon: FileText },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("mock");

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <div className="space-y-10">
      {/* Header */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative">
        <div className="absolute -top-8 -left-8 w-64 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <motion.p variants={lineVariants} className="text-sm text-muted-foreground mb-1">
          Welcome back, {firstName} 👋
        </motion.p>
        <motion.h1 variants={lineVariants} className="text-3xl font-bold tracking-tight">
          Dashboard
        </motion.h1>
        <motion.p variants={lineVariants} className="text-muted-foreground mt-1">
          Create a new mock interview or start a live conversational session.
        </motion.p>
      </motion.div>

      {/* Streak + goal widget */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={1}>
        <StreakWidget />
      </motion.div>

      {/* New Interview cards */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={2}>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Start Interview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <AddNewInterview />
          <LiveInterviewCard />
          <ResumeInterviewCard />
          <JDPrepCard />
        </div>
      </motion.div>

      {/* Tabbed history */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={3}>
        {/* Tab bar */}
        <div className="flex items-center gap-1 mb-6 bg-secondary/50 rounded-xl p-1 w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "mock" && (
            <motion.div key="mock" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <InterviewList filter="mock" />
            </motion.div>
          )}
          {activeTab === "live" && (
            <motion.div key="live" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <LiveInterviewList />
            </motion.div>
          )}
          {activeTab === "resume" && (
            <motion.div key="resume" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <InterviewList filter="resume" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Dashboard;
