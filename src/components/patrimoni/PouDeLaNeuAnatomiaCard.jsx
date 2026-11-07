import { memo, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useUIStateOpcional } from '../../app/contexts/UIContext.jsx';
import { buildPouNeuScene, pouNeuState } from './iso/modelPouNeu.js';
import { A, iso, prepareRuralOrder, sortRuralParts, splitRuralLayers, stepSpring, viewOf } from './iso/ruralIsoEngine.js';
import { POU_ORDER_KEYS } from './iso/pouNeuOrderKeys.js';
import { POU_NEU_TEXT } from './iso/pouNeuTextos.js';
import { usePouNeuWebgl } from './iso/pouNeuWebgl.js';
import { useElementFullscreen } from '../../hooks/useElementFullscreen.js';

const IDS = ['base-roca','pou-cilindric','estrats-gel','volta-cupula','portell-empouar','porta-extraccio','desaigue-fusio'];
const W = 760, H = 720;
const cache = new Map();
function sceneAt(azimuth, season) {
  const key = `${azimuth}:${season}`;
  if (!cache.has(key)) {
    const scene = buildPouNeuScene({ azimuth, season, width: W, height: H });
    const keys = POU_ORDER_KEYS[season]?.[azimuth];
    scene.order = keys ? { keys: new Map(Object.entries(keys)), V: viewOf(scene.P) }
      : prepareRuralOrder(scene.parts, scene.P, { states: [0, 0.25, 0.5, 0.75, 1], step: 1 });
    scene.boxes = new Map(scene.parts.map((part) => [part.id, A.markupBox(`<path d="${part.paths.fill}"/>`)]));
    cache.set(key, scene);
    if (cache.size > 12) cache.delete(cache.keys().next().value);
  }
  return cache.get(key);
}
const numberOf = (value, locale, places = 1) => new Intl.NumberFormat(locale, { minimumFractionDigits: places, maximumFractionDigits: places }).format(value);

function SolidPaths({ part }) {
  const tube = part.tube, p = tube ? null : part.paths;
  const clipId = useId().replace(/:/g, '');
  return <>
    {p ? <>
      <path className="pou-neu-fill" d={p.fill} />
      {p.shades?.map((d, shade) => d ? <path key={shade} className="pou-neu-shade" data-shade={shade} d={d} /> : null)}
      {p.top ? <path className="pou-neu-top" d={p.top} /> : null}
      {p.crease ? <path className="pou-neu-line" data-tone="lo" d={p.crease} /> : null}
      {p.bevel ? <path className="pou-neu-line" data-tone="mid" d={p.bevel} /> : null}
    </> : null}
    {tube ? <>
      <path className="pou-neu-fill" d={tube.body} />
      {tube.wide ? <><path className="pou-neu-top" d={tube.shine} /><path className="pou-neu-shade" data-shade="0" d={tube.shade} /></> : null}
      {tube.rings?.map(({ d, alpha }, index) => <g key={index} opacity={alpha}><path className="pou-neu-line" data-tone="lo" d={d} /></g>)}
    </> : null}
    {part.detailClip ? <defs><clipPath id={clipId}><path d={part.detailClip} /></clipPath></defs> : null}
    <g clipPath={part.detailClip ? `url(#${clipId})` : undefined}>
      {(tube ? [] : part.details)?.map(({ d, tone, alpha }, index) => <g key={index} opacity={alpha ?? 1}><path className="pou-neu-line" data-tone={tone || 'lo'} d={d} /></g>)}
      {part.ribs?.map(({ d, alpha }, index) => <g key={`rib-${index}`} opacity={alpha ?? 1}><path className="pou-neu-line" data-tone="lo" d={d} /></g>)}
      {part.dots?.map(([x,y,alpha], index) => <circle key={index} className="pou-neu-dot" cx={x} cy={y} r="0.55" opacity={alpha ?? 1} />)}
    </g>
    <path className="pou-neu-line pou-neu-edge" d={p?.outline || tube?.edges || ''} />
  </>;
}

const Art = memo(function Art({ scene, selected, titleId, title, onSelect }) {
  const renderParts = () => scene.parts.map((part) => <g
    key={part.id} data-part={part.id} data-physical-id={part.physicalId} data-assembly={part.assembly} data-tone={part.tone}
    data-fluid={part.physicalId === 'drain.free-water-jet' ? 'outflow' : undefined}
    data-selected={part.assembly === selected ? 'true' : 'false'} data-lit={part.tone === 'lit' ? 'true' : undefined}
    className="pou-neu-part" onClick={() => onSelect(part.assembly)}
  ><SolidPaths part={part} />
    {part.id === scene.engraving?.partId ? <>
      <defs><clipPath id={`${titleId}-engraving`}><path d={part.paths.top} /></clipPath></defs>
      <g clipPath={`url(#${titleId}-engraving)`}>
        <g transform={`${scene.engraving.transform} scale(${scene.engraving.size/16})`}>
          <text className="pou-neu-engraving" x="0" y="0" fontSize="16" textLength={54*16/scene.engraving.size} lengthAdjust="spacingAndGlyphs">CAVA DE DALT · RENTADOR</text>
        </g>
      </g>
    </> : null}
  </g>);
  return <>
    <svg viewBox={`0 0 ${W} ${H}`} className="pou-neu-svg" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{title}</title>
      <defs><filter id={`${titleId}-halo`}><feGaussianBlur stdDeviation="4" /></filter></defs>
      <path className="pou-neu-halo" d={scene.halo} filter={`url(#${titleId}-halo)`} />
      <g data-art-layer="back">{renderParts()}</g>
    </svg>
    <svg viewBox={`0 0 ${W} ${H}`} className="pou-neu-svg pou-neu-front" aria-hidden="true">
      <g data-art-layer="front" />
    </svg>
  </>;
});

