import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useStore } from "../stores/scene";
import { CITY_GROUND, makeCity } from "../config/context";

function facadeTextures(style: number) {
  const diffuse = document.createElement("canvas"),
    glow = document.createElement("canvas");
  diffuse.width = glow.width = 256;
  diffuse.height = glow.height = 512;
  const d = diffuse.getContext("2d")!,
    g = glow.getContext("2d")!;
  d.fillStyle = ["#70665c", "#3e5262", "#273e55"][style];
  d.fillRect(0, 0, 256, 512);
  g.fillStyle = "#000";
  g.fillRect(0, 0, 256, 512);
  let seed = 100 + style;
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let row = 0; row < 64; row++)
    for (let col = 0; col < 32; col++) {
      const x = col * 8 + 2,
        y = row * 8 + 2,
        lit = rnd() > 0.42;
      d.fillStyle = lit ? ["#a9a091", "#8396a3", "#7395b1"][style] : "#253746";
      d.fillRect(x, y, style === 0 ? 4 : 5, 5);
      if (lit) {
        g.fillStyle = rnd() > 0.22 ? "#c5a473" : "#7d9fc2";
        g.globalAlpha = 0.2 + rnd() * 0.8;
        g.fillRect(x, y, style === 0 ? 4 : 5, 5);
      }
      if (style === 1 && row % 9 === 0) {
        d.fillStyle = "#6c7781";
        d.fillRect(col * 8, y + 5, 8, 1);
      }
    }
  // Roof UVs sample this dark texel rather than wrapping window rows onto roofs.
  d.fillStyle = "#353c43";
  d.fillRect(0, 0, 2, 2);
  g.globalAlpha = 1;
  g.fillStyle = "#000";
  g.fillRect(0, 0, 2, 2);
  const map = new THREE.CanvasTexture(diffuse),
    emissiveMap = new THREE.CanvasTexture(glow);
  for (const t of [map, emissiveMap]) {
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
  }
  return { map, emissiveMap };
}
function cityGeometry(style: number) {
  const parts: THREE.BufferGeometry[] = [];
  const add = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    tint: THREE.Color,
  ) => {
    const part = new THREE.BoxGeometry(w, h, d);
    const uv = part.attributes.uv;
    for (let face = 0; face < 6; face++)
      for (let j = 0; j < 4; j++) {
        const i = face * 4 + j;
        if (face === 2 || face === 3) uv.setXY(i, 0.001, 0.999);
        else
          uv.setXY(
            i,
            (uv.getX(i) * (face < 2 ? d : w)) / 80,
            (uv.getY(i) * h) / 200,
          );
      }
    part.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(
        Array.from({ length: 24 }, () => [tint.r, tint.g, tint.b]).flat(),
        3,
      ),
    );
    part.translate(x, y, z);
    parts.push(part);
  };
  makeCity()
    .filter((b) => b.style === style)
    .forEach((b, i) => {
      const color = new THREE.Color().setHSL(
        0.07 + (i % 5) * 0.035,
        0.06,
        0.7 + (i % 7) * 0.035,
      );
      const base = b.height / (1 + b.steps * 0.1);
      let top = CITY_GROUND;
      add(b.x, top + base / 2, b.z, b.width, base, b.depth, color);
      top += base;
      for (let k = 1; k <= b.steps; k++) {
        const height = base * 0.1;
        add(
          b.x,
          top + height / 2,
          b.z,
          b.width * Math.pow(0.74, k),
          height,
          b.depth * Math.pow(0.74, k),
          color,
        );
        top += height;
      }
      add(b.x, top + 2, b.z, b.width * 0.28, 4, b.depth * 0.26, color);
      if (b.spire) {
        add(b.x, top + 9, b.z, 2.4, 18, 2.4, color);
        add(b.x, top + 25, b.z, 0.7, 22, 0.7, color);
      }
    });
  const geometry = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  geometry.computeBoundingSphere();
  return geometry;
}
function CityLayer({ style, glow }: { style: number; glow: number }) {
  const textures = useMemo(() => facadeTextures(style), [style]);
  const geometry = useMemo(() => cityGeometry(style), [style]);
  useEffect(
    () => () => {
      geometry.dispose();
      textures.map.dispose();
      textures.emissiveMap.dispose();
    },
    [geometry, textures],
  );
  return (
    <mesh
      geometry={geometry}
      name={`City_${["MasonrySetbacks", "OfficeTowers", "GlassTowers"][style]}`}
    >
      <meshStandardMaterial
        {...textures}
        vertexColors
        emissive="#ffffff"
        emissiveIntensity={glow}
        metalness={style === 2 ? 0.45 : 0.12}
        roughness={style === 2 ? 0.4 : 0.8}
      />
    </mesh>
  );
}
function makeSky(day: boolean, night: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!,
    gradient = ctx.createLinearGradient(0, 0, 0, 512);
  const colors = day
    ? ["#315b91", "#86b1d1", "#dce5e6", "#aab6bb"]
    : night
      ? ["#030919", "#091e48", "#314567", "#192c45"]
      : ["#13264f", "#65779a", "#e8b09a", "#7a889c"];
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.43, colors[1]);
  gradient.addColorStop(0.5, colors[2]);
  gradient.addColorStop(1, colors[3]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}
