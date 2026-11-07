/**
 * PouDeLaNeuAnatomiaCard.jsx — el visor únic del Pou de Neu del Rentonar
 * (IDEA-161 + IDEA-165 + IDEA-160, Onada R11). Tres modes en un sol lloc:
 *  · «Dins del pou» i «Tall seccional»: el motor WebGL2 propi sobre la
 *    geometria exacta de Segura Martí (PouNeuInterior.jsx, carregat en diferit
 *    i muntat una sola vegada: entre modes només s'amaga, CP-13).
 *  · «Desmuntar en 3D»: el motor isomètric de 103 sòlids en 7 assemblatges,
 *    amb la seua capçalera i la seua estació (hivern o estiu), separades de
 *    l'estat del pou del WebGL (CP-09, ARQ-02).
 * Sense WebGL2 (o en JSDOM, o amb ?no-webgl) només hi ha el desmuntatge, sense
 * cap avís; l'avís ix només si un intent real falla (CP-01).
 * A pantalla completa la capçalera és només per a lectors i el HUD va
 * superposat a la vista (components.css, «Visor únic del Pou de Neu»).
 * Co-creació R11 (empelts de la proposta de Gemini i MarIA):
 *  · E1 · El desmuntatge es pot dibuixar en Pedra Seca o com la làmina de
 *    l'interior (`data-estil` de l'escenari): el CSS només reassigna els àlies
 *    locals --pou-neu-* amb els tokens de material; la selecció i la llum manen.
 *  · E2 · La «Fitxa de Segura (1987)» es genera de SEGURA_1987, amb la línia del
 *    corpus de cada xifra; cap xifra escrita a mà. No ix a pantalla completa.
 */
import { Component, lazy, memo, Suspense, useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useUIStateOpcional } from '../../app/contexts/UIContext.jsx';
import { buildPouNeuScene, pouNeuState } from './iso/modelPouNeu.js';
import { A, iso, prepareRuralOrder, sortRuralParts, splitRuralLayers, stepSpring, viewOf } from './iso/ruralIsoEngine.js';
import { POU_ORDER_KEYS } from './iso/pouNeuOrderKeys.js';
import { POU_NEU_TEXT } from './iso/pouNeuTextos.js';
import { POU_NEU_ETIQUETES_VISOR } from './iso/pouNeuEtiquetesVisor.js';
import { SEGURA_1987 } from './iso/pouNeuRentonar.js';
import { usePouNeuWebgl } from './iso/pouNeuWebgl.js';
import { useElementFullscreen } from '../../hooks/useElementFullscreen.js';

const PouNeuInterior = lazy(() => import('./PouNeuInterior.jsx'));
const IDS = ['base-roca','pou-cilindric','estrats-gel','volta-cupula','portell-empouar','porta-extraccio','desaigue-fusio'];
const MODES = ['interior', 'tall', 'desmuntatge'];
const ESTATS = ['hivern', 'estiu', 'hui'];
const TALLS = ['ab', 'cd', 'quart'];
const ESTILS = ['pedra-seca', 'lamina'];
/** WebGL2 al navegador (no en JSDOM, ni amb la prop noWebgl, ni amb ?no-webgl): decidix si s'intenta. */
function hiHaWebgl2(noWebgl) {
  if (noWebgl || typeof window === 'undefined' || typeof WebGL2RenderingContext === 'undefined') return false;
  try { return !new URLSearchParams(window.location.search).has('no-webgl'); } catch { return false; }
}
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

