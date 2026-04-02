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
import { chatSession } from "../../../lib/GorqAIModal";
import { PrepTalk } from "../../../utils/schema";
import { LoaderCircle, Plus, Sparkles } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { db } from "../../../utils/db";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const AddNewInterview = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useUser();
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let cleanedResponse = "";
    try {
      const InputPrompt = `Job position: ${jobPosition}, Job Description: ${jobDesc}, Years of Experience: ${jobExperience}. Depending upon the job position, job description, and the years of experience, generate ${process.env.NEXT_PUBLIC_INTERVIEW_OUESTION_COUNT} interview questions along with the answers in JSON format. Provide "question" and "answer" fields in JSON.`;

      const result = await chatSession.sendMessage(InputPrompt);
      const rawResponse = await result.response.text();

      cleanedResponse = rawResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      JSON.parse(cleanedResponse); // validate
    } catch (err) {
      console.error("Error:", err);
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      if (cleanedResponse) {
        const resp = await db
          .insert(PrepTalk)
          .values({
            mockId: uuidv4(),
            jsonMockResp: cleanedResponse,
            jobPosition,
            jobDesc,
            jobexperience: jobExperience,
            createdBy: user?.primaryEmailAddress?.emailAddress,
            createdAt: moment().format("DD-MM-yyyy"),
          })
          .returning({ mockId: PrepTalk.mockId });

        if (resp) {
          setOpenDialog(false);
          router.push("/dashboard/interview/" + resp[0]?.mockId);
        }
      } else if (!error) {
        setError("Failed to generate questions. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpenDialog(true)}
        className="group border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary hover:bg-accent transition-all duration-200"
      >
        <div className="h-12 w-12 rounded-xl bg-accent group-hover:bg-primary/10 flex items-center justify-center transition-colors">
          <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm group-hover:text-primary transition-colors">
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
