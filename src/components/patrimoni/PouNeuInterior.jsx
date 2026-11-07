/**
 * PouNeuInterior.jsx — IDEA-165 + IDEA-160 (Onada R11) · Els modes WebGL del
 * visor únic del Pou de Neu del Rentonar (es carrega en diferit des de la
 * targeta, PouDeLaNeuAnatomiaCard.jsx, i es queda muntat entre modes: CP-13).
 *  · «interior»: caminar per dins com en un videojoc (a peu, amb gravetat i
 *    col·lisions, o en vol), amb sis estacions guiades i visita guiada.
 *  · «tall»: el pou tallat, vist des de fora en òrbita (l'«Angle de càmera»
 *    de la targeta). `tall` tria la secció: 'ab' (A-B, oest-est, de Segura),
 *    'cd' (C-D, nord-sud pel túnel) o 'quart' (un quart llevat, com un motor
 *    seccionat).
 *  · El motor es crea quan la vista s'acosta a la pantalla (CP-08) i només es
 *    pinta quan cal: en moviment, amb menys píxels; parat, un fotograma nítid.
 *  · El HUD de l'interior (estacions, accions i relat) es pinta dins de la
 *    ranura que li dona la targeta (`ranura`, un portal): així la pantalla
 *    completa el pot posar damunt de la vista o a la columna dreta (VH-10).
 * Les cotes són línies de làmina amb trets a 45° i la xifra de
 * pouNeuRentonar.js; s'amaguen quan una paret les tapa, quan el tall en lleva
 * la meitat o quan la xifra cauria davall d'un comandament. Controls: W A S D
 * o fletxes, Q/E o Re Pàg/Av Pàg per a pujar i baixar en vol, R/F per a alçar
 * i abaixar la mirada (a peu i en vol; empelt E3 de la co-creació R11: amb el
 * teclat sol també es veu la cúpula), ratolí o dit per a mirar, palanca tàctil
 * a la part esquerra i coixinet de botons de 48 px (la 4a columna mira amunt i
 * avall a peu, i puja i baixa en vol).
 * Amb prefers-reduced-motion no hi ha cap moviment autònom.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BotoVeuIaia } from '../PedraSeca/molecules/BotoVeuIaia.jsx';
import { CAMERA_FORA, CAMERES_GUIADES, COTES_INTERIOR, NIVELLS_NEU, POU_RENTONAR, cotaEnTall, distanciaAlSolid } from './iso/pouNeuRentonar.js';
import { cameraTerceraPersona, creaMotorInterior, esVisible, llegixColors, mouAmbColisio, orbita, projecta, rotacioCamera, solDavall, sostreDamunt } from './iso/pouNeuInterior.js';
import { POU_NEU_INTERIOR_TEXT } from './iso/pouNeuTextosInterior.js';

const ALTURA_ULL = 1.6;
const VELOCITAT = { peu: 2.2, vol: 3.4 };
const GIR = 70; // graus per segon amb les fletxes
/** Cos i cap per a les col·lisions: a peu, el cos (pit) i el cap van separats (VH-08). */
const COS = { peu: { radiCos: 0.28, radiCap: 0.1, alturaCos: 0.6 }, vol: { radiCos: 0.16, radiCap: 0.1, alturaCos: 0 } };
/** Pressupost de píxels del raymarch (CP-07): parat, nítid; en moviment, lleuger. */
const PIXELS = { repos: 1.2e6, moviment: 0.35e6 };
const NITID_MS = 150;
const SONDES = ['paper', 'tinta', 'calcaria', 'argila', 'palla', 'vegetacio', 'carrasca', 'gel', 'ombra'];
const TECLES = {
  KeyW: 'davant', ArrowUp: 'davant', KeyS: 'darrere', ArrowDown: 'darrere',
  KeyA: 'esquerra', KeyD: 'dreta', ArrowLeft: 'giraEsq', ArrowRight: 'giraDreta',
  KeyQ: 'puja', PageUp: 'puja', KeyE: 'baixa', PageDown: 'baixa',
  KeyR: 'mirarAmunt', KeyF: 'mirarAvall',
};
/** A11Y-02 · Tecles que, amb el focus a la vista, desplaçarien la pàgina: la vista se les queda (sense acció). */
const ENGOLIDES = new Set(['Space', 'Home', 'End']);
/** A11Y-07 · Si el context WebGL perdut no torna en este temps, el visor passa al desmuntatge amb un avís. */
const ESPERA_CONTEXT_MS = 3000;
/** Els comandaments que una xifra de cota no ha de tapar (en pantalla completa van damunt de la vista). */
const OBSTACLES = '.pou-neu-interior__coixinet, .pou-neu-interior__cameres, .pou-neu-interior__accions, .pou-neu-interior__relat, .pou-neu-interior__avis';
const ALT_TEXT = 20; // px: la xifra de 16 px amb el seu halo
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const copia = (c) => ({ ...c, pos: c.pos.slice() });
const intersecta = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
const totes = [...CAMERES_GUIADES, CAMERA_FORA];
const reduida = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const tactil = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const formatCota = (m, lang) => `${new Intl.NumberFormat(lang, { minimumFractionDigits: m.decimals, maximumFractionDigits: m.decimals }).format(m.valor)} ${m.unitat}`;

