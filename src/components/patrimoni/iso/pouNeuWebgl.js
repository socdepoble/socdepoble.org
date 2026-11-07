import { useEffect, useRef } from 'react';
import { A, glCamera, glLayer, settle, smooth } from './ruralIsoEngine.js';
import { pouNeuState } from './modelPouNeu.js';

/** World-space fields share the kit camera. Structural solids remain SVG. */
export const POU_NEU_FRAGMENT = `
uniform float uIceTops[6];
uniform float uIceBottoms[6];
uniform vec3 uIceMove;
uniform vec3 uWallMove;
uniform vec3 uDoorMove;
uniform vec3 uDoorMin[4];
uniform vec3 uDoorMax[4];
uniform vec3 uDrain;
uniform float uRadius;
uniform float uFog;
uniform float uFlow;
uniform vec3 uInk;
uniform vec3 uPaper;
float visibleAt(vec3 p,vec3 V){
  float cover=0.;
  vec3 q=p-uWallMove;
  float a=dot(V.xy,V.xy),b=dot(q.xy,V.xy),c=dot(q.xy,q.xy)-42.*42.;
  float disc=b*b-a*c;
  if(disc>0.){
    float t=(-b+sqrt(disc))/a;
    vec3 hit=q+t*V;
    float retained=1.-smoothstep(.49,.51,dot(normalize(hit.xy),normalize(vec2(1.))));
    cover=max(cover,smoothstep(0.,.25,t)*window(hit.z,2.,112.,.15)*retained);
  }
  for(int i=0;i<6;i++){
    vec3 sp=p-uIceMove;
    float sb=dot(sp.xy,V.xy),sc=dot(sp.xy,sp.xy)-39.1*39.1;
    float sd=sb*sb-a*sc;
    if(sd>0.){
      float enter=max((-sb-sqrt(sd))/a,(uIceTops[i]-sp.z)/V.z);
      float leave=min((-sb+sqrt(sd))/a,(uIceTops[i]+1.3-sp.z)/V.z);
      cover=max(cover,smoothstep(0.,.15,leave-max(.02,enter)));
    }
  }
  for(int i=0;i<4;i++){
    vec3 t0=(uDoorMin[i]+uDoorMove-p)/V;
    vec3 t1=(uDoorMax[i]+uDoorMove-p)/V;
    vec3 lo=min(t0,t1),hi=max(t0,t1);
    float enter=max(max(lo.x,lo.y),lo.z),leave=min(min(hi.x,hi.y),hi.z);
    cover=max(cover,smoothstep(0.,.15,leave-max(.02,enter))*smoothstep(0.,.15,leave));
  }
  return 1.-cover;
}
void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  vec3 V=towardViewer();
  float px=pixelOf();
  float top=uIceTops[5]+uIceMove.z;
  float fine=1.-smoothstep(1.2,3.5,px);
  vec3 ray=rayOf(vb)-uIceMove;
  float aa=dot(V.xy,V.xy),bb=dot(ray.xy,V.xy);
  float innerRadius=uRadius-.3/uK;
  float dd=bb*bb-aa*(dot(ray.xy,ray.xy)-innerRadius*innerRadius);
  float caustic=0.;
  if(dd>0.){
    float t=(-bb+sqrt(dd))/aa;
    vec3 skin=ray+t*V;
    for(int i=0;i<6;i++){
      float band=window(skin.z,uIceBottoms[i],uIceTops[i],max(.2,px));
      float crystal=pow(.5+.5*sin(skin.x*.6+sin(skin.z*.4)+uTime*.16),10.)*
        pow(.5+.5*sin(skin.z*.56-sin(skin.y*.5)-uTime*.12),6.);
      if(band>0.0001) caustic+=crystal*band*fine*.16*visibleAt(skin+uIceMove,V);
    }
  }
  vec3 base=onFloor(vb,top+5.);
  float fog=0.;
  for(int i=0;i<12;i++){
    float along=(float(i)+.5)/12.-.5;
    vec3 p=base+V*(along*22.);
    float radial=1.-smoothstep(uRadius*.72,uRadius*.98,length(p.xy-uIceMove.xy));
    float height=window(p.z,top+1.,top+9.,2.);
    float field=.65+.35*noise3(p*.18-vec3(0.,0.,uTime*.08));
    if(radial*height>0.0001) fog+=radial*height*field*visibleAt(p,V)/12.;
  }
  vec3 waterRay=rayOf(vb)-uDrain;
  float wa=.06*V.x*V.x,wb=V.z+.12*waterRay.x*V.x;
  float wc=waterRay.z+.06*waterRay.x*waterRay.x;
  float wd=wb*wb-4.*wa*wc;
  float flow=0.;
  if(wd>0.){
    vec3 water=waterRay+((-wb+sqrt(wd))/(2.*wa))*V;
    float radius=.7-.028*water.x;
    float mask=window(water.x,0.,10.,.4)*(1.-smoothstep(radius*.65,radius,abs(water.y)));
    float ripple=pow(.5+.5*sin(water.x*.9-uTime*.6),8.);
    flow=mask*ripple*uFlow*.18;
  }
  float fogAlpha=(1.-exp(-fog*.45))*uFog;
  float inkAlpha=(caustic+flow)*uFog;
  // Composite paper-coloured condensation over the token-derived ink.
  vec4 ink=vec4(uInk*inkAlpha,inkAlpha);
  float paperLight=smoothstep(.25,.7,dot(uPaper,vec3(.2126,.7152,.0722)));
  vec3 mist=mix(uPaper,uInk,mix(.65,.12,paperLight));
  vec4 haze=vec4(mist*fogAlpha,fogAlpha);
  vec4 col=haze+ink*(1.-haze.a);
  vec2 edge=min(vb,uView-vb);
  float boundary=smoothstep(12.,24.,min(edge.x,edge.y));
  col*=boundary;
  float noise=(hash12(gl_FragCoord.xy)+hash12(gl_FragCoord.yx*1.37)-1.)/255.;
  col+=vec4(noise)*smoothstep(0.,1.5/255.,col.a)*boundary;
  col.a=max(0.,col.a);
  col.rgb=min(vec3(col.a),max(vec3(0.),col.rgb));
  gl_FragColor=col;
}`;

