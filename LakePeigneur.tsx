import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World } from "./world";
import { cameraAt, DEFAULT_STARTS, dofAt, shotIndex } from "./story";
import { LensBlur } from "./lensblur";
import { COLOR_GRADE, VIGNETTE } from "./grade";

export type Props = { starts: number[]; audio: string | null };
export const DEFAULTS: Props = { starts: DEFAULT_STARTS, audio: null };

const CameraRig: React.FC<{ frame: number; starts: number[] }> = ({ frame, starts }) => {
  const { camera } = useThree();
  const key = cameraAt(frame, starts);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...key.position);
  cam.up.set(0, 1, 0);
  cam.lookAt(...key.lookAt);
  cam.rotateZ(key.roll ?? 0);
  cam.fov = key.fov;
  cam.updateProjectionMatrix();
  return null;
};


const PostFX: React.FC<{ frame: number; starts: number[] }> = ({ frame, starts }) => {
  const { camera } = useThree();
  const lens = useMemo(() => new LensBlur({ maxCoC: 24, nearScale: 1.2 }), []);
  const bloom = useMemo(() => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.42, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 }), []);
  const tone = useMemo(() => new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), []);
  const cam = camera as THREE.PerspectiveCamera;
  const key = cameraAt(frame, starts);
  const forward = new THREE.Vector3();
  const focusPoint = new THREE.Vector3(...key.lookAt);
  cam.getWorldDirection(forward);
  lens.focus = Math.max(0.3, focusPoint.sub(cam.position).dot(forward));
  lens.cInf = dofAt(shotIndex(frame, starts));
  useEffect(() => () => { lens.dispose(); bloom.dispose(); tone.dispose(); }, [lens, bloom, tone]);
  return (
    <EffectComposer multisampling={4}>
      <primitive object={lens.pre} dispose={null} />
      <primitive object={lens.main} dispose={null} />
      <primitive object={bloom} dispose={null} />
      <primitive object={tone} dispose={null} />
    </EffectComposer>
  );
};

export const LakePeigneurShort: React.FC<Props> = ({ starts, audio }) => {
  const frame = useCurrentFrame();
  const flashFrame = frame - (starts[1] ?? 150);
  const flashOpacity = flashFrame >= 0 && flashFrame < 5 ? [0.95, 0.62, 0.35, 0.16, 0.04][flashFrame] : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#40556f", overflow: "hidden" }}>
      {audio ? <Audio src={staticFile(audio)} /> : null}
      <AbsoluteFill style={{ filter: COLOR_GRADE }}>
        <ThreeCanvas
          width={1080}
          height={1920}
          shadows
          dpr={[1, 1.5]}
          gl={{ antialias: false, stencil: false, alpha: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
          camera={{ fov: 43, position: [30, 27, 43], near: 0.1, far: 500 }}
        >
          <CameraRig frame={frame} starts={starts} />
          <World frame={frame} starts={starts} />
          <PostFX frame={frame} starts={starts} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{ pointerEvents: "none", background: VIGNETTE }} />
      {flashOpacity > 0 ? <AbsoluteFill style={{ backgroundColor: "#fff", opacity: flashOpacity, pointerEvents: "none" }} /> : null}
    </AbsoluteFill>
  );
};
