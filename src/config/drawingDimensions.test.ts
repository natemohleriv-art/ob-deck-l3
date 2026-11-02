import { expect, it } from "vitest";
import { defaultConfig } from "./scene";
import {
  drawingDimensionChanges,
  restoreDrawingDimensions,
} from "./drawingDimensions";

it("uses the printed floor and ceiling dimensions without rounding or swapping axes", () => {
  expect(defaultConfig.width).toBeCloseTo(22 * 0.3048, 10);
  expect(defaultConfig.length).toBeCloseTo(100 * 0.3048, 10);
  expect(defaultConfig.ceilingWidth).toBeCloseTo((22 * 12 + 2) * 0.0254, 10);
  expect(defaultConfig.ceilingLength).toBeCloseTo((100 * 12 + 1) * 0.0254, 10);
});
it("keeps the user-selected older wall extent while preserving uncertainty about openings", () => {
  expect(defaultConfig.wallLength).toBeCloseTo((50 * 12 + 10) * 0.0254, 10);
  expect(
    defaultConfig.measurements.find((m) => m.feature === "Wall upper extent")
      ?.status,
  ).toBe("conflicting");
  expect(
    defaultConfig.measurements.find(
      (m) => m.feature === "Opening widths / wall placement",
    )?.status,
  ).toBe("estimated");
});
it("detects scaled LED geometry and restores dimensions without resetting content", () => {
  const c = structuredClone(defaultConfig);
  c.width = 8;
  c.transforms.LED_Ceiling = {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [2, 1, 1],
  };
  c.mappings.floor.brightness = 0.7;
  expect(drawingDimensionChanges(c)).toContain("LED_Ceiling transform");
  expect(drawingDimensionChanges(c)).toContain("width");
  restoreDrawingDimensions(c);
  expect(drawingDimensionChanges(c)).toEqual([]);
  expect(c.mappings.floor.brightness).toBe(0.7);
});
