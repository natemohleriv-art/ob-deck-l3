import { describe, expect, it } from "vitest";
import { Box3, Ray, Vector3 } from "three";
import { coreEnvelope, makeCity } from "./context";
import { defaultConfig } from "./scene";

const solids = coreEnvelope(defaultConfig).map((b) =>
  new Box3().setFromCenterAndSize(
    new Vector3(...b.position),
    new Vector3(...b.size),
  ),
);
describe("gallery exterior enclosure", () => {
  it("closes the entire LED side, including behind doorway recesses", () => {
    for (
      let z = -defaultConfig.length / 2;
      z <= defaultConfig.length / 2;
      z += 0.15
    )
      for (const y of [0.1, 1.7, 3.2, defaultConfig.height - 0.1]) {
        const ray = new Ray(new Vector3(0, y, z), new Vector3(-1, 0, 0));
        expect(solids.some((b) => ray.intersectsBox(b))).toBe(true);
      }
  });
  it("keeps views open on all three glazed sides", () => {
    for (const direction of [
      [1, 0, 0],
      [0, 0, 1],
      [0, 0, -1],
    ]) {
      const ray = new Ray(new Vector3(0, 1.7, 0), new Vector3(...direction));
      expect(solids.some((b) => ray.intersectsBox(b))).toBe(false);
    }
  });
  it("retains depth in the door openings", () => {
    for (const section of defaultConfig.wallSections.filter(
      (s) => s.bottom > 1,
    )) {
      const ray = new Ray(
        new Vector3(0, 1.7, section.start + section.length / 2),
        new Vector3(-1, 0, 0),
      );
      const hits = solids
        .map((b) => ray.intersectBox(b, new Vector3()))
        .filter((p) => p !== null);
      expect(Math.min(...hits.map((p) => Math.abs(p!.x)))).toBeGreaterThan(
        defaultConfig.width / 2 + 0.5,
      );
    }
  });
  it("provides a repeatable city around every open side", () => {
    const city = makeCity();
    expect(city).toEqual(makeCity());
    for (const direction of [0, 1, -1])
      expect(
        city.filter((b) => (direction === 0 ? b.x > 90 : b.z * direction > 90))
          .length,
      ).toBeGreaterThan(300);
    expect(city.every((b) => Math.hypot(b.x, b.z) >= 90)).toBe(true);
  });
});
