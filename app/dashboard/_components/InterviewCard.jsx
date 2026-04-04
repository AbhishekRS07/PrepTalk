"use client";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { CalendarDays, Briefcase, ChevronRight, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../components/ui/alert-dialog";

export const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const InterviewCard = ({ interview, onDelete }) => {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const cardRef = useRef(null);

  const onDeleteClick = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/interview/${interview.mockId}`, { method: "DELETE" });
      onDelete(interview.mockId);
    } catch (error) {
      console.error("Error deleting interview:", error);
    } finally {
      setDeleting(false);
    }
  };

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
      variants={cardVariants}
      className="group relative"
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover glow halo */}
      <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/20 via-violet-500/10 to-transparent blur-sm -z-10 pointer-events-none" />

      {/* Card */}
      <div className="relative bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 group-hover:border-primary/30 transition-colors duration-300 overflow-hidden">
        {/* Shimmer */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/4 to-transparent pointer-events-none" />

        {/* Role + badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{interview?.jobPosition}</h3>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {interview?.jobexperience} yrs exp
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {interview?.createdAt}
              </span>
            </div>
          </div>
          <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
            {interview?.jobexperience === "0" ? "Fresher" : interview?.jobexperience + " yr exp"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => router.push("/dashboard/interview/" + interview?.mockId + "/feedback")}
          >
            View Feedback
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs gap-1 group-hover:shadow-md group-hover:shadow-primary/20 transition-shadow duration-300"
            onClick={() => router.push("/dashboard/interview/" + interview?.mockId)}
          >
            Practice
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete interview?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the <strong>{interview?.jobPosition}</strong> interview and all its feedback. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteClick}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  );
};

export default InterviewCard;
