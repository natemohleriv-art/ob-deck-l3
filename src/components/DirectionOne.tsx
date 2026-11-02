import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../stores/scene";

const fragment = `
uniform float time;
uniform float surface;
uniform float extent;
uniform float origin;
varying vec3 world;
float segment(vec2 p,vec2 a,vec2 b,float r){vec2 v=b-a;return length(p-a-v*clamp(dot(p-a,v)/dot(v,v),0.,1.))-r;}
float person(vec2 p,float phase){
 float swing=sin(phase)*.33;
 float d=length((p-vec2(0.,2.45))*vec2(1.,.85))-.23;
 d=min(d,segment(p,vec2(0.,2.12),vec2(0.,1.18),.27));
 d=min(d,segment(p,vec2(-.17,1.24),vec2(-.20+swing,.65),.12));
 d=min(d,segment(p,vec2(-.20+swing,.65),vec2(-.22+swing*.8,.12),.10));
 d=min(d,segment(p,vec2(.17,1.24),vec2(.20-swing,.65),.12));
 d=min(d,segment(p,vec2(.20-swing,.65),vec2(.22-swing*.8,.12),.10));
 d=min(d,segment(p,vec2(-.25,2.),vec2(-.43-swing,1.33),.10));
 d=min(d,segment(p,vec2(.25,2.),vec2(.43+swing,1.33),.10));
 return d;
}
float walker(float t,float i){return origin+.8+mod(t*.78+i*extent/3.,extent-1.6);}
vec3 palette(float t){return .50+.44*cos(6.28318*(vec3(0.,.33,.67)+t));}
float sole(vec2 p){
 float toe=length((p-vec2(0.,.065))/vec2(.095,.16))-1.;
 float heel=length((p-vec2(0.,-.10))/vec2(.070,.078))-1.;
 return min(toe,heel);
}
void main(){
 vec3 color=vec3(.008,.006,.024);
 if(surface<.5){
   // Actual past step locations stay still; new steps alternate left and right.
   for(int j=0;j<3;j++)for(int k=0;k<16;k++){
     float i=float(j), stepIndex=floor(time/.60)-float(k), born=stepIndex*.60;
     float age=time-born;
     float z=walker(born,i), lane=-1.7+i*1.65+.18*sin(z*.6+i);
     float foot=mod(stepIndex,2.)*2.-1.;
     vec2 p=vec2(world.x-lane-foot*.13,world.z-z);
     p.x+=p.y*foot*.12;
     float d=sole(p), fade=pow(max(0.,1.-age/9.6),1.6);
     float mask=1.-smoothstep(-.05,.16,d);
     float halo=exp(-max(d,0.)*2.7)*.12;
     color+=(vec3(.25,.08,.9)+vec3(.30,.35,.1)*(1.-age/9.6))*(mask+halo)*fade;
   }
 }else{
   vec2 p=surface<1.5?vec2(world.z,world.y):vec2(world.z,world.x);
   vec2 warped=p;
   float silhouettes=0.,edge=0.;
   if(surface<1.5)for(int j=0;j<3;j++){
     float i=float(j), z=walker(time,i);
     vec2 q=vec2((p.x-z)*.9,(p.y-.15)/1.35);
     float d=person(q,time*5.23599+i*1.3);
     float influence=exp(-max(d,0.)*2.0);
     warped+=vec2(sin(p.y*2.+time+i),cos(p.x*1.7-time))*.65*influence;
     silhouettes=max(silhouettes,1.-smoothstep(-.04,.06,d));
     edge=max(edge,exp(-abs(d)*10.));
     // Trailing color wakes linger behind each moving figure.
     float wake=exp(-abs(p.y-1.8)*.9)*exp(-abs(p.x-z+.8)*1.3);
     warped.y+=sin(p.x*3.-time*2.)*wake*.4;
   }
   float field=.13*sin(warped.x*.6+time*.13)+.20*cos(warped.y*.7-time*.18)+.12*sin((warped.x+warped.y)*.9);
   color=palette(field+time*.018)*.68;
   color=mix(color,palette(field+.38)*.48,silhouettes*.88);
   color+=palette(field+.18)*edge*.22;
   if(surface>1.5)color*=.3;
 }
 gl_FragColor=vec4(color,1.);
}`;

export default function DirectionOne({ surface }: { surface: string }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const elapsed = useRef(8);
  const uniforms = useMemo(
    () => ({
      time: { value: 8 },
      surface: { value: surface === "floor" ? 0 : surface === "wall" ? 1 : 2 },
      extent: { value: 15.494 },
      origin: { value: -7.747 },
    }),
    [surface],
  );
  useFrame((_, dt) => {
    if (!material.current) return;
    const s = useStore.getState();
    if (s.colorPlaying) elapsed.current += Math.min(dt, 0.1);
    const u = material.current.uniforms;
    u.time.value = elapsed.current;
    u.extent.value = Math.max(2, s.config.wallLength);
    u.origin.value = s.config.wallStart;
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
