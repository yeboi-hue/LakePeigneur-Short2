import * as THREE from "three";
import { makeInkMaterial } from "./ink";

/** Reusable near-black outline material used by the story's low-poly props. */
export const outlineMaterial = makeInkMaterial;

/** A tiny utility for deterministic, hand-built scene geometry. */
export const boxGeometry = (width: number, height: number, depth: number) => new THREE.BoxGeometry(width, height, depth, 1, 1, 1);
