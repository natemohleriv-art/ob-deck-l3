import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  TransformControls,
  Html,
  Edges,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useStore } from "../stores/scene";
import { useMedia } from "../stores/media";
import { mappingDefault, formatDimension } from "../config/scene";
import { mapUV, wallUV } from "../utils/mapping";
import { makePattern } from "../utils/patterns";
import type { V3 } from "../types";
export type Assets = {
  model: THREE.Group | null;
  reference: THREE.Texture | null;
  referenceName: string;
  referencePosition: V3;
  referenceRotation: V3;
  referenceScale: number;
  referenceOpacity: number;
  referenceVisible: boolean;
};
export async function loadModel(file: File) {
  const bytes = await file.arrayBuffer();
  return new Promise<THREE.Group>((resolve, reject) =>
    new GLTFLoader().parse(bytes, "", (g) => resolve(g.scene), reject),
  );
}
function Editable({ id, children }: { id: string; children: ReactNode }) {
  const s = useStore();
  const ref = useRef<THREE.Group>(null);
  const t = s.config.transforms[id];
  const active = s.calibration && !s.presentation && s.selected === id;
  const group = (
    <group
      ref={ref}
      name={id}
      position={t?.position || [0, 0, 0]}
      rotation={t?.rotation || [0, 0, 0]}
      scale={t?.scale || [1, 1, 1]}
      onClick={(e) => {
        if (s.calibration) {
          e.stopPropagation();
          s.set({ selected: id });
        }
      }}
    >
      {children}
    </group>
  );
  return active ? (
    <TransformControls
      mode={s.gizmo}
      onMouseUp={() => {
        const o = ref.current;
        if (o)
          s.edit((c) => {
            c.transforms[id] = {
              position: o.position.toArray() as V3,
              rotation: [o.rotation.x, o.rotation.y, o.rotation.z],
              scale: o.scale.toArray() as V3,
            };
          });
      }}
    >
      {group}
    </TransformControls>
  ) : (
    group
  );
}
function Box({
  p,
  size,
  color = "#343b45",
  metal = 0.5,
}: {
  p: V3;
  size: V3;
  color?: string;
  metal?: number;
}) {
  return (
    <mesh position={p}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={metal} />
    </mesh>
  );
}
function LED({
  id,
  surface,
  width,
  height,
  position,
  rotation,
  wallStart,
  bottom = 0,
}: {
  id: string;
  surface: string;
  width: number;
  height: number;
  position: V3;
  rotation: V3;
  wallStart?: number;
  bottom?: number;
}) {
  const s = useStore(),
    items = useMedia((x) => x.items);
  const sourceId =
    s.mode === "unified"
      ? "unified"
      : surface === "wall" && s.wallMode === "sections"
        ? id
        : surface;
  const media = items[sourceId];
  const m = s.config.mappings[surface] || mappingDefault;
  const test = useMemo(
    () => makePattern(surface, s.pattern),
    [surface, s.pattern],
  );
  useEffect(() => () => test.dispose(), [test]);
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, height);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      let u = uv.getX(i),
        v = uv.getY(i);
      if (
        surface === "wall" &&
        (s.wallMode === "continuous" || s.mode === "unified") &&
        wallStart !== undefined
      )
        [u, v] = wallUV(
          wallStart + (1 - u) * width,
          bottom + v * height,
          s.config.wallStart,
          s.config.wallLength,
          s.config.height,
        );
      const out = mapUV(u, v, m);
      uv.setXY(i, ...out);
    }
    return g;
  }, [
    width,
    height,
    m,
    surface,
    wallStart,
    bottom,
    s.wallMode,
    s.mode,
    s.config.wallStart,
    s.config.wallLength,
    s.config.height,
  ]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <Editable id={id}>
      <mesh
        name={id}
        position={position}
        rotation={rotation}
        geometry={geometry}
      >
        <meshBasicMaterial
          map={media?.width ? media.texture : test}
          color={new THREE.Color().setScalar(m.brightness)}
          toneMapped={false}
        />
        {s.calibration && !s.presentation && (
          <>
            <Edges color="#b7f7d0" />
            <Html center distanceFactor={9}>
              <span className="scene-label">
                {id} · {formatDimension(width, s.imperial)} ×{" "}
                {formatDimension(height, s.imperial)}
              </span>
            </Html>
          </>
        )}
      </mesh>
    </Editable>
  );
}
function Architecture() {
  const s = useStore(),
    c = s.config,
    w = c.width / 2,
    L = c.length / 2,
    h = c.height;
  const bays = Array.from({ length: 13 }, (_, i) => -L + (i * c.length) / 12);
  const columns = [-L, -L / 2, 0, L / 2, L];
  return (
    <group name="Architecture">
      <Editable id="SurroundingFloors">
        <Box
          p={[0.35, -0.22, 0]}
          size={[c.width + 2.7, 0.4, c.length + 2]}
          color="#373c43"
        />
        <Box p={[-w - 2, -0.22, 0]} size={[3, 0.4, 18]} color="#454951" />
      </Editable>
      {s.structures && (
        <>
          <Editable id="StructuralColumns">
            {columns.map((z, i) => (
              <Box
                key={i}
                p={[w + 1.05, h / 2, z]}
                size={[0.58, h, 0.65]}
                color="#454c57"
              />
            ))}
            {[-L, L].map((z) => (
              <Box key={z} p={[-w - 0.38, h / 2, z]} size={[0.65, h, 0.65]} />
            ))}
          </Editable>
          <Editable id="Soffits">
            <Box
              p={[w + 0.53, c.soffit + 0.15, 0]}
              size={[1.1, 0.3, c.length + 1]}
            />
            <Box p={[-w - 0.4, h + 0.1, 0]} size={[0.8, 0.2, c.length + 1]} />
          </Editable>
          <Editable id="CeilingBeams">
            <Box
              p={[w + 1.05, h * 0.72, 0]}
              size={[0.45, 0.48, c.length + 1]}
            />
            {[-L, L].map((z) => (
              <Box
                key={z}
                p={[0.5, h * 0.72, z]}
                size={[c.width + 2, 0.48, 0.3]}
              />
            ))}
          </Editable>
        </>
      )}
      {s.windows && (
        <group name="ExteriorFacade">
          <Editable id="WindowFrames">
            {bays.map((z) => (
              <Box
                key={z}
                p={[w + 1.2, h / 2, z]}
                size={[0.12, h, 0.095]}
                color="#57616d"
              />
            ))}
            {[-L - 0.15, L + 0.15].flatMap((z) =>
              [-w, -w / 2, 0, w / 2, w, w + 1.2].map((x) => (
                <Box
                  key={`${z}-${x}`}
                  p={[x, h / 2, z]}
                  size={[0.09, h, 0.12]}
                  color="#57616d"
                />
              )),
            )}
          </Editable>
          <Editable id="GlassPanels">
            <mesh
              position={[w + 1.24, h / 2, 0]}
              rotation={[0, -Math.PI / 2, 0]}
            >
              <planeGeometry args={[c.length, h]} />
              <meshPhysicalMaterial
                color="#accde0"
                transparent
                opacity={0.1}
                metalness={0.25}
                roughness={0.15}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            {[-L - 0.18, L + 0.18].map((z) => (
              <mesh key={z} position={[0.5, h / 2, z]}>
                <planeGeometry args={[c.width + 2, h]} />
                <meshPhysicalMaterial
                  color="#abc9df"
                  transparent
                  opacity={0.08}
                  roughness={0.2}
                  metalness={0.2}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </Editable>
        </group>
      )}
      <Editable id="DoorOpenings">
        {c.wallSections
          .filter((a) => a.bottom > 1)
          .map((a) => (
            <group key={a.id}>
              <Box
                p={[-w - 0.18, a.bottom / 2, a.start - 0.09]}
                size={[0.4, a.bottom, 0.18]}
                color="#292d35"
              />
              <Box
                p={[-w - 0.18, a.bottom / 2, a.start + a.length + 0.09]}
                size={[0.4, a.bottom, 0.18]}
                color="#292d35"
              />
              <Box
                p={[-w - 0.18, a.bottom - 0.09, a.start + a.length / 2]}
                size={[0.4, 0.18, a.length]}
                color="#292d35"
              />
              <Box
                p={[-w - 2, 1.45, a.start + a.length / 2]}
                size={[0.1, 2.9, a.length]}
                color="#20242c"
              />
            </group>
          ))}
      </Editable>
      <Editable id="StairAccess">
        {Array.from({ length: 10 }, (_, i) => (
          <Box
            key={i}
            p={[-w - 1.3, -i * 0.17 - 0.09, 10 + i * 0.28]}
            size={[1.8, 0.18, 0.29]}
            color="#454953"
          />
        ))}
      </Editable>
    </group>
  );
}
function Skyline() {
  const s = useStore();
  const night = s.environment === "Nighttime",
    day = s.environment === "Daytime";
  const scene = useThree((t) => t.scene);
  useEffect(() => {
    scene.background = new THREE.Color(
      day ? "#a9c5dc" : night ? "#0b1428" : "#9e90a4",
    );
    scene.fog = new THREE.Fog(
      day ? "#bbc8d2" : night ? "#17243c" : "#9492a7",
      80,
      500,
    );
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, day, night]);
  const buildings = useMemo(() => {
    let seed = 93;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    return Array.from({ length: 180 }, () => {
      const angle = rand() * Math.PI * 2,
        r = 70 + rand() * 330,
        height = 12 + rand() * 100;
      return {
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        h: height,
        w: 5 + rand() * 12,
        t: rand(),
      };
    });
  }, []);
  return (
    <group name="Environment">
      <ambientLight intensity={s.exposure * (day ? 1.6 : night ? 0.32 : 0.8)} />
      <hemisphereLight args={["#c6d6ff", "#3a2235", s.exposure * 0.7]} />
      <directionalLight
        position={[30, 50, -30]}
        intensity={s.exposure * (day ? 2 : 0.6)}
        color={day ? "#fff1d7" : "#c2b8ed"}
      />
      <group name="Skyline">
        {buildings.map((b, i) => (
          <group key={i} position={[b.x, -120 + b.h / 2, b.z]}>
            <mesh>
              <boxGeometry args={[b.w, b.h, b.w]} />
              <meshStandardMaterial
                color={day ? "#738399" : "#293953"}
                emissive={night ? "#7d9ebc" : "#53637a"}
                emissiveIntensity={s.skyline * (night ? 0.12 : 0.08)}
                roughness={0.65}
              />
            </mesh>
            {b.t > 0.5 && (
              <mesh position={[0, b.h / 2 + 3, 0]}>
                <boxGeometry args={[b.w * 0.6, 6, b.w * 0.6]} />
                <meshStandardMaterial color="#435269" />
              </mesh>
            )}
            {night &&
              Array.from({ length: 8 }, (_, j) => (
                <mesh
                  key={j}
                  position={[0, -b.h * 0.4 + (j * b.h) / 10, b.w / 2 + 0.02]}
                >
                  <planeGeometry args={[b.w * 0.7, 0.5]} />
                  <meshBasicMaterial
                    color={b.t > 0.7 ? "#ffce8e" : "#89a6df"}
                    colorWrite
                    toneMapped={false}
                  />
                </mesh>
              ))}
          </group>
        ))}
      </group>
      <pointLight
        position={[-2, 3, -3]}
        intensity={12 * s.exposure}
        distance={15}
        color="#b076ce"
      />
      <pointLight
        position={[1, 3, 8]}
        intensity={10 * s.exposure}
        distance={14}
        color="#f3ad91"
      />
    </group>
  );
}
function CameraRig() {
  const s = useStore(),
    { camera, gl } = useThree();
  const orbit = useRef<any>(null),
    walkActive = useRef(false),
    dragging = useRef(false);
  const keys = useRef(new Set<string>()),
    transition = useRef(true),
    target = useRef(new THREE.Vector3(...s.view.target));
  const clock = useRef(0);
  const dir = new THREE.Vector3(),
    right = new THREE.Vector3();
  useEffect(() => {
    transition.current = true;
    target.current.set(...s.view.target);
    if (orbit.current) orbit.current.target.copy(target.current);
  }, [s.view, s.cameraMode]);
  useEffect(() => {
    (camera as THREE.PerspectiveCamera).fov = s.fov;
    camera.updateProjectionMatrix();
  }, [s.fov, camera]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.matches("input,select,textarea")) return;
      keys.current.add(e.code);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const clear = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);
  useEffect(() => {
    if (s.cameraMode === "walk") camera.position.y = s.eyeHeight;
  }, [s.cameraMode, s.eyeHeight, camera]);
  useFrame((_, dt) => {
    if (transition.current) {
      camera.position.lerp(
        new THREE.Vector3(...s.view.position),
        1 - Math.exp(-dt * 5),
      );
      camera.lookAt(target.current);
      if (
        camera.position.distanceTo(new THREE.Vector3(...s.view.position)) < 0.02
      )
        transition.current = false;
    } else if (s.cameraMode === "walk" && walkActive.current) {
      camera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      right.crossVectors(dir, camera.up).normalize();
      const k = keys.current;
      const d = s.speed * dt * (k.has("ShiftLeft") ? 2.5 : 1);
      camera.position.addScaledVector(
        dir,
        ((k.has("KeyW") ? 1 : 0) - (k.has("KeyS") ? 1 : 0)) * d,
      );
      camera.position.addScaledVector(
        right,
        ((k.has("KeyD") ? 1 : 0) - (k.has("KeyA") ? 1 : 0)) * d,
      );
      camera.position.y = Math.max(0.3, s.eyeHeight);
      camera.position.x = THREE.MathUtils.clamp(
        camera.position.x,
        -s.config.width / 2 + 0.15,
        s.config.width / 2 + 1,
      );
      camera.position.z = THREE.MathUtils.clamp(
        camera.position.z,
        -s.config.length / 2 + 0.2,
        s.config.length / 2 - 0.2,
      );
    }
    if (s.cameraMode === "orbit")
      camera.position.y = Math.max(0.12, camera.position.y);
    clock.current += dt;
    if (clock.current > 0.3) {
      clock.current = 0;
      camera.getWorldDirection(dir);
      s.set({
        cameraLive: {
          name: "Current view",
          position: camera.position.toArray() as V3,
          target:
            s.cameraMode === "orbit" && orbit.current
              ? orbit.current.target.toArray()
              : (camera.position
                  .clone()
                  .addScaledVector(dir, 8)
                  .toArray() as V3),
        },
      });
    }
  });
  useEffect(() => {
    if (s.cameraMode !== "walk") return;
    const el = gl.domElement;
    el.tabIndex = 0;
    const activate = async () => {
      walkActive.current = true;
      el.focus();
      try {
        await el.requestPointerLock();
      } catch {
        /* Embedded browsers may reject pointer lock; drag look stays available. */
      }
    };
    const down = () => {
      walkActive.current = true;
      dragging.current = true;
      el.focus();
    };
    const up = () => {
      dragging.current = false;
    };
    const move = (e: MouseEvent) => {
      if (document.pointerLockElement !== el && !dragging.current) return;
      const rotation = new THREE.Euler().setFromQuaternion(
        camera.quaternion,
        "YXZ",
      );
      rotation.y -= e.movementX * 0.002;
      rotation.x = THREE.MathUtils.clamp(
        rotation.x - e.movementY * 0.002,
        -Math.PI / 2 + 0.02,
        Math.PI / 2 - 0.02,
      );
      camera.quaternion.setFromEuler(rotation);
    };
    const stop = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        walkActive.current = false;
        dragging.current = false;
        keys.current.clear();
      }
    };
    const button = document.getElementById("walk-lock");
    button?.addEventListener("click", activate);
    el.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    window.addEventListener("mousemove", move);
    window.addEventListener("keydown", stop);
    return () => {
      button?.removeEventListener("click", activate);
      el.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("keydown", stop);
      walkActive.current = false;
      if (document.pointerLockElement === el) document.exitPointerLock();
    };
  }, [s.cameraMode, gl, camera]);
  return s.cameraMode === "orbit" ? (
    <OrbitControls
      ref={orbit}
      makeDefault
      enableDamping
      minDistance={0.2}
      maxDistance={90}
      maxPolarAngle={Math.PI - 0.01}
      onStart={() => (transition.current = false)}
    />
  ) : null;
}
function World({ assets }: { assets: Assets }) {
  const s = useStore(),
    c = s.config;
  return (
    <group name="OBDeck_L3">
      <Skyline />
      {s.procedural && <Architecture />}
      <group name="LED">
        <LED
          id="LED_Floor"
          surface="floor"
          width={c.width}
          height={c.length}
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
        <LED
          id="LED_Ceiling"
          surface="ceiling"
          width={c.ceilingWidth}
          height={c.ceilingLength}
          position={[0, c.height, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        {c.wallSections.map((a) => (
          <LED
            key={a.id}
            id={a.id}
            surface="wall"
            width={a.length}
            height={a.top - a.bottom}
            position={[
              -c.width / 2 - 0.0508,
              (a.top + a.bottom) / 2,
              a.start + a.length / 2,
            ]}
            rotation={[0, Math.PI / 2, 0]}
            wallStart={a.start}
            bottom={a.bottom}
          />
        ))}
      </group>
      {assets.model && (
        <Editable id="Imported_Model">
          <primitive object={assets.model} />
        </Editable>
      )}
      {s.calibration && !s.presentation && (
        <group name="Helpers">
          <gridHelper
            args={[60, 60, "#80b8a8", "#414d5b"]}
            position={[0, 0.015, 0]}
          />
          <axesHelper args={[4]} />
          {assets.reference && assets.referenceVisible && (
            <mesh
              position={assets.referencePosition}
              rotation={assets.referenceRotation}
              scale={assets.referenceScale}
            >
              <planeGeometry
                args={[
                  1,
                  (assets.reference.image?.height || 1) /
                    (assets.reference.image?.width || 1),
                ]}
              />
              <meshBasicMaterial
                map={assets.reference}
                transparent
                opacity={assets.referenceOpacity}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          )}
        </group>
      )}
      <CameraRig />
      {s.bloom > 0 && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={s.bloom} luminanceThreshold={0.8} mipmapBlur />
        </EffectComposer>
      )}
    </group>
  );
}
export default function Scene({ assets }: { assets: Assets }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [2.5, 1.7, 13.2], fov: 65, near: 0.05, far: 1000 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NoToneMapping;
      }}
    >
      <World assets={assets} />
    </Canvas>
  );
}