/** La càmera d'una estació; dins del cilindre, mai davall de la neu de l'estat triat. */
function cameraDe(id, estat = 'hui') {
  const c = totes.find((cam) => cam.id === id) || CAMERES_GUIADES[1];
  const pos = c.pos.slice();
  const neu = NIVELLS_NEU[estat] ?? 0;
  let cabotatge = c.cabotatge;
  if (neu > 0 && Math.hypot(pos[0], pos[2]) < POU_RENTONAR.R && pos[1] < neu + ALTURA_ULL) {
    pos[1] = neu + ALTURA_ULL;
    cabotatge = c.cabotatgeNeu ?? cabotatge;
  }
  return { pos, guinyada: c.guinyada, cabotatge, fov: 1.0 };
}

/** Les opcions del camp de distància per a l'estat viu (mode, estat, coberta i tall). */
const opcionsDe = (s) => ({ nivellNeu: NIVELLS_NEU[s.estat] ?? 0, tall: s.mode === 'tall' ? s.tall : false, estat: s.estat, coberta: s.coberta });


/** Escala del llenç (píxels del llenç per píxel CSS) dins del pressupost. */
function escalaDe(ample, alt, enMoviment) {
  const dpr = typeof devicePixelRatio === 'number' && devicePixelRatio > 0 ? devicePixelRatio : 1;
  return Math.max(0.5, Math.min(dpr, 2, Math.sqrt((enMoviment ? PIXELS.moviment : PIXELS.repos) / (ample * alt))));
}

/** Els rectangles dels comandaments que cauen damunt de la vista, en coordenades de la vista. */
function obstaclesDe(arrel, caixa) {
  const card = arrel?.closest('.pou-neu-card') || arrel;
  if (!card) return [];
  return [...card.querySelectorAll(OBSTACLES)]
    .map((n) => n.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r) => [r.left - caixa.left, r.top - caixa.top, r.right - caixa.left, r.bottom - caixa.top])
    .filter((r) => intersecta(r, [0, 0, caixa.width, caixa.height]));
}

/** L'amplada d'una xifra (es mesura quan és visible; mentrestant, una estimació). */
function ampladaDe(text, amplades) {
  const clau = text.textContent;
  if (amplades.has(clau)) return amplades.get(clau);
  const mesura = typeof text.getComputedTextLength === 'function' ? text.getComputedTextLength() : 0;
  if (mesura > 0) { amplades.set(clau, mesura); return mesura; }
  return clau.length * 9;
}

/** On prova la xifra al llarg del tros visible de la línia: el centre i, si xoca, a un terç de cada extrem. */
const LLOCS_XIFRA = [0.5, 0.3, 0.7];

/** Liang-Barsky: el tros [t0, t1] del segment a→b que cau dins de la caixa [x0, y0, x1, y1], o null. */
function trosDins(a, b, [x0, y0, x1, y1]) {
  let t0 = 0, t1 = 1;
  const dx = b.x - a.x, dy = b.y - a.y;
  for (const [p, q] of [[-dx, a.x - x0], [dx, x1 - a.x], [-dy, a.y - y0], [dy, y1 - a.y]]) {
    if (p === 0) { if (q < 0) return null; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return null; t0 = Math.max(t0, r); } else { if (r < t0) return null; t1 = Math.min(t1, r); }
  }
  return [t0, t1];
}

/**
 * Situa una cota (línia amb trets i xifra paral·lela) i diu si es veu. La xifra
 * es queda dins de la vista i, si cau damunt d'un comandament, s'amaga (VH-11).
 * VIS-05 · La xifra va damunt del tros de línia que es veu (la galeria de 29 m
 * ix de la vista: la xifra no es despenja cap a la cantonada), i les xifres ja
 * situades també són obstacles: dues xifres no es tapen; la que no troba lloc s'amaga.
 */
