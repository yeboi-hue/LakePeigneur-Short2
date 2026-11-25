import * as THREE from "three";

export const INK_COLOR = "#17151a";
export const OUTLINE_SCALE = 1.055;
export const makeInkMaterial = () => new THREE.MeshBasicMaterial({ color: INK_COLOR, side: THREE.BackSide });
