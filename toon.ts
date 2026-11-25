import * as THREE from "three";

const INK = "#241726";
const cache = new Map<string, THREE.CanvasTexture>();
export type Face = "calm" | "worried" | "shocked" | "relieved";

/** Original hand-drawn 2D cast card, lit as a real surface inside the 3D scene. */
export function toonTexture(role: "driller" | "miner" | "captain", face: Face = "calm", shirt?: string) {
  const key = `${role}-${face}-${shirt ?? ""}`;
  const found = cache.get(key);
  if (found) return found;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const g = canvas.getContext("2d");
  if (!g) throw new Error("Canvas 2D context is unavailable");

  const line = (width = 13) => {
    g.lineWidth = width;
    g.strokeStyle = INK;
    g.lineCap = "round";
    g.lineJoin = "round";
  };
  const ellipse = (x: number, y: number, rx: number, ry: number, fill: string) => {
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    g.fillStyle = fill;
    g.fill();
    g.stroke();
  };

  g.clearRect(0, 0, 512, 768);
  // Long, thin limbs and small ink-dot hands keep adult characters near 3.5 head-heights tall.
  line(13);
  g.beginPath(); g.moveTo(218, 520); g.lineTo(195, 721); g.stroke();
  g.beginPath(); g.moveTo(294, 520); g.lineTo(319, 721); g.stroke();
  ellipse(158, 741, 37, 13, "#463b3c");
  ellipse(356, 741, 37, 13, "#463b3c");

  // Tapered bean torso with a subtle collar seam.
  g.beginPath();
  g.moveTo(194, 300);
  g.quadraticCurveTo(256, 278, 318, 300);
  g.lineTo(340, 536);
  g.quadraticCurveTo(256, 562, 172, 536);
  g.closePath();
  g.fillStyle = shirt ?? (role === "miner" ? "#e0a34c" : role === "captain" ? "#416f87" : "#bd5947");
  g.fill(); line(14); g.stroke();

  // Arms are single tapered strokes rather than thick cartoon tubes.
  line(13);
  g.beginPath(); g.moveTo(190, 327); g.lineTo(135, 451); g.lineTo(146, 510); g.stroke();
  g.beginPath(); g.moveTo(322, 327); g.lineTo(378, 451); g.lineTo(366, 510); g.stroke();
  ellipse(146, 515, 12, 12, "#e8b58f");
  ellipse(366, 515, 12, 12, "#e8b58f");

  // Neck and a slightly wider-than-tall, asymmetrical bean head with a narrowed chin.
  g.fillStyle = "#e8b58f";
  g.fillRect(226, 254, 60, 58);
  g.beginPath();
  g.moveTo(253, 80);
  g.quadraticCurveTo(347, 80, 356, 169);
  g.quadraticCurveTo(367, 244, 284, 267);
  g.quadraticCurveTo(256, 277, 228, 267);
  g.quadraticCurveTo(145, 244, 154, 169);
  g.quadraticCurveTo(163, 80, 253, 80);
  g.closePath();
  g.fillStyle = "#edc19f";
  g.fill();
  line(13); g.stroke();
  // A heavier lower contour adds the hand-inked weight from the reference construction.
  line(21);
  g.beginPath(); g.moveTo(155, 202); g.quadraticCurveTo(256, 300, 366, 202); g.stroke();

  // Hardhat or swept hair; no blush and no eye highlights.
  if (role === "miner") {
    g.beginPath(); g.ellipse(256, 94, 110, 40, Math.PI, 0, Math.PI * 2);
    g.fillStyle = "#f0bd4e"; g.fill(); line(13); g.stroke();
    g.fillRect(148, 94, 216, 18); g.strokeRect(148, 94, 216, 18);
  } else {
    g.beginPath();
    g.moveTo(157, 156);
    g.quadraticCurveTo(145, 55, 252, 57);
    g.quadraticCurveTo(354, 55, 359, 151);
    g.quadraticCurveTo(302, 111, 252, 127);
    g.quadraticCurveTo(200, 116, 157, 156);
    g.closePath();
    g.fillStyle = role === "captain" ? "#302b2b" : "#43302b";
    g.fill(); line(13); g.stroke();
  }

  // Face library: small, readable expressions designed for quick story beats.
  const eyeY = face === "shocked" ? 181 : 184;
  ellipse(229, eyeY, 8, face === "shocked" ? 13 : 9, INK);
  ellipse(284, eyeY, 8, face === "shocked" ? 13 : 9, INK);
  line(9);
  if (face === "worried" || face === "shocked") {
    g.beginPath(); g.moveTo(214, 158); g.lineTo(237, 151); g.moveTo(276, 151); g.lineTo(299, 158); g.stroke();
  }
  g.beginPath();
  if (face === "relieved") g.arc(256, 220, 22, 0.15, Math.PI - 0.15);
  else if (face === "shocked") g.ellipse(256, 219, 11, 17, 0, 0, Math.PI * 2);
  else if (face === "worried") { g.moveTo(236, 225); g.quadraticCurveTo(256, 209, 276, 225); }
  else { g.moveTo(236, 216); g.quadraticCurveTo(256, 229, 276, 216); }
  g.stroke();

  g.beginPath(); g.moveTo(226, 306); g.lineTo(256, 333); g.lineTo(286, 306); g.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  cache.set(key, texture);
  return texture;
}
