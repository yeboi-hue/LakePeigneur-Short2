import React from "react";
import * as THREE from "three";
import { ToonCharacter } from "./cast";
import { LIGHTS } from "./lights";
import { PALETTE } from "./shade";
import { boxGeometry, outlineMaterial } from "./build";
import { progress, shotIndex, lerp, smoother, SHOTS } from "./story";

const InkedBox: React.FC<{ position: [number, number, number]; size: [number, number, number]; color: string; rotation?: [number, number, number]; outline?: boolean }> = ({ position, size, color, rotation = [0, 0, 0], outline = true }) => {
  const geometry = React.useMemo(() => boxGeometry(...size), [size[0], size[1], size[2]]);
  const ink = React.useMemo(() => outlineMaterial(), []);
  return <group position={position} rotation={rotation}>
    {outline && <mesh geometry={geometry} scale={1.055}><primitive object={ink} attach="material" /></mesh>}
    <mesh geometry={geometry} castShadow receiveShadow><meshLambertMaterial color={color} flatShading side={THREE.DoubleSide} /></mesh>
  </group>;
};

const Beam: React.FC<{ a: [number, number, number]; b: [number, number, number]; width?: number; color?: string }> = ({ a, b, width = 0.22, color = "#66737a" }) => {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const dir = end.clone().sub(start);
  return <mesh position={mid.toArray()} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())} castShadow>
    <cylinderGeometry args={[width * 0.55, width, dir.length(), 6]} />
    <meshLambertMaterial color={color} flatShading />
  </mesh>;
};

const LakeSurface: React.FC<{ frame: number; starts: number[] }> = ({ frame, starts }) => {
  const swirl = progress(frame, starts, 5);
  const drain = progress(frame, starts, 8);
  const refill = progress(frame, starts, 9);
  const holeRaw = frame < starts[5] ? 0.18 : frame < starts[8] ? lerp(0.18, 3.5, smoother(swirl)) : frame < starts[9] ? lerp(3.5, 8.6, smoother(drain)) : lerp(8.6, 1.1, smoother(refill));
  const hole = Math.round(holeRaw * 4) / 4;
  const waterOpacity = frame < starts[8] ? 1 : frame < starts[9] ? lerp(1, 0.72, drain) : 1;
  const geometry = React.useMemo(() => new THREE.RingGeometry(Math.max(0.02, hole), 33, 128, 8), [hole]);
  return <group>
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
      <meshStandardMaterial color={PALETTE.water} roughness={0.28} metalness={0.08} transparent opacity={waterOpacity} side={THREE.DoubleSide} />
    </mesh>
    {frame > starts[5] && frame < starts[9] && <group position={[0, 0.12, 0]}>
      {[0, 1, 2, 3, 4].map((i) => <mesh key={i} rotation={[-Math.PI / 2, 0, frame * (0.018 + i * 0.002)]}>
        <torusGeometry args={[hole + 0.45 + i * 0.8, 0.12 + i * 0.018, 8, 96]} />
        <meshBasicMaterial color={i % 2 ? "#b5e4e9" : "#5bb6ce"} transparent opacity={0.52 - i * 0.065} />
      </mesh>)}
    </group>}
  </group>;
};