/** CP-15e · Si el tros diferit de l'interior falla, el visor es queda amb el desmuntatge (no cau la ruta). */
class LimitInterior extends Component {
  constructor(props) { super(props); this.state = { fallat: false }; }
  static getDerivedStateFromError() { return { fallat: true }; }
  componentDidCatch() { this.props.onFallada(); }
  render() { return this.state.fallat ? null : this.props.children; }
}

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
          <text className="pou-neu-engraving" x="0" y="0" fontSize="16" textLength={54*16/scene.engraving.size} lengthAdjust="spacingAndGlyphs">{scene.engraving.text}</text>
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
  useLayoutEffect(() => {
    live.current = { scene, selected, season, locale };
    const root = stage.current;
    const still = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    let frame = 0, last = 0, visible = true;
    const nodes = new Map([...root.querySelectorAll('[data-part]')].map((node) => [node.dataset.part, node]));
    const containers = { back: root.querySelector('[data-art-layer="back"]'), front: root.querySelector('[data-art-layer="front"]') };
    const readout = root.closest('.pou-neu-card').querySelector('[data-readout]');
    /* A11Y-06 · La lectura és una regió viva atòmica: només s'hi escriu quan el valor canvia
       (un pas de l'àzimut no la reescriu, i el lector no la repetix). */
    const ocupat = (valor) => { const text = String(valor); if (readout.getAttribute('aria-busy') !== text) readout.setAttribute('aria-busy', text); };
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
        const cota = `${numberOf(state.explodedZ ?? state.z, lang, 2)} m`;
        if (zRef.current.textContent !== cota) zRef.current.textContent = cota;
      }
    };
    const tick = (now) => {
      frame = 0;
      const dt = last ? Math.min((now-last)/1000, 1/30) : 1/60;
      last = now;
      const moving = stepSpring(progress.current, exploded ? 1 : 0, dt);
      ocupat(moving);
      paint();
      if (moving && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const run = () => {
      if (still?.matches || typeof requestAnimationFrame !== 'function') {
        progress.current = { x: exploded ? 1 : 0, v: 0 };
        ocupat(false);
        paint();
      } else if (!frame && visible && !document.hidden) { last = 0; frame = requestAnimationFrame(tick); }
    };
    paint();
    ocupat(!still?.matches && Math.abs(progress.current.x-(exploded ? 1 : 0))>0.0001);
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
      ocupat(false);
    };
  }, [stage, scene, exploded, selected, season, locale, zRef]);
  return progress;
}

/** Un botó amb el rètol sencer i, a la pantalla completa estreta, el curt (el nom accessible és sempre el sencer). */
function Etiquetes({ llarga, curta, opcional = false }) {
  return <>
    <span className="pou-neu-etiqueta">{llarga}</span>
    {curta ? <span className={`pou-neu-etiqueta-curta ${opcional ? 'pou-neu-etiqueta-curta--opcional' : ''}`} aria-hidden="true">{curta}</span> : null}
  </>;
}

