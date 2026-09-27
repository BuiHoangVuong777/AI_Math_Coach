import { useMemo } from 'react';
import * as THREE from 'three';
import { Html, Line } from '@react-three/drei';
import { MAIN_PROBLEM, formatNumberVi } from '@/lib/cylinder/math';

/**
 * Two right circular cylinders on one shared scale: 1 scene unit = 1 cm.
 * Neither model is ever rescaled to fit the frame (S2-AC-02, §11.5).
 */

export const REFERENCE_COLOR = '#818cf8';
export const COMPARISON_COLOR = '#22d3ee';
const RADIUS_COLOR = '#f97316';
const HEIGHT_COLOR = '#facc15';

/** Gap in cm between the two cylinders' facing edges. */
const GAP = 1;
const REFERENCE_X = -(MAIN_PROBLEM.r1 + GAP / 2);

export function comparisonX(r: number): number {
  return GAP / 2 + r;
}

function Label({ position, children, tone = 'text-white' }: {
  position: [number, number, number];
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <span className={`whitespace-nowrap rounded bg-slate-950/80 px-1.5 py-0.5 text-xs font-medium ${tone}`}>
        {children}
      </span>
    </Html>
  );
}

export function Rim({ r, y, color }: { r: number; y: number; color: string }) {
  const points = useMemo(
    () =>
      Array.from({ length: 65 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      }),
    [r, y],
  );
  return <Line points={points} color={color} lineWidth={1.5} />;
}

function CylinderModel({ x, r, h, color, title, heightSide }: {
  x: number;
  r: number;
  h: number;
  color: string;
  title: string;
  /** Draw the height marker on the outer side so labels never sit between the two models. */
  heightSide: -1 | 1;
}) {
  const rText = formatNumberVi(r);
  const hx = heightSide * r;
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[r, r, h, 64, 1]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.28}
          roughness={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <Rim r={r} y={0} color={color} />
      <Rim r={r} y={h} color={color} />

      {/* Radius: from the centre of the top face to its rim, never the diameter. */}
      <Line points={[[0, h + 0.02, 0], [r, h + 0.02, 0]]} color={RADIUS_COLOR} lineWidth={3} />
      <mesh position={[0, h + 0.02, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color={RADIUS_COLOR} />
      </mesh>
      <Label position={[r / 2, h + 0.55, 0]} tone="text-orange-300">r = {rText} cm</Label>

      {/* Height: perpendicular to the base, drawn on the cylinder's outer edge. */}
      <Line points={[[hx, 0, 0.02], [hx, h, 0.02]]} color={HEIGHT_COLOR} lineWidth={3} />
      <Label position={[hx + heightSide * 0.9, h / 2, 0]} tone="text-yellow-300">h = {formatNumberVi(h)} cm</Label>

      <Label position={[0, h + 1.5, 0]}>{title}</Label>
    </group>
  );
}

export default function CylinderPair({ comparisonRadius }: { comparisonRadius: number }) {
  const { r1, h } = MAIN_PROBLEM;
  return (
    <group>
      <gridHelper args={[24, 24, '#334155', '#1e293b']} position={[1, 0, 0]} />
      <CylinderModel x={REFERENCE_X} r={r1} h={h} color={REFERENCE_COLOR} title="Tham chiếu (cố định)" heightSide={-1} />
      <CylinderModel x={comparisonX(comparisonRadius)} r={comparisonRadius} h={h} color={COMPARISON_COLOR} title="So sánh" heightSide={1} />
    </group>
  );
}
