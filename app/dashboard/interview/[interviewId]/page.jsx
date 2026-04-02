"use client";
import { useEffect, useState } from "react";
import Webcam from "react-webcam";
import { Lightbulb, Video, VideoOff, ArrowRight, Briefcase, Clock, Code2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

const tips = [
  "Speak clearly and at a natural pace.",
  "Take a moment to think before answering — it's okay.",
  "Structure answers with context, your action, and the result.",
  "Be honest about what you know and don't know.",
];

const InterView = ({ params }) => {
  const [interviewData, setInterviewData] = useState(null);
  const [webcamEnabled, setWebcamEnabled] = useState(false);

  useEffect(() => {
    GetInterviewDetails();
    const saved = localStorage.getItem("webcamEnabled");
    if (saved === "true") setWebcamEnabled(true);
  }, [params.interviewId]);

  const GetInterviewDetails = async () => {
    const res = await fetch(`/api/interview/${params.interviewId}`);
    if (res.ok) {
      const data = await res.json();
      setInterviewData(data);
    }
  };

  const handleEnableWebcam = () => {
    setWebcamEnabled(true);
    localStorage.setItem("webcamEnabled", "true");
  };

  const handleDisableWebcam = () => {
    setWebcamEnabled(false);
    localStorage.setItem("webcamEnabled", "false");
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">Ready to practice?</h1>
        <p className="text-muted-foreground">
          Review your interview details and enable your camera before starting.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left — Webcam */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-4"
        >
          <div className="bg-card border border-border rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative">
            {webcamEnabled ? (
              <Webcam
                mirrored
                onUserMediaError={handleDisableWebcam}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <VideoOff className="h-12 w-12" />
                <p className="text-sm">Camera is off</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant={webcamEnabled ? "outline" : "default"}
              className="flex-1 gap-2"
              onClick={webcamEnabled ? handleDisableWebcam : handleEnableWebcam}
            >
              {webcamEnabled ? (
                <><VideoOff className="h-4 w-4" /> Disable Camera</>
              ) : (
                <><Video className="h-4 w-4" /> Enable Camera & Mic</>
              )}
            </Button>
            <Link href={`/dashboard/interview/${params.interviewId}/start`} className="flex-1">
              <Button className="w-full gap-2">
                Start Interview
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Right — Details + Tips */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col gap-4"
        >
          {/* Interview details */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-base">Interview Details</h2>
            {interviewData ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm font-medium">{interviewData.jobPosition}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Code2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tech Stack</p>
                    <p className="text-sm font-medium">{interviewData.jobDesc}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Experience</p>
                    <p className="text-sm font-medium">{interviewData.jobexperience} years</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 bg-muted animate-pulse rounded" />
                ))}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-accent border border-accent-foreground/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm text-primary">Tips for a great session</h2>
            </div>
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-primary font-bold mt-0.5">·</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InterView;
