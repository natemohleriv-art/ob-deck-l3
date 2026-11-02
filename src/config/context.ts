import type { SceneConfig, V3 } from "../types";

export type SolidBox = { name: string; position: V3; size: V3 };
// The LED wall is the gallery's opaque building edge, not a fourth facade.
// Door dimensions follow the editable header sections. Recess depth is contextual.
export function coreEnvelope(c: SceneConfig): SolidBox[] {
  const front = -c.width / 2 - 0.085;
  const depth = 0.4064;
  const end = c.length / 2 + 0.3;
  const doors = c.wallSections
    .filter((s) => s.bottom > 1)
    .map((s) => ({
      start: Math.max(-end, s.start),
      end: Math.min(end, s.start + s.length),
      top: Math.min(c.height, s.bottom),
    }))
    .filter((d) => d.end > d.start)
    .sort((a, b) => a.start - b.start);
  const cuts = [
    ...new Set([-end, end, ...doors.flatMap((d) => [d.start, d.end])]),
  ].sort((a, b) => a - b);
  const boxes: SolidBox[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const start = cuts[i],
      finish = cuts[i + 1],
      mid = (start + finish) / 2;
    const bottom = Math.max(
      0,
      ...doors.filter((d) => mid >= d.start && mid <= d.end).map((d) => d.top),
    );
    if (c.height > bottom)
      boxes.push({
        name: `CoreFace_${i}`,
        position: [front - depth / 2, (bottom + c.height) / 2, mid],
        size: [depth, c.height - bottom, finish - start],
      });
  }
  // Solid rear core closes every aperture at depth and connects the deck to the tower.
  boxes.push({
    name: "BuildingCoreMass",
    position: [front - 6.6, c.height / 2, 0],
    size: [12, c.height + 1, c.length + 0.6],
  });
  return boxes;
}

export const CITY_GROUND = -290; // Contextual grade: approximate 951 ft 10 in deck datum.
export type CityBuilding = {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  style: number;
  steps: number;
  spire: boolean;
};
export function makeCity(): CityBuilding[] {
  let seed = 740;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const result: CityBuilding[] = [];
  // Manhattan-like blocks and avenues. Three open gallery sides have a complete city field.
  for (let ix = -18; ix <= 18; ix++)
    for (let iz = -24; iz <= 24; iz++) {
      const x = ix * 76 + (random() - 0.5) * 17,
        z = iz * 59 + (random() - 0.5) * 12;
      const distance = Math.hypot(x, z);
      if (distance < 90 || distance > 1650) continue;
      const style = Math.floor(random() * 3),
        tall = random();
      const height =
        distance < 240
          ? 70 + random() * 130
          : 45 + random() * 150 + (tall > 0.88 ? 80 : 0);
      result.push({
        x,
        z,
        width: 23 + random() * 25,
        depth: 22 + random() * 19,
        height,
        style,
        steps: style === 0 ? 2 : style === 1 ? 1 : 0,
        spire: tall > 0.965,
      });
    }
  // Landmark-inspired silhouettes; illustrative placement, not a geographic survey.
  result.push(
    {
      x: 310,
      z: -420,
      width: 49,
      depth: 45,
      height: 345,
      style: 0,
      steps: 4,
      spire: true,
    },
    {
      x: 460,
      z: 310,
      width: 38,
      depth: 35,
      height: 300,
      style: 0,
      steps: 3,
      spire: true,
    },
    {
      x: 160,
      z: 590,
      width: 30,
      depth: 30,
      height: 365,
      style: 2,
      steps: 1,
      spire: false,
    },
    {
      x: 660,
      z: -40,
      width: 35,
      depth: 34,
      height: 330,
      style: 1,
      steps: 2,
      spire: true,
    },
    {
      x: -190,
      z: -610,
      width: 34,
      depth: 34,
      height: 320,
      style: 2,
      steps: 1,
      spire: false,
    },
    {
      x: -180,
      z: 480,
      width: 45,
      depth: 43,
      height: 310,
      style: 0,
      steps: 3,
      spire: true,
    },
  );
  return result;
}
