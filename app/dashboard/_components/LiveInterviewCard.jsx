"use client";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import { useRouter } from "next/navigation";

const LiveInterviewCard = () => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.97 }}
      onClick={() => router.push("/dashboard/live-interview")}
      className="group border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary hover:bg-accent transition-all duration-300"
    >
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute inset-0 rounded-xl bg-emerald-500/20 pointer-events-none"
        />
        <div className="relative h-12 w-12 rounded-xl bg-accent group-hover:bg-emerald-500/10 flex items-center justify-center transition-colors duration-300">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Mic className="h-6 w-6 text-muted-foreground group-hover:text-emerald-500 transition-colors duration-300" />
          </motion.div>
        </div>
      </div>

      <div className="text-center">
        <p className="font-semibold text-sm group-hover:text-primary transition-colors duration-300">
          Live Interview
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Conversational AI interviewer
        </p>
      </div>
    </motion.div>
  );
};

export default LiveInterviewCard;
