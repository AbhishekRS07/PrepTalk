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
import { containerVariants, lineVariants, sectionVariants } from "@/lib/animations";
import { BarChart3, Mic, FileText } from "lucide-react";

const tabs = [
  { id: "mock",   label: "Mock Interviews",   icon: BarChart3 },
  { id: "live",   label: "Live Interviews",   icon: Mic },
  { id: "resume", label: "Resume Interviews", icon: FileText },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good evening";
}

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("mock");

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <div className="space-y-12">
      {/* Header */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative">
        <div className="absolute -top-10 -left-10 w-72 h-40 bg-primary/6 rounded-full blur-3xl pointer-events-none" />
        <motion.h1 variants={lineVariants} className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
          {getGreeting()}, {firstName}.
        </motion.h1>
        <motion.p variants={lineVariants} className="text-muted-foreground mt-2 max-w-lg leading-relaxed">
          Start a mock interview, go live with the AI, or practice from your resume or a job description.
        </motion.p>
      </motion.div>

      {/* Streak + goal widget */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={1}>
        <StreakWidget />
      </motion.div>

      {/* New Interview cards */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={2}>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-sm font-semibold text-primary shrink-0">
            {"// start interview"}
          </h2>
          <div className="h-px flex-1 bg-border/60" />
        </div>
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
        <div className="flex items-center gap-1 mb-6 bg-secondary/50 rounded-xl p-1 w-full sm:w-fit overflow-x-auto scrollbar-hide">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium font-mono lowercase transition-all duration-200 whitespace-nowrap shrink-0",
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
