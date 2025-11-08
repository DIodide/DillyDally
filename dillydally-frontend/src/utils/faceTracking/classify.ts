/**
 * Heuristic, explainable head-orientation classifier.
 * - yaw  : left/right (nose horizontal offset from eye midpoint, normalized)
 * - pitch: up/down (nose vertical offset from eye midpoint, normalized)
 * - roll : head tilt (slope of eye line)
 *
 * We keep a short smoothing window and a baseline (auto-calibrates on start).
 */

const SMOOTH_N = 10;          // moving median length
const BASELINE_WARMUP = 30;   // frames to auto-calibrate initially
const DEAD_ZONE_YAW = 0.06;   // neutral band after normalization
const DEAD_ZONE_PITCH = 0.05;

// If you want it stricter/looser, tweak thresholds:
const YAW_AWAY_THRESH = 0.14;   // beyond this => left/right away
const PITCH_UP_THRESH = 0.10;   // looking up
const PITCH_DOWN_THRESH = 0.10; // looking down

let bufferYaw: number[] = [];
let bufferPitch: number[] = [];
let bufferRoll: number[] = [];

let baseline = { yaw: 0, pitch: 0, roll: 0 };
let framesSeen = 0;

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function norm(v: number, scale: number): number {
  if (!scale || scale === 0) return 0;
  return v / scale;
}

// Pulls specific indices for facial landmarks.
// These indices follow MediaPipe FaceMesh (468 points).
const IDX = {
  // Eye corners (outer/inner)
  leftEyeOuter: 33,
  leftEyeInner: 133,
  rightEyeInner: 362,
  rightEyeOuter: 263,

  // Nose tip (approx) and eye-brow/temple spots
  noseTip: 1,

  // Mouth corners for face height proxy
  mouthLeft: 61,
  mouthRight: 291,
};

interface Point {
  x: number;
  y: number;
  z?: number;
}

function getPoint(kps: any[], idx: number): Point | null {
  const p = kps[idx];
  return p ? { x: p.x, y: p.y, z: p.z ?? 0 } : null;
}

function computeOrientation(face: any, canvas: HTMLCanvasElement) {
  if (!face || !face.keypoints || face.keypoints.length < 400) {
    return { yaw: 0, pitch: 0, roll: 0, ok: false };
  }
  const kps = face.keypoints;

  const LEO = getPoint(kps, IDX.leftEyeOuter);
  const LEI = getPoint(kps, IDX.leftEyeInner);
  const REI = getPoint(kps, IDX.rightEyeInner);
  const REO = getPoint(kps, IDX.rightEyeOuter);
  const NT  = getPoint(kps, IDX.noseTip);
  const ML  = getPoint(kps, IDX.mouthLeft);
  const MR  = getPoint(kps, IDX.mouthRight);

  if (!LEO || !LEI || !REI || !REO || !NT || !ML || !MR) {
    return { yaw: 0, pitch: 0, roll: 0, ok: false };
  }

  // Midpoints
  const eyeMid = {
    x: (LEI.x + REI.x) / 2,
    y: (LEI.y + REI.y) / 2,
  };

  // Proxy scales for normalization
  // Face width: outer eye corners distance (stable even with small moves)
  const faceWidth = Math.hypot(REO.x - LEO.x, REO.y - LEO.y);

  // Face height proxy: mouth width as a fallback scale to normalize pitch as well
  const mouthWidth = Math.hypot(MR.x - ML.x, MR.y - ML.y);
  const faceScale = Math.max(faceWidth, mouthWidth);

  // Raw offsets
  const dx = NT.x - eyeMid.x; // right positive
  const dy = NT.y - eyeMid.y; // down positive (because canvas y grows downward)

  // Normalized
  let yaw = norm(dx, faceWidth);   // left/right
  let pitch = norm(dy, faceScale); // up/down
  // Eye line slope (roll)
  const eyeSlope = (REO.y - LEO.y) / (REO.x - LEO.x);
  let roll = clamp(eyeSlope, -1, 1); // simple bounded value

  // Smooth
  bufferYaw.push(yaw);
  bufferPitch.push(pitch);
  bufferRoll.push(roll);
  if (bufferYaw.length > SMOOTH_N) bufferYaw.shift();
  if (bufferPitch.length > SMOOTH_N) bufferPitch.shift();
  if (bufferRoll.length > SMOOTH_N) bufferRoll.shift();

  yaw = median(bufferYaw);
  pitch = median(bufferPitch);
  roll = median(bufferRoll);

  // Auto-baseline during warmup or when user clicks "Recalibrate"
  framesSeen++;
  if (framesSeen <= BASELINE_WARMUP) {
    baseline.yaw = 0.8 * baseline.yaw + 0.2 * yaw;
    baseline.pitch = 0.8 * baseline.pitch + 0.2 * pitch;
    baseline.roll = 0.8 * baseline.roll + 0.2 * roll;
  }

  // Zero-center relative to baseline
  yaw -= baseline.yaw;
  pitch -= baseline.pitch;
  roll -= baseline.roll;

  return { yaw, pitch, roll, ok: true };
}

// Listen for a recalibration request from UI
if (typeof window !== "undefined") {
  window.addEventListener("recalibrate-attention", () => {
    baseline = { yaw: 0, pitch: 0, roll: 0 };
    framesSeen = 0;
    bufferYaw = [];
    bufferPitch = [];
    bufferRoll = [];
  });
}

export interface AttentionState {
  state: string;
  confidence: number;
  yaw: number;
  pitch: number;
  roll: number;
}

export function getAttentionState(face: any, canvas: HTMLCanvasElement): AttentionState {
  const { yaw, pitch, roll, ok } = computeOrientation(face, canvas);

  if (!ok) {
    return { state: "no_face", confidence: 0, yaw: 0, pitch: 0, roll: 0 };
  }

  // Dead-zones around neutral so tiny motions don't flip states
  const ay = Math.abs(yaw);
  const ap = Math.abs(pitch);

  let state = "looking_at_screen";
  let confidence = 0.7;

  // Horizontal first (feels most "away" when yaw is large)
  if (ay > YAW_AWAY_THRESH) {
    state = yaw > 0 ? "away_right" : "away_left";
    confidence = clamp((ay - YAW_AWAY_THRESH) * 3 + 0.7, 0, 1);
  } else if (ap > PITCH_UP_THRESH && pitch < -DEAD_ZONE_PITCH) {
    state = "away_up";
    confidence = clamp((ap - PITCH_UP_THRESH) * 3 + 0.7, 0, 1);
  } else if (ap > PITCH_DOWN_THRESH && pitch > DEAD_ZONE_PITCH) {
    state = "away_down";
    confidence = clamp((ap - PITCH_DOWN_THRESH) * 3 + 0.7, 0, 1);
  } else if (ay < DEAD_ZONE_YAW && ap < DEAD_ZONE_PITCH) {
    state = "looking_at_screen";
    confidence = 0.9;
  }

  return {
    state,
    confidence,
    yaw,
    pitch,
    roll,
  };
}

