import React from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { toonTexture, type Face } from "./toon";

export type CharacterRole = "driller" | "miner" | "captain";

export const ToonCharacter: React.FC<{
  role: CharacterRole;
  face?: Face;
  position: [number, number, number];
  height?: number;
  rotationY?: number;
  shirt?: string;
  bob?: number;
}> = ({ role, face = "calm", position, height = 3.2, rotationY = 0, shirt, bob = 0 }) => {
  const { camera } = useThree();
  const texture = React.useMemo(() => toonTexture(role, face, shirt), [role, face, shirt]);
  const material = React.useMemo(() => new THREE.MeshLambertMaterial({ map: texture, transparent: true, alphaTest: 0.08, side: THREE.DoubleSide }), [texture]);
  return (
    <group position={[position[0], position[1] + bob, position[2]]} rotation={[0, Math.atan2(camera.position.x - position[0], camera.position.z - position[2]) + rotationY, 0]}>
      <mesh position={[0, height * 0.5, 0]} castShadow>
        <planeGeometry args={[height * 0.67, height]} />
        <primitive object={material} attach="material" />
      </mesh>
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.42, 0.24, 1]}>
        <circleGeometry args={[1, 24]} />
        <meshBasicMaterial color="#17151a" transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
};