const DrillRig: React.FC<{ frame: number; starts: number[] }> = ({ frame, starts }) => {
  const tilt = progress(frame, starts, 3);
  const slide = progress(frame, starts, 5);
  const fall = progress(frame, starts, 8);
  const rotation = -0.04 - tilt * 0.48 - slide * 0.16 - fall * 0.22;
  const sink = slide * 1.1 + smoother(fall) * 4.7;
  return <group position={[-slide * 1.8, 0.5 - sink, 0]} rotation={[0, 0, rotation]}>
    <InkedBox position={[0, 0.35, 0]} size={[9.4, 0.8, 5.8]} color="#8c5037" />
    <InkedBox position={[0, 0.92, 0]} size={[6.7, 0.25, 4.3]} color="#b6a58c" />
    <InkedBox position={[0, 5.6, 0]} size={[0.75, 9.2, 0.75]} color="#69777e" />
    {[-2.1, 2.1].map((x) => [-1.4, 1.4].map((z) => <Beam key={`${x}-${z}`} a={[x, 1.15, z]} b={[x * 0.62, 10.3, z * 0.62]} width={0.25} />))}
    {[-1, 1].map((s) => <React.Fragment key={s}>
      <Beam a={[-2.1, 1.2, -1.4]} b={[2.1, 4.2, -1.4]} width={0.12} />
      <Beam a={[-2.1, 4.2, 1.4]} b={[2.1, 1.2, 1.4]} width={0.12} />
      <Beam a={[s * 2.1, 1.2, -1.4]} b={[s * 2.1, 10.2, 1.4]} width={0.16} />
    </React.Fragment>)}
    <InkedBox position={[0, 10.35, 0]} size={[2.1, 0.55, 2.1]} color="#d4b36e" />
    <mesh position={[0, -0.5, 0]}><cylinderGeometry args={[0.16, 0.16, 12, 12]} /><meshStandardMaterial color="#b8c2c6" metalness={0.65} roughness={0.3} /></mesh>
    <mesh position={[0, 0.98, 2.25]}><boxGeometry args={[1.2, 0.7, 0.2]} /><meshStandardMaterial color="#e0b34e" /></mesh>
  </group>;
};

const Barges: React.FC<{ frame: number; starts: number[] }> = ({ frame, starts }) => {
  const drift = progress(frame, starts, 5);
  const sink = progress(frame, starts, 8);
  const rise = progress(frame, starts, 9);
  return <group>
    {Array.from({ length: 11 }, (_, i) => {
      const angle = (i / 11) * Math.PI * 2;
      const radius = 12 + (i % 3) * 3;
      const x = Math.cos(angle) * radius * (1 - drift * 0.58);
      const z = Math.sin(angle) * radius * (1 - drift * 0.58);
      const sunkY = -(2.4 + (i % 4) * 0.55);
      const recovered = i < 9;
      const y = frame < starts[8] ? 0 : frame < starts[9] ? -sink * (2.4 + (i % 4) * 0.55) : recovered ? lerp(sunkY, 0.25, smoother(rise)) : sunkY;
      return <group key={i} position={[x, y, z]} rotation={[0, angle + Math.PI / 2, sink * 0.22]}>
        <InkedBox position={[0, 0.3, 0]} size={[5.2, 0.55, 2.2]} color={i % 2 ? "#7d4939" : "#9c6247"} />
        <InkedBox position={[0, 0.85, 0]} size={[2.8, 0.7, 1.5]} color="#b8a88b" />
      </group>;
    })}
    <group position={[8.5, frame < starts[8] ? 0 : frame < starts[9] ? -sink * 3.2 : -3.2, 4]} rotation={[0, -0.4, 0]}>
      <InkedBox position={[0, 0.28, 0]} size={[3.4, 0.55, 1.6]} color="#a94e3a" />
      <InkedBox position={[0.15, 0.85, -0.1]} size={[1.2, 0.85, 1.05]} color="#e1d2b1" />
      <mesh position={[0.15, 1.32, -0.1]}><boxGeometry args={[0.72, 0.12, 0.82]} /><meshBasicMaterial color="#354d5c" /></mesh>
    </group>
  </group>;
};

