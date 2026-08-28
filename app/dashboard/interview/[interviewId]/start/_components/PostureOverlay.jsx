"use client";
import { useEffect, useRef } from "react";

// MediaPipe/BlazePose 33-point model indices
const NOSE = 0, LEFT_EYE = 2, RIGHT_EYE = 5, LEFT_SHOULDER = 11, RIGHT_SHOULDER = 12, LEFT_HIP = 23, RIGHT_HIP = 24;

// The video is rendered with object-fit: cover, which crops whichever axis doesn't
// match the container's aspect ratio. Pose landmarks are normalized (0-1) against the
// full, uncropped camera frame, so drawing them directly would misalign with what's
// actually visible whenever the camera's native aspect ratio isn't an exact match for
// the container — this maps a landmark into the visible (cropped) window instead.
function toDisplayPoint(x, y, video, canvasWidth, canvasHeight) {
  const videoAspect = video.videoWidth / video.videoHeight;
  const containerAspect = canvasWidth / canvasHeight;

  let cropXStart = 0, cropXEnd = 1, cropYStart = 0, cropYEnd = 1;

  if (videoAspect > containerAspect) {
    const visible = containerAspect / videoAspect;
    cropXStart = (1 - visible) / 2;
    cropXEnd = 1 - cropXStart;
  } else if (videoAspect < containerAspect) {
    const visible = videoAspect / containerAspect;
    cropYStart = (1 - visible) / 2;
    cropYEnd = 1 - cropYStart;
  }

  return {
    x: ((x - cropXStart) / (cropXEnd - cropXStart)) * canvasWidth,
    y: ((y - cropYStart) / (cropYEnd - cropYStart)) * canvasHeight,
  };
}

/**
 * Draws the posture skeleton over the webcam feed: a fixed green "target" (captured
 * once from the baseline good-posture window — a stable reference, not something that
 * tracks the person around) alongside solid red "actual" lines showing the live,
 * current position. Comparing the two is what actually shows someone how to fix their
 * posture, rather than just flagging that something's off.
 *
 * Mirrored via CSS to match the mirrored video underneath — landmarks are drawn in
 * their natural (unmirrored) coordinate space and the whole canvas flips together with
 * the video, rather than flipping each coordinate by hand.
 */
export default function PostureOverlay({ videoRef, poseLandmarks, postureTarget }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !video.videoWidth) return;

    const width = video.clientWidth;
    const height = video.clientHeight;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!poseLandmarks) return;

    const pt = (i) => toDisplayPoint(poseLandmarks[i].x, poseLandmarks[i].y, video, canvas.width, canvas.height);
    const nose = pt(NOSE);
    const leftEye = pt(LEFT_EYE);
    const rightEye = pt(RIGHT_EYE);
    const leftShoulder = pt(LEFT_SHOULDER);
    const rightShoulder = pt(RIGHT_SHOULDER);
    const leftHip = pt(LEFT_HIP);
    const rightHip = pt(RIGHT_HIP);

    const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const shoulderMid = mid(leftShoulder, rightShoulder);
    const hipMid = mid(leftHip, rightHip);

    // ── Target (fixed, from baseline) ──────────────────────────────
    ctx.strokeStyle = "#22c55e";

    if (postureTarget) {
      const targetCenter = toDisplayPoint(postureTarget.centerX, 0, video, canvas.width, canvas.height);
      const targetLevel = toDisplayPoint(0, postureTarget.shoulderY, video, canvas.width, canvas.height);

      // Fixed vertical target line
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(targetCenter.x, 0);
      ctx.lineTo(targetCenter.x, canvas.height);
      ctx.stroke();

      // Dashed horizontal "level shoulders" target line
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(0, targetLevel.y);
      ctx.lineTo(canvas.width, targetLevel.y);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // Baseline not captured yet — fall back to a live vertical line through the nose
      // so there's still some feedback during the first few seconds of calibration.
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(nose.x, 0);
      ctx.lineTo(nose.x, canvas.height);
      ctx.stroke();
    }

    // ── Actual (live) ───────────────────────────────────────────────
    const line = (a, b) => {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    line(leftEye, rightEye);
    line(leftShoulder, rightShoulder);
    line(leftHip, rightHip);
    line(nose, shoulderMid);
    line(shoulderMid, hipMid);

    // Keypoint markers
    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#00000080";
    ctx.lineWidth = 1.5;
    [leftEye, rightEye, leftShoulder, rightShoulder, leftHip, rightHip].forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }, [poseLandmarks, postureTarget, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ transform: "scaleX(-1)" }}
    />
  );
}
