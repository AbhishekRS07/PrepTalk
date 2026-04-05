"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText, Upload, X, ArrowLeft, Sparkles,
  Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ResumeInterviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [experience, setExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.");
      return;
    }
    setError("");
    setFile(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please upload your resume."); return; }
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("jobPosition", jobPosition);
      formData.append("experience", experience || "0");
      formData.append("userEmail", user?.email);

      const res = await fetch("/api/resume/generate", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to generate interview");
      router.push(`/dashboard/interview/${data.mockId}`);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto pb-20"
    >
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
          <FileText className="h-6 w-6 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Resume Interview</h1>
          <p className="text-sm text-muted-foreground">AI reads your resume and asks tailored questions</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-2">
        <p className="text-sm font-medium">What makes this different</p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
            Questions reference your actual projects, companies, and tech stack
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
            AI probes specific claims from your resume — no generic questions
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
            Same feedback and analytics as regular mock interviews
          </li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Drop zone */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Your Resume (PDF)</label>
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div
                key="file"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="flex items-center gap-3 p-4 bg-violet-500/5 border border-violet-500/30 rounded-xl"
              >
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · PDF</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="h-7 w-7 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
                <CheckCircle2 className="h-5 w-5 text-violet-500 shrink-0" />
              </motion.div>
            ) : (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200",
                  dragging
                    ? "border-violet-500 bg-violet-500/5"
                    : "border-border hover:border-violet-500/50 hover:bg-accent"
                )}
              >
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center transition-colors duration-200",
                  dragging ? "bg-violet-500/15" : "bg-secondary"
                )}>
                  <Upload className={cn("h-6 w-6 transition-colors duration-200", dragging ? "text-violet-500" : "text-muted-foreground")} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{dragging ? "Drop it here" : "Drop your PDF here"}</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse · max 5 MB</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        {/* Optional fields */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Target Role <span className="text-muted-foreground font-normal">(optional — AI infers from resume if blank)</span>
          </label>
          <Input
            placeholder="e.g. Senior Frontend Engineer"
            value={jobPosition}
            onChange={(e) => setJobPosition(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Years of Experience <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Input
            type="number"
            min="0"
            max="40"
            placeholder="e.g. 3"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" disabled={loading || !file} className="w-full gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing resume & generating questions…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Interview from Resume
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}