function situaCota(g, cota, camera, ample, alt, opcions, obstacles, amplades) {
  const a = projecta(cota.a, camera, ample, alt, camera.fov);
  const b = projecta(cota.b, camera, ample, alt, camera.fov);
  if (!a || !b || Math.hypot(b.x - a.x, b.y - a.y) <= 28) return false;
  if (!esVisible(cota.a.map((v, i) => (v + cota.b[i]) / 2), camera, opcions)) return false;
  const linia = g.querySelector('line'), text = g.querySelector('text');
  let angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
  if (angle > 90) angle -= 180; else if (angle <= -90) angle += 180;
  const rad = angle * Math.PI / 180, cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad));
  const w = ampladaDe(text, amplades);
  const hx = (w * cos + ALT_TEXT * sin) / 2, hy = (w * sin + ALT_TEXT * cos) / 2;
  const minX = ample * 0.06 + hx, maxX = ample * 0.94 - hx, minY = hy + 4, maxY = alt - hy - 4;
  if (minX > maxX || minY > maxY) return false;
  // El centre de la xifra cau sobre la línia i dins de la vista (la caixa ja descompta el mig text).
  const tros = trosDins(a, b, [minX, minY, maxX, maxY]);
  if (!tros) return false;
  for (const f of LLOCS_XIFRA) {
    // La xifra va 12 px «damunt» de la línia (perpendicular, cap a dalt del text).
    const t = tros[0] + (tros[1] - tros[0]) * f;
    const cx = clamp(a.x + (b.x - a.x) * t + Math.sin(rad) * 12, minX, maxX);
    const cy = clamp(a.y + (b.y - a.y) * t - Math.cos(rad) * 12, minY, maxY);
    const lloc = [cx - hx - 4, cy - hy - 4, cx + hx + 4, cy + hy + 4];
    if (obstacles.some((o) => intersecta(o, lloc))) continue;
    linia.setAttribute('x1', a.x.toFixed(1)); linia.setAttribute('y1', a.y.toFixed(1));
    linia.setAttribute('x2', b.x.toFixed(1)); linia.setAttribute('y2', b.y.toFixed(1));
    text.setAttribute('x', cx.toFixed(1)); text.setAttribute('y', cy.toFixed(1));
    text.setAttribute('transform', `rotate(${angle.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})`);
    obstacles.push(lloc);
    return true;
  }
  return false;
}