const Mine: React.FC<{ frame: number; starts: number[] }> = ({ frame, starts }) => {
  const alarm = progress(frame, starts, 6);
  const roof = <InkedBox position={[0, -20, 0]} size={[28, 1.6, 18]} color="#8b8f91" />;
  return <group>
    <InkedBox position={[0, -30, 0]} size={[30, 1.2, 20]} color="#646e75" />
    {roof}
    {[-10, -3.5, 3.5, 10].map((x) => [-6, 6].map((z) => <InkedBox key={`${x}-${z}`} position={[x, -25, z]} size={[1.9, 9, 1.9]} color="#d0c9b7" />))}
    <InkedBox position={[-14.5, -25, 0]} size={[1.2, 10, 20]} color="#777f83" />
    <InkedBox position={[14.5, -25, 0]} size={[1.2, 10, 20]} color="#777f83" />
    <mesh position={[0, -24.5, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[27, 17]} /><meshStandardMaterial color="#555f66" roughness={0.94} /></mesh>
    {Array.from({ length: 7 }, (_, i) => <ToonCharacter key={i} role="miner" face={alarm > 0.35 ? "worried" : "calm"} position={[-10 + i * 3.1 + alarm * (i - 3) * 1.35, -29.3, (i % 2) * 3 - 1.5 + alarm * (i % 2 ? 1.4 : -1.4)]} height={2.7} bob={Math.sin(frame * 0.14 + i) * 0.07} />)}
    <mesh position={[0, -24.7, -4.2]}>
      <cylinderGeometry args={[0.55, 1.15, 8.4, 20]} />
      <meshStandardMaterial color="#4aa8c8" roughness={0.22} transparent opacity={0.66} />
    </mesh>
    {Array.from({ length: 10 }, (_, i) => <mesh key={`drop-${i}`} position={[Math.sin(frame * 0.09 + i) * (0.8 + alarm), -22.5 - ((frame * 0.12 + i * 0.7) % 6), -4.2 + Math.cos(i * 3) * 0.8]}>
      <sphereGeometry args={[0.12 + (i % 3) * 0.035, 8, 8]} /><meshBasicMaterial color="#8bd7eb" transparent opacity={0.8} />
    </mesh>)}
    {Array.from({ length: 5 }, (_, i) => <mesh key={`lamp-${i}`} position={[-9 + i * 4.5, -21.2, -6.5]}>
      <sphereGeometry args={[0.24, 12, 10]} /><meshStandardMaterial color="#fff0c2" emissive="#ffbd63" emissiveIntensity={1.8} />
    </mesh>)}
  </group>;
};

const Canal: React.FC<{ frame: number; starts: number[] }> = ({ frame, starts }) => {
  const reverse = progress(frame, starts, 7);
  return <group position={[15, -0.15, -13]} rotation={[0, -0.6, 0]}>
    <InkedBox position={[0, -0.3, 0]} size={[28, 0.6, 7]} color="#8b9a6b" />
    <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[27, 5]} /><meshStandardMaterial color="#3b91b3" roughness={0.24} />
    </mesh>
    {Array.from({ length: 8 }, (_, i) => {
      const phase = i * 4 + frame * (reverse > 0.1 ? -0.11 : 0.08);
      const x = -11 + ((phase % 22) + 22) % 22;
      return <mesh key={i} position={[x, 0.16, Math.sin(i * 8) * 1.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.16, 1.2, 5]} /><meshBasicMaterial color="#c8edf0" />
      </mesh>;
    })}
  </group>;
};

