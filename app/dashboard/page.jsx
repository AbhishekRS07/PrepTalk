"use client";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import AddNewInterview from "./_components/AddNewInterview";
import InterviewList from "./_components/InterviewList";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease: "easeOut" },
  }),
};

const Dashboard = () => {
  const { user } = useUser();
  const firstName = user?.firstName || "there";

  return (
    <div className="space-y-10">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
        <p className="text-sm text-muted-foreground mb-1">Welcome back, {firstName} 👋</p>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Create a new mock interview or continue practicing from where you left off.
        </p>
      </motion.div>

      {/* New interview */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          New Interview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AddNewInterview />
        </div>
      </motion.div>

      {/* Interview list */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
        <InterviewList />
      </motion.div>
    </div>
  );
};

export default Dashboard;
