"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

// ── Thresholds ────────────────────────────────────────────────────
const FACE_LOST_THRESHOLD_MS = 3000;   // 3s without face → violation
const POSE_THRESHOLD_MS = 2000;        // 2s head turned → violation
const WINDOW_BLUR_THRESHOLD_MS = 3000; // 3s window blurred → violation
const TOAST_COOLDOWN_MS = 5000;        // max 1 warning per 5s — for quick, correctable-in-the-moment lapses
const DETECTION_INTERVAL_MS = 200;     // run detection at 5fps

// Yaw: |nose_x - eye_mid_x| / eye_width > this → head turned left/right
const YAW_THRESHOLD = 0.35;

// Attention score: starts at 100, each violation costs 5 points
const POINTS_PER_VIOLATION = 5;

// ── Posture thresholds ───────────────────────────────────────────
// Body posture (shoulders/hips) is a separate, slower-moving signal than face pose —
// people hold a bad posture for a while rather than flick in and out of it like a head
// turn, so its sustained-duration threshold is longer than the face ones above.
const POSTURE_THRESHOLD_MS = 4000;
const SHOULDER_TILT_THRESHOLD_DEG = 8;      // shoulder line angle vs horizontal
const LEAN_THRESHOLD_RATIO = 0.18;          // body-center offset from frame center, as a fraction of shoulder width
const SLOUCH_RATIO_THRESHOLD = 0.85;        // current/baseline nose-to-shoulder distance
const BASELINE_CAPTURE_MS = 4000;           // 4s of held-still posture sets the "good posture" reference
// Combined frame-to-frame drift (centerX + shoulderY) above this restarts the baseline
// window — without this, the target gets captured mid-adjustment (e.g. leaning in to
// check the camera right as tracking starts) and locks in a target that's off from
// where the person actually settles.
const BASELINE_STABILITY_THRESHOLD = 0.04;

// Posture is a sustained state, not a momentary lapse — someone tilted 4s ago is very
// likely still tilted now, unlike a quick glance away. Toasting every ~5s for something
// that takes real, deliberate effort to correct (and hold) was reported as actively
// distracting during a real interview. One nudge, then quiet for a while — the
// violation still logs and still costs attention-score points every 4s underneath,
// this only throttles the interruptive toast.
const POSTURE_TOAST_COOLDOWN_MS = 30000;
const POSTURE_VIOLATION_TYPES = new Set(["uneven_shoulders", "leaning", "slouching"]);

// ── Integrity checks (phone / extra person) ───────────────────────
// Deliberately separate from the attention score — these are a fundamentally different
// category of thing than "looked away" or "slouching," and false positives are a real
// risk (a poster counted as a face, a stress ball read as a phone), so they're reported
// as their own signal on the feedback page rather than quietly docking points. A
// sustained-duration requirement (like posture) exists specifically to filter out a
// single bad frame before anything is logged.
const INTEGRITY_THRESHOLD_MS = 3000;
const INTEGRITY_TOAST_COOLDOWN_MS = 10000; // shorter than posture's — this is more serious, shouldn't go quiet as long
const OBJECT_DETECTION_INTERVAL_MS = 1200; // heavier model — throttled well below the 200ms face/pose tick
const PHONE_SCORE_THRESHOLD = 0.5;

// ── Hook ──────────────────────────────────────────────────────────
/**
 * useEyeTracking
 *
 * Despite the name (kept to avoid touching every call site), this also tracks:
 *  - body posture (shoulder level, lean, slouch) — feeds the same attention score and
 *    violation list as the face/tab/window signals.
 *  - integrity checks (a second face in frame, a visible phone) — reported completely
 *    separately via integrityIncidents/integrityWarningActive, never affects the score.
 *
 * Three MediaPipe models run off the same webcam feed: FaceLandmarker (face/eye-contact
 * + extra-person, via numFaces:2), PoseLandmarker (posture), and ObjectDetector (phone).
 *
 * @param {object}    options
 * @param {object}    options.videoRef  - ref whose .current is the HTMLVideoElement
 * @param {boolean}   options.enabled   - only active when true (webcam on)
 * @param {string}    options.mockId    - used to persist data in sessionStorage
 *
 * @returns {{ isTracking, faceDetected, attentionScore, violations, warningActive, poseLandmarks, postureOk, postureTarget, recalibratePosture, integrityIncidents, integrityWarningActive }}
 */
