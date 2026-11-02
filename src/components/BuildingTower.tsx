import { useMemo } from "react";
import { useStore } from "../stores/scene";

// Reference-inspired massing only. LED dimensions remain in SceneConfig.
export default function BuildingTower() {
  const c = useStore((s) => s.config);
  const night = useStore((s) => s.environment === "Nighttime");
  const uniforms = useMemo(
    () => ({ night: { value: night ? 1 : 0 } }),
    [night],
  );
  const parts: {
    name: string;
    x: number;
    z: number;
    bottom: number;
    top: number;
    width: number;
    depth: number;
    sign?: boolean;
  }[] = [
    {
      name: "Street podium",
      x: -12,
      z: 0,
      bottom: -290,
      top: -266,
      width: 58,
      depth: 58,
    },
    {
      name: "Podium upper setback",
      x: -12,
      z: 0,
      bottom: -266,
      top: -253,
      width: 49,
      depth: 49,
    },
    {
      name: "Main tower",
      x: -9,
      z: 5,
      bottom: -253,
      top: -111,
      width: 29,
      depth: 31,
    },
    {
      name: "West wing",
      x: -30,
      z: -10,
      bottom: -253,
      top: -130,
      width: 17,
      depth: 25,
    },
    {
      name: "East wing",
      x: 8,
      z: 10,
      bottom: -253,
      top: -141,
      width: 13,
      depth: 27,
    },
    {
      name: "Shoulder",
      x: -9,
      z: 0,
      bottom: -111,
      top: -91,
      width: 26,
      depth: 30,
    },
    {
      name: "Slender upper shaft",
      x: -8,
      z: 0,
      bottom: -91,
      top: -24,
      width: 12,
      depth: 15,
    },
    {
      name: "Crown lower collar",
      x: -7,
      z: 0,
      bottom: -24,
      top: -16,
      width: 24,
      depth: 25,
      sign: true,
    },
    {
      name: "Observation terrace",
      x: -6,
      z: 0,
      bottom: -16,
      top: -12,
      width: 32,
      depth: 34,
    },
    {
      name: "Recessed observation level",
      x: -8,
      z: 0,
      bottom: -12,
      top: -5,
      width: 22,
      depth: 26,
    },
    {
      name: "Gallery support crown",
      x: -5,
      z: 0,
      bottom: -5,
      top: -0.42,
      width: c.width + 16,
      depth: c.length + 3,
    },
    {
      name: "Upper crown",
      x: -5,
      z: 0,
      bottom: c.height + 0.25,
      top: c.height + 13,
      width: c.width + 16,
      depth: c.length + 3,
    },
  ];
  return (
    <group name="ReferenceInspiredTower">
      {parts.map((p) => (
        <mesh
          key={p.name}
          name={p.name}
          position={[p.x, (p.top + p.bottom) / 2, p.z]}
        >
          <boxGeometry args={[p.width, p.top - p.bottom, p.depth]} />
          {p.sign ? (
            <meshStandardMaterial
              color="#97235f"
              emissive="#ed217d"
              emissiveIntensity={night ? 0.65 : 0.25}
              metalness={0.3}
              roughness={0.4}
            />
          ) : (
            <shaderMaterial
              key={String(night)}
              uniforms={uniforms}
              toneMapped={false}
              vertexShader={`varying vec3 pos; varying vec3 norm; void main(){vec4 p=modelMatrix*vec4(position,1.);pos=p.xyz;norm=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*p;}`}
              fragmentShader={`uniform float night; varying vec3 pos; varying vec3 norm;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        void main(){float side=abs(norm.x)>.5?pos.z:pos.x; vec2 cell=vec2(side/1.55,pos.y/3.5);vec2 f=fract(cell);
        float frame=step(f.x,.10)+step(f.y,.06);float lit=step(.55,hash(floor(cell)));
        vec3 glass=mix(vec3(.10,.19,.28),vec3(.035,.07,.12),night);
        glass+=vec3(.55,.38,.17)*lit*step(.25,f.x)*step(f.x,.77)*step(.2,f.y)*step(f.y,.8)*mix(.35,.95,night);
        vec3 col=mix(glass,vec3(.28,.39,.48),clamp(frame,0.,1.));
        col*=.7+.3*max(dot(norm,normalize(vec3(1.,1.,.7))),0.);
        if(abs(norm.y)>.5)col=vec3(.20,.26,.31);gl_FragColor=vec4(col,1.);}`}
            />
          )}
        </mesh>
      ))}
      {/* Thin overhanging slabs articulate the crown without covering gallery glazing. */}
      {[-16, -5, c.height + 0.4, c.height + 13.1].map((y, i) => (
        <mesh key={i} position={[-5, y, 0]}>
          <boxGeometry args={[c.width + 17, 0.35, c.length + 4]} />
          <meshStandardMaterial
            color="#8c9ba7"
            metalness={0.65}
            roughness={0.3}
          />
        </mesh>
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh
          key={i}
          position={[-16 + i * 2.7, c.height + 13.65, -c.length / 2 - 1.5]}
        >
          <boxGeometry args={[0.1, 1.3, 0.12]} />
          <meshStandardMaterial
            color="#779bcc"
            emissive="#9657de"
            emissiveIntensity={night ? 0.8 : 0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

