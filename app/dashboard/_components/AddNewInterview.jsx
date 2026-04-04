"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { LoaderCircle, Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const AddNewInterview = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobPosition,
          jobDesc,
          jobExperience,
          userEmail: user?.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate interview");
      }

      setOpenDialog(false);
      router.push("/dashboard/interview/" + data.mockId);
    } catch (err) {
      console.error("Error:", err);
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpenDialog(true)}
        className="group border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary hover:bg-accent transition-all duration-300"
      >
        {/* Icon with pulsing ring */}
        <div className="relative">
          {/* Pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-xl bg-primary/20 pointer-events-none"
          />
          <div className="relative h-12 w-12 rounded-xl bg-accent group-hover:bg-primary/10 flex items-center justify-center transition-colors duration-300">
            <motion.div
              animate={{ rotate: [0, 0, 90, 90, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", times: [0, 0.4, 0.5, 0.9, 1] }}
            >
              <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            </motion.div>
          </div>
        </div>

        <div className="text-center">
          <p className="font-semibold text-sm group-hover:text-primary transition-colors duration-300">
            New Interview
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            AI-generated questions
          </p>
        </div>
      </motion.div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl">Set up your interview</DialogTitle>
            </div>
            <DialogDescription>
              Tell us about the role and we'll generate tailored questions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Job Role / Position</label>
              <Input
                placeholder="e.g. Full Stack Developer"
                required
                value={jobPosition}
                onChange={(e) => setJobPosition(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tech Stack / Description</label>
              <Textarea
                placeholder="e.g. React, Node.js, PostgreSQL"
                required
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Years of Experience</label>
              <Input
                type="number"
                min="0"
                max="40"
                placeholder="e.g. 3"
                required
                value={jobExperience}
                onChange={(e) => setJobExperience(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Interview
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddNewInterview;