export function useEyeTracking({ videoRef, enabled, mockId }) {
  const [isTracking, setIsTracking] = useState(false);
  const [faceDetected, setFaceDetected] = useState(true);
  const [attentionScore, setAttentionScore] = useState(100);
  const [violations, setViolations] = useState([]);
  const [warningActive, setWarningActive] = useState(false);
  const [poseLandmarks, setPoseLandmarks] = useState(null);
  // Separate from `violations`/`attentionScore` on purpose — see INTEGRITY_THRESHOLD_MS
  // comment above.
  const [integrityIncidents, setIntegrityIncidents] = useState([]);
  const [integrityWarningActive, setIntegrityWarningActive] = useState(false);
  // Live, moment-to-moment posture state for the subtle status-dot indicator — distinct
  // from the violation log, which only records sustained (4s+) issues. This flips as
  // soon as a deviation starts, same responsiveness as the existing face-detected dot.
  const [postureOk, setPostureOk] = useState(true);
  // The "good posture" reference captured during the baseline window — fixed once set,
  // so the overlay can draw it as a stable target alongside the live/actual position,
  // instead of a line that just follows the person around (which isn't a target at all).
  const [postureTarget, setPostureTarget] = useState(null);

  const faceLandmarkerRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const objectDetectorRef = useRef(null);
  const intervalRef = useRef(null);
  const lastToastRef = useRef(0);
  const lastPostureToastRef = useRef(0);
  const lastIntegrityToastRef = useRef(0);
  const faceLostSinceRef = useRef(null);
  const poseLostSinceRef = useRef(null);
  const windowBlurSinceRef = useRef(null);
  const violationsRef = useRef([]);
  const integrityIncidentsRef = useRef([]);

  // Integrity-specific refs
  const extraPersonSinceRef = useRef(null);
  const phoneSinceRef = useRef(null);
  const lastObjectDetectionRef = useRef(0);

  // Posture-specific refs
  const tiltSinceRef = useRef(null);
  const leanSinceRef = useRef(null);
  const slouchSinceRef = useRef(null);
  const postureBaselineRef = useRef(null); // { noseToShoulderDist } once captured
  const baselineSamplesRef = useRef([]);
  // Set on the first tick the pose model actually sees a body — not at model-load time.
  // Starting the 4s capture window the instant tracking begins risks baking in whatever
  // the person happened to be doing while still settling into frame (adjusting their
  // seat, turning to read the question) as the "correct" target.
  const postureCaptureStartRef = useRef(null);

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

      // Throttled toast — posture gets a much longer cooldown than face/tab/window
      // (see POSTURE_TOAST_COOLDOWN_MS above), tracked independently so a posture nudge
      // can't be blocked by a recent face toast or vice versa.
      const now = Date.now();
      const isPosture = POSTURE_VIOLATION_TYPES.has(type);
      const cooldownRef = isPosture ? lastPostureToastRef : lastToastRef;
      const cooldownMs = isPosture ? POSTURE_TOAST_COOLDOWN_MS : TOAST_COOLDOWN_MS;

      if (now - cooldownRef.current > cooldownMs) {
        cooldownRef.current = now;
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

  // ── Add an integrity incident ────────────────────────────────────
  // Kept fully separate from addViolation/attentionScore — no score impact, its own
  // sessionStorage key, its own (shorter) toast cooldown, and a distinct toast style so
  // it doesn't read as just another "you looked away" nudge.
  const addIntegrityIncident = useCallback(
    (type, message) => {
      const incident = { type, message, timestamp: Date.now() };
      integrityIncidentsRef.current = [...integrityIncidentsRef.current, incident];
      setIntegrityIncidents([...integrityIncidentsRef.current]);

      if (mockId) {
        try {
          sessionStorage.setItem(
            `integrity_${mockId}`,
            JSON.stringify({ incidents: integrityIncidentsRef.current })
          );
        } catch (_) {}
      }

      const now = Date.now();
      if (now - lastIntegrityToastRef.current > INTEGRITY_TOAST_COOLDOWN_MS) {
        lastIntegrityToastRef.current = now;
        toast.warning(message, {
          description: "This won't affect your score — flagged for your own practice integrity.",
          duration: 4000,
        });
        setIntegrityWarningActive(true);
        setTimeout(() => setIntegrityWarningActive(false), 2500);
      }
    },
    [mockId]
  );

  // ── Recalibrate posture target ────────────────────────────────────
  // Manual escape hatch alongside the auto-stability fix above — if the captured target
  // still looks off (different chair, camera got bumped, whatever), this lets the person
  // reset it from wherever they're sitting right now instead of living with a bad one
  // for the rest of the session.
  const recalibratePosture = useCallback(() => {
    postureBaselineRef.current = null;
    baselineSamplesRef.current = [];
    postureCaptureStartRef.current = null;
    tiltSinceRef.current = null;
    leanSinceRef.current = null;
    slouchSinceRef.current = null;
    setPostureTarget(null);
    setPostureOk(true);
  }, []);

  // ── Load MediaPipe FaceLandmarker + PoseLandmarker ────────────────
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function loadMediaPipe() {
      try {
        const { FaceLandmarker, PoseLandmarker, ObjectDetector, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "/mediapipe"
        );

        const [faceLandmarker, poseLandmarker, objectDetector] = await Promise.all([
          FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU",
            },
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrices: false,
            runningMode: "VIDEO",
            // 2, not 1 — a second detected face is exactly the "someone else is helping"
            // signal, reusing this model instead of needing a separate one for it.
            numFaces: 2,
          }),
          PoseLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              // "lite" variant — real-time budget alongside the face model on the same
              // 200ms tick.
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
          }),
          ObjectDetector.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/int8/1/efficientdet_lite0.tflite",
              delegate: "GPU",
            },
            scoreThreshold: PHONE_SCORE_THRESHOLD,
            runningMode: "VIDEO",
          }),
        ]);

        if (!cancelled) {
          faceLandmarkerRef.current = faceLandmarker;
          poseLandmarkerRef.current = poseLandmarker;
          objectDetectorRef.current = objectDetector;
          setIsTracking(true);
          // Write baseline so feedback page shows the cards even with 0 violations/incidents
          if (mockId) {
            try {
              const existingAttention = sessionStorage.getItem(`attention_${mockId}`);
              if (!existingAttention) {
                sessionStorage.setItem(
                  `attention_${mockId}`,
                  JSON.stringify({ score: 100, violations: [] })
                );
              }
              const existingIntegrity = sessionStorage.getItem(`integrity_${mockId}`);
              if (!existingIntegrity) {
                sessionStorage.setItem(`integrity_${mockId}`, JSON.stringify({ incidents: [] }));
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
      if (!video || video.readyState < 2) return;

      const now = Date.now();
      const nowMs = performance.now();

      // ── Face + head pose ─────────────────────────────────────────
      if (faceLandmarkerRef.current) {
        try {
          const results = faceLandmarkerRef.current.detectForVideo(video, nowMs);

          if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
            setFaceDetected(false);
            poseLostSinceRef.current = null;

            if (!faceLostSinceRef.current) {
              faceLostSinceRef.current = now;
            } else if (now - faceLostSinceRef.current > FACE_LOST_THRESHOLD_MS) {
              faceLostSinceRef.current = now;
              addViolation("face_lost", "Face not detected — are you still there?");
            }
          } else {
            setFaceDetected(true);
            faceLostSinceRef.current = null;

            // Extra person — a second detected face, sustained (filters out a single
            // bad frame, e.g. a reflection or a momentary misdetection).
            if (results.faceLandmarks.length > 1) {
              if (!extraPersonSinceRef.current) {
                extraPersonSinceRef.current = now;
              } else if (now - extraPersonSinceRef.current > INTEGRITY_THRESHOLD_MS) {
                extraPersonSinceRef.current = now;
                addIntegrityIncident("extra_person", "A second person may be visible in frame");
              }
            } else {
              extraPersonSinceRef.current = null;
            }

            const landmarks = results.faceLandmarks[0];
            // Landmark indices (MediaPipe 478-point model):
            //   33 = left eye outer corner, 263 = right eye outer corner, 4 = nose tip
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
                  addViolation("looking_away", "Keep your eyes on the screen");
                }
              } else {
                poseLostSinceRef.current = null;
              }
            }
          }
        } catch (_) {
          // Swallow individual frame errors silently
        }
      }

      // ── Posture (shoulders/hips) ──────────────────────────────────
      if (poseLandmarkerRef.current) {
        try {
          const poseResults = poseLandmarkerRef.current.detectForVideo(video, nowMs);
          const pose = poseResults.landmarks?.[0];

          if (pose) {
            setPoseLandmarks(pose);

            // BlazePose/MediaPipe Pose 33-point indices
            const nose = pose[0];
            const leftShoulder = pose[11];
            const rightShoulder = pose[12];
            const leftHip = pose[23];
            const rightHip = pose[24];

            const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
            let slouching = false;

            if (shoulderWidth > 0.02) {
              // Shoulder tilt — angle of the shoulder line vs horizontal
              const tiltDeg =
                (Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x) *
                  180) /
                Math.PI;
              const tilted = Math.abs(tiltDeg) > SHOULDER_TILT_THRESHOLD_DEG;

              if (tilted) {
                if (!tiltSinceRef.current) {
                  tiltSinceRef.current = now;
                } else if (now - tiltSinceRef.current > POSTURE_THRESHOLD_MS) {
                  tiltSinceRef.current = now;
                  addViolation("uneven_shoulders", "Keep your shoulders level and squared to the camera");
                }
              } else {
                tiltSinceRef.current = null;
              }

              // Lean — body centerline (shoulder+hip midpoint) offset from frame center
              const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
              const hipMidX =
                leftHip && rightHip ? (leftHip.x + rightHip.x) / 2 : shoulderMidX;
              const bodyCenterX = (shoulderMidX + hipMidX) / 2;
              const leanRatio = Math.abs(bodyCenterX - 0.5) / shoulderWidth;
              const leaning = leanRatio > LEAN_THRESHOLD_RATIO;

              if (leaning) {
                if (!leanSinceRef.current) {
                  leanSinceRef.current = now;
                } else if (now - leanSinceRef.current > POSTURE_THRESHOLD_MS) {
                  leanSinceRef.current = now;
                  addViolation("leaning", "Try to sit centered in frame, facing the camera");
                }
              } else {
                leanSinceRef.current = null;
              }

              // Slouch — nose-to-shoulder-midpoint distance shrinking vs a baseline
              // captured during the first few seconds of tracking (accounts for
              // different body types/camera distances instead of a fixed threshold).
              const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
              const noseToShoulderDist = Math.abs(shoulderMidY - nose.y);

              if (!postureBaselineRef.current) {
                // Restart the capture window if the person moved meaningfully since the
                // last sample (or on the very first sample) — this is what stops the
                // target from locking in mid-adjustment (e.g. still leaning in to check
                // the camera when tracking starts). Only once BASELINE_CAPTURE_MS passes
                // with no big jumps does the average get finalized.
                const last = baselineSamplesRef.current[baselineSamplesRef.current.length - 1];
                const drifted =
                  last &&
                  Math.abs(bodyCenterX - last.centerX) + Math.abs(shoulderMidY - last.shoulderY) >
                    BASELINE_STABILITY_THRESHOLD;

                if (drifted || !postureCaptureStartRef.current) {
                  baselineSamplesRef.current = [];
                  postureCaptureStartRef.current = now;
                }

                const elapsedSinceStart = now - postureCaptureStartRef.current;
                if (elapsedSinceStart < BASELINE_CAPTURE_MS) {
                  // centerX/shoulderY double as the "correct posture" target the overlay
                  // draws — captured here, not hardcoded, so it matches this person's
                  // actual camera setup instead of assuming dead-center framing.
                  baselineSamplesRef.current.push({ noseToShoulderDist, centerX: bodyCenterX, shoulderY: shoulderMidY });
                } else if (baselineSamplesRef.current.length > 0) {
                  const n = baselineSamplesRef.current.length;
                  const avg = (key) => baselineSamplesRef.current.reduce((a, s) => a + s[key], 0) / n;
                  const baseline = {
                    noseToShoulderDist: avg("noseToShoulderDist"),
                    centerX: avg("centerX"),
                    shoulderY: avg("shoulderY"),
                  };
                  postureBaselineRef.current = baseline;
                  setPostureTarget(baseline);
                }
              } else {
                const ratio = noseToShoulderDist / postureBaselineRef.current.noseToShoulderDist;
                slouching = ratio < SLOUCH_RATIO_THRESHOLD;

                if (slouching) {
                  if (!slouchSinceRef.current) {
                    slouchSinceRef.current = now;
                  } else if (now - slouchSinceRef.current > POSTURE_THRESHOLD_MS) {
                    slouchSinceRef.current = now;
                    addViolation("slouching", "Sit up straight — you're slouching toward the camera");
                  }
                } else {
                  slouchSinceRef.current = null;
                }
              }

              setPostureOk(!(tilted || leaning || slouching));
            }
          } else {
            setPoseLandmarks(null);
            setPostureOk(true);
            // Body left frame mid-capture — discard the partial window rather than
            // letting a stale start-time cause a premature finalize once they're back.
            if (!postureBaselineRef.current) {
              baselineSamplesRef.current = [];
              postureCaptureStartRef.current = null;
            }
          }
        } catch (_) {
          // Swallow individual frame errors silently
        }
      }

      // ── Phone detection ──────────────────────────────────────────
      // EfficientDet is meaningfully heavier than the face/pose models, and a phone
      // being held up isn't a split-second event — throttled to its own slower cadence
      // rather than running on every 200ms tick like the rest of this loop.
      if (objectDetectorRef.current && now - lastObjectDetectionRef.current > OBJECT_DETECTION_INTERVAL_MS) {
        lastObjectDetectionRef.current = now;
        try {
          const objectResults = objectDetectorRef.current.detectForVideo(video, nowMs);
          const phoneVisible = (objectResults.detections || []).some(
            (d) => d.categories[0]?.categoryName === "cell phone" && d.categories[0].score >= PHONE_SCORE_THRESHOLD
          );

          if (phoneVisible) {
            if (!phoneSinceRef.current) {
              phoneSinceRef.current = now;
            } else if (now - phoneSinceRef.current > INTEGRITY_THRESHOLD_MS) {
              phoneSinceRef.current = now;
              addIntegrityIncident("phone_detected", "A phone may be visible in frame");
            }
          } else {
            phoneSinceRef.current = null;
          }
        } catch (_) {
          // Swallow individual frame errors silently
        }
      }
    };

    intervalRef.current = setInterval(runDetection, DETECTION_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
    // videoRef intentionally omitted — it's a stable ref object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTracking, addViolation, addIntegrityIncident]);

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
      poseLandmarkerRef.current = null;
      objectDetectorRef.current = null;
      postureBaselineRef.current = null;
      baselineSamplesRef.current = [];
      postureCaptureStartRef.current = null;
      setPoseLandmarks(null);
      setPostureOk(true);
      setPostureTarget(null);
    }
  }, [enabled]);

  return {
    isTracking,
    faceDetected,
    attentionScore,
    violations,
    warningActive,
    poseLandmarks,
    postureOk,
    postureTarget,
    recalibratePosture,
    integrityIncidents,
    integrityWarningActive,
  };
}
