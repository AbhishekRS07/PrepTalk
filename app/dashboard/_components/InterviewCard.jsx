"use client";
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

const InterviewCard = ({ interview, onDelete }) => {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
      className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md hover:shadow-primary/5 transition-shadow"
    >
      {/* Role badge */}
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
          className="flex-1 text-xs gap-1"
          onClick={() => router.push("/dashboard/interview/" + interview?.mockId)}
        >
          Practice
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
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
    </motion.div>
  );
};

export default InterviewCard;
