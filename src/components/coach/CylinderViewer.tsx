import CylinderPair from '@/components/three/CylinderPair';
import Viewer3D from '@/components/three/Viewer3D';
import { MAIN_PROBLEM, formatNumberVi } from '@/lib/cylinder/math';

const CAMERA: [number, number, number] = [3, 8, 17];
const TARGET: [number, number, number] = [1.5, 2.5, 0];

/**
 * Side-by-side cylinder scene. Rotation and zoom only move the camera; they
 * never change r, h or the shared scale (S2-AC-02). Buttons provide keyboard
 * access to the same camera moves (FR-CYL-003, NFR-A11Y-001).
 */
export default function CylinderViewer({ comparisonRadius }: { comparisonRadius: number }) {
  const r = formatNumberVi(comparisonRadius);
  const description = `Hai hình trụ đặt cạnh nhau cùng thang đo. Tham chiếu: bán kính ${MAIN_PROBLEM.r1} cm, chiều cao ${MAIN_PROBLEM.h} cm. So sánh: bán kính ${r} cm, chiều cao ${MAIN_PROBLEM.h} cm.`;
  return (
    <Viewer3D description={description} testId="cylinder-viewer" camera={CAMERA} target={TARGET} note="Kéo để xoay · cuộn để phóng to · 1 ô lưới = 1 cm">
      <CylinderPair comparisonRadius={comparisonRadius} />
    </Viewer3D>
  );
}
