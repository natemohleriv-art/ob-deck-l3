import { useEffect, useState, type ReactNode } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Settings2,
  Maximize,
  Upload,
  X,
  Eye,
  Move3D,
  ChevronDown,
  Volume2,
  VolumeX,
  Repeat,
  Check,
  Download,
  Camera,
  Undo2,
} from "lucide-react";
import * as THREE from "three";
import Scene, { loadModel, type Assets } from "./components/Scene";
import { useStore } from "./stores/scene";
import { useMedia } from "./stores/media";
import {
  presets,
  mappingDefault,
  validateConfig,
  validateMapping,
  formatDimension,
} from "./config/scene";
import { downloadJSON } from "./utils/mapping";
import type { Mapping, V3 } from "./types";
const time = (v: number) =>
  `${Math.floor(v / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(v % 60)
    .toString()
    .padStart(2, "0")}`;
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Num({
  label,
  value,
  onChange,
  min = -1000,
  max = 1000,
  step = 0.01,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label}>
      <input
        aria-label={label}
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number(value.toFixed(4))}
        onChange={(e) => {
          const n = e.target.valueAsNumber;
          if (Number.isFinite(n) && n >= min && n <= max) onChange(n);
        }}
      />
    </Field>
  );
}
function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Field label={label}>
      <input
        aria-label={label}
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </Field>
  );
}
function UploadCard({ id, label }: { id: string; label: string }) {
  const m = useMedia((s) => s.items[id]),
    load = useMedia((s) => s.load),
    remove = useMedia((s) => s.remove);
  const [drag, setDrag] = useState(false);
  return (
    <div
      className={`upload-card ${drag ? "drag" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (e.dataTransfer.files[0]) load(id, e.dataTransfer.files[0]);
      }}
    >
      <div className="card-heading">
        <span className={`dot ${m ? "loaded" : ""}`} />
        <strong>{label}</strong>
        {m && (
          <button
            className="icon small"
            title={`Remove ${label}`}
            onClick={() => remove(id)}
          >
            <X size={13} />
          </button>
        )}
      </div>
      <label className="file-drop">
        <input
          type="file"
          accept="video/mp4,video/webm,.m4v"
          onChange={(e) => {
            if (e.target.files?.[0]) load(id, e.target.files[0]);
            e.target.value = "";
          }}
        />
        <Upload size={17} />
        <span>{m ? m.name : "Drop MP4 or browse"}</span>
      </label>
      {m ? (
        <p>
          {m.width
            ? `${m.width} × ${m.height} · ${time(m.duration)}`
            : "Reading media…"}
          <br />
          <span className={m.error ? "error" : ""}>{m.status}</span> · FPS
          unavailable
        </p>
      ) : (
        <p>Local playback · H.264 recommended</p>
      )}
    </div>
  );
}
export default function App() {
  const s = useStore(),
    media = useMedia();
  const [surface, setSurface] = useState("floor"),
    [pixel, setPixel] = useState(false),
    [notice, setNotice] = useState("");
  const [assets, setAssets] = useState<Assets>({
    model: null,
    reference: null,
    referenceName: "",
    referencePosition: [0, 0.04, 0],
    referenceRotation: [-Math.PI / 2, 0, 0],
    referenceScale: 30,
    referenceOpacity: 0.4,
    referenceVisible: true,
  });
  const config = s.config,
    m = config.mappings[surface] || mappingDefault;
  const source = media.items[s.mode === "unified" ? "unified" : surface];
  useEffect(() => {
    media.setActive(
      s.mode === "unified"
        ? ["unified"]
        : [
            "floor",
            "ceiling",
            ...(s.wallMode === "sections"
              ? config.wallSections.map((a) => a.id)
              : ["wall"]),
          ],
    );
  }, [s.mode, s.wallMode, config.wallSections]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === "Escape") s.set({ presentation: false });
      if (
        e.code === "Space" &&
        !(e.target as HTMLElement).matches("input,select,textarea,button")
      ) {
        e.preventDefault();
        const a = useMedia.getState();
        void (a.playing ? a.pause() : a.play());
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);
  const map = (key: keyof Mapping, value: number | boolean) =>
    s.edit((c) => {
      c.mappings[surface] = { ...m, [key]: value };
    });
  const importJSON = async (file: File, kind: string) => {
    try {
      const data = JSON.parse(await file.text());
      if (kind === "scene") {
        if (!validateConfig(data))
          throw Error(
            "Invalid scene configuration. Check dimensions, mappings, and schema version.",
          );
        s.replace(data);
      } else {
        if (
          data.version !== 1 ||
          !data.mappings ||
          !["floor", "ceiling", "wall"].every((k) =>
            validateMapping(data.mappings[k]),
          )
        )
          throw Error(
            "Invalid mapping preset. Rectangles must remain inside the source.",
          );
        s.edit((c) => {
          c.mappings = data.mappings;
        });
      }
      setNotice("Configuration imported.");
    } catch (e) {
      setNotice(String(e));
    }
  };
  const fileButton = (
    label: string,
    accept: string,
    fn: (file: File) => void,
  ) => (
    <label className="button file-button">
      {label}
      <input
        type="file"
        accept={accept}
        onChange={(e) => {
          if (e.target.files?.[0]) fn(e.target.files[0]);
          e.target.value = "";
        }}
      />
    </label>
  );
  const editNumber = (
    key:
      | "width"
      | "length"
      | "ceilingWidth"
      | "ceilingLength"
      | "height"
      | "soffit"
      | "wallStart"
      | "wallLength",
    value: number,
  ) =>
    s.edit((c) => {
      if (key === "height") {
        if (c.wallSections.some((a) => value <= a.bottom + 0.01)) return;
        const before = c.height;
        c.wallSections.forEach((a) => {
          if (Math.abs(a.top - before) < 0.001) a.top = value;
        });
      }
      c[key] = value;
    });
  return (
    <main>
      <Scene assets={assets} />
      {!s.presentation && (
        <>
          <header>
            <div className="brand">
              <div className="brand-mark">
                <i />
                <i />
                <i />
              </div>
              <div>
                <h1>
                  OB DECK L3<span className="version">STUDIO / 01</span>
                </h1>
                <p>LED PREVISUALIZATION</p>
              </div>
            </div>
            <div className="toolbar">
              <select
                aria-label="Camera preset"
                value={s.view.name}
                onChange={(e) => {
                  const view = [...presets, ...config.cameras].find(
                    (v) => v.name === e.target.value,
                  );
                  if (view) s.set({ view, cameraMode: "orbit" });
                }}
              >
                {[...presets, ...config.cameras].map((v, i) => (
                  <option key={i}>{v.name}</option>
                ))}
              </select>
              <div className="segmented">
                <button
                  className={s.cameraMode === "orbit" ? "active" : ""}
                  onClick={() => s.set({ cameraMode: "orbit" })}
                >
                  Orbit
                </button>
                <button
                  className={s.cameraMode === "walk" ? "active" : ""}
                  onClick={() => s.set({ cameraMode: "walk" })}
                >
                  Walk
                </button>
              </div>
              <select
                aria-label="Environment preset"
                value={s.environment}
                onChange={(e) =>
                  s.set({ environment: e.target.value as typeof s.environment })
                }
              >
                {["Daytime", "Dusk", "Nighttime"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <button
                title="Settings"
                className={`icon ${s.sidebar ? "active" : ""}`}
                onClick={() => s.set({ sidebar: !s.sidebar })}
              >
                <Settings2 size={18} />
              </button>
              <button
                title="Fullscreen"
                className="icon"
                onClick={() => {
                  void (
                    document.fullscreenElement
                      ? document.exitFullscreen()
                      : document.documentElement.requestFullscreen()
                  ).catch(() =>
                    setNotice("Fullscreen unavailable in this browser."),
                  );
                }}
              >
                <Maximize size={18} />
              </button>
            </div>
          </header>
          <div className="project-label">
            <span className="eyebrow">OBSERVATION DECK 3 UPPER</span>
            <div className="project-meta">
              <span className="live-dot" />
              {Object.keys(media.items).length
                ? "LOCAL MEDIA SESSION"
                : "PROCEDURAL ATMOSPHERE"}
              <span className="slash">/</span>
              {s.environment.toUpperCase()}
            </div>
          </div>
          <div className="left-tools">
            <button
              className={s.calibration ? "tool active" : "tool"}
              title="Architectural calibration"
              onClick={() =>
                s.set({
                  calibration: !s.calibration,
                  sidebar: true,
                  tab: "Architecture",
                })
              }
            >
              <Move3D size={18} />
            </button>
            <button
              className="tool"
              title="Presentation mode · Escape to return"
              onClick={() => {
                setNotice(
                  "Presentation mode · press Escape to restore controls",
                );
                s.set({ presentation: true });
              }}
            >
              <Eye size={18} />
            </button>
            <button
              className="tool"
              title="Save camera view"
              onClick={() => {
                s.edit((c) =>
                  c.cameras.push({
                    ...s.cameraLive,
                    name: `Saved view ${c.cameras.length + 1}`,
                  }),
                );
                setNotice("Camera view saved.");
              }}
            >
              <Camera size={18} />
            </button>
          </div>
          {s.cameraMode === "walk" && (
            <button id="walk-lock" className="walk-button">
              Click to walk · WASD · Drag to look if unlocked
            </button>
          )}
          {!s.sidebar && (
            <div className="scene-info">
              <span className="eyebrow">THE IMMERSIVE GALLERY</span>
              <h2>
                A canvas beyond
                <br />
                the screen.
              </h2>
              <p>
                {formatDimension(config.width, s.imperial)} ×{" "}
                {formatDimension(config.length, s.imperial)} floor
                <br />
                Three surfaces. One shared experience.
              </p>
              <button onClick={() => s.set({ sidebar: true, tab: "Media" })}>
                Load your motion content <span>↗</span>
              </button>
            </div>
          )}
          <div className="status-footer">
            <span>
              <span className="live-dot" /> WEBGL · LOCAL WORKSPACE
            </span>
            <span>
              {s.calibration
                ? "CALIBRATION · " +
                  s.cameraLive.position.map((n) => n.toFixed(2)).join(", ") +
                  " m"
                : "DESIGN-INTENT MODEL · ESTIMATES EDITABLE"}
            </span>
          </div>
          <section className="playback" aria-label="Playback">
            <button
              className="upload-trigger"
              onClick={() => s.set({ sidebar: true, tab: "Media" })}
            >
              <Upload size={16} />
              <span>Media</span>
              <span className="count">{Object.keys(media.items).length}</span>
            </button>
            <div className="divider" />
            <button
              className="icon"
              title="Restart"
              onClick={() => media.seek(0)}
            >
              <RotateCcw size={17} />
            </button>
            <button
              className="play"
              title={media.playing ? "Pause" : "Play"}
              disabled={!media.duration}
              onClick={() =>
                void (media.playing ? media.pause() : media.play())
              }
            >
              {media.playing ? (
                <Pause size={19} />
              ) : (
                <Play size={19} fill="currentColor" />
              )}
            </button>
            <span className="timestamp">{time(media.time)}</span>
            <input
              aria-label="Timeline"
              className="timeline"
              type="range"
              min={0}
              max={media.duration || 1}
              step={0.01}
              value={media.time}
              disabled={!media.duration}
              onChange={(e) => media.seek(+e.target.value)}
            />
            <span className="timestamp muted">{time(media.duration)}</span>
            <button
              className={`icon ${media.loop ? "active" : ""}`}
              title="Loop"
              aria-pressed={media.loop}
              onClick={() => media.options({ loop: !media.loop })}
            >
              <Repeat size={17} />
            </button>
            <button
              className="icon"
              title={media.muted ? "Unmute" : "Mute"}
              onClick={() => media.options({ muted: !media.muted })}
            >
              {media.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
            <select
              aria-label="Playback speed"
              value={media.rate}
              onChange={(e) => media.options({ rate: +e.target.value })}
            >
              {[0.25, 0.5, 1, 1.5, 2].map((n) => (
                <option key={n} value={n}>
                  {n}×
                </option>
              ))}
            </select>
          </section>
          {s.sidebar && (
            <aside>
              <div className="sidebar-title">
                <div>
                  <span className="eyebrow">WORKSPACE</span>
                  <h2>Scene controls</h2>
                </div>
                <button
                  className="icon"
                  title="Close settings"
                  onClick={() => s.set({ sidebar: false })}
                >
                  <X size={19} />
                </button>
              </div>
              <nav>
                {[
                  "Media",
                  "Mapping",
                  "Environment",
                  "Camera",
                  "Architecture",
                ].map((t) => (
                  <button
                    className={s.tab === t ? "active" : ""}
                    key={t}
                    onClick={() => s.set({ tab: t })}
                  >
                    {t}
                  </button>
                ))}
              </nav>
              <div className="panel-body">
                {s.tab === "Media" && (
                  <>
                    <h3>Source assignment</h3>
                    <button
                      className="wide"
                      onClick={async () => {
                        try {
                          const response = await fetch(
                            `${import.meta.env.BASE_URL}samples/motion-test.mp4`,
                          );
                          if (!response.ok) throw Error();
                          const blob = await response.blob();
                          for (const id of s.mode === "unified"
                            ? ["unified"]
                            : [
                                "floor",
                                "ceiling",
                                ...(s.wallMode === "sections"
                                  ? config.wallSections.map((a) => a.id)
                                  : ["wall"]),
                              ])
                            media.load(
                              id,
                              new File([blob], "Motion calibration.mp4", {
                                type: "video/mp4",
                              }),
                            );
                          setNotice(
                            "Motion test loaded. Press Play to preview.",
                          );
                        } catch {
                          setNotice("Could not load the bundled motion test.");
                        }
                      }}
                    >
                      Load motion test
                    </button>
                    <p className="hint">
                      Files stay on this device. Assign content to each surface,
                      or use one shared canvas.
                    </p>
                    <Field label="Media mode">
                      <select
                        value={s.mode}
                        onChange={(e) => {
                          media.pause();
                          s.set({ mode: e.target.value as typeof s.mode });
                        }}
                      >
                        <option value="independent">
                          Independent surfaces
                        </option>
                        <option value="unified">Unified canvas</option>
                      </select>
                    </Field>
                    {s.mode === "unified" ? (
                      <UploadCard id="unified" label="Unified video canvas" />
                    ) : (
                      <>
                        <UploadCard id="floor" label="01 / LED floor" />
                        <UploadCard id="ceiling" label="02 / LED ceiling" />
                        <Field label="Wall source layout">
                          <select
                            value={s.wallMode}
                            onChange={(e) =>
                              s.set({
                                wallMode: e.target.value as typeof s.wallMode,
                              })
                            }
                          >
                            <option value="continuous">
                              Continuous wall canvas
                            </option>
                            <option value="sections">
                              Independent sections
                            </option>
                          </select>
                        </Field>
                        {s.wallMode === "continuous" ? (
                          <UploadCard id="wall" label="03 / LED side wall" />
                        ) : (
                          config.wallSections.map((a) => (
                            <UploadCard key={a.id} id={a.id} label={a.id} />
                          ))
                        )}
                      </>
                    )}
                    <div className="callout">
                      Independent videos use best-effort drift correction.
                      Browser playback and seeking are not frame-accurate.
                      Shorter sources loop individually; the timeline uses the
                      longest active source.
                    </div>
                    <Field label="Unloaded surface preview">
                      <select
                        value={s.pattern}
                        onChange={(e) =>
                          s.set({ pattern: e.target.value as typeof s.pattern })
                        }
                      >
                        <option value="atmosphere">
                          Procedural atmosphere
                        </option>
                        <option value="calibration">
                          Labeled calibration grid
                        </option>
                        <option value="neutral">Neutral material</option>
                      </select>
                    </Field>
                  </>
                )}
                {s.tab === "Mapping" && (
                  <>
                    <h3>Canvas mapping</h3>
                    <p className="hint">
                      Source rectangles use a top-left origin. Each surface
                      starts with the full source; no master resolution is
                      assumed.
                    </p>
                    <Field label="Surface">
                      <select
                        value={surface}
                        onChange={(e) => setSurface(e.target.value)}
                      >
                        {["floor", "ceiling", "wall"].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </Field>
                    <Toggle
                      label="Pixel coordinates"
                      value={pixel}
                      onChange={setPixel}
                    />
                    {pixel && !source?.width && (
                      <p className="hint">
                        Load the source to edit pixel coordinates.
                      </p>
                    )}
                    <div className="number-grid">
                      {(["x", "y", "w", "h"] as const).map((k) => {
                        const dim =
                          pixel && source?.width
                            ? k === "x" || k === "w"
                              ? source.width
                              : source.height
                            : 1;
                        return (
                          <Num
                            key={k}
                            label={
                              {
                                x: "Source X",
                                y: "Source Y",
                                w: "Source width",
                                h: "Source height",
                              }[k] + (dim > 1 ? " px" : " UV")
                            }
                            value={m[k] * dim}
                            min={k === "w" || k === "h" ? 0.0001 : 0}
                            max={dim}
                            step={dim > 1 ? 1 : 0.01}
                            onChange={(v) => {
                              const next = { ...m, [k]: v / dim };
                              if (
                                next.x + next.w <= 1.00001 &&
                                next.y + next.h <= 1.00001
                              )
                                map(k, v / dim);
                              else
                                setNotice(
                                  "The source rectangle must fit inside the video. Reduce width or height first.",
                                );
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="uv-preview">
                      <div
                        style={{
                          left: `${m.x * 100}%`,
                          top: `${m.y * 100}%`,
                          width: `${m.w * 100}%`,
                          height: `${m.h * 100}%`,
                        }}
                      >
                        <span>{surface.toUpperCase()}</span>
                      </div>
                    </div>
                    <Toggle
                      label="Flip horizontally"
                      value={m.flipX}
                      onChange={(v) => map("flipX", v)}
                    />
                    <Toggle
                      label="Flip vertically"
                      value={m.flipY}
                      onChange={(v) => map("flipY", v)}
                    />
                    <Num
                      label="Rotation °"
                      value={m.rotation}
                      min={-360}
                      max={360}
                      step={90}
                      onChange={(v) => map("rotation", v)}
                    />
                    <div className="number-grid">
                      {(
                        ["offsetX", "offsetY", "scaleX", "scaleY"] as const
                      ).map((k) => (
                        <Num
                          key={k}
                          label={k}
                          value={m[k]}
                          min={k.startsWith("scale") ? 0.01 : -10}
                          max={10}
                          onChange={(v) => map(k, v)}
                        />
                      ))}
                    </div>
                    <Num
                      label="Surface brightness"
                      value={m.brightness}
                      min={0}
                      max={4}
                      step={0.1}
                      onChange={(v) => map("brightness", v)}
                    />
                    <div className="button-row">
                      <button
                        onClick={() =>
                          downloadJSON(
                            { version: 1, mappings: config.mappings },
                            "ob-deck-mapping.json",
                          )
                        }
                      >
                        Export mapping
                      </button>
                      {fileButton(
                        "Import mapping",
                        ".json",
                        (f) => void importJSON(f, "mapping"),
                      )}
                    </div>
                    <button
                      className="text-button"
                      onClick={() =>
                        s.edit((c) => {
                          c.mappings[surface] = { ...mappingDefault };
                        })
                      }
                    >
                      Reset this surface
                    </button>
                    <p className="hint">
                      Continuous wall UVs span the full virtual wall; door
                      apertures contain no LED meshes. Offsets and scale may
                      sample beyond the crop and clamp at source edges.
                    </p>
                  </>
                )}
                {s.tab === "Environment" && (
                  <>
                    <h3>Light & atmosphere</h3>
                    <Field label="Lighting preset">
                      <select
                        value={s.environment}
                        onChange={(e) =>
                          s.set({
                            environment: e.target.value as typeof s.environment,
                          })
                        }
                      >
                        {["Daytime", "Dusk", "Nighttime"].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </Field>
                    {(["exposure", "skyline", "bloom"] as const).map((k) => (
                      <Field
                        key={k}
                        label={
                          {
                            exposure: "Room illumination",
                            skyline: "Skyline emission",
                            bloom: "Bloom",
                          }[k]
                        }
                      >
                        <input
                          type="range"
                          min={0}
                          max={k === "bloom" ? 2 : 4}
                          step={0.05}
                          value={s[k]}
                          onChange={(e) => s.set({ [k]: +e.target.value })}
                        />
                      </Field>
                    ))}
                    {["floor", "ceiling", "wall"].map((k) => (
                      <Num
                        key={k}
                        label={`${k} brightness`}
                        value={config.mappings[k].brightness}
                        min={0}
                        max={4}
                        step={0.1}
                        onChange={(v) =>
                          s.edit((c) => {
                            c.mappings[k].brightness = v;
                          })
                        }
                      />
                    ))}
                    <p className="hint">
                      Unlit video materials preserve source colors. Colored
                      light spill and glass reflections are approximations; the
                      skyline is illustrative.
                    </p>
                  </>
                )}
                {s.tab === "Camera" && (
                  <>
                    <h3>Viewfinder</h3>
                    <Num
                      label="Field of view °"
                      value={s.fov}
                      min={20}
                      max={110}
                      step={1}
                      onChange={(fov) => s.set({ fov })}
                    />
                    <Num
                      label="Eye height m"
                      value={s.eyeHeight}
                      min={0.3}
                      max={3}
                      onChange={(eyeHeight) => s.set({ eyeHeight })}
                    />
                    <Num
                      label="Walk speed m/s"
                      value={s.speed}
                      min={0.1}
                      max={10}
                      onChange={(speed) => s.set({ speed })}
                    />
                    <h3>Orbit focal target</h3>
                    {([0, 1, 2] as const).map((i) => (
                      <Num
                        key={i}
                        label={"Target " + ["X", "Y", "Z"][i]}
                        value={s.view.target[i]}
                        onChange={(v) => {
                          const target = [...s.view.target] as V3;
                          target[i] = v;
                          s.set({
                            view: {
                              ...s.cameraLive,
                              name: "Custom target",
                              target,
                            },
                          });
                        }}
                      />
                    ))}
                    <div className="view-list">
                      {[...presets, ...config.cameras].map((v, i) => (
                        <button
                          key={i}
                          onClick={() =>
                            s.set({ view: v, cameraMode: "orbit" })
                          }
                        >
                          <span>{String(i + 1).padStart(2, "0")}</span>
                          {v.name}
                          <span>↗</span>
                        </button>
                      ))}
                    </div>
                    <button
                      className="wide"
                      onClick={() =>
                        s.edit((c) =>
                          c.cameras.push({
                            ...s.cameraLive,
                            name: `Saved view ${c.cameras.length + 1}`,
                          }),
                        )
                      }
                    >
                      Save current view
                    </button>
                    <button
                      className="wide"
                      onClick={() =>
                        downloadJSON(
                          { version: 1, cameras: config.cameras },
                          "ob-deck-cameras.json",
                        )
                      }
                    >
                      Export saved cameras
                    </button>
                    <p className="hint">
                      Orbit: drag to rotate, right-drag to pan, wheel to zoom.
                      <br />
                      Walk: click the viewport prompt, WASD, Shift for speed,
                      Escape to release. If pointer lock is unavailable, drag
                      the viewport to look.
                    </p>
                  </>
                )}
                {s.tab === "Architecture" && (
                  <>
                    <h3>Architectural calibration</h3>
                    <Toggle
                      label="Calibration helpers"
                      value={s.calibration}
                      onChange={(calibration) => s.set({ calibration })}
                    />
                    <Toggle
                      label="Display feet / inches"
                      value={s.imperial}
                      onChange={(imperial) => s.set({ imperial })}
                    />
                    <p className="hint">
                      Dimension inputs use meters. Printed dimensions and
                      estimates are listed below. Geometry edits are
                      session-local until exported.
                    </p>
                    <div className="number-grid">
                      {(
                        [
                          "width",
                          "length",
                          "ceilingWidth",
                          "ceilingLength",
                          "height",
                          "soffit",
                          "wallStart",
                          "wallLength",
                        ] as const
                      ).map((k) => (
                        <Num
                          key={k}
                          label={k}
                          value={config[k]}
                          min={k === "wallStart" ? -100 : 0.1}
                          max={100}
                          onChange={(v) => editNumber(k, v)}
                        />
                      ))}
                    </div>
                    <Toggle
                      label="Structural details"
                      value={s.structures}
                      onChange={(structures) => s.set({ structures })}
                    />
                    <Toggle
                      label="Exterior glazing"
                      value={s.windows}
                      onChange={(windows) => s.set({ windows })}
                    />
                    <Toggle
                      label="Procedural architecture"
                      value={s.procedural}
                      onChange={(procedural) => s.set({ procedural })}
                    />
                    <h3>Object transform</h3>
                    <Field label="Object">
                      <select
                        value={s.selected || ""}
                        onChange={(e) =>
                          s.set({ selected: e.target.value, calibration: true })
                        }
                      >
                        <option value="">Select object…</option>
                        {[
                          "LED_Floor",
                          "LED_Ceiling",
                          ...config.wallSections.map((a) => a.id),
                          "BuildingCore",
                          "BuildingShell",
                          "StructuralColumns",
                          "Soffits",
                          "CeilingBeams",
                          "WindowFrames",
                          "GlassPanels",
                          "DoorOpenings",
                          "SurroundingFloors",
                          "StairAccess",
                          ...(assets.model ? ["Imported_Model"] : []),
                        ].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </Field>
                    <div className="segmented">
                      {(["translate", "rotate", "scale"] as const).map((v) => (
                        <button
                          key={v}
                          className={s.gizmo === v ? "active" : ""}
                          onClick={() => s.set({ gizmo: v })}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    {s.selected && (
                      <>
                        <p className="hint">
                          Drag the viewport gizmo. Changes are saved when
                          released.
                        </p>
                        <button
                          onClick={() =>
                            s.edit((c) => {
                              delete c.transforms[s.selected!];
                            })
                          }
                        >
                          Reset selected transform
                        </button>
                      </>
                    )}
                    <details>
                      <summary>Wall sections & apertures</summary>
                      <p className="hint">
                        Sections are positioned along Z. Header sections span
                        over openings. Changing boundaries changes the actual
                        empty gaps.
                      </p>
                      {config.wallSections.map((a, i) => (
                        <div className="wall-editor" key={a.id}>
                          <strong>{a.id}</strong>
                          <div className="number-grid">
                            {(
                              ["start", "length", "bottom", "top"] as const
                            ).map((k) => (
                              <Num
                                key={k}
                                label={k}
                                value={a[k]}
                                min={
                                  k === "start"
                                    ? -100
                                    : k === "bottom"
                                      ? 0
                                      : 0.01
                                }
                                max={100}
                                onChange={(v) =>
                                  s.edit((c) => {
                                    const row = c.wallSections[i];
                                    if (
                                      (k === "top" && v <= row.bottom) ||
                                      (k === "bottom" && v >= row.top)
                                    )
                                      return;
                                    row[k] = v;
                                  })
                                }
                              />
                            ))}
                          </div>
                          <button
                            className="text-button"
                            onClick={() =>
                              s.edit((c) => {
                                c.wallSections.splice(i, 1);
                              })
                            }
                          >
                            Remove section
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          s.edit((c) =>
                            c.wallSections.push({
                              id: `Wall_${Date.now()}`,
                              start: 0,
                              length: 1,
                              bottom: 0,
                              top: c.height,
                            }),
                          )
                        }
                      >
                        Add section
                      </button>
                    </details>
                    <details>
                      <summary>Drawing reference overlay</summary>
                      {fileButton(
                        "Load plan / section image",
                        "image/*",
                        (file) => {
                          const url = URL.createObjectURL(file);
                          new THREE.TextureLoader().load(
                            url,
                            (texture) => {
                              assets.reference?.dispose();
                              setAssets((a) => ({
                                ...a,
                                reference: texture,
                                referenceName: file.name,
                              }));
                              URL.revokeObjectURL(url);
                            },
                            undefined,
                            () => {
                              URL.revokeObjectURL(url);
                              setNotice("Could not load reference image.");
                            },
                          );
                        },
                      )}
                      {assets.reference && (
                        <>
                          <p className="hint">{assets.referenceName}</p>
                          <Toggle
                            label="Visible in calibration"
                            value={assets.referenceVisible}
                            onChange={(referenceVisible) =>
                              setAssets((a) => ({ ...a, referenceVisible }))
                            }
                          />
                          <Num
                            label="Reference width m"
                            value={assets.referenceScale}
                            min={0.1}
                            max={200}
                            onChange={(referenceScale) =>
                              setAssets((a) => ({ ...a, referenceScale }))
                            }
                          />
                          <Num
                            label="Opacity"
                            value={assets.referenceOpacity}
                            min={0}
                            max={1}
                            onChange={(referenceOpacity) =>
                              setAssets((a) => ({ ...a, referenceOpacity }))
                            }
                          />
                          {([0, 1, 2] as const).map((i) => (
                            <Num
                              key={i}
                              label={"Position " + ["X", "Y", "Z"][i]}
                              value={assets.referencePosition[i]}
                              onChange={(v) =>
                                setAssets((a) => {
                                  const p = [...a.referencePosition] as V3;
                                  p[i] = v;
                                  return { ...a, referencePosition: p };
                                })
                              }
                            />
                          ))}
                          {([0, 1, 2] as const).map((i) => (
                            <Num
                              key={i}
                              label={"Rotation " + ["X", "Y", "Z"][i] + " °"}
                              value={
                                (assets.referenceRotation[i] * 180) / Math.PI
                              }
                              min={-360}
                              max={360}
                              onChange={(v) =>
                                setAssets((a) => {
                                  const r = [...a.referenceRotation] as V3;
                                  r[i] = (v * Math.PI) / 180;
                                  return { ...a, referenceRotation: r };
                                })
                              }
                            />
                          ))}
                        </>
                      )}
                    </details>
                    <details>
                      <summary>Import architectural model</summary>
                      <p className="hint">
                        GLB or self-contained glTF with embedded resources.
                        Assumes meters. Original model hierarchy is preserved.
                        Disable procedural architecture to replace it.
                      </p>
                      {fileButton(
                        "Import GLB / glTF",
                        ".glb,.gltf",
                        async (file) => {
                          try {
                            setNotice("Loading architectural model…");
                            const model = await loadModel(file);
                            assets.model?.traverse((o) => {
                              if (o instanceof THREE.Mesh) {
                                o.geometry.dispose();
                                const mats = Array.isArray(o.material)
                                  ? o.material
                                  : [o.material];
                                mats.forEach((m) => m.dispose());
                              }
                            });
                            setAssets((a) => ({ ...a, model }));
                            s.set({
                              calibration: true,
                              selected: "Imported_Model",
                            });
                            setNotice(
                              "Model loaded. Select Imported_Model to align it.",
                            );
                          } catch {
                            setNotice(
                              "Model import failed. Use GLB or embedded-resource glTF.",
                            );
                          }
                        },
                      )}
                      {assets.model && (
                        <button
                          onClick={() =>
                            setAssets((a) => ({ ...a, model: null }))
                          }
                        >
                          Remove imported model
                        </button>
                      )}
                    </details>
                    <details>
                      <summary>Drawing measurements & confidence</summary>
                      {config.measurements.map((a, i) => (
                        <div className="measurement" key={i}>
                          <strong>{a.feature}</strong>
                          <span className={"badge " + a.status}>
                            {a.status} · {a.confidence}
                          </span>
                          <p>
                            {a.value > 0
                              ? formatDimension(a.value, s.imperial) + " · "
                              : ""}
                            {a.source}
                          </p>
                          <p>{a.note}</p>
                        </div>
                      ))}
                    </details>
                    <div className="button-row">
                      <button
                        onClick={() =>
                          downloadJSON(config, "ob-deck-scene.json")
                        }
                      >
                        Export scene
                      </button>
                      {fileButton(
                        "Import scene",
                        ".json",
                        (f) => void importJSON(f, "scene"),
                      )}
                    </div>
                    <div className="button-row">
                      <button disabled={!s.history.length} onClick={s.undo}>
                        <Undo2 size={14} />
                        Undo
                      </button>
                      <button onClick={s.reset}>Reset defaults</button>
                    </div>
                    <p className="hint">
                      Scene JSON includes dimensions, section geometry, object
                      transforms, mapping, measurements and saved cameras.
                      Media, imported models and reference images must be
                      reloaded.
                    </p>
                  </>
                )}
              </div>
              <div className="sidebar-bottom">
                <span className="live-dot" /> LOCAL FILES · NO SERVER UPLOAD
              </div>
            </aside>
          )}
        </>
      )}
      {(notice || media.error) && (
        <div
          className="toast"
          role="status"
          onClick={() => {
            setNotice("");
            useMedia.setState({ error: "" });
          }}
        >
          {media.error || notice}
        </div>
      )}
    </main>
  );
}
