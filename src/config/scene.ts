import type { CameraView, Mapping, SceneConfig } from "../types";
export const mappingDefault: Mapping = {
  x: 0,
  y: 0,
  w: 1,
  h: 1,
  flipX: false,
  flipY: false,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  scaleX: 1,
  scaleY: 1,
  brightness: 1,
};
export const presets: CameraView[] = [
  { name: "Main Entrance", position: [-2.5, 1.7, 1], target: [1, 2.5, -11] },
  {
    name: "Long Gallery View",
    position: [2.5, 1.7, 13.2],
    target: [-0.8, 3, -8],
  },
  { name: "Center of Gallery", position: [2, 1.7, 0], target: [-2, 3, -7] },
  { name: "Side Wall LED View", position: [3, 2, 2], target: [-3.35, 3, 0] },
  { name: "Floor View", position: [2, 5, 9], target: [0, 0, 0] },
  { name: "Ceiling View", position: [1, 1.7, 10], target: [0, 6.8, -2] },
  {
    name: "Window-Side Perspective",
    position: [3.9, 1.7, 10],
    target: [-1, 2.8, -8],
  },
  {
    name: "Wide Architectural View",
    position: [12, 10, 23],
    target: [0, 3, 0],
  },
  {
    name: "City / Long Windows",
    position: [0, 1.7, 0],
    target: [16, -0.3, -7],
  },
  { name: "City / Far End", position: [1, 1.7, -11], target: [3, 0.7, -28] },
  { name: "City / Near End", position: [1, 1.7, 11], target: [3, 0.7, 28] },
  { name: "Elevated Overview", position: [18, 25, 27], target: [0, 0, 0] },
];
// Source dimensions are printed callouts, never scaled from PDF pixels.
export const defaultConfig: SceneConfig = {
  version: 1,
  width: 6.7056,
  length: 30.48,
  ceilingWidth: 6.7564,
  ceilingLength: 30.5054,
  height: 6.858,
  soffit: 6.5532,
  wallStart: -8.1792,
  wallLength: 16.3584,
  wallSections: [
    {
      id: "Wall_01",
      start: -8.1792,
      length: 6.604,
      bottom: 0.0508,
      top: 6.858,
    },
    {
      id: "Wall_02",
      start: 0.1248,
      length: 4.3434,
      bottom: 0.0508,
      top: 6.858,
    },
    { id: "Wall_03", start: 6.579, bottom: 0.0508, length: 1.6002, top: 6.858 },
    {
      id: "Wall_Header_01",
      start: -1.5752,
      length: 1.7,
      bottom: 2.921,
      top: 6.858,
    },
    {
      id: "Wall_Header_02",
      start: 4.4682,
      length: 2.1108,
      bottom: 2.921,
      top: 6.858,
    },
  ],
  transforms: {},
  mappings: {
    floor: { ...mappingDefault },
    ceiling: { ...mappingDefault },
    wall: { ...mappingDefault },
  },
  cameras: [],
  measurements: [
    {
      feature: "Building core and city context",
      value: 0,
      unit: "context",
      source:
        "User clarification and supplied building/skyline renderings (2026-11-02)",
      confidence: "low",
      status: "estimated",
      note: "Opaque core at X-negative with enclosed door recesses; glazing only at X-positive and both Z ends. Supporting tower, city heights, facade details and landmark-inspired silhouettes are illustrative; not survey-registered. City grade is approximately 290 m below the LED floor.",
    },
    {
      feature: "LED floor width",
      value: 6.7056,
      unit: "m",
      source: "p1 / 4_133 H; p2–3 sections",
      confidence: "high",
      status: "confirmed",
      note: "22 ft printed zone width",
    },
    {
      feature: "LED floor length",
      value: 30.48,
      unit: "m",
      source: "p1 / 4_133 H; p4 / 4_290 E",
      confidence: "high",
      status: "confirmed",
      note: "100 ft; corrects brief’s approximate 100 ft 1 in",
    },
    {
      feature: "LED ceiling width",
      value: 6.7564,
      unit: "m",
      source: "p5 / 4_633 J; p2–3 sections",
      confidence: "high",
      status: "confirmed",
      note: "22 ft 2 in",
    },
    {
      feature: "LED ceiling length",
      value: 30.5054,
      unit: "m",
      source: "p5 / 4_633 J; p4 / 4_290 E",
      confidence: "high",
      status: "confirmed",
      note: "100 ft 1 in",
    },
    {
      feature: "Main ceiling AFFL",
      value: 6.858,
      unit: "m",
      source: "p2–5 / sections and RCP",
      confidence: "high",
      status: "confirmed",
      note: "22 ft 6 in. Applied as visual face elevation provisionally; assembly datum requires coordination.",
    },
    {
      feature: "Down soffit AFFL",
      value: 6.5532,
      unit: "m",
      source: "p2–5",
      confidence: "high",
      status: "confirmed",
      note: "21 ft 6 in",
    },
    {
      feature: "Wall upper extent",
      value: 16.3584,
      unit: "m",
      source: "p5 / 4_633 J (2025-10-29)",
      confidence: "medium",
      status: "conflicting",
      note: "53 ft 8 in above openings. Older p4 section B gives 50 ft 10 in (15.494 m). Newer extent used; centered placement estimated.",
    },
    {
      feature: "Wall solid lengths",
      value: 0,
      unit: "see note",
      source: "p1 / 4_133 H",
      confidence: "high",
      status: "confirmed",
      note: "21 ft 8 in, 14 ft 3 in, 5 ft 3 in between openings. Order along -Z to +Z follows the plan.",
    },
    {
      feature: "Opening surround top",
      value: 2.921,
      unit: "m",
      source: "p2 / section C",
      confidence: "medium",
      status: "estimated",
      note: "9 ft 7 in callout used for opening top; precise finished aperture needs ID details.",
    },
    {
      feature: "Opening widths / wall placement",
      value: 0,
      unit: "see note",
      source: "p1 plan + p4 section B + p5 RCP",
      confidence: "low",
      status: "estimated",
      note: "1.70 m and 2.1108 m openings reconcile newer upper extent with solid lengths. Absolute longitudinal offsets not dimensioned; centered estimate. Not survey data.",
    },
    {
      feature: "Wall build-up",
      value: 0.4064,
      unit: "m",
      source: "p1, p2, p5",
      confidence: "high",
      status: "confirmed",
      note: "16 in overall from core wall",
    },
    {
      feature: "Wall-floor diffuser gap",
      value: 0.0508,
      unit: "m",
      source: "p1 and p4",
      confidence: "high",
      status: "confirmed",
      note: "2 in; terminates at doors",
    },
    {
      feature: "Perimeter diffuser",
      value: 0.3048,
      unit: "m",
      source: "p1, p2, p5",
      confidence: "high",
      status: "confirmed",
      note: "1 ft",
    },
    {
      feature: "Floor assembly",
      value: 0.40005,
      unit: "m",
      source: "p2–4",
      confidence: "high",
      status: "confirmed",
      note: "15 3/4 in = 7 3/4 in screen + 8 in plenum; below visual floor datum",
    },
    {
      feature: "Ceiling assembly",
      value: 0.200025,
      unit: "m",
      source: "p2–4",
      confidence: "high",
      status: "confirmed",
      note: "7 7/8 in; modeled above visual ceiling face, not subtracted twice",
    },
    {
      feature: "Facade, columns, stairs, skyline",
      value: 0,
      unit: "various",
      source: "p1–5 topology and concept images",
      confidence: "low",
      status: "estimated",
      note: "Procedural context only. Bay spacing, profiles, surrounding depth and stairs are adjustable approximations. Skyline is illustrative, not geographically registered.",
    },
  ],
};
export function validateConfig(c: unknown): c is SceneConfig {
  if (!c || typeof c !== "object") return false;
  const a = c as SceneConfig;
  const n = (v: unknown, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  const vec = (v: unknown) =>
    Array.isArray(v) && v.length === 3 && v.every((x) => n(x, -10000, 10000));
  return (
    a.version === 1 &&
    [
      "width",
      "length",
      "ceilingWidth",
      "ceilingLength",
      "height",
      "soffit",
      "wallLength",
    ].every((k) => n(a[k as keyof SceneConfig], 0.1, 200)) &&
    n(a.wallStart, -200, 200) &&
    Array.isArray(a.wallSections) &&
    a.wallSections.length <= 100 &&
    a.wallSections.every(
      (s) =>
        typeof s.id === "string" &&
        n(s.start, -200, 200) &&
        n(s.length, 0.01, 200) &&
        n(s.bottom, 0, 100) &&
        n(s.top, s.bottom + 0.01, 200),
    ) &&
    !!a.transforms &&
    Object.values(a.transforms).every(
      (t) =>
        vec(t.position) &&
        vec(t.rotation) &&
        vec(t.scale) &&
        t.scale.every((x) => x > 0),
    ) &&
    !!a.mappings &&
    ["floor", "ceiling", "wall"].every((k) => !!a.mappings[k]) &&
    Object.values(a.mappings).every(validateMapping) &&
    Array.isArray(a.cameras) &&
    a.cameras.every(
      (v) => typeof v.name === "string" && vec(v.position) && vec(v.target),
    ) &&
    Array.isArray(a.measurements)
  );
}
export function validateMapping(m: Mapping) {
  return (
    !!m &&
    [
      "x",
      "y",
      "w",
      "h",
      "rotation",
      "offsetX",
      "offsetY",
      "scaleX",
      "scaleY",
      "brightness",
    ].every((k) => Number.isFinite(m[k as keyof Mapping])) &&
    m.w > 0 &&
    m.h > 0 &&
    m.x >= 0 &&
    m.y >= 0 &&
    m.x + m.w <= 1.00001 &&
    m.y + m.h <= 1.00001 &&
    m.scaleX > 0 &&
    m.scaleY > 0 &&
    m.brightness >= 0 &&
    typeof m.flipX === "boolean" &&
    typeof m.flipY === "boolean"
  );
}
export const formatDimension = (m: number, imperial: boolean) => {
  if (!imperial) return `${m.toFixed(3)} m`;
  let inches = Math.round(m / 0.0254);
  return `${Math.floor(inches / 12)}′ ${inches % 12}″`;
};
