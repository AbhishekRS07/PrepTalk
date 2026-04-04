"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import InterviewCard from "./InterviewCard";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const InterviewList = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) GetInterviews();
  }, [user]);

  const GetInterviews = async () => {
    try {
      const email = user?.email;
      const res = await fetch(`/api/interviews?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load interviews");
      setInterviews(data);
    } catch (err) {
      console.error("Error fetching interviews:", err);
      setError("Failed to load interviews.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (mockId) => {
    setInterviews((prev) => prev.filter((i) => i.mockId !== mockId));
  };

  return (
    <div>
      <motion.h2
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4"
      >
        Previous Interviews
      </motion.h2>

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-muted-foreground text-sm py-8"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your interviews…
        </motion.div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : interviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center py-16 border-2 border-dashed border-border rounded-2xl"
        >
          <p className="text-muted-foreground text-sm">No interviews yet.</p>
          <p className="text-muted-foreground text-xs mt-1">Create your first one above to get started.</p>
        </motion.div>
      ) : (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {interviews.map((item) => (
            <InterviewCard
              key={item.mockId}
              interview={item}
              onDelete={handleDelete}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default InterviewList;
