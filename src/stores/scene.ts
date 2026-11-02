import { create } from "zustand";
import { defaultConfig } from "../config/scene";
import type { CameraView, SceneConfig } from "../types";
type State = {
  direction: "original" | "direction2";
  colorEchoes: boolean;
  colorPlaying: boolean;
  revealMode: "auto" | "pointer";
  revealPlaying: boolean;
  config: SceneConfig;
  history: SceneConfig[];
  edit: (fn: (c: SceneConfig) => void) => void;
  replace: (c: SceneConfig) => void;
  undo: () => void;
  reset: () => void;
  mode: "independent" | "unified";
  wallMode: "continuous" | "sections";
  environment: "Daytime" | "Dusk" | "Nighttime";
  sidebar: boolean;
  tab: string;
  presentation: boolean;
  calibration: boolean;
  selected: string | null;
  gizmo: "translate" | "rotate" | "scale";
  cameraMode: "orbit" | "walk";
  view: CameraView;
  cameraLive: CameraView;
  eyeHeight: number;
  speed: number;
  fov: number;
  exposure: number;
  skyline: number;
  bloom: number;
  structures: boolean;
  windows: boolean;
  procedural: boolean;
  imperial: boolean;
  pattern: "atmosphere" | "calibration" | "neutral";
  set: (s: Partial<State>) => void;
};
export const useStore = create<State>((set) => ({
  direction: "original",
  colorEchoes: true,
  colorPlaying: true,
  revealMode: "auto",
  revealPlaying: true,
  config: structuredClone(defaultConfig),
  history: [],
  edit: (fn) =>
    set((s) => {
      const c = structuredClone(s.config);
      fn(c);
      return { config: c, history: [...s.history.slice(-29), s.config] };
    }),
  replace: (c) =>
    set((s) => ({ config: c, history: [...s.history.slice(-29), s.config] })),
  undo: () =>
    set((s) =>
      s.history.length
        ? { config: s.history.at(-1)!, history: s.history.slice(0, -1) }
        : {},
    ),
  reset: () =>
    set((s) => ({
      config: structuredClone(defaultConfig),
      history: [...s.history.slice(-29), s.config],
    })),
  mode: "independent",
  wallMode: "continuous",
  environment: "Dusk",
  sidebar: false,
  tab: "Media",
  presentation: false,
  calibration: false,
  selected: null,
  gizmo: "translate",
  cameraMode: "orbit",
  view: {
    name: "Long Gallery View",
    position: [2.5, 1.7, 13.2],
    target: [-0.8, 3, -8],
  },
  cameraLive: {
    name: "Current",
    position: [2.5, 1.7, 13.2],
    target: [-0.8, 3, -8],
  },
  eyeHeight: 1.7,
  speed: 2.5,
  fov: 65,
  exposure: 1,
  skyline: 1,
  bloom: 0.25,
  structures: true,
  windows: true,
  procedural: true,
  imperial: false,
  pattern: "atmosphere",
  set: (s) => set(s),
}));
