import { useMemo } from 'react';
import * as THREE from 'three';
import { Html, Line } from '@react-three/drei';
import { Rim } from '@/components/three/CylinderPair';
import Viewer3D from '@/components/three/Viewer3D';
import { EPISTEMIC_UI } from '@/data/canvas/copy';
import type { CylinderAnnotation, CylinderParams, VisualSpec } from '@/lib/reasoning/types';

const CYL_COLOR: Record<string, string> = { reference: '#818cf8', comparison: '#22d3ee', single: '#818cf8' };
const GAP = 1;

interface Props {
  spec: VisualSpec;
  selected: string[];
  onSelectElement: (elementId: string) => void;
}

/**
 * Renderer `cylinder_3d` (generalises CylinderPair): meshes come only from the
 * spec's cylinders (problem data or experiment parameters) on one uniform scale;
 * learner claims are drawn as annotations in their own style — an incorrect
 * radius is drawn at the learner's length, even past the rim.
 */
export default function CylinderScene({ spec, selected, onSelectElement }: Props) {
  const p = spec.params as CylinderParams;
  const s = spec.scale?.cmPerSceneUnit ?? 1;
  const layout = useMemo(() => {
    const cyl = [...p.cylinders].sort((a, b) => a.index - b.index);
    if (cyl.length === 1) return [{ ...cyl[0], x: 0 }];
    const r1 = cyl[0].r / s;
    return cyl.map((c, i) => ({ ...c, x: i === 0 ? -(r1 + GAP / 2) : GAP / 2 + c.r / s }));
  }, [p.cylinders, s]);
  const maxH = Math.max(...p.cylinders.map((c) => c.h / s));
  const extent = Math.max(...layout.map((c) => Math.abs(c.x) + c.r / s), maxH);
  const camera: [number, number, number] = [extent * 0.3, maxH * 0.9 + extent * 0.7, extent * 2.6 + 8];
  const target: [number, number, number] = [0, maxH / 2, 0];
  const selectedEls = new Set(spec.elements.filter((e) => e.sourceNodeIds.some((id) => selected.includes(id))).map((e) => e.elementId));
  const unit = p.unit ?? '';
  const note = `Kéo để xoay · cuộn để phóng to · 1 ô lưới = ${String(Math.round(s * 100) / 100).replace('.', ',')} ${unit}${p.mode === 'experiment' ? ' · chế độ thử nghiệm' : ''}`;

  return (
    <Viewer3D
      className="relative h-[380px] overflow-hidden rounded-xl border border-white/10 bg-[#0a0a1a] sm:h-[520px]"
      key={`${s}-${p.cylinders.length}`}
      description={spec.fallback.content}
      testId="canvas-3d"
      camera={camera}
      target={target}
      minDistance={4}
      maxDistance={80}
      note={note}
      fallback={<p role="alert" className="p-4 text-sm text-amber-200">Không hiển thị được mô hình 3D (WebGL). Mô tả: {spec.fallback.content}</p>}
    >
      <gridHelper args={[Math.ceil(extent * 2 + 6), Math.ceil(extent * 2 + 6), '#334155', '#1e293b']} />
      {layout.map((c) => {
        const anns = p.annotations.filter((a) => a.cylinder === c.index);
        return (
          <group key={c.index} position={[c.x, 0, 0]}>
            <mesh position={[0, c.h / s / 2, 0]}>
              <cylinderGeometry args={[c.r / s, c.r / s, c.h / s, 64, 1]} />
              <meshStandardMaterial color={CYL_COLOR[c.role]} transparent opacity={0.25} roughness={0.5} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <Rim r={c.r / s} y={0} color={CYL_COLOR[c.role]} />
            <Rim r={c.r / s} y={c.h / s} color={CYL_COLOR[c.role]} />
            <Html position={[0, c.h / s + 0.5 + anns.length * 0.5, 0]} center zIndexRange={[20, 0]}>
              <span className="whitespace-nowrap rounded bg-slate-950/80 px-1.5 py-0.5 text-xs font-semibold text-white">{c.label}</span>
            </Html>
            {anns.map((a, i) => (
              <Annotation key={a.elementId} a={a} i={i} r={c.r / s} h={c.h / s} scale={s} selected={selectedEls.has(a.elementId)} onSelect={onSelectElement} />
            ))}
          </group>
        );
      })}
    </Viewer3D>
  );
}

function Annotation({ a, i, r, h, scale, selected, onSelect }: { a: CylinderAnnotation; i: number; r: number; h: number; scale: number; selected: boolean; onSelect: (id: string) => void }) {
  const ui = EPISTEMIC_UI[a.epistemic];
  const len = a.value / scale;
  const angle = (i * Math.PI) / 5;
  const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
  let points: [number, number, number][] | null = null;
  let labelPos: [number, number, number];
  const y = h + 0.03 + i * 0.02;
  if (a.kind === 'radius') {
    points = [[0, y, 0], [dir.x * len, y, dir.z * len]];
    labelPos = [dir.x * len * 0.6, y + 0.35 + (i % 3) * 0.4, dir.z * len * 0.6];
  } else if (a.kind === 'diameter') {
    points = [[-dir.x * len / 2, y, -dir.z * len / 2], [dir.x * len / 2, y, dir.z * len / 2]];
    labelPos = [0, y + 0.35 + (i % 3) * 0.4, 0];
  } else if (a.kind === 'height') {
    const side = r + 0.15 + (i % 2) * 0.25;
    points = [[side, 0, 0.02], [side, len, 0.02]];
    labelPos = [side + 0.9, len / 2 + (i % 3) * 0.4, 0];
  } else {
    labelPos = [0, a.kind === 'base_area' ? -0.35 - (i % 3) * 0.45 : h / 2 + (i % 3) * 0.45, r + 0.2];
  }
  const color = selected ? '#ffffff' : ui.color;
  return (
    <group>
      {points && (
        <Line points={points} color={color} lineWidth={selected ? 5 : 3} dashed={!!ui.dash} dashSize={0.25} gapSize={0.15} />
      )}
      <Html position={labelPos} center zIndexRange={[30, 0]}>
        <button
          type="button"
          onClick={() => onSelect(a.elementId)}
          data-element-id={a.elementId}
          data-epistemic={a.epistemic}
          className={`whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] font-medium ${selected ? 'ring-2 ring-white' : ''} ${ui.dash ? 'border-dashed' : ''}`}
          style={{ color: ui.color, borderColor: ui.color, background: 'rgba(2,6,23,0.85)' }}
          aria-label={`${a.text} — ${ui.word}`}
        >
          {ui.icon} {a.text}
        </button>
      </Html>
    </group>
  );
}
