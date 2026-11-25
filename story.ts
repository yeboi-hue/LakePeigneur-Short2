export const FPS = 30;
export const DEFAULT_STARTS = [0, 150, 315, 480, 645, 810, 975, 1140, 1305, 1470, 1800];
export const TOTAL = 1800;

export type Vec3 = [number, number, number];
export type CameraKey = { position: Vec3; lookAt: Vec3; fov: number; roll?: number };
export type Shot = { id: number; label: string; camera: CameraKey; light: "day" | "storm" | "golden" };

export const SHOTS: Shot[] = [
  { id: 0, label: "A quiet Louisiana lake", camera: { position: [30, 27, 43], lookAt: [0, 0, 0], fov: 43 }, light: "day" },
  { id: 1, label: "The drilling barge", camera: { position: [13, 9, 18], lookAt: [0, 4, 0], fov: 39 }, light: "day" },
  { id: 2, label: "The hidden salt mine", camera: { position: [17, -22, 22], lookAt: [0, -26, 0], fov: 43 }, light: "storm" },
  { id: 3, label: "The rig begins to tilt", camera: { position: [10, 8, 15], lookAt: [0, 5, 0], fov: 38, roll: -0.035 }, light: "storm" },
  { id: 4, label: "The crew escapes", camera: { position: [11, 9, 16], lookAt: [0, 4, 0], fov: 39, roll: -0.02 }, light: "storm" },
  { id: 5, label: "The whirlpool opens", camera: { position: [22, 17, 24], lookAt: [0, 0, 0], fov: 44, roll: 0.035 }, light: "storm" },
  { id: 6, label: "The mine floods", camera: { position: [16, -22, 22], lookAt: [0, -26, 0], fov: 43 }, light: "storm" },
  { id: 7, label: "The canal flows backward", camera: { position: [27, 12, 17], lookAt: [15, 0, -13], fov: 43 }, light: "golden" },
  { id: 8, label: "The lake drains away", camera: { position: [24, 22, 30], lookAt: [0, -2, 0], fov: 46 }, light: "storm" },
  { id: 9, label: "A very different lake", camera: { position: [34, 31, 42], lookAt: [0, -2, 0], fov: 43 }, light: "golden" },
];

export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export const smoother = (n: number) => { const x = clamp01(n); return x * x * x * (x * (x * 6 - 15) + 10); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export function shotIndex(frame: number, starts: number[]) {
  let i = 0;
  while (i < starts.length - 2 && frame >= starts[i + 1]) i++;
  return Math.min(i, SHOTS.length - 1);
}

export function cameraAt(frame: number, starts: number[]): CameraKey {
  const i = shotIndex(frame, starts);
  const a = starts[i] ?? 0;
  const b = starts[i + 1] ?? TOTAL;
  const u = smoother((frame - a) / Math.max(1, b - a));
  const current = SHOTS[i].camera;
  const next = SHOTS[Math.min(i + 1, SHOTS.length - 1)].camera;
  const drift = Math.min(1, Math.max(0, (frame - a) / Math.max(1, b - a)));
  const p = lerp3(current.position, next.position, u);
  const look = lerp3(current.lookAt, next.lookAt, u);
  const creep = 1 - 0.012 * drift;
  const position: Vec3 = [p[0] * creep, p[1] * creep, p[2] * creep];
  return { position, lookAt: look, fov: lerp(current.fov, next.fov, u), roll: lerp(current.roll ?? 0, next.roll ?? 0, u) };
}

export function progress(frame: number, starts: number[], shot: number) {
  const a = starts[shot] ?? 0;
  const b = starts[shot + 1] ?? TOTAL;
  return clamp01((frame - a) / Math.max(1, b - a));
}

/** Blur-disc radius in 1080p pixels; establishing views stay sharp, intimate beats get gentle lens blur. */
export function dofAt(shot: number) {
  return [1, 2, 4, 6].includes(shot) ? (shot === 2 || shot === 6 ? 12 : 10) : 0;
}
