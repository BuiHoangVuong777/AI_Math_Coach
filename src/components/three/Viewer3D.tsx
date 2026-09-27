import { Component, ReactNode, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, LocateFixed } from 'lucide-react';

const UP = new THREE.Vector3(0, 1, 0);
const ROTATE_STEP = Math.PI / 10;

class ViewerErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[Viewer3D] 3D rendering failed:', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export interface Viewer3DProps {
  children: ReactNode;
  /** Text description for screen readers (role="img"). */
  description: string;
  testId: string;
  camera: [number, number, number];
  target: [number, number, number];
  minDistance?: number;
  maxDistance?: number;
  note: string;
  /** Shown when WebGL is unavailable (spec §10.7 fallback). */
  fallback?: ReactNode;
  className?: string;
}

/**
 * Shared 3D shell (extracted from the /coach CylinderViewer): Canvas, OrbitControls,
 * keyboard camera buttons and a WebGL error boundary. Camera moves never change
 * the model dimensions.
 */
export default function Viewer3D({
  children, description, testId, camera, target, minDistance = 8, maxDistance = 40, note, fallback, className,
}: Viewer3DProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const initialCamera = useRef(new THREE.Vector3(...camera));
  const initialTarget = useRef(new THREE.Vector3(...target));

  useEffect(() => {
    initialCamera.current.set(...camera);
    initialTarget.current.set(...target);
  }, [camera, target]);

  const withControls = (fn: (controls: OrbitControlsImpl, offset: THREE.Vector3) => void) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cam = controls.object;
    const offset = cam.position.clone().sub(controls.target);
    fn(controls, offset);
    cam.position.copy(controls.target).add(offset);
    controls.update();
  };
  const rotate = (angle: number) => withControls((_, offset) => offset.applyAxisAngle(UP, angle));
  const zoom = (factor: number) =>
    withControls((controls, offset) =>
      offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance)),
    );
  const resetView = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.target.copy(initialTarget.current);
    controls.object.position.copy(initialCamera.current);
    controls.update();
  };

  const buttons = [
    { label: 'Xoay sang trái', icon: RotateCcw, onClick: () => rotate(-ROTATE_STEP) },
    { label: 'Xoay sang phải', icon: RotateCw, onClick: () => rotate(ROTATE_STEP) },
    { label: 'Phóng to', icon: ZoomIn, onClick: () => zoom(0.8) },
    { label: 'Thu nhỏ', icon: ZoomOut, onClick: () => zoom(1.25) },
    { label: 'Đặt lại góc nhìn', icon: LocateFixed, onClick: resetView },
  ];

  const defaultFallback = (
    <div role="alert" className="flex h-full items-center justify-center p-6 text-center text-sm text-amber-200">
      Không hiển thị được mô hình 3D trên thiết bị này (có thể trình duyệt chưa bật WebGL). Em vẫn có thể tiếp tục
      bài học bằng các nhãn và bảng số bên dưới.
    </div>
  );

  return (
    <div className={className ?? 'relative h-[340px] overflow-hidden rounded-xl border border-white/10 bg-[#0a0a1a] sm:h-[420px]'}>
      <ViewerErrorBoundary fallback={fallback ?? defaultFallback}>
        <div role="img" aria-label={description} className="h-full w-full" data-testid={testId}>
          <Canvas camera={{ position: camera, fov: 45, near: 0.1, far: 400 }} dpr={[1, 2]}>
            <color attach="background" args={['#0a0a1a']} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[6, 12, 8]} intensity={0.9} />
            <pointLight position={[-10, 6, -6]} intensity={0.4} color="#6366f1" />
            {children}
            <OrbitControls
              ref={controlsRef}
              target={target}
              enablePan={false}
              minDistance={minDistance}
              maxDistance={maxDistance}
              enableDamping
              dampingFactor={0.08}
            />
          </Canvas>
        </div>
      </ViewerErrorBoundary>

      <div className="absolute bottom-2 right-2 flex gap-1" role="group" aria-label="Điều khiển góc nhìn">
        {buttons.map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className="rounded-lg bg-slate-800/90 p-2 text-slate-200 hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <p className="pointer-events-none absolute left-2 top-2 rounded bg-slate-950/70 px-2 py-1 text-[11px] text-slate-400">{note}</p>
    </div>
  );
}
