"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import LiveSessionCard, { liveCardVariants } from "./LiveSessionCard";
import { motion } from "framer-motion";
import { Loader2, Mic } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useRouter } from "next/navigation";

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const LiveInterviewList = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/live-interview/list?email=${encodeURIComponent(user?.email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load sessions");
      setSessions(data);
    } catch (err) {
      setError("Failed to load live interviews.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex items-center gap-2 text-muted-foreground text-sm py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your live interviews…
      </motion.div>
    );
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>;

  if (sessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center py-16 border-2 border-dashed border-border rounded-2xl"
      >
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
          <Mic className="h-6 w-6 text-emerald-500" />
        </div>
        <p className="text-muted-foreground text-sm">No live interviews yet.</p>
        <p className="text-muted-foreground text-xs mt-1 mb-4">Start a conversational AI interview to see your sessions here.</p>
        <Button size="sm" variant="outline" onClick={() => router.push("/dashboard/live-interview")} className="gap-2">
          <Mic className="h-3.5 w-3.5" /> Start Live Interview
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {sessions.map((s) => (
        <LiveSessionCard key={s.mockId} session={s} />
      ))}
    </motion.div>
  );
};

export default LiveInterviewList;
