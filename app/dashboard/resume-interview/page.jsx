"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleCombobox } from "@/components/ui/role-combobox";
import {
  FileText, Upload, X, ArrowLeft, Sparkles,
  Loader2, CheckCircle2, AlertCircle, BookOpen,
  Trash2, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const JOB_ROLES = [
  "Full Stack Developer", "Frontend Developer", "Backend Developer",
  "React Developer", "Node.js Developer", "Python Developer", "Java Developer",
  "Mobile Developer (Android)", "Mobile Developer (iOS)",
  "Data Scientist", "Machine Learning Engineer", "DevOps Engineer", "QA Engineer",
  "System Design", "Product Manager", "Senior Product Manager",
  "HR Generalist", "HR Business Partner", "Technical Recruiter", "Talent Acquisition Manager",
];

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

  // Saved resume state
  const [savedResumeName, setSavedResumeName] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [useSaved, setUseSaved] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [savingResume, setSavingResume] = useState(false);
  const [removingResume, setRemovingResume] = useState(false);

  // Fetch saved resume on mount
  useEffect(() => {
    if (!user?.email) return;
    fetch(`/api/profile?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.resume_name) {
          setSavedResumeName(d.resume_name);
          setUseSaved(true); // default to using saved if available
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [user?.email]);

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") { setError("Only PDF files are supported."); return; }
    if (f.size > 5 * 1024 * 1024) { setError("File must be under 5 MB."); return; }
    setError("");
    setFile(f);
    setUseSaved(false); // switching to new file
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleRemoveSaved = async () => {
    setRemovingResume(true);
    await fetch("/api/resume/save", { method: "DELETE" });
    setSavedResumeName(null);
    setUseSaved(false);
    setRemovingResume(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!useSaved && !file) { setError("Please upload your resume."); return; }
    setLoading(true);
    setError("");

    try {
      // If using a new file and saveToProfile is checked, save it first
      if (!useSaved && file && saveToProfile) {
        setSavingResume(true);
        const saveData = new FormData();
        saveData.append("file", file);
        const saveRes = await fetch("/api/resume/save", { method: "POST", body: saveData });
        const saveJson = await saveRes.json();
        if (saveRes.ok) setSavedResumeName(saveJson.resumeName);
        setSavingResume(false);
      }

      const formData = new FormData();
      if (useSaved) {
        formData.append("useSaved", "true");
      } else {
        formData.append("file", file);
      }
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
      setSavingResume(false);
    }
  };

  const loadingLabel = savingResume
    ? "Saving resume to profile…"
    : "Analyzing resume & generating questions…";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto pb-20">
      {/* Back */}
      <button onClick={() => router.push("/dashboard")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <FileText className="h-6 w-6 text-primary" />
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
          {[
            "Questions reference your actual roles, companies, and experience",
            "AI probes specific claims from your resume — no generic questions",
            "Same feedback and analytics as regular mock interviews",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Saved resume banner ──────────────────────────────── */}
        {!loadingProfile && savedResumeName && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-2xl border p-4 transition-colors duration-200",
                useSaved
                  ? "bg-primary/8 border-primary/30"
                  : "bg-card border-border"
              )}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{savedResumeName}</p>
                    <p className="text-xs text-muted-foreground">Saved resume</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveSaved}
                  disabled={removingResume}
                  className="text-muted-foreground/50 hover:text-destructive transition-colors"
                  title="Remove saved resume"
                >
                  {removingResume
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4" />
                  }
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setUseSaved(true); setFile(null); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-all",
                    useSaved
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Use this resume
                </button>
                <button
                  type="button"
                  onClick={() => { setUseSaved(false); fileInputRef.current?.click(); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-all",
                    !useSaved && file
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Upload new
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Drop zone (shown when no saved resume, or uploading new) ── */}
        {(!savedResumeName || !useSaved) && (
          <div>
            {savedResumeName && (
              <label className="text-sm font-medium mb-1.5 block">New Resume (PDF)</label>
            )}
            {!savedResumeName && (
              <label className="text-sm font-medium mb-1.5 block">Your Resume (PDF)</label>
            )}
            <AnimatePresence mode="wait">
              {file ? (
                <motion.div key="file" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                  className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/30 rounded-xl">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · PDF</p>
                  </div>
                  <button type="button" onClick={() => setFile(null)}
                    className="h-7 w-7 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors shrink-0">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                </motion.div>
              ) : (
                <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onDrop={onDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200",
                    dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent"
                  )}
                >
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-colors duration-200",
                    dragging ? "bg-primary/15" : "bg-secondary")}>
                    <Upload className={cn("h-6 w-6 transition-colors duration-200", dragging ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{dragging ? "Drop it here" : "Drop your PDF here"}</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse · max 5 MB</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])} />

            {/* Save to profile toggle — only for new uploads, no saved resume yet */}
            {file && (
              <motion.label initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mt-3 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={saveToProfile}
                  onChange={(e) => setSaveToProfile(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  Save this resume to my profile for next time
                </span>
              </motion.label>
            )}
          </div>
        )}

        {/* Optional fields */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Target Role <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <RoleCombobox
            options={JOB_ROLES}
            placeholder="e.g. Senior Frontend Engineer, HR Generalist"
            value={jobPosition}
            onChange={setJobPosition}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Years of Experience <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Input type="number" min="0" max="40" placeholder="e.g. 3" value={experience}
            onChange={(e) => setExperience(e.target.value)} />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" disabled={loading || (!useSaved && !file)} className="w-full gap-2">
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" />{loadingLabel}</>
          ) : (
            <><Sparkles className="h-4 w-4" />Generate Interview from Resume</>
          )}
        </Button>
      </form>
    </motion.div>
  );
}