const rgb = (css) => {
  const matches = css.match(/[\d.]+/g)?.map(Number) || [];
  if (css.startsWith('color(srgb')) return matches.slice(0,3);
  return matches.slice(0,3).map((n) => n/255);
};
export function usePouNeuWebgl({ stage, probe, scene, progress, season, noWebgl }) {
  const live = useRef({ scene, season });
  live.current = { scene, season };
  useEffect(() => {
    const root=stage.current, canvas=root?.querySelector('canvas');
    const reduced=typeof matchMedia==='function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    const disabled=noWebgl || new URLSearchParams(window.location.search).has('no-webgl');
    // JSDOM has a canvas stub but no graphics API: never call its noisy getContext.
    if (!canvas || disabled || reduced?.matches || typeof WebGLRenderingContext==='undefined') return undefined;
    const camera=glCamera(live.current.scene.P);
    const view=[760,720];
    const readColours=() => {
      const computed=getComputedStyle(probe.current || root);
      return { uInk: rgb(computed.color), uPaper: rgb(computed.backgroundColor) };
    };
    const layer=glLayer({ canvas, fragment: POU_NEU_FRAGMENT, view, camera,
      uniforms:['uIceTops','uIceBottoms','uIceMove','uWallMove','uDoorMove','uDoorMin','uDoorMax','uDrain','uRadius','uFog','uFlow','uInk','uPaper'],
      maxRatio:1.5, onError:() => { delete root.dataset.gl; }
    });
    if (!layer) return undefined;
    root.dataset.gl='true';
    let frame=0, previous=0, clock=0, visible=true, lost=false;
    const fog={x:0,v:0}, flow={x:0,v:0};
    const tick=(now) => {
      frame=0;
      if (!visible || document.hidden || lost || reduced?.matches) return;
      const dt=previous ? Math.min((now-previous)/1000,1/15) : 1/30;
      if (previous && now-previous<30) { frame=requestAnimationFrame(tick); return; }
      previous=now; clock+=dt;
      const current=live.current;
      const physics=pouNeuState({season:current.season,assembly:'estrats-gel'});
      const gradient=physics.ambientTemperature-physics.temperature;
      settle(fog, .25+.55*smooth(0,24,gradient)+.2*smooth(550,720,physics.density), dt,.45);
      settle(flow,smooth(0,40,physics.drainageLh),dt,.6);
      Object.assign(camera,glCamera(current.scene.P));
      const viewport=root.dataset.view?.split(' ').map(Number);
      if(viewport?.length===4){ camera.origin[0]-=viewport[0];camera.origin[1]-=viewport[1];view[0]=viewport[2];view[1]=viewport[3]; }
      const effect=current.scene.effect || {};
      const share=progress.current.x;
      const move=(effect.iceMove || [0,0,0]).map((n)=>n*share);
      const drain=(effect.drainOrigin || [54,8,-118]).map((n,i)=>n+(effect.drainMove?.[i] || 0)*share);
      const assemblyMove=(id)=>(current.scene.assemblies.find((a)=>a.id===id)?.move || [0,0,0]).map((n)=>n*share);
      const portal=current.scene.parts.filter((part)=>/^door\.(chamfered-|timber-leaf)/.test(part.physicalId || part.id)).map((part)=>A.boundsOf(part.shape));
      layer.draw({uIceTops:effect.iceTops,uIceBottoms:effect.iceLayers.map((layer)=>layer.z),uIceMove:move,uDrain:drain,
        uWallMove:assemblyMove('pou-cilindric'),uDoorMove:assemblyMove('porta-extraccio'),
        uDoorMin:portal.flatMap((box)=>box.min),uDoorMax:portal.flatMap((box)=>box.max),
        uRadius:effect.iceRadius || 40,uFog:fog.x,uFlow:flow.x,...readColours()},clock);
      frame=requestAnimationFrame(tick);
    };
    const stop=() => { if(frame) cancelAnimationFrame(frame); frame=0; previous=0; };
    const run=() => { if(!frame && visible && !document.hidden && !lost && !reduced?.matches) frame=requestAnimationFrame(tick); };
    const observer=typeof IntersectionObserver==='function' ? new IntersectionObserver(([entry])=>{ visible=entry.isIntersecting; if(visible)run();else stop(); }) : null;
    observer?.observe(root);
    const visibility=()=>{if(document.hidden)stop();else run();};
    const stillness=()=>{if(reduced.matches){stop();layer.clear();delete root.dataset.gl;}else{root.dataset.gl='true';run();}};
    const contextLost=(event)=>{event.preventDefault();lost=true;stop();delete root.dataset.gl;};
    canvas.addEventListener('webglcontextlost',contextLost);
    document.addEventListener('visibilitychange',visibility);
    reduced?.addEventListener?.('change',stillness);
    run();
    return ()=>{
      stop();observer?.disconnect();layer.dispose();delete root.dataset.gl;
      canvas.removeEventListener('webglcontextlost',contextLost);
      document.removeEventListener('visibilitychange',visibility);
      reduced?.removeEventListener?.('change',stillness);
    };
  },[stage,probe,progress,noWebgl]);
}