export default function CityEnvironment() {
  const environment = useStore((s) => s.environment),
    exposure = useStore((s) => s.exposure),
    brightness = useStore((s) => s.skyline);
  const day = environment === "Daytime",
    night = environment === "Nighttime";
  const scene = useThree((s) => s.scene),
    sky = useMemo(() => makeSky(day, night), [day, night]);
  useEffect(() => {
    scene.background = sky;
    scene.environment = sky;
    scene.environmentIntensity = 0.25;
    scene.fog = new THREE.FogExp2(
      day ? "#bccad5" : night ? "#172944" : "#8592a8",
      day ? 0.00048 : night ? 0.0003 : 0.0004,
    );
    return () => {
      scene.background = null;
      scene.environment = null;
      scene.fog = null;
      sky.dispose();
    };
  }, [scene, sky, day, night]);
  const glow = brightness * (day ? 0.03 : night ? 1.7 : 0.6);
  return (
    <group name="Environment">
      <ambientLight intensity={exposure * (day ? 1.25 : night ? 0.4 : 0.85)} />
      <hemisphereLight args={["#b7d1ff", "#504039", exposure * 0.7]} />
      <directionalLight
        position={[180, 220, -150]}
        intensity={exposure * (day ? 2 : night ? 0.25 : 1.1)}
        color={day ? "#fff1d7" : night ? "#a6c7ff" : "#ffc5a0"}
      />
      <group name="Skyline">
        {[0, 1, 2].map((style) => (
          <CityLayer key={style} style={style} glow={glow} />
        ))}
        <mesh
          position={[0, CITY_GROUND - 0.1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[4500, 4500]} />
          <meshStandardMaterial
            color={night ? "#101a26" : "#5c6570"}
            roughness={1}
          />
        </mesh>
        {/* Avenues give depth below the deck without thousands of extra meshes. */}
        {Array.from({ length: 37 }, (_, i) => (
          <mesh
            key={i}
            position={[(i - 18) * 76 + 38, CITY_GROUND + 0.02, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[10, 3400]} />
            <meshStandardMaterial
              color="#29333d"
              emissive="#b79560"
              emissiveIntensity={glow * 0.14}
            />
          </mesh>
        ))}
      </group>
      <pointLight
        position={[-2, 3, -3]}
        intensity={12 * exposure}
        distance={15}
        color="#b076ce"
      />
      <pointLight
        position={[1, 3, 8]}
        intensity={10 * exposure}
        distance={14}
        color="#f3ad91"
      />
    </group>
  );
}