export const World: React.FC<{ frame: number; starts: number[] }> = ({ frame, starts }) => {
  const index = shotIndex(frame, starts);
  const lightName = SHOTS[index].light;
  const light = LIGHTS[lightName];
  const swirl = progress(frame, starts, 5);
  const drain = progress(frame, starts, 8);
  const refill = progress(frame, starts, 9);
  const escape = progress(frame, starts, 4);
  const showMine = index === 2 || index === 6;
  const lakeHeight = index >= 9 ? lerp(-0.2, 0.08, smoother(refill)) : 0;
  return <>
    <color attach="background" args={[light.sky]} />
    <fog attach="fog" args={[light.horizon, 38, 180]} />
    <ambientLight intensity={lightName === "storm" ? 0.62 : 0.85} color={light.fill} />
    <directionalLight position={[-28, 48, 35]} intensity={light.intensity} color={light.key} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-42} shadow-camera-right={42} shadow-camera-top={42} shadow-camera-bottom={-42} shadow-bias={-0.0003} />
    <hemisphereLight args={[light.sky, "#59616b", 0.42]} />
    {/* A low green island shelf surrounds the lake. */}
    <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[38, 96]} /><meshLambertMaterial color="#78935f" />
    </mesh>
    <mesh position={[0, -0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[33.2, 96]} /><meshLambertMaterial color="#b2a78b" />
    </mesh>
    <group position={[0, lakeHeight, 0]}><LakeSurface frame={frame} starts={starts} /></group>
    {/* shoreline trees and a tiny settlement */}
    {Array.from({ length: 24 }, (_, i) => {
      const a = i / 24 * Math.PI * 2;
      const x = Math.cos(a) * 35, z = Math.sin(a) * 35;
      return <group key={i} position={[x, 0, z]}>
        <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.22, 0.34, 2.2, 7]} /><meshLambertMaterial color="#6b4b37" /></mesh>
        <mesh position={[0, 3.1, 0]}><coneGeometry args={[1.5 + (i % 3) * 0.25, 4.2, 7]} /><meshLambertMaterial color={i % 2 ? "#416b50" : "#527b52"} flatShading /></mesh>
      </group>;
    })}
    {[-1, 1].map((s) => <InkedBox key={s} position={[s * 27, 1.1, -22]} size={[4.8, 2.2, 3.5]} color={s < 0 ? "#c7ad86" : "#d4c39e"} />)}
    <group visible={index <= 5 || index === 8}>
      <DrillRig frame={frame} starts={starts} />
    </group>
    <group visible={index !== 2 && index !== 6}>
      <Barges frame={frame} starts={starts} />
    </group>
    <group visible={index <= 4}>
      <ToonCharacter role="driller" face={index >= 3 ? "shocked" : "calm"} position={[-4.3 - escape * 4.5, 1.05, 3.2 + escape * 1.8]} height={3.2} bob={Math.sin(frame * 0.11) * 0.04} />
      <ToonCharacter role="captain" face={index >= 3 ? "worried" : "calm"} position={[4.2 + escape * 4.5, 1.05, 2.8 + escape * 1.8]} height={3.3} bob={Math.sin(frame * 0.12 + 1) * 0.05} />
    </group>
    {showMine && <Mine frame={frame} starts={starts} />}
    {index >= 5 && index <= 8 && <group position={[0, -0.6, 0]}>
      <mesh position={[0, -4.2, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[8.5, 13, 64, 1, true]} />
        <meshStandardMaterial color={PALETTE.deepWater} roughness={0.2} metalness={0.12} side={THREE.DoubleSide} transparent opacity={0.82} />
      </mesh>
      {[0, 1, 2, 3].map((i) => <mesh key={i} position={[0, -0.2 - i * 1.2, 0]} rotation={[-Math.PI / 2, 0, frame * (0.035 + i * 0.008)]}>
        <torusGeometry args={[2.1 + i * 1.55 + drain * 2.2, 0.12, 8, 80]} />
        <meshBasicMaterial color={i % 2 ? "#c7edf2" : "#4bb0ce"} transparent opacity={0.55 - i * 0.07} />
      </mesh>)}
    </group>}
    {index >= 7 && index <= 8 && <Canal frame={frame} starts={starts} />}
    {index === 9 && <group position={[0, -0.2, 0]}>
      <mesh position={[0, -3.8, 0]}><cylinderGeometry args={[8.6, 7.8, 7.4, 64, 1, true]} /><meshStandardMaterial color="#1b4c68" side={THREE.DoubleSide} transparent opacity={0.72} /></mesh>
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[7.8, 9.2, 96]} /><meshStandardMaterial color="#b2d8d8" transparent opacity={0.7} /></mesh>
    </group>}
    {/* Surface debris and drifting foam animate through the vortex beat. */}
    {index >= 5 && index <= 8 && Array.from({ length: 24 }, (_, i) => {
      const t = frame * 0.025 + i * Math.PI * 2 / 24;
      const r = Math.max(1.4, lerp(18, 8, smoother(swirl)) - drain * 5 + Math.sin(i * 5) * 1.4);
      return <mesh key={`foam-${i}`} position={[Math.cos(t) * r, 0.22 + Math.sin(t * 1.8) * 0.12, Math.sin(t) * r]}>
        <sphereGeometry args={[0.16 + (i % 3) * 0.04, 8, 8]} /><meshBasicMaterial color="#d9f1ed" transparent opacity={0.8} />
      </mesh>;
    })}
  </>;
};
