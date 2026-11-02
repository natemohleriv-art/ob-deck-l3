import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../stores/scene";

// Shared aim coordinates are a world-space ray/wall intersection, not a light source.
export const flashlightAim = new THREE.Vector3(0, 3.8, 3);
export const flashlightActive = { value: false };
const hiddenAim = new THREE.Vector3(0, 1000, 1000);
const fragment = `
uniform float time;
uniform float wall;
uniform float manual;
uniform vec3 aim;
varying vec3 world;
float line(float x, float width) {return 1.-smoothstep(width,width+.025,abs(x));}
float hash(float n){return fract(sin(n*127.1)*43758.5453);}
vec3 secret(vec2 p, float kind){
  vec3 ink=vec3(.025,.045,.065);
  vec3 silver=vec3(.68,.79,.85);
  if(kind<.5){
    // Steel-frame cutaway: columns, cross-bracing, lift shafts and moving cabs.
    vec2 cell=vec2(mod(p.x+30.,2.)-1.,mod(p.y,1.5)-.75);
    float beams=max(line(abs(cell.x)-.90,.035),line(abs(cell.y)-.66,.035));
    float brace=line(abs(cell.x*.72)-abs(cell.y),.022);
    float lift=step(abs(mod(p.x+30.,4.)-2.),.27)*step(abs(mod(p.y-time*.45,4.)-2.),.34);
    return ink+silver*(beams*.8+brace*.45)+vec3(1.,.57,.24)*lift;
  }
  if(kind<1.5){
    // Animated city within the wall: staggered towers and scrolling windows.
    float col=floor(p.x*1.8);
    float top=3.4+hash(col)*3.8;
    float body=step(p.y,top)*step(.09,fract(p.x*1.8))*step(fract(p.x*1.8),.91);
    float windows=step(.24,fract(p.x*7.2))*step(fract(p.x*7.2),.64)*step(.3,fract(p.y*4.))*step(fract(p.y*4.),.65);
    float flicker=.55+.45*sin(col*4.+floor(p.y*4.)+time*.6);
    return ink+body*(vec3(.13,.19,.24)+silver*windows*flicker);
  }
  // Hidden clockwork: concentric machinery and counter-rotating toothed wheels.
  vec2 q=vec2(mod(p.x+30.,2.7)-1.35,mod(p.y,2.7)-1.35);
  float a=atan(q.y,q.x)+time*.3;
  float r=length(q);
  float gear=line(r-(.82+.07*sin(a*18.)),.045);
  float hub=line(r-.28,.035);
  float spoke=line(sin(a*4.)*r,.025)*step(.27,r)*step(r,.8);
  return ink+silver*(gear+hub+spoke)*.8;
}
void main(){
  vec2 p=wall>.5?vec2(world.z,world.y):vec2(world.z,world.x);
  float flow=p.y+.85*sin(p.x*.43+time*.18+p.y*.28)+.35*sin(p.x*.85-time*.13);
  float ribbons=pow(.5+.5*cos(flow*48.),18.);
  float envelope=pow(.5+.5*sin(flow*1.65+p.x*.13),5.);
  vec3 color=vec3(.006,.013,.032)+vec3(.08,.23,.43)*ribbons*(.06+.94*envelope);
  if(wall>.5){
    for(int i=0;i<3;i++){
      float fi=float(i);
      vec2 center=vec2(-5.5+fi*5.1+sin(time*.22+fi*2.)*1.2,3.9+sin(time*.31+fi*1.7)*.9);
      if(manual>.5){if(i==0)center=vec2(aim.z,aim.y);else center=vec2(1000.);}
      float radius=1.20+.12*sin(time*.65+fi);
      float dist=length(p-center);
      float reveal=1.-smoothstep(radius-.13,radius,dist);
      float rim=exp(-abs(dist-radius)*30.);
      float sparks=pow(.5+.5*sin(atan(p.y-center.y,p.x-center.x)*83.+time*3.+fi),12.);
      color=mix(color,secret(p,manual>.5?floor(mod(time/10.,3.)):fi),reveal);
      color+=vec3(1.,.65,.30)*rim*(.65+sparks*.9);
    }
  }else{
    // Subtle warm echoes on floor and ceiling keep the room cohesive.
    color+=vec3(.13,.075,.035)*pow(.5+.5*sin(world.z*.75-time*.25),12.)*.35;
  }
  gl_FragColor=vec4(color,1.);
}`;

export default function DirectionTwo({ surface }: { surface: string }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const elapsed = useRef(0);
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      wall: { value: surface === "wall" ? 1 : 0 },
      manual: { value: 0 },
      aim: { value: flashlightAim },
    }),
    [surface],
  );
  useFrame((_, delta) => {
    if (!material.current) return;
    const live = material.current.uniforms;
    const state = useStore.getState();
    if (state.revealPlaying) elapsed.current += Math.min(delta, 0.1);
    live.time.value = elapsed.current;
    live.manual.value = state.revealMode === "pointer" ? 1 : 0;
    // Move the pointer reveal off the wall when aiming at windows or door openings.
    live.aim.value = flashlightAim;
    if (!flashlightActive.value && state.revealMode === "pointer")
      live.aim.value = hiddenAim;
  });
  return (
    <shaderMaterial
      ref={material}
      uniforms={uniforms}
      toneMapped={false}
      vertexShader={`varying vec3 world; void main(){vec4 p=modelMatrix*vec4(position,1.);world=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`}
      fragmentShader={fragment}
    />
  );
}
