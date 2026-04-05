"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { CalendarDays, Mic, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export const liveCardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const bandColor = (band) => {
  if (!band) return "#6b7280";
  const b = (band || "").toLowerCase();
  if (b === "excellent") return "#10b981";
  if (b === "good") return "#3b82f6";
  if (b === "average") return "#f59e0b";
  return "#ef4444";
};

const LiveSessionCard = ({ session }) => {
  const router = useRouter();
  const cardRef = useRef(null);
  const color = bandColor(session?.debrief?.overallBand);
  const exchangeCount = (session?.messages ?? []).filter((m) => m.role === "user").length;

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    el.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg) translateY(-4px)`;
    el.style.transition = "none";
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "";
    el.style.transition = "transform 0.5s cubic-bezier(0.22,1,0.36,1)";
  };

  return (
    <motion.div
      variants={liveCardVariants}
      className="group relative"
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-emerald-500/20 via-primary/10 to-transparent blur-sm -z-10 pointer-events-none" />

      <div className="relative bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 group-hover:border-emerald-500/30 transition-colors duration-300 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/4 to-transparent pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Mic className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <h3 className="font-semibold text-base truncate">{session?.role}</h3>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span>{session?.experience} yr exp</span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {session?.createdAt}
              </span>
              <span>{exchangeCount} exchanges</span>
            </div>
          </div>

          {session?.debrief ? (
            <div className="text-right shrink-0">
              <p className="text-base font-black" style={{ color }}>{session.debrief.score}/10</p>
              <p className="text-xs font-medium" style={{ color }}>{session.debrief.overallBand}</p>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">No debrief</span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <Button
            size="sm"
            className="flex-1 text-xs gap-1 group-hover:shadow-md group-hover:shadow-emerald-500/20 transition-shadow duration-300"
            onClick={() => router.push(`/dashboard/live-interview/${session?.mockId}`)}
          >
            View Debrief
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default LiveSessionCard;
