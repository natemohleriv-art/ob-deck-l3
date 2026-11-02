import type { Mapping } from "../types";
// UI rectangles use top-left origin. Geometry uv uses bottom-left origin.
export function mapUV(u: number, v: number, m: Mapping): [number, number] {
  let x = (u - 0.5) * m.scaleX,
    y = (v - 0.5) * m.scaleY;
  const r = (m.rotation * Math.PI) / 180;
  [x, y] = [
    x * Math.cos(r) - y * Math.sin(r),
    x * Math.sin(r) + y * Math.cos(r),
  ];
  if (m.flipX) x = -x;
  if (m.flipY) y = -y;
  return [
    m.x + (x + 0.5 + m.offsetX) * m.w,
    1 - m.y - m.h + (y + 0.5 + m.offsetY) * m.h,
  ];
}
export function wallUV(
  z: number,
  y: number,
  start: number,
  length: number,
  height: number,
): [number, number] {
  return [(z - start) / length, y / height];
}
export function downloadJSON(data: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
