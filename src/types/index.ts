export type V3 = [number, number, number];
export type Mapping = {
  x: number;
  y: number;
  w: number;
  h: number;
  flipX: boolean;
  flipY: boolean;
  rotation: number;
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
  brightness: number;
};
export type Transform = { position: V3; rotation: V3; scale: V3 };
export type WallSection = {
  id: string;
  start: number;
  length: number;
  bottom: number;
  top: number;
};
export type CameraView = { name: string; position: V3; target: V3 };
export type SceneConfig = {
  version: 1;
  width: number;
  length: number;
  ceilingWidth: number;
  ceilingLength: number;
  height: number;
  soffit: number;
  wallStart: number;
  wallLength: number;
  wallSections: WallSection[];
  transforms: Record<string, Transform>;
  mappings: Record<string, Mapping>;
  cameras: CameraView[];
  measurements: Measurement[];
};
export type Measurement = {
  feature: string;
  value: number;
  unit: string;
  source: string;
  confidence: "high" | "medium" | "low";
  status: "confirmed" | "estimated" | "conflicting";
  note: string;
};