/** One damped assembly spring keeps every component on its physical mount. */
function useAssemblyMotion({ stage, scene, exploded, selected, season, locale, zRef, initialExploded }) {
  const progress = useRef({ x: initialExploded ? 1 : 0, v: 0 });
  const live = useRef({ scene, selected, season, locale });
  live.current = { scene, selected, season, locale };
  useLayoutEffect(() => {
    const root = stage.current;
    const still = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    let frame = 0, last = 0, visible = true;
    const nodes = new Map([...root.querySelectorAll('[data-part]')].map((node) => [node.dataset.part, node]));
    const containers = { back: root.querySelector('[data-art-layer="back"]'), front: root.querySelector('[data-art-layer="front"]') };
    const readout = root.closest('.pou-neu-card').querySelector('[data-readout]');
    const paint = () => {
      const { scene: current, selected: assembly, season: currentSeason, locale: lang } = live.current;
      const share = progress.current.x;
      const origin = iso([0,0,0], current.P);
      const bounds = [Infinity, Infinity, -Infinity, -Infinity];
      const sorted = sortRuralParts(current.parts, current.P, share, current.order);
      const { frontParts } = splitRuralLayers(sorted);
      const inFront = new Set(frontParts.map((part) => part.id));
      for (const part of sorted) {
        const at = iso((part.move || [0,0,0]).map((n) => n * share), current.P);
        const box = current.boxes.get(part.id);
        if (box) {
          bounds[0] = Math.min(bounds[0], box[0]+at[0]-origin[0]);
          bounds[1] = Math.min(bounds[1], box[1]+at[1]-origin[1]);
          bounds[2] = Math.max(bounds[2], box[2]+at[0]-origin[0]);
          bounds[3] = Math.max(bounds[3], box[3]+at[1]-origin[1]);
        }
        const node = nodes.get(part.id);
        if (node) {
          node.setAttribute('transform', `translate(${(at[0]-origin[0]).toFixed(3)} ${(at[1]-origin[1]).toFixed(3)})`);
          containers[inFront.has(part.id) ? 'front' : 'back'].appendChild(node);
        }
      }
      const width = Math.max(bounds[2]-bounds[0]+60, (bounds[3]-bounds[1]+60)*W/H);
      const height = width*H/W;
      const view = [(bounds[0]+bounds[2]-width)/2,(bounds[1]+bounds[3]-height)/2,width,height];
      root.querySelectorAll(':scope > svg').forEach((svg) => svg.setAttribute('viewBox', view.join(' ')));
      root.dataset.view = view.join(' ');
      root.dataset.progress = share.toFixed(5);
      if (zRef.current) {
        const state = pouNeuState({ assembly, season: currentSeason, volumes: current.assemblyVolumes, shares: Object.fromEntries(IDS.map((key) => [key, share])) });
        zRef.current.textContent = `${numberOf(state.explodedZ ?? state.z, lang, 2)} m`;
      }
    };
    const tick = (now) => {
      frame = 0;
      const dt = last ? Math.min((now-last)/1000, 1/30) : 1/60;
      last = now;
      const moving = stepSpring(progress.current, exploded ? 1 : 0, dt);
      readout.setAttribute('aria-busy', String(moving));
      paint();
      if (moving && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const run = () => {
      if (still?.matches || typeof requestAnimationFrame !== 'function') {
        progress.current = { x: exploded ? 1 : 0, v: 0 };
        readout.setAttribute('aria-busy', 'false');
        paint();
      } else if (!frame && visible && !document.hidden) { last = 0; frame = requestAnimationFrame(tick); }
    };
    paint();
    readout.setAttribute('aria-busy', String(!still?.matches && Math.abs(progress.current.x-(exploded ? 1 : 0))>0.0001));
    run();
    const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; } else run();
    }) : null;
    observer?.observe(root);
    const visibility = () => {
      if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; } else run();
    };
    document.addEventListener('visibilitychange', visibility);
    still?.addEventListener?.('change', run);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      still?.removeEventListener?.('change', run);
      readout.setAttribute('aria-busy', 'false');
    };
  }, [stage, scene, exploded, selected, season, locale, zRef]);
  return progress;
}

