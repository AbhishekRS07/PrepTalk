"use client";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";

const ResumeInterviewCard = () => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.97 }}
      onClick={() => router.push("/dashboard/resume-interview")}
      className="group border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-violet-500/60 hover:bg-accent transition-all duration-300"
    >
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute inset-0 rounded-xl bg-violet-500/20 pointer-events-none"
        />
        <div className="relative h-12 w-12 rounded-xl bg-accent group-hover:bg-violet-500/10 flex items-center justify-center transition-colors duration-300">
          <FileText className="h-6 w-6 text-muted-foreground group-hover:text-violet-500 transition-colors duration-300" />
        </div>
      </div>

      <div className="text-center">
        <p className="font-semibold text-sm group-hover:text-violet-500 transition-colors duration-300">
          Resume Interview
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tailored to your resume
        </p>
      </div>
    </motion.div>
  );
};

export default ResumeInterviewCard;