export default function PouNeuInterior({ t, lang = 'ca', mode = 'interior', estat = 'hui', coberta = 'fase2', tall = 'ab', angle = 45, noWebgl = false, onSuport, ranura = null }) {
  const id = useId().replace(/:/g, '');
  // Els relats viatgen amb este tros diferit (CP-15d); els rètols arriben per `t`.
  const r = POU_NEU_INTERIOR_TEXT[lang] || POU_NEU_INTERIOR_TEXT.ca;
  const interior = mode === 'interior';
  const arrel = useRef(null), vista = useRef(null), canvas = useRef(null), capaCotes = useRef(null), sondes = useRef(null);
  const motor = useRef(null), bucle = useRef(0), dirty = useRef(true), darrer = useRef(0), nitid = useRef(0), baixa = useRef(false);
  const colors = useRef(null), amplades = useRef(new Map());
  const cam = useRef(cameraDe('fons'));
  const desti = useRef(null), tecles = useRef(new Set());
  const mirada = useRef(null), palanca = useRef(null), vy = useRef(0), ull = useRef(ALTURA_ULL);
  const [suport, setSuport] = useState(null);
  const [aprop, setAprop] = useState(() => typeof IntersectionObserver !== 'function');
  const [desplacament, setDesplacament] = useState('peu');
  const [ambCotes, setAmbCotes] = useState(true);
  const [actual, setActual] = useState('fons');
  const [visita, setVisita] = useState(false);
  const [avis, setAvis] = useState('');
  const [persona, setPersona] = useState('primera');
  const [ajudaTactil] = useState(tactil);
  // CP-15a · L'estat viu per al bucle es copia després de cada render, mai durant.
  const viu = useRef({ mode, estat, coberta, tall, desplacament, ambCotes, persona, actual, t, onSuport });
  useLayoutEffect(() => {
    viu.current = { mode, estat, coberta, tall, desplacament, ambCotes, persona, actual, t, onSuport };
  });

  const pintaCotes = useCallback((ample, alt, camera, caixa) => {
    const svg = capaCotes.current;
    if (!svg) return;
    svg.setAttribute('viewBox', `0 0 ${ample} ${alt}`);
    const s = viu.current;
    const veure = s.ambCotes && s.mode !== 'desmuntatge';
    const opcions = opcionsDe(s);
    const obstacles = veure ? obstaclesDe(arrel.current, caixa) : [];
    for (const cota of COTES_INTERIOR) {
      const g = svg.querySelector(`[data-cota="${cota.id}"]`);
      if (!g) continue;
      const ok = veure && cotaEnTall(cota, opcions.tall) && situaCota(g, cota, camera, ample, alt, opcions, obstacles, amplades.current);
      g.setAttribute('data-visible', String(Boolean(ok)));
    }
  }, []);

  const pinta = useCallback((enMoviment = false) => {
    const c = canvas.current, m = motor.current;
    if (!c || !m) return;
    const caixa = c.getBoundingClientRect();
    if (caixa.width < 2 || caixa.height < 2) return;
    const s = viu.current;
    const escala = escalaDe(caixa.width, caixa.height, enMoviment);
    const ample = Math.max(1, Math.round(caixa.width * escala)), alt = Math.max(1, Math.round(caixa.height * escala));
    const o = opcionsDe(s);
    // La càmera que es pinta: la de l'ull o, en 3a persona, la de seguiment darrere de la figura.
    const camera = (s.mode === 'interior' && s.persona === 'tercera' && cameraTerceraPersona(cam.current, o)) || cam.current;
    const figura = camera === cam.current ? null : [cam.current.pos[0], cam.current.pos[1] - ull.current, cam.current.pos[2]];
    // VH-03a · CP-12: els colors es lligen una vegada i només es tornen a llegir si canvia el tema.
    if (!colors.current) colors.current = llegixColors(sondes.current);
    m.pinta({ camera, figura, ample, alt, escalaPx: ample / caixa.width, nivellNeu: o.nivellNeu, tall: o.tall, estat: o.estat, coberta: o.coberta, llanterna: o.tall ? 0.25 : 1, colors: colors.current });
    baixa.current = enMoviment;
    pintaCotes(caixa.width, caixa.height, camera, caixa);
    arrel.current?.setAttribute('data-camera', cam.current.pos.map((n) => n.toFixed(2)).join(' '));
  }, [pintaCotes]);

  const pas = useCallback((dt) => {
    const k = tecles.current, c = cam.current, s = viu.current;
    let canvi = false;
    if (desti.current) {
      const d = desti.current;
      d.t = Math.min(1, d.t + dt / d.durada);
      const e = d.t < 0.5 ? 2 * d.t * d.t : 1 - (-2 * d.t + 2) ** 2 / 2;
      c.pos = d.de.pos.map((v, i) => v + (d.a.pos[i] - v) * e);
      c.guinyada = d.de.guinyada + (((d.a.guinyada - d.de.guinyada + 540) % 360) - 180) * e;
      c.cabotatge = d.de.cabotatge + (d.a.cabotatge - d.de.cabotatge) * e;
      c.fov = d.de.fov + (d.a.fov - d.de.fov) * e;
      if (d.t >= 1) desti.current = null;
      canvi = true;
    }
    if (s.mode !== 'interior') return canvi;
    const giro = (k.has('giraDreta') ? 1 : 0) - (k.has('giraEsq') ? 1 : 0);
    if (giro) { c.guinyada += giro * GIR * dt; canvi = true; }
    const mirar = (k.has('mirarAmunt') ? 1 : 0) - (k.has('mirarAvall') ? 1 : 0);
    if (mirar) { c.cabotatge = clamp(c.cabotatge + mirar * GIR * dt, -85, 85); canvi = true; }
    const p = palanca.current;
    const avant = clamp((k.has('davant') ? 1 : 0) - (k.has('darrere') ? 1 : 0) - (p ? p.dy : 0), -1, 1);
    const lateral = clamp((k.has('dreta') ? 1 : 0) - (k.has('esquerra') ? 1 : 0) + (p ? p.dx : 0), -1, 1);
    const vertical = (k.has('puja') ? 1 : 0) - (k.has('baixa') ? 1 : 0);
    const vol = s.desplacament === 'vol';
    const { davant, dreta } = rotacioCamera(c.guinyada, vol ? c.cabotatge : 0);
    const v = VELOCITAT[s.desplacament] * dt;
    const opcions = opcionsDe(s);
    if (avant || lateral || (vol && vertical)) {
      const moviment = [(davant[0] * avant + dreta[0] * lateral) * v, vol ? (davant[1] * avant + vertical) * v : 0, (davant[2] * avant + dreta[2] * lateral) * v];
      const nou = mouAmbColisio(c.pos, moviment, { ...COS[s.desplacament], opcions });
      // A peu no es salta al buit des de l'ingrés de 10 m ni des de la finestra.
      if (!vol && solDavall(c.pos, opcions) - solDavall(nou, opcions) > 1.2) setAvis(s.t.vora);
      else { c.pos = nou; canvi = true; }
    }
    if (!vol) {
      const sol = solDavall(c.pos, opcions);
      ull.current = clamp(sostreDamunt(c.pos, opcions) - sol - 0.15, 0.4, ALTURA_ULL);
      const objectiu = sol + ull.current;
      if (c.pos[1] > objectiu + 0.02) { vy.current -= 9.8 * dt; c.pos[1] = Math.max(objectiu, c.pos[1] + vy.current * dt); canvi = true; }
      else if (Math.abs(c.pos[1] - objectiu) > 0.005) { c.pos[1] += (objectiu - c.pos[1]) * Math.min(1, dt * 10); vy.current = 0; canvi = true; }
      else vy.current = 0;
    }
    return canvi;
  }, []);

  const engega = useCallback(() => {
    if (bucle.current || !motor.current) return;
    darrer.current = 0;
    const tick = (ara) => {
      bucle.current = 0;
      const dt = darrer.current ? Math.min((ara - darrer.current) / 1000, 1 / 20) : 1 / 60;
      darrer.current = ara;
      const mogut = pas(dt);
      const continua = Boolean(mogut || tecles.current.size || palanca.current || desti.current);
      if (mogut || dirty.current) { pinta(continua || Boolean(mirada.current)); dirty.current = false; }
      if (continua && !document.hidden) bucle.current = requestAnimationFrame(tick);
      else if (baixa.current && !nitid.current) {
        // Quan el moviment s'atura, un fotograma nítid.
        nitid.current = setTimeout(() => {
          nitid.current = 0;
          if (bucle.current || !motor.current) return;
          dirty.current = true; darrer.current = 0;
          bucle.current = requestAnimationFrame(tick);
        }, NITID_MS);
      }
    };
    bucle.current = requestAnimationFrame(tick);
  }, [pas, pinta]);

  const marca = useCallback(() => { dirty.current = true; engega(); }, [engega]);

  const vesA = useCallback((nou, durada = 1.3, salta = false) => {
    if (reduida() || durada === 0) { cam.current = copia(nou); desti.current = null; marca(); return; }
    desti.current = { de: copia(cam.current), a: nou, t: 0, durada, salta };
    marca();
  }, [marca]);

  const triaCamera = useCallback((idCamera, durada, salta = false) => {
    setActual(idCamera); setAvis('');
    setDesplacament(totes.find((c) => c.id === idCamera)?.vol ? 'vol' : 'peu');
    vy.current = 0;
    vesA(cameraDe(idCamera, viu.current.estat), durada, salta);
  }, [vesA]);

  /**
   * CP-04 · CP-06 · Una tecla o un toc anul·len la transició només dins del pou:
   * al tall no s'anul·la mai, i si la transició ve del tall (o la càmera ha
   * quedat dins d'un sòlid) es salta al destí, no es queda a mig camí.
   */
  const interromp = useCallback(() => {
    const d = desti.current;
    if (!d || viu.current.mode !== 'interior') return;
    const p = cam.current.pos;
    if (d.salta || distanciaAlSolid(p[0], p[1], p[2], opcionsDe(viu.current)) < 0.1) { cam.current = copia(d.a); dirty.current = true; }
    desti.current = null;
  }, []);

  // CP-08 · El motor no es crea fins que la vista s'acosta a la pantalla (200 px).
  useEffect(() => {
    if (aprop) return undefined;
    const v = vista.current;
    if (!v) return undefined;
    const observa = new IntersectionObserver((entrades) => {
      if (entrades.some((e) => e.isIntersecting)) { observa.disconnect(); setAprop(true); }
    }, { rootMargin: '200px' });
    observa.observe(v);
    return () => observa.disconnect();
  }, [aprop]);

  // Motor: només amb WebGL2 real (mai en JSDOM ni amb ?no-webgl).
  useEffect(() => {
    const c = canvas.current;
    if (!aprop || !c) return undefined;
    const avisa = (...args) => viu.current.onSuport?.(...args);
    const desactivat = noWebgl || typeof WebGL2RenderingContext === 'undefined' || new URLSearchParams(window.location.search).has('no-webgl');
    if (desactivat) { setSuport(false); avisa(false, false); return undefined; }
    let m = null, espera = 0;
    const deixaEsperar = () => { clearTimeout(espera); espera = 0; };
    try {
      m = creaMotorInterior(c, { g: POU_RENTONAR, onRestaurat: () => { deixaEsperar(); colors.current = null; arrel.current?.removeAttribute('data-perdut'); marca(); } });
    } catch { m = null; }
    if (!m) { setSuport(false); avisa(false, true); return undefined; }
    motor.current = m; setSuport(true); avisa(true, true);
    /* Context perdut: el llenç s'amaga (es veu el pergamí). Si torna però el motor no es refà, o si
       no torna en ESPERA_CONTEXT_MS (A11Y-07: abans el visor quedava en blanc per sempre), el visor
       passa al desmuntatge amb un avís que diu que el navegador l'ha aturat. Amb la pestanya
       amagada (on el navegador pot tardar a tornar-lo) l'espera continua fins que es veu. */
    const passaAlDesmuntatge = () => { deixaEsperar(); setSuport(false); avisa(false, true, 'perdut'); };
    const esperaContext = () => {
      espera = setTimeout(() => {
        espera = 0;
        if (!m.perdut) return;
        if (document.hidden) esperaContext(); else passaAlDesmuntatge();
      }, ESPERA_CONTEXT_MS);
    };
    const perdut = () => { arrel.current?.setAttribute('data-perdut', 'true'); deixaEsperar(); esperaContext(); };
    const restaurat = () => { if (m.perdut) passaAlDesmuntatge(); else deixaEsperar(); };
    c.addEventListener('webglcontextlost', perdut);
    c.addEventListener('webglcontextrestored', restaurat);
    const redimensiona = typeof ResizeObserver === 'function' ? new ResizeObserver(() => marca()) : null;
    redimensiona?.observe(c);
    const visible = () => { if (!document.hidden) marca(); };
    document.addEventListener('visibilitychange', visible);
    // VH-03a · CP-12: el tema (data-theme, data-contrast o el del sistema) torna a llegir els colors.
    // LLEI_06 · S'escolta l'avantpassat que porta el data-theme (com BrainGraph), mai el document amfitrió:
    // a l'App és l'<html>; incrustat (<soc-de-poble>), l'amfitrió, perquè closest() no ix del shadow root.
    const tema = () => { colors.current = null; marca(); };
    const nus = arrel.current;
    const arrelTema = nus?.closest('[data-theme]') ?? nus?.getRootNode?.().host?.closest('[data-theme]') ?? null;
    const atributs = arrelTema && typeof MutationObserver === 'function' ? new MutationObserver(tema) : null;
    atributs?.observe(arrelTema, { attributes: true, attributeFilter: ['data-theme', 'data-contrast'] });
    const fosc = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
    fosc?.addEventListener?.('change', tema);
    marca();
    return () => {
      if (bucle.current) cancelAnimationFrame(bucle.current);
      bucle.current = 0;
      clearTimeout(nitid.current); nitid.current = 0;
      deixaEsperar();
      redimensiona?.disconnect();
      atributs?.disconnect();
      fosc?.removeEventListener?.('change', tema);
      document.removeEventListener('visibilitychange', visible);
      c.removeEventListener('webglcontextlost', perdut);
      c.removeEventListener('webglcontextrestored', restaurat);
      m.dispose(); motor.current = null;
    };
  }, [aprop, noWebgl, marca]);

  // CP-14e · Les tecles es buiden si la finestra perd el focus o la pestanya s'amaga.
  useEffect(() => {
    const buida = () => { tecles.current.clear(); palanca.current = null; mirada.current = null; };
    const pestanya = () => { if (document.hidden) buida(); };
    window.addEventListener('blur', buida);
    document.addEventListener('visibilitychange', pestanya);
    return () => { window.removeEventListener('blur', buida); document.removeEventListener('visibilitychange', pestanya); };
  }, []);

  // Canvi de mode, estat, coberta, tall, angle o cotes: un fotograma nou (i l'òrbita del tall).
  const modeWebgl = useRef(mode === 'tall' ? 'tall' : 'interior');
  useEffect(() => {
    if (mode === 'desmuntatge') return; // amagat: la càmera es queda on era
    const anterior = modeWebgl.current;
    modeWebgl.current = mode;
    if (mode === 'tall') vesA(orbita(angle), anterior === 'tall' ? 0 : 1.1);
    else if (anterior === 'tall') triaCamera(viu.current.actual, 1.1, true);
    else {
      // Si la neu de l'estat nou cobrix la càmera, es puja damunt de la neu.
      const p = cam.current.pos, neu = NIVELLS_NEU[estat] ?? 0;
      if (neu > 0 && Math.hypot(p[0], p[2]) < POU_RENTONAR.R && p[1] < neu + ALTURA_ULL) { p[1] = neu + ALTURA_ULL; vy.current = 0; }
      marca();
    }
  }, [mode, angle, estat, coberta, tall, ambCotes, vesA, marca, triaCamera]);

  // Visita guiada: una estació cada 9 s fins que la persona toca un control.
  useEffect(() => {
    if (!visita || mode !== 'interior' || reduida()) return undefined;
    const ordre = CAMERES_GUIADES.map((c) => c.id);
    const rellotge = setInterval(() => {
      triaCamera(ordre[(ordre.indexOf(viu.current.actual) + 1) % ordre.length], 2.2);
    }, 9000);
    return () => clearInterval(rellotge);
  }, [visita, mode, triaCamera]);

  const prem = (accio, avall) => {
    if (avall) { tecles.current.add(accio); setVisita(false); interromp(); } else tecles.current.delete(accio);
    engega();
  };
  const onKeyDown = (e) => {
    if (!interior || e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey) return;
    const accio = TECLES[e.code];
    // A11Y-02 · Espai, Maj+Espai, Inici i Fi no fan desplaçar la pàgina mentre es camina.
    if (!accio) { if (ENGOLIDES.has(e.code)) e.preventDefault(); return; }
    e.preventDefault();
    prem(accio, true);
  };
  const onKeyUp = (e) => { const accio = TECLES[e.code]; if (accio) prem(accio, false); };
  const onBlur = () => { tecles.current.clear(); palanca.current = null; };

  const onPointerDown = (e) => {
    // Al tall la vista és una imatge: cap gest no l'atura ni la mou.
    if (!interior || (e.button !== 0 && e.pointerType === 'mouse')) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setVisita(false); interromp();
    const caixa = e.currentTarget.getBoundingClientRect();
    if (e.pointerType !== 'mouse' && e.clientX - caixa.left < caixa.width * 0.4) {
      palanca.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 };
    } else mirada.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    engega();
  };
  const onPointerMove = (e) => {
    const p = palanca.current;
    if (p && p.id === e.pointerId) { p.dx = clamp((e.clientX - p.x0) / 60, -1, 1); p.dy = clamp((e.clientY - p.y0) / 60, -1, 1); engega(); return; }
    const m = mirada.current;
    if (!m || m.id !== e.pointerId || !interior) return;
    const dx = e.clientX - m.x, dy = e.clientY - m.y;
    m.x = e.clientX; m.y = e.clientY;
    cam.current.guinyada += dx * 0.25;
    cam.current.cabotatge = clamp(cam.current.cabotatge - dy * 0.25, -85, 85);
    marca();
  };
  const onPointerUp = (e) => {
    const mirava = mirada.current?.id === e.pointerId;
    if (palanca.current?.id === e.pointerId) palanca.current = null;
    if (mirava) { mirada.current = null; marca(); }
  };
  const tecla = (accio, glif, nom) => <button key={accio} type="button" className="pou-neu-interior__tecla" aria-label={nom}
    onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); prem(accio, true); }} onPointerUp={() => prem(accio, false)}
    onPointerLeave={() => prem(accio, false)} onPointerCancel={() => prem(accio, false)}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); prem(accio, true); } }}
    onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') prem(accio, false); }}><span aria-hidden="true">{glif}</span></button>;
  const vol = desplacament === 'vol';
  const movimentReduit = reduida();
  const boto = (nom, glif, premut, onClick, extra = {}) => <button type="button" className="pou-neu-choice" aria-pressed={premut} aria-label={nom} onClick={onClick} {...extra}>
    <span aria-hidden="true">{glif}</span> <span className="pou-neu-etiqueta">{nom}</span>
  </button>;
  const hud = interior ? <>
    <div className="pou-neu-interior__cameres" role="group" aria-label={t.cameres}>
      {CAMERES_GUIADES.map((c, i) => {
        const num = String(i + 1).padStart(2, '0'), nom = r.nomsCameres[c.id];
        return <button key={c.id} type="button" className="pou-neu-choice" data-camera-guiada={c.id} aria-pressed={actual === c.id} aria-label={`${num} ${nom}`} title={nom} onClick={() => { setVisita(false); triaCamera(c.id); }}>
          <span aria-hidden="true">{num}</span> <span className="pou-neu-etiqueta">{nom}</span>
        </button>;
      })}
    </div>
    <div className="pou-neu-interior__accions" role="group" aria-label={t.accions}>
      {boto(t.visita, visita ? '⏸' : '▶', visita, () => setVisita((v) => !v), { disabled: movimentReduit, 'aria-describedby': movimentReduit ? `${id}-reduida` : undefined })}
      {boto(t.vol, '🕊', vol, () => { setDesplacament(vol ? 'peu' : 'vol'); setAvis(''); marca(); })}
      {boto(t.terceraPersona, '👤', persona === 'tercera', () => { setPersona((p) => (p === 'tercera' ? 'primera' : 'tercera')); marca(); })}
      {boto(t.cotes, '📐', ambCotes, () => setAmbCotes((v) => !v))}
    </div>
    <div className="pou-neu-interior__relat" aria-live="polite">
      <strong>{r.nomsCameres[actual]}</strong>
      <p>{r.relats[actual]}</p>
      <BotoVeuIaia className="pou-neu-interior__iaia" text={`${r.nomsCameres[actual]}. ${r.relats[actual]}`} idioma={lang} privat={false} aria-label={t.escolta} />
    </div>
    {movimentReduit ? <span id={`${id}-reduida`} hidden>{t.visitaReduida}</span> : null}
  </> : null;
  return <div ref={arrel} className="pou-neu-interior" hidden={mode === 'desmuntatge'} data-mode={mode} data-suport={suport === null ? 'pendent' : String(suport)}>
    <span ref={sondes} className="pou-neu-interior__sondes" aria-hidden="true">
      {SONDES.map((nom) => <span key={nom} data-sonda={nom} className="pou-neu-sonda" />)}
    </span>
    <div ref={vista} className="pou-neu-interior__vista" role={interior ? 'application' : 'img'} tabIndex={interior ? 0 : undefined}
      aria-label={interior ? t.etiqueta : t.etiquetaTall} aria-describedby={`${id}-ajuda`}
      onKeyDown={onKeyDown} onKeyUp={onKeyUp} onBlur={onBlur}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      <canvas ref={canvas} className="pou-neu-interior__canvas" />
      <svg ref={capaCotes} className="pou-neu-interior__cotes" aria-hidden="true">
        <defs>
          <marker id={`${id}-tret`} viewBox="-5 -5 10 10" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
            <path className="pou-neu-interior__cota-tret" d="M-4,4 L4,-4" />
          </marker>
        </defs>
        {COTES_INTERIOR.map((cota) => <g key={cota.id} data-cota={cota.id} data-seccio={cota.seccio ?? undefined} data-visible="false">
          <line className="pou-neu-interior__cota-linia" markerStart={`url(#${id}-tret)`} markerEnd={`url(#${id}-tret)`} />
          <text className="pou-neu-interior__cota-text" textAnchor="middle" dominantBaseline="central">{formatCota(cota.mesura, lang)}</text>
        </g>)}
      </svg>
      {interior ? <div className="pou-neu-interior__coixinet" role="group" aria-label={t.moviment}>
        {tecla('giraEsq', '↶', t.giraEsq)}{tecla('davant', '▲', t.davant)}{tecla('giraDreta', '↷', t.giraDreta)}{vol ? tecla('puja', '⤒', t.puja) : tecla('mirarAmunt', '⇡', t.mirarAmunt)}
        {tecla('esquerra', '◀', t.esquerra)}{tecla('darrere', '▼', t.darrere)}{tecla('dreta', '▶', t.dreta)}{vol ? tecla('baixa', '⤓', t.baixa) : tecla('mirarAvall', '⇣', t.mirarAvall)}
      </div> : null}
    </div>
    <p id={`${id}-ajuda`} className="pou-neu-interior__ajuda">{interior ? (ajudaTactil ? t.ajudaTactil : t.ajuda) : t.ajudaTall}</p>
    {avis && interior ? <p className="pou-neu-interior__avis" role="status">{avis}</p> : null}
    {ranura ? (hud ? createPortal(hud, ranura) : null) : hud}
  </div>;
}
