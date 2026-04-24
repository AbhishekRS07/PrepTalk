"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

// ── Thresholds ────────────────────────────────────────────────────
const FACE_LOST_THRESHOLD_MS = 3000;   // 3s without face → violation
const POSE_THRESHOLD_MS = 2000;        // 2s head turned → violation
const WINDOW_BLUR_THRESHOLD_MS = 3000; // 3s window blurred → violation
const TOAST_COOLDOWN_MS = 5000;        // max 1 warning per 5s
const DETECTION_INTERVAL_MS = 200;     // run detection at 5fps

// Yaw: |nose_x - eye_mid_x| / eye_width > this → head turned left/right
const YAW_THRESHOLD = 0.35;

// Attention score: starts at 100, each violation costs 5 points
const POINTS_PER_VIOLATION = 5;

// ── Hook ──────────────────────────────────────────────────────────
/**
 * useEyeTracking
 *
 * @param {object}    options
 * @param {object}    options.videoRef  - ref whose .current is the HTMLVideoElement
 * @param {boolean}   options.enabled   - only active when true (webcam on)
 * @param {string}    options.mockId    - used to persist data in sessionStorage
 *
 * @returns {{ isTracking, faceDetected, attentionScore, violations, warningActive }}
 */
export function useEyeTracking({ videoRef, enabled, mockId }) {
  const [isTracking, setIsTracking] = useState(false);
  const [faceDetected, setFaceDetected] = useState(true);
  const [attentionScore, setAttentionScore] = useState(100);
  const [violations, setViolations] = useState([]);
  const [warningActive, setWarningActive] = useState(false);

  const faceLandmarkerRef = useRef(null);
  const intervalRef = useRef(null);
  const lastToastRef = useRef(0);
  const faceLostSinceRef = useRef(null);
  const poseLostSinceRef = useRef(null);
  const windowBlurSinceRef = useRef(null);
  const violationsRef = useRef([]);

  // ── Add a violation ─────────────────────────────────────────────
  const addViolation = useCallback(
    (type, message) => {
      const violation = { type, message, timestamp: Date.now() };
      violationsRef.current = [...violationsRef.current, violation];
      setViolations([...violationsRef.current]);

      const newScore = Math.max(
        0,
        100 - violationsRef.current.length * POINTS_PER_VIOLATION
      );
      setAttentionScore(newScore);

      // Persist to sessionStorage so feedback page can read it
      if (mockId) {
        try {
          sessionStorage.setItem(
            `attention_${mockId}`,
            JSON.stringify({ score: newScore, violations: violationsRef.current })
          );
        } catch (_) {}
      }

      // Throttled toast
      const now = Date.now();
      if (now - lastToastRef.current > TOAST_COOLDOWN_MS) {
        lastToastRef.current = now;
        toast.warning(message, {
          description: "Stay focused — just like a real interview!",
          duration: 3000,
        });
        setWarningActive(true);
        setTimeout(() => setWarningActive(false), 2500);
      }
    },
    [mockId]
  );

  // ── Load MediaPipe FaceLandmarker ────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function loadMediaPipe() {
      try {
        const { FaceLandmarker, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "/mediapipe"
        );

        const landmarker = await FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU",
            },
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrices: false,
            runningMode: "VIDEO",
            numFaces: 1,
          }
        );

        if (!cancelled) {
          faceLandmarkerRef.current = landmarker;
          setIsTracking(true);
          // Write baseline so feedback page shows the card even with 0 violations
          if (mockId) {
            try {
              const existing = sessionStorage.getItem(`attention_${mockId}`);
              if (!existing) {
                sessionStorage.setItem(
                  `attention_${mockId}`,
                  JSON.stringify({ score: 100, violations: [] })
                );
              }
            } catch (_) {}
          }
        }
      } catch (err) {
        // Silently degrade — tracking simply won't run
        console.warn("[EyeTracking] MediaPipe failed to load:", err?.message);
      }
    }

    loadMediaPipe();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // ── Detection loop ───────────────────────────────────────────────
  useEffect(() => {
    if (!isTracking) return;

    const runDetection = () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !faceLandmarkerRef.current) return;

      try {
        const results = faceLandmarkerRef.current.detectForVideo(
          video,
          performance.now()
        );
        const now = Date.now();

        if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
          // ── No face detected ──────────────────────────────────────
          setFaceDetected(false);
          poseLostSinceRef.current = null;

          if (!faceLostSinceRef.current) {
            faceLostSinceRef.current = now;
          } else if (now - faceLostSinceRef.current > FACE_LOST_THRESHOLD_MS) {
            faceLostSinceRef.current = now; // reset so next violation fires after another 3s
            addViolation("face_lost", "Face not detected — are you still there?");
          }
        } else {
          // ── Face detected — check head pose ───────────────────────
          setFaceDetected(true);
          faceLostSinceRef.current = null;

          const landmarks = results.faceLandmarks[0];

          // Landmark indices (MediaPipe 478-point model):
          //   33  = left eye outer corner
          //  263  = right eye outer corner
          //    4  = nose tip
          const leftEye = landmarks[33];
          const rightEye = landmarks[263];
          const noseTip = landmarks[4];

          const eyeWidth = Math.abs(rightEye.x - leftEye.x);
          if (eyeWidth > 0.01) {
            const eyeMidX = (leftEye.x + rightEye.x) / 2;
            const yaw = (noseTip.x - eyeMidX) / eyeWidth;
            const lookingAway = Math.abs(yaw) > YAW_THRESHOLD;

            if (lookingAway) {
              if (!poseLostSinceRef.current) {
                poseLostSinceRef.current = now;
              } else if (now - poseLostSinceRef.current > POSE_THRESHOLD_MS) {
                poseLostSinceRef.current = now;
                addViolation(
                  "looking_away",
                  "Keep your eyes on the screen"
                );
              }
            } else {
              poseLostSinceRef.current = null;
            }
          }
        }
      } catch (_) {
        // Swallow individual frame errors silently
      }
    };

    intervalRef.current = setInterval(runDetection, DETECTION_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
    // videoRef intentionally omitted — it's a stable ref object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTracking, addViolation]);

  // ── Tab visibility ───────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.hidden) {
        addViolation("tab_switch", "Tab switch detected — stay focused");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, addViolation]);

  // ── Window blur ──────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => {
      windowBlurSinceRef.current = Date.now();
    };
    const handleFocus = () => {
      windowBlurSinceRef.current = null;
    };

    const blurCheck = setInterval(() => {
      if (windowBlurSinceRef.current) {
        const elapsed = Date.now() - windowBlurSinceRef.current;
        if (elapsed > WINDOW_BLUR_THRESHOLD_MS) {
          windowBlurSinceRef.current = null;
          addViolation("window_blur", "Please keep this window in focus");
        }
      }
    }, 1000);

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      clearInterval(blurCheck);
    };
  }, [enabled, addViolation]);

  // ── Cleanup on disable ───────────────────────────────────────────
  useEffect(() => {
    if (!enabled) {
      clearInterval(intervalRef.current);
      setIsTracking(false);
      faceLandmarkerRef.current = null;
    }
  }, [enabled]);

  return { isTracking, faceDetected, attentionScore, violations, warningActive };
}
