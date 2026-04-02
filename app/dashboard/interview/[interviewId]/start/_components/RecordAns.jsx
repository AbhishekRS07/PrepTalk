"use client";
import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import WebcamComponent from "react-webcam";
import useSpeechToText from "react-hook-speech-to-text";
import { Mic, MicOff, Loader2, VideoOff } from "lucide-react";
import { Button } from "../../../../../../components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const RecordAns = forwardRef(({ mockInterQuestion, active, interviewData }, ref) => {
  const [userAnswer, setUserAnswer] = useState("");
  const userAnswerRef = useRef("");
  const activeRef = useRef(active);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(false);

  const { isRecording, results, setResults, startSpeechToText, stopSpeechToText } =
    useSpeechToText({ continuous: true, useLegacyResults: false });

  // Keep activeRef in sync so saveCurrentAnswer always uses the right index
  useEffect(() => {
    activeRef.current = active;
    // Reset transcript when question changes
    userAnswerRef.current = "";
    setUserAnswer("");
    setResults([]);
  }, [active]);

  useEffect(() => {
    const saved = localStorage.getItem("webcamEnabled");
    if (saved === "true") setWebcamEnabled(true);
  }, []);

  // Accumulate transcript
  useEffect(() => {
    if (results?.length > 0) {
      const transcript = results.map((r) => r.transcript).join(" ");
      userAnswerRef.current = transcript;
      setUserAnswer(transcript);
    }
  }, [results]);

  // Expose saveCurrentAnswer to parent
  useImperativeHandle(ref, () => ({
    saveCurrentAnswer: async () => {
      if (isRecording) stopSpeechToText();
      if (userAnswerRef.current.trim().length > 10) {
        await UpdateAnswer(activeRef.current);
      }
    },
  }));

  const UpdateAnswer = async (questionIndex) => {
    const answer = userAnswerRef.current.trim();
    const question = mockInterQuestion[questionIndex];
    if (!question || !answer) return;

    setLoading(true);
    try {
      const res = await fetch("/api/answer/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mockIdRef: interviewData?.mockId,
          question: question.question,
          correctAns: question.answer,
          userAns: answer,
          userEmail: user?.email,
        }),
      });

      if (!res.ok) throw new Error("Failed to save answer");

      toast.success("Answer saved");
      setResults([]);
      userAnswerRef.current = "";
      setUserAnswer("");
    } catch (err) {
      console.error("UpdateAnswer error:", err);
      toast.error("Failed to save answer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Webcam */}
      <div className="bg-muted rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative">
        {webcamEnabled ? (
          <WebcamComponent
            mirrored
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <VideoOff className="h-10 w-10" />
            <p className="text-xs">Camera off</p>
          </div>
        )}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Recording
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live transcript */}
      <AnimatePresence>
        {userAnswer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-secondary rounded-xl px-4 py-3 text-sm text-muted-foreground italic overflow-hidden"
          >
            "{userAnswer}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant={isRecording ? "destructive" : "default"}
          className={cn("flex-1 gap-2", isRecording && "animate-pulse")}
          onClick={isRecording ? stopSpeechToText : startSpeechToText}
          disabled={loading}
        >
          {isRecording
            ? <><MicOff className="h-4 w-4" /> Stop Recording</>
            : <><Mic className="h-4 w-4" /> Record Answer</>
          }
        </Button>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
          </div>
        )}
      </div>
    </div>
  );
});

RecordAns.displayName = "RecordAns";
export default RecordAns;
