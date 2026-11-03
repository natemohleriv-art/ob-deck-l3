import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../stores/scene";

const fragment = `
uniform float time;
uniform float surface;
varying vec3 world;
void main(){
 vec2 p=surface>.5&&surface<1.5?vec2(world.z,world.y):vec2(world.z,world.x);
 float t=time*.09;
 float field=.5+.25*sin(p.x*.29+t+sin(p.y*.43-t)*1.3)+.20*cos(p.y*.53-p.x*.15-t*.7);
 vec3 color=mix(vec3(.002,.004,.012),vec3(.025,.12,.65),smoothstep(.12,.58,field));
 color=mix(color,vec3(.88,.94,1.),smoothstep(.64,.92,field));
 float pink=pow(.5+.5*sin(p.x*.20-p.y*.32+t*.6),10.)*.14*smoothstep(.35,.7,field);
 color=mix(color,vec3(.95,.46,.67),pink);
 color*=surface<.5?.70:surface>1.5?.78:1.;
 gl_FragColor=vec4(color,1.);
}`;

export default function DirectionOne({ surface }: { surface: string }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const elapsed = useRef(8);
  const uniforms = useMemo(
    () => ({
      time: { value: 8 },
      surface: { value: surface === "floor" ? 0 : surface === "wall" ? 1 : 2 },
    }),
    [surface],
  );
  useFrame((_, dt) => {
    if (!material.current) return;
    const s = useStore.getState();
    if (s.colorPlaying) elapsed.current += Math.min(dt, 0.1);
    const u = material.current.uniforms;
    u.time.value = elapsed.current;
  });
  return (
    <shaderMaterial
      ref={material}
      uniforms={uniforms}
      toneMapped={false}
      vertexShader={`varying vec3 world;void main(){vec4 p=modelMatrix*vec4(position,1.);world=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`}
      fragmentShader={fragment}
    />
  );
}
