import { describe, it, expect } from "vitest";
import { mapUV, wallUV } from "./mapping";
import {
  defaultConfig,
  mappingDefault,
  validateConfig,
  validateMapping,
} from "../config/scene";
describe("source video UVs", () => {
  it("preserves the full frame", () => {
    expect(mapUV(0, 0, mappingDefault)).toEqual([0, 0]);
    expect(mapUV(1, 1, mappingDefault)).toEqual([1, 1]);
  });
  it("converts a top-left source rectangle to bottom-left texture coordinates", () => {
    const m = { ...mappingDefault, x: 0.25, y: 0.1, w: 0.5, h: 0.3 };
    expect(mapUV(0, 0, m)[0]).toBeCloseTo(0.25);
    expect(mapUV(0, 0, m)[1]).toBeCloseTo(0.6);
    expect(mapUV(1, 1, m)[1]).toBeCloseTo(0.9);
  });
  it("flips and rotates around the crop center", () => {
    expect(mapUV(0, 0, { ...mappingDefault, flipX: true })).toEqual([1, 0]);
    const a = mapUV(1, 0, { ...mappingDefault, rotation: 90 });
    expect(a[0]).toBeCloseTo(1);
    expect(a[1]).toBeCloseTo(1);
  });
  it("keeps a continuous wall across an aperture without repeating the frame", () => {
    expect(wallUV(4, 3, 0, 10, 6)).toEqual([0.4, 0.5]);
    expect(wallUV(6, 3, 0, 10, 6)).toEqual([0.6, 0.5]);
  });
  it("applies source-relative scale and offset", () =>
    expect(
      mapUV(0.5, 0.5, { ...mappingDefault, offsetX: 0.1, offsetY: -0.2 }),
    ).toEqual([0.6, 0.3]));
  it("rejects out-of-source rectangles", () =>
    expect(validateMapping({ ...mappingDefault, x: 0.8, w: 0.5 })).toBe(false));
});
describe("architecture configuration", () => {
  it("has validated defaults and round-trips through JSON", () =>
    expect(validateConfig(JSON.parse(JSON.stringify(defaultConfig)))).toBe(
      true,
    ));
  it("uses the actual printed floor and ceiling dimensions", () => {
    expect(defaultConfig.length).toBeCloseTo(100 * 0.3048);
    expect(defaultConfig.ceilingLength).toBeCloseTo(100 * 0.3048 + 0.0254);
    expect(defaultConfig.width).toBeCloseTo(22 * 0.3048);
  });
  it("has no LED coverage inside either doorway", () => {
    for (const z of [-0.7, 5.5])
      expect(
        defaultConfig.wallSections.some(
          (s) =>
            z > s.start &&
            z < s.start + s.length &&
            1.7 > s.bottom &&
            1.7 < s.top,
        ),
      ).toBe(false);
  });
  it("fills the wall continuously above both openings", () => {
    for (
      let z = defaultConfig.wallStart + 0.01;
      z < defaultConfig.wallStart + defaultConfig.wallLength;
      z += 0.03
    ) {
      expect(
        defaultConfig.wallSections.some(
          (s) =>
            z >= s.start - 1e-6 &&
            z <= s.start + s.length + 1e-6 &&
            4 > s.bottom &&
            4 < s.top,
        ),
      ).toBe(true);
    }
  });
  it("rejects unsafe dimensions and malformed imports", () => {
    expect(validateConfig({ ...defaultConfig, height: -1 })).toBe(false);
    expect(
      validateConfig({
        ...defaultConfig,
        transforms: {
          bad: { position: [NaN, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
        },
      }),
    ).toBe(false);
    expect(validateConfig({})).toBe(false);
  });
});