export default function PouDeLaNeuAnatomiaCard({ language, noWebgl = false, initialExploded = false }) {
  const { elementRef, isFullscreen, toggleFullscreen } = useElementFullscreen();
  const ui = useUIStateOpcional();
  const requested = language || ui?.language || 'ca';
  const lang = Object.hasOwn(POU_NEU_TEXT, requested) ? requested : 'ca';
  const t = POU_NEU_TEXT[lang];
  const id = useId().replace(/:/g, '');
  const [selected, setSelected] = useState('estrats-gel');
  const [exploded, setExploded] = useState(initialExploded);
  const [azimuth, setAzimuth] = useState(45);
  const [season, setSeason] = useState('winter');
  const stage = useRef(null), probe = useRef(null), zRef = useRef(null);
  const scene = useMemo(() => sceneAt(azimuth, season), [azimuth, season]);
  const progress = useAssemblyMotion({ stage, scene, exploded, selected, season, locale: lang, zRef, initialExploded });
  const model = pouNeuState({ season, assembly: selected, volumes: scene.assemblyVolumes, shares: Object.fromEntries(IDS.map((key) => [key, progress.current.x])) });
  usePouNeuWebgl({ stage, probe, scene, progress, season, noWebgl });
  const index = IDS.indexOf(selected);
  const unit = { z: 'm', temperature: '°C', density: 'kg/m³', mass: 't', drainage: 'L/h' };
  const values = { z: model.explodedZ ?? model.z, temperature: model.temperature, density: model.density, mass: model.massTonnes, drainage: model.drainageLh };
  return <section ref={elementRef} data-element-fullscreen="" className={['pou-neu-card', isFullscreen ? 'is-fullscreen' : ''].filter(Boolean).join(' ')} lang={lang} aria-labelledby={`${id}-heading`}>
    <header className="pou-neu-heading">
      <p className="pou-neu-kicker">{t.figure}</p><h3 id={`${id}-heading`}>{t.title}</h3><p>{t.dimensions}</p>
    </header>
    <div className="pou-neu-card__toolbar"><button type="button" className="pou-neu-choice" aria-pressed={isFullscreen} onClick={toggleFullscreen}><span aria-hidden="true">⛶</span> {isFullscreen ? t.exitFullscreen : t.fullscreen}</button></div>
    <figure className="pou-neu-figure">
      <div ref={stage} className="pou-neu-stage" data-azimuth={azimuth} data-exploded={String(exploded)} data-season={season} data-physical-solids={scene.physicalSolidCount}>
        <Art key={`${azimuth}:${season}`} scene={scene} selected={selected} titleId={`${id}-svg-title`} title={t.title} onSelect={setSelected} />
        <canvas className="pou-neu-gl" aria-hidden="true" />
        <span ref={probe} className="pou-neu-ink-probe" aria-hidden="true" />
      </div>
      <figcaption className="pou-neu-caption"><span>{t.section}</span><span>{scene.physicalSolidCount ?? scene.solidCount} {t.solids}</span></figcaption>
    </figure>
    <div className="pou-neu-controls">
      <button type="button" className="pou-neu-explode" data-explode-toggle="" aria-pressed={exploded} onClick={() => setExploded((value) => !value)}>{exploded ? t.compact : t.explode}</button>
      <label className="pou-neu-field" htmlFor={`${id}-azimuth`}>{t.camera} <output>{azimuth}°</output>
        <input id={`${id}-azimuth`} type="range" min="25" max="65" step="1" value={azimuth} aria-valuetext={`${azimuth}°`} onChange={(event) => setAzimuth(Math.max(25, Math.min(65, Number(event.target.value))))} />
      </label>
      <label className="pou-neu-field" htmlFor={`${id}-season`}>{t.season}
        <select id={`${id}-season`} data-season="" value={season} onChange={(event) => setSeason(event.target.value)}><option value="winter">{t.winter}</option><option value="summer">{t.summer}</option></select>
      </label>
    </div>
    <p className="pou-neu-hint">{t.hint}</p>
    <div className="pou-neu-assemblies" role="group" aria-label={t.assemblies}>
      {IDS.map((assembly, at) => <button key={assembly} type="button" className="pou-neu-choice" data-assembly-select={assembly} aria-pressed={selected === assembly} onClick={() => setSelected(assembly)}><span aria-hidden="true">{String(at+1).padStart(2,'0')}</span> {t.names[at]}</button>)}
    </div>
    <div className="pou-neu-description" aria-live="polite"><strong>{t.names[index]}</strong><p>{t.descriptions[index]}</p></div>
    <dl className="pou-neu-readout" data-readout="" aria-live="polite" aria-atomic="true">
      {Object.entries(values).map(([key, value]) => <div key={key}><dt>{t[key]}</dt><dd data-metric={key} ref={key === 'z' ? zRef : undefined}>{numberOf(value, lang, key === 'z' ? 2 : key === 'density' ? 0 : 1)} {unit[key]}</dd></div>)}
    </dl>
    <p className="pou-neu-note">{t.estimate}</p>
  </section>;
}