export default function PouDeLaNeuAnatomiaCard({ language, noWebgl = false, initialExploded = false }) {
  const { elementRef, isFullscreen, toggleFullscreen } = useElementFullscreen();
  const ui = useUIStateOpcional();
  const requested = language || ui?.language || 'ca';
  const lang = Object.hasOwn(POU_NEU_TEXT, requested) ? requested : 'ca';
  const t = POU_NEU_TEXT[lang];
  const ti = POU_NEU_ETIQUETES_VISOR[lang];
  const id = useId().replace(/:/g, '');
  const [ambWebgl, setAmbWebgl] = useState(() => hiHaWebgl2(noWebgl));
  const [webglFallit, setWebglFallit] = useState(false);
  const [mode, setMode] = useState(() => (hiHaWebgl2(noWebgl) && !initialExploded ? 'interior' : 'desmuntatge'));
  const [interiorMuntat, setInteriorMuntat] = useState(() => hiHaWebgl2(noWebgl) && !initialExploded);
  const [selected, setSelected] = useState('estrats-gel');
  const [exploded, setExploded] = useState(initialExploded);
  const [azimuth, setAzimuth] = useState(45);
  // CP-09 · L'estació del desmuntatge (hivern o estiu) és seua: l'estat del WebGL no reconstruïx l'escena amagada.
  const [season, setSeason] = useState('winter');
  const [estat, setEstat] = useState('hui');
  const [coberta, setCoberta] = useState('fase2');
  const [tall, setTall] = useState('ab');
  const [estil, setEstil] = useState('pedra-seca');
  const [ambHud, setAmbHud] = useState(true);
  const [ranura, setRanura] = useState(null);
  const stage = useRef(null), probe = useRef(null), zRef = useRef(null);
  const scene = useMemo(() => sceneAt(azimuth, season), [azimuth, season]);
  const progress = useAssemblyMotion({ stage, scene, exploded, selected, season, locale: lang, zRef, initialExploded });
  const model = pouNeuState({ season, assembly: selected, volumes: scene.assemblyVolumes, shares: Object.fromEntries(IDS.map((key) => [key, progress.current.x])) });
  usePouNeuWebgl({ stage, probe, scene, progress, season, noWebgl: noWebgl || mode !== 'desmuntatge' });
  /**
   * CP-01 · `intentat` és fals si l'interior ni tan sols ha provat el WebGL2: llavors no hi ha avís.
   * A11Y-07 · `motiu` 'perdut': el context es va perdre i no ha tornat; l'avís ho diu així.
   */
  const onSuport = useCallback((ok, intentat = true, motiu = null) => {
    if (ok) return;
    setAmbWebgl(false); setMode('desmuntatge');
    if (intentat) setWebglFallit(motiu === 'perdut' ? 'perdut' : true);
  }, []);
  const onFallada = useCallback(() => onSuport(false, true), [onSuport]);
  const triaMode = (nom) => { setMode(nom); if (nom !== 'desmuntatge') setInteriorMuntat(true); };
  const index = IDS.indexOf(selected);
  const mou = (pas) => setSelected(IDS[(index + pas + IDS.length) % IDS.length]);
  const iso3d = mode === 'desmuntatge';
  // CP-02 · Amagar el HUD només val a pantalla completa.
  const hudAmagat = isFullscreen && !ambHud;
  // ARQ-06 · Hui només hi ha la 2a coberta.
  const cobertaViva = estat === 'hui' ? 'fase2' : coberta;
  const unit = { z: 'm', temperature: '°C', density: 'kg/m³', mass: 't', drainage: 'L/h' };
  const values = { z: model.explodedZ ?? model.z, temperature: model.temperature, density: model.density, mass: model.massTonnes, drainage: model.drainageLh };
  return <section ref={elementRef} data-element-fullscreen="" data-mode={mode} data-hud={String(!hudAmagat)} className={`pou-neu-card ${isFullscreen ? 'is-fullscreen' : ''}`} lang={lang} aria-labelledby={`${id}-heading`}>
    <header className={`pou-neu-heading ${isFullscreen ? 'sdp-sr-only' : ''}`}>
      <p className="pou-neu-kicker">{t.figure}</p><h3 id={`${id}-heading`}>{t.title}</h3><p>{iso3d ? t.dimensions : ti.dimensions}</p>
    </header>
    <div className="pou-neu-card__toolbar">
      <div className="pou-neu-modes" role="group" aria-label={ti.mode}>
        {MODES.map((nom) => <button key={nom} type="button" className="pou-neu-choice" data-mode-select={nom} aria-pressed={mode === nom} aria-label={ti.modes[nom]} disabled={nom !== 'desmuntatge' && !ambWebgl} onClick={() => triaMode(nom)}>
          <Etiquetes llarga={ti.modes[nom]} curta={ti.modesCurts[nom]} />
        </button>)}
      </div>
      {isFullscreen ? <button type="button" className="pou-neu-choice" data-hud-toggle="" aria-controls={`${id}-hud`} aria-label={ambHud ? ti.amagaHud : ti.mostraHud} onClick={() => setAmbHud((v) => !v)}>
        <span aria-hidden="true">☰</span> <Etiquetes llarga={ambHud ? ti.amagaHud : ti.mostraHud} curta={ambHud ? ti.amagaHudCurt : ti.mostraHudCurt} opcional />
      </button> : null}
      <button type="button" className="pou-neu-choice" data-fullscreen-toggle="" aria-label={isFullscreen ? t.exitFullscreen : t.fullscreen} onClick={toggleFullscreen}>
        <span aria-hidden="true">⛶</span> <Etiquetes llarga={isFullscreen ? t.exitFullscreen : t.fullscreen} curta={isFullscreen ? ti.eixirCurt : null} opcional />
      </button>
    </div>
    {webglFallit ? <p className="pou-neu-avis-webgl" role="status">{webglFallit === 'perdut' ? ti.webglPerdut : ti.senseWebgl}</p> : null}
    <figure className="pou-neu-figure">
      <div ref={stage} hidden={!iso3d} className="pou-neu-stage" data-azimuth={azimuth} data-exploded={String(exploded)} data-season={season} data-estil={estil} data-physical-solids={scene.physicalSolidCount}>
        <Art key={`${azimuth}:${season}`} scene={scene} selected={selected} titleId={`${id}-svg-title`} title={t.title} onSelect={setSelected} />
        <canvas className="pou-neu-gl" aria-hidden="true" />
        <span ref={probe} className="pou-neu-ink-probe" aria-hidden="true" />
      </div>
      {ambWebgl && interiorMuntat ? <LimitInterior onFallada={onFallada}>
        <Suspense fallback={iso3d ? null : <div className="pou-neu-interior__reserva" aria-hidden="true" />}>
          <PouNeuInterior t={ti} lang={lang} mode={mode} estat={estat} coberta={cobertaViva} tall={tall} angle={azimuth} noWebgl={noWebgl} onSuport={onSuport} ranura={ranura} />
        </Suspense>
      </LimitInterior> : null}
      <figcaption className="pou-neu-caption"><span>{iso3d ? t.section : ti.modes[mode]}</span><span>{iso3d ? `${scene.physicalSolidCount ?? scene.solidCount} ${t.solids}` : ti.estacions[estat]}</span></figcaption>
    </figure>
    <div id={`${id}-hud`} className="pou-neu-hud" hidden={hudAmagat}>
      <div ref={setRanura} className="pou-neu-hud__interior" hidden={mode !== 'interior'} />
      <div className="pou-neu-controls">
        {iso3d ? <button type="button" className="pou-neu-explode" data-explode-toggle="" aria-pressed={exploded} onClick={() => setExploded((value) => !value)}>{t.explode}</button> : null}
        {iso3d ? <div className="pou-neu-estils" role="group" aria-label={ti.estil}>
          {ESTILS.map((nom) => <button key={nom} type="button" className="pou-neu-choice" data-estil-select={nom} aria-pressed={estil === nom} aria-label={ti.estils[nom]} onClick={() => setEstil(nom)}>
            <Etiquetes llarga={ti.estils[nom]} curta={ti.estilsCurts[nom]} />
          </button>)}
        </div> : null}
        {mode !== 'interior' ? <label className="pou-neu-field pou-neu-field--azimut" htmlFor={`${id}-azimuth`}>{t.camera} <span className="pou-neu-field__valor" aria-hidden="true">{azimuth}°</span>
          <input id={`${id}-azimuth`} type="range" min="25" max="65" step="1" value={azimuth} aria-valuetext={`${azimuth}°`} onChange={(event) => setAzimuth(Math.max(25, Math.min(65, Number(event.target.value))))} />
        </label> : null}
        {iso3d ? <label className="pou-neu-field" htmlFor={`${id}-season`}>{t.season}
          <select id={`${id}-season`} data-season="" value={season} onChange={(event) => setSeason(event.target.value === 'summer' ? 'summer' : 'winter')}><option value="winter">{t.winter}</option><option value="summer">{t.summer}</option></select>
        </label> : <>
          <label className="pou-neu-field" htmlFor={`${id}-estat`}>{ti.estat}
            <select id={`${id}-estat`} data-estat="" value={estat} onChange={(event) => setEstat(ESTATS.includes(event.target.value) ? event.target.value : 'hui')}>{ESTATS.map((nom) => <option key={nom} value={nom}>{ti.estacions[nom]}</option>)}</select>
          </label>
          <label className="pou-neu-field" htmlFor={`${id}-coberta`}>{ti.coberta}
            <select id={`${id}-coberta`} data-coberta="" value={cobertaViva} aria-describedby={estat === 'hui' ? `${id}-coberta-hui` : undefined} onChange={(event) => setCoberta(event.target.value === 'fase1' ? 'fase1' : 'fase2')}>
              {['fase2', 'fase1'].map((nom) => <option key={nom} value={nom} disabled={nom === 'fase1' && estat === 'hui'}>{ti.cobertes[nom]}</option>)}
            </select>
          </label>
        </>}
        {mode === 'tall' ? <div className="pou-neu-talls" role="group" aria-label={ti.seccio}>
          {TALLS.map((nom) => <button key={nom} type="button" className="pou-neu-choice" data-tall-select={nom} aria-pressed={tall === nom} aria-label={ti.talls[nom]} onClick={() => setTall(nom)}>
            <Etiquetes llarga={ti.talls[nom]} curta={ti.tallsCurts[nom]} />
          </button>)}
        </div> : null}
      </div>
      {!iso3d && estat === 'hui' ? <p id={`${id}-coberta-hui`} className="pou-neu-hint">{ti.cobertaHui}</p> : null}
      {iso3d ? <>
        <p className="pou-neu-hint">{t.hint}</p>
        <div className="pou-neu-assemblies" role="group" aria-label={t.assemblies}>
          <button type="button" className="pou-neu-choice" data-pas="-1" aria-label={ti.anterior} onClick={() => mou(-1)}><span aria-hidden="true">←</span> <span className="pou-neu-etiqueta">{ti.anterior}</span></button>
          {IDS.map((assembly, at) => {
            const num = String(at + 1).padStart(2, '0');
            return <button key={assembly} type="button" className="pou-neu-choice" data-assembly-select={assembly} aria-pressed={selected === assembly} aria-label={`${num} ${t.names[at]}`} onClick={() => setSelected(assembly)}>
              <span aria-hidden="true">{num}</span> <span className="pou-neu-etiqueta">{t.names[at]}</span>
            </button>;
          })}
          <button type="button" className="pou-neu-choice" data-pas="1" aria-label={ti.seguent} onClick={() => mou(1)}><span className="pou-neu-etiqueta">{ti.seguent}</span> <span aria-hidden="true">→</span></button>
        </div>
      </> : null}
    </div>
    <div className="pou-neu-description" hidden={!iso3d} aria-live="polite"><strong>{t.names[index]}</strong><p>{t.descriptions[index]}</p></div>
    <dl className="pou-neu-readout" hidden={!iso3d} data-readout="" aria-live="polite" aria-atomic="true">
      {Object.entries(values).map(([key, value]) => <div key={key}><dt>{t[key]}</dt><dd data-metric={key} ref={key === 'z' ? zRef : undefined}>{numberOf(value, lang, key === 'z' ? 2 : key === 'density' ? 0 : 1)} {unit[key]}</dd></div>)}
    </dl>
    <details className="pou-neu-fitxa" data-fitxa-segura="" hidden={isFullscreen}>
      <summary>{ti.fitxa}</summary>
      <dl>
        {Object.entries(SEGURA_1987).map(([clau, m]) => <div key={clau}>
          <dt>{ti.fitxaClaus[clau]}</dt>
          <dd>{numberOf(m.valor, lang, m.decimals)} {m.unitat} <span className="pou-neu-fitxa__linia">({ti.linia} {m.linia})</span></dd>
        </div>)}
      </dl>
      <p className="pou-neu-fitxa__nota">{ti.fitxaNota}</p>
    </details>
    <p className="pou-neu-note">{iso3d ? t.estimate : ti.font}</p>
  </section>;
}
