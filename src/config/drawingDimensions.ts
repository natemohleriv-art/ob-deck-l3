import type { SceneConfig } from "../types";
import { defaultConfig } from "./scene";

const dimensions = [
  "width",
  "length",
  "ceilingWidth",
  "ceilingLength",
  "height",
  "soffit",
  "wallStart",
  "wallLength",
] as const;
const ledIds = (c: SceneConfig) => [
  "LED_Floor",
  "LED_Ceiling",
  ...c.wallSections.map((s) => s.id),
];
export function drawingDimensionChanges(c: SceneConfig): string[] {
  const changes: string[] = dimensions.filter(
    (k) => Math.abs(c[k] - defaultConfig[k]) > 1e-8,
  );
  if (
    JSON.stringify(c.wallSections) !==
    JSON.stringify(defaultConfig.wallSections)
  )
    changes.push("wall sections");
  for (const id of ledIds(c)) {
    const t = c.transforms[id];
    if (
      t &&
      (t.scale.some((v) => Math.abs(v - 1) > 1e-8) ||
        t.position.some((v) => Math.abs(v) > 1e-8) ||
        t.rotation.some((v) => Math.abs(v) > 1e-8))
    )
      changes.push(`${id} transform`);
  }
  return changes;
}
// Restore only geometry; preserve media mappings, cameras and unrelated context edits.
export function restoreDrawingDimensions(c: SceneConfig) {
  for (const id of [...ledIds(c), ...ledIds(defaultConfig)])
    delete c.transforms[id];
  for (const key of dimensions) c[key] = defaultConfig[key];
  c.wallSections = structuredClone(defaultConfig.wallSections);
  c.measurements = structuredClone(defaultConfig.measurements);
}
