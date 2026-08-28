"use client";
import { useEffect, useImperativeHandle, useRef, useState, forwardRef, useCallback } from "react";
import WebcamComponent from "react-webcam";
import useSpeechToText from "react-hook-speech-to-text";
import { Mic, MicOff, Loader2, VideoOff, Eye, EyeOff, PersonStanding, RotateCcw } from "lucide-react";
import { Button } from "../../../../../../components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEyeTracking } from "@/lib/useEyeTracking";
import PostureOverlay from "./PostureOverlay";

const RecordAns = forwardRef(({ mockInterQuestion, active, interviewData }, ref) => {
  const [userAnswer, setUserAnswer] = useState("");
  const userAnswerRef = useRef("");
  const activeRef = useRef(active);
  const [loading, setLoading] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(false);

  // Webcam + video refs for eye tracking
  const webcamRef = useRef(null);
  const videoRef = useRef(null);

  const { isRecording, results, setResults, startSpeechToText, stopSpeechToText } =
    useSpeechToText({ continuous: true, useLegacyResults: false });

  // ── Eye tracking ────────────────────────────────────────────────
  const {
    isTracking,
    faceDetected,
    warningActive,
    poseLandmarks,
    postureOk,
    postureTarget,
    recalibratePosture,
    integrityWarningActive,
  } = useEyeTracking({
    videoRef,
    enabled: webcamEnabled && !!interviewData?.mockId,
    mockId: interviewData?.mockId,
  });

  // Wire up videoRef when webcam stream starts
  const handleUserMedia = useCallback(() => {
    if (webcamRef.current?.video) {
      videoRef.current = webcamRef.current.video;
    }
  }, []);

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
      const answerSnapshot = userAnswerRef.current;
      if (isRecording) stopSpeechToText();
      if (answerSnapshot.trim().length > 10) {
        await UpdateAnswer(activeRef.current, answerSnapshot);
      }
    },
  }));

  const UpdateAnswer = async (questionIndex, answer) => {
    answer = answer.trim();
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save answer");

      toast.success("Answer saved");
      userAnswerRef.current = "";
      setUserAnswer("");
      setResults([]);
    } catch (err) {
      console.error("UpdateAnswer error:", err);
      toast.error("Failed to save answer");
    } finally {
      setLoading(false);
    }
  };

  // ── Tracking status dot ─────────────────────────────────────────
  // green = tracking + face ok, yellow = tracking but face lost, grey = not tracking
  const dotColor = !webcamEnabled || !isTracking
    ? "bg-zinc-500"
    : warningActive || !faceDetected
    ? "bg-amber-400"
    : "bg-emerald-400";

  const dotTitle = !webcamEnabled
    ? "Camera off"
    : !isTracking
    ? "Eye tracking loading…"
    : !faceDetected
    ? "Face not detected"
    : warningActive
    ? "Distraction detected"
    : "Eye tracking active";

  // Posture status — same color language as the eye-tracking dot, but stays neutral
  // (grey) rather than amber when the pose model simply can't see the shoulders, since
  // that's not itself a posture problem (the separate hint above already covers it).
  const postureHasSignal = isTracking && !!poseLandmarks;
  const postureDotColor = !webcamEnabled || !postureHasSignal
    ? "bg-zinc-500"
    : postureOk
    ? "bg-emerald-400"
    : "bg-amber-400";

  const postureTitle = !webcamEnabled
    ? "Camera off"
    : !postureHasSignal
    ? "Posture tracking — shoulders not visible"
    : postureOk
    ? "Posture looks good"
    : "Posture needs adjusting";

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Webcam */}
      <div className="bg-muted rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative">
        {webcamEnabled ? (
          <>
            <WebcamComponent
              ref={webcamRef}
              onUserMedia={handleUserMedia}
              mirrored
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {isTracking && (
              <PostureOverlay videoRef={videoRef} poseLandmarks={poseLandmarks} postureTarget={postureTarget} />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <VideoOff className="h-10 w-10" />
            <p className="text-xs">Camera off</p>
          </div>
        )}

        {/* Recording badge */}
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

        {/* Posture tracking hint — shown when tracking is active but the pose model
            can't currently find shoulders in frame (e.g. sitting too close, cropped
            out). Without this, "no overlay lines" looks identical to "broken." */}
        <AnimatePresence>
          {isTracking && !poseLandmarks && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 left-3 right-3 flex items-center justify-center bg-black/60 text-white text-xs px-3 py-1.5 rounded-full text-center"
            >
              Move back a little so your shoulders are visible for posture tracking
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tracking status indicator — eye contact + posture side by side in one badge */}
        {webcamEnabled && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            <div className="flex items-center gap-1.5" title={dotTitle}>
              <span className={cn("h-2 w-2 rounded-full shrink-0", dotColor, !isTracking && "animate-pulse")} />
              {isTracking ? (
                faceDetected ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3 text-amber-300" />
                )
              ) : (
                <Eye className="h-3 w-3 opacity-40" />
              )}
            </div>
            <span className="h-3 w-px bg-white/20 shrink-0" />
            <div className="flex items-center gap-1.5" title={postureTitle}>
              <span className={cn("h-2 w-2 rounded-full shrink-0", postureDotColor)} />
              <PersonStanding className={cn("h-3 w-3", !postureHasSignal && "opacity-40")} />
            </div>
          </div>
        )}

        {/* Recalibrate posture target — the target line is captured automatically, but
            if it still looks off (camera bumped, different seat) this resets it from
            the person's current position instead of living with a bad one all session */}
        {isTracking && postureTarget && (
          <button
            type="button"
            onClick={recalibratePosture}
            title="Reset posture target to your current position"
            className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 hover:bg-black/70 text-white text-xs px-2 py-1 rounded-full transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}

        {/* Warning flash overlay — amber for habit-coaching (attention/posture), a
            distinct red for integrity checks so the two categories don't look the same */}
        <AnimatePresence>
          {warningActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 border-2 border-amber-400 rounded-2xl pointer-events-none"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {integrityWarningActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 border-2 border-red-500 rounded-2xl pointer-events-none"
            />
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
