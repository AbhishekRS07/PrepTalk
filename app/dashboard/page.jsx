"use client";
import { motion } from "framer-motion";
import AddNewInterview from "./_components/AddNewInterview";
import InterviewList from "./_components/InterviewList";
import { useAuth } from "@/context/AuthContext";

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
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

const Dashboard = () => {
  const { user } = useAuth();
  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <div className="space-y-10">
      {/* ── Header — staggered lines ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative"
      >
        {/* Decorative glow */}
        <div className="absolute -top-8 -left-8 w-64 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <motion.p variants={lineVariants} className="text-sm text-muted-foreground mb-1">
          Welcome back, {firstName} 👋
        </motion.p>
        <motion.h1 variants={lineVariants} className="text-3xl font-bold tracking-tight">
          Dashboard
        </motion.h1>
        <motion.p variants={lineVariants} className="text-muted-foreground mt-1">
          Create a new mock interview or continue practicing from where you left off.
        </motion.p>
      </motion.div>

      {/* ── New Interview ── */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={2}
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          New Interview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AddNewInterview />
        </div>
      </motion.div>

      {/* ── Interview List ── */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={3}
      >
        <InterviewList />
      </motion.div>
    </div>
  );
};

export default Dashboard;
