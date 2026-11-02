import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement as h } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { BarraBlava } from '../components/universal/barres/BarraBlava.jsx';

/* PS-04 (B7d, marató 261101_2143) · La barra blava per davall de 336 px.
   Set cel·les de 48 (Arrere · Índex · Endavant, Traduir · Comentar ·
   Compartir, «+») demanen 336 px. Amb el rail de 56 px (finestres de 360 a
   391) o a la tercera columna de 1024, la barra en fa 304-335 i el «+» de
   CONNECTAR quedava retallat (Chrome, 261101: 7, 17 i 32 px a 385, 375 i
   360; 14 a 1024). També un telèfon de menys de 336 px sense rail (16 px a
   320) i la tercera columna fins a uns 1135 px de finestra. Default D-2 de
   la spec B7: s'amaga Endavant i en queden sis, 288 px.
   jsdom no resol @container ni pinta. La prova fa la cascada ella mateixa:
   la barra és la de BarraBlava (DOM real) i les regles, les de
   components.css; jsdom diu quins selectors casen, i la prova aplica capes,
   consultes, especificitat i ordre, i suma l'amplària que demana la
   graella. La mesura de veres (Chrome headless aïllat contra :3340) és al
   registre del carril M20-B7d-BARRA. */

afterEach(cleanup);

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles fulla en ordre de font: { prelud, cos, pares }. */
function regles(css) {
  const eixida = [];
  const pila = [];
  let tros = '';
  for (const c of senseComentaris(css)) {
    if (c === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      pila.push({ prelud: tros.split(';').pop().trim().replace(/\s+/g, ' '), fills: false });
      tros = '';
    } else if (c === '}') {
      const marc = pila.pop();
      if (marc && !marc.fills) eixida.push({ prelud: marc.prelud, cos: tros.replace(/\s+/g, ' ').trim(), pares: pila.map((p) => p.prelud) });
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}

/** Parteix per `sep` fora de parèntesis. */
function parteix(text, sep) {
  const parts = [];
  let fons = 0;
  let tros = '';
  for (const c of text) {
    if (c === '(') fons += 1;
    else if (c === ')') fons -= 1;
    if (fons === 0 && (sep === ' ' ? /\s/.test(c) : c === sep)) {
      if (tros.trim()) parts.push(tros.trim());
      tros = '';
    } else {
      tros += c;
    }
  }
  if (tros.trim()) parts.push(tros.trim());
  return parts;
}

/** Declaracions en propietats llargues (només les que la barra necessita). */
function llargues(cos) {
  const d = {};
  for (const declaracio of parteix(cos, ';')) {
    const k = declaracio.indexOf(':');
    if (k < 0) continue;
    const prop = declaracio.slice(0, k).trim();
    const brut = declaracio.slice(k + 1).trim();
    const imp = /!important$/.test(brut);
    const valor = brut.replace(/\s*!important$/, '');
    const posa = (p, v) => { d[p] = { valor: v, imp }; };
    const v = parteix(valor, ' ');
    if (prop === 'padding') { const [, r = v[0], , l = r] = v; posa('padding-right', r); posa('padding-left', l); }
    else if (prop === 'padding-inline') { posa('padding-left', v[0]); posa('padding-right', v[1] ?? v[0]); }
    else if (prop === 'padding-inline-start') posa('padding-left', valor);
    else if (prop === 'padding-inline-end') posa('padding-right', valor);
    else if (prop === 'gap') posa('column-gap', v[1] ?? v[0]);
    else if (prop === 'inline-size') posa('width', valor);
    else if (prop === 'min-inline-size') posa('min-width', valor);
    else posa(prop, valor);
  }
  return d;
}

/** Especificitat [a, b, c] (Selectors 4: :where 0; :not/:is/:has, la del més específic). */
function especificitat(selector) {
  let a = 0; let b = 0; let c = 0; let resta = '';
  for (let i = 0; i < selector.length; i += 1) {
    const m = /^::?([-\w]+)\(/.exec(selector.slice(i));
    if (m) {
      let fons = 0; let j = i + m[0].length - 1;
      for (; j < selector.length; j += 1) {
        if (selector[j] === '(') fons += 1;
        else if (selector[j] === ')' && (fons -= 1) === 0) break;
      }
      const dins = selector.slice(i + m[0].length, j);
      if (['not', 'is', 'has', 'matches'].includes(m[1])) {
        const max = parteix(dins, ',').map(especificitat).reduce((x, y) => (compara(x, y) >= 0 ? x : y), [0, 0, 0]);
        a += max[0]; b += max[1]; c += max[2];
      } else if (m[1] !== 'where') {
        if (m[0].startsWith('::')) c += 1; else b += 1;
      }
      resta += ' ';
      i = j;
      continue;
    }
    resta += selector[i];
  }
  resta = resta.replace(/\[[^\]]*\]/g, () => { b += 1; return ' '; })
    .replace(/::[-\w]+/g, () => { c += 1; return ' '; })
    .replace(/:[-\w]+/g, () => { b += 1; return ' '; })
    .replace(/#[-\w]+/g, () => { a += 1; return ' '; })
    .replace(/\.[-\w]+/g, () => { b += 1; return ' '; });
  for (const t of resta.split(/[\s>+~]+/)) if (/^[a-zA-Z][-\w]*$/.test(t)) c += 1;
  return [a, b, c];
}
function compara(x, y) { return (x[0] - y[0]) || (x[1] - y[1]) || (x[2] - y[2]); }

const casa = (el, selector) => { try { return el.matches(selector); } catch { return false; } };

/* Tokens: el bloc arrel de tokens.css i design-tokens.css, i l'ample del
   rail (--app-grid-col-collapsed, a .app-grid-page d'AppGridShell.css). */
const ARRELS = [
  ...['src/css/tokens.css', 'src/css/design-tokens.css']
    .flatMap((ruta) => regles(llig(ruta)).filter((r) => r.pares.length === 0 && /^:root\b/.test(r.prelud))),
  ...regles(llig('src/components/layout/AppGridShell.css')).filter((r) => r.pares.length === 0 && r.prelud === '.app-grid-page'),
].map((r) => r.cos);
function token(nom) {
  const re = new RegExp(`(?:^|;)\\s*${nom.replace(/[-]/g, '\\-')}\\s*:\\s*([^;]+)`);
  for (const cos of ARRELS) { const m = re.exec(cos); if (m) return m[1].trim(); }
  throw new Error(`token desconegut: ${nom}`);
}
function px(valor) {
  const v = valor.trim();
  const amb = /^var\((--[-\w]+)\s*(?:,\s*(.+))?\)$/.exec(v);
  if (amb) {
    try { return px(token(amb[1])); } catch (e) { if (amb[2] !== undefined) return px(amb[2]); throw e; }
  }
  if (v === '0') return 0;
  const m = /^(-?\d*\.?\d+)px$/.exec(v);
  if (m) return Number(m[1]);
  throw new Error(`el model no sap llegir «${valor}»`);
}

/* El context de cada consulta: «contenidors» (navegador amb @container o
   no), l'amplària de la finestra i la del contenidor de l'element. */
function avaluaMedia(consulta, finestra) {
  return consulta.split(/\s+and\s+/).every((f) => {
    const t = f.trim();
    if (t === 'screen' || t === 'all') return true;
    const m = /^\((max|min)-width: ([\d.]+)px\)$/.exec(t);
    /* Hover fi, moviment reduït, impressió…: un mòbil tàctil no les complix. */
    if (!m) return false;
    return m[1] === 'max' ? finestra <= Number(m[2]) : finestra >= Number(m[2]);
  });
}
function complix(pare, ctx) {
  if (pare === '@layer components') return true;
  const cont = /^@container \((max|min)-width: ([\d.]+)px\)$/.exec(pare);
  if (cont) return ctx.contenidors && (cont[1] === 'max' ? ctx.contenidor <= Number(cont[2]) : ctx.contenidor >= Number(cont[2]));
  /* Amb nom: cap avantpassat de la barra en porta. */
  if (pare.startsWith('@container')) return false;
  if (pare.startsWith('@media ')) return avaluaMedia(pare.slice(7), ctx.finestra);
  if (pare === '@supports not (container-type: inline-size)') return !ctx.contenidors;
  return false;
}

const COMPONENTS = regles(llig('src/css/components.css'))
  .filter((r) => !r.prelud.startsWith('@'))
  .map((r, ordre) => ({ ...r, ordre, selectors: parteix(r.prelud, ','), decl: llargues(r.cos) }));

/** El valor que guanya per a `prop` en `el` (null si cap regla el posa). */
function calcula(el, prop, ctx, fulls) {
  let guanya = null;
  for (const r of fulls) {
    const d = r.decl[prop];
    if (!d) continue;
    let millor = null;
    for (const s of r.selectors) {
      if (!casa(el, s)) continue;
      const e = especificitat(s);
      if (!millor || compara(e, millor) > 0) millor = e;
    }
    if (!millor) continue;
    /* La barra es pinta tota des de @layer components: una regla fora de la
       capa guanyaria a totes i el model ja no valdria. */
    expect(r.pares[0], `${r.prelud} { ${r.cos} }`).toBe('@layer components');
    if (!r.pares.every((p) => complix(p, ctx))) continue;
    if (!guanya || (d.imp && !guanya.imp) || (d.imp === guanya.imp && compara(millor, guanya.esp) >= 0)) {
      guanya = { valor: d.valor, imp: d.imp, esp: millor };
    }
  }
  return guanya?.valor ?? null;
}
const longitud = (el, prop, ctx, fulls, perDefecte) => {
  const v = calcula(el, prop, ctx, fulls);
  if (v === null) {
    if (perDefecte === undefined) throw new Error(`${prop} sense valor a ${el.className}`);
    return perDefecte;
  }
  return px(v);
};

const res = () => {};
const TOTES = {
  onBack: res, onForward: res, onIndex: res,
  traduirVisible: true, comentarVisible: true, compartirVisible: true, connectarVisible: true,
  onTranslate: res, onComment: res, onShare: res, onConnect: res,
};
/* Fitxer .js (sense JSX): createElement. `accions` canvia la forma de la
   barra (p. ex. sense CONNECTAR, o sense Comentar en un objecte privat). */
function barra({ rail = true, ...accions } = {}) {
  const { container } = render(
    h('div', { className: 'app-grid-shell', 'data-layout': 'estret', 'data-llista': rail ? 'rail' : undefined },
      h('div', { className: 'sdp-universal-page-container' }, h(BarraBlava, { ...TOTES, ...accions })))
  );
  return container.querySelector('header.bar-blue');
}

/** Els botons de la barra que la cascada amaga en el context `ctx`. */
const amagats = (header, ctx, fulls = COMPONENTS) => [...header.querySelectorAll('button')]
  .filter((b) => calcula(b, 'display', ctx, fulls) === 'none').map((b) => b.getAttribute('aria-label'));

/**
 * La geometria de la barra a `ample` px. La capçalera consulta el seu pare
 * (.sdp-universal-page-container, del mateix ample: T20); els descendents
 * consulten la caixa de contingut de la barra.
 */
function geometria(header, ample, { contenidors = true, finestra = ample + 56, fulls = COMPONENTS } = {}) {
  const ctxBarra = { contenidors, finestra, contenidor: ample };
  const coixi = longitud(header, 'padding-left', ctxBarra, fulls, 0) + longitud(header, 'padding-right', ctxBarra, fulls, 0);
  const ctx = { contenidors, finestra, contenidor: ample - coixi };
  const visible = (el) => calcula(el, 'display', ctx, fulls) !== 'none';
  const cella = (el) => Math.max(longitud(el, 'width', ctx, fulls), longitud(el, 'min-width', ctx, fulls, 0));
  const pack = (el) => {
    const fills = [...el.children].filter(visible);
    return fills.reduce((s, f) => s + cella(f), 0) + longitud(el, 'column-gap', ctx, fulls, 0) * Math.max(0, fills.length - 1)
      + longitud(el, 'padding-left', ctx, fulls, 0) + longitud(el, 'padding-right', ctx, fulls, 0);
  };
  const esquerra = header.querySelector(':scope > .bar-blue-left');
  const trio = header.querySelector(':scope > .sp-card-actions');
  const connectar = header.querySelector(':scope > .btn-connectar');
  /* Graella de tres columnes (T37): dues separacions i cap pista per davall
     del seu contingut. Sense CONNECTAR, la tercera pista és buida. */
  const demana = coixi + 2 * longitud(header, 'column-gap', ctxBarra, fulls) + pack(esquerra) + pack(trio) + (connectar ? cella(connectar) : 0);
  return {
    demana,
    sobreix: Math.max(0, demana - ample),
    amagats: amagats(header, ctx, fulls),
    celles: [...esquerra.children, ...trio.children, ...(connectar ? [connectar] : [])].filter(visible).length,
    connectar: connectar ? cella(connectar) : null,
  };
}

const TOUCH = px('var(--sdp-touch)');
const RAIL = px('var(--app-grid-col-collapsed)');
const LLINDAR = 7 * TOUCH - 0.02;
const CONSULTA = `@container (max-width: ${LLINDAR}px)`;
const XARXA_MEDIA = `@media (max-width: ${LLINDAR + RAIL}px)`;
const SUPORT = '@supports not (container-type: inline-size)';
const ENDAVANT = '.bar-blue .bar-blue-left__endavant';
const ENDAVANT_RAIL = `.app-grid-shell[data-llista="rail"] ${ENDAVANT}`;
const esPs04 = (r) => r.decl.display?.valor === 'none' && r.selectors.some((s) => s.endsWith('.bar-blue-left__endavant'));
const SENSE_PS04 = COMPONENTS.filter((r) => !esPs04(r));
/* Les barres que va mesurar Chrome (261101): finestres de 385, 375 i 360
   amb el rail, i la tercera columna a 1024. */
const MESURADES = [329, 319, 304, 322];
const franja = (de, fins) => Array.from({ length: fins - de + 1 }, (_, i) => de + i);

describe('PS-04 · la barra blava per davall de 336 px (D-2: s’amaga Endavant)', () => {
  test('el llindar és el de set cel·les de --sdp-touch, i la xarxa hi suma el rail', () => {
    expect(TOUCH).toBe(48);
    expect(LLINDAR).toBe(335.98);
    expect(RAIL).toBe(56);
  });

  test('calibratge: sense la regla nova, el model torna el retall que va mesurar Chrome (7, 17, 32 i 14 px)', () => {
    const header = barra();
    expect(MESURADES.map((w) => geometria(header, w, { fulls: SENSE_PS04 }).sobreix)).toEqual([7, 17, 32, 14]);
    expect(geometria(header, 336, { fulls: SENSE_PS04 }).sobreix).toBe(0);
  });

  test('per davall de 336 px de barra, Endavant s’amaga i CONNECTAR hi cap sencer fins a 288', () => {
    const header = barra();
    for (const w of MESURADES) expect(geometria(header, w).sobreix, `${w}px`).toBe(0);
    for (const w of [...franja(288, 335), LLINDAR]) {
      const g = geometria(header, w);
      expect(g.amagats, `${w}px`).toEqual(['Tornar endavant']);
      expect(g.celles, `${w}px`).toBe(6);
      expect(g.demana, `${w}px`).toBe(6 * TOUCH);
      expect(g.sobreix, `${w}px`).toBe(0);
    }
  });

  test('de 336 a 480 px de barra no canvia res: set cel·les i CONNECTAR dins de la barra', () => {
    const header = barra();
    for (const w of franja(336, 480)) {
      const g = geometria(header, w);
      expect(g.amagats, `${w}px`).toEqual([]);
      expect(g.celles, `${w}px`).toBe(7);
      expect(g.sobreix, `${w}px`).toBe(0);
      expect(g, `${w}px`).toEqual(geometria(header, w, { fulls: SENSE_PS04 }));
    }
  });

  test('CONNECTAR conserva la forma: la cel·la de --sdp-touch a tota la franja estreta', () => {
    const header = barra();
    for (const w of franja(288, 480)) expect(geometria(header, w).connectar, `${w}px`).toBe(TOUCH);
    const pas = COMPONENTS.find((r) => r.prelud === '.bar-blue .btn-connectar.sp-card-connect' && r.pares.at(-1) === '@container (max-width: 367px)');
    expect(pas?.cos).toBe('width: var(--sdp-touch); min-width: var(--sdp-touch); height: var(--sdp-touch); min-height: var(--sdp-touch);');
  });

  test('la regla és una sola, dins de @layer components, i només amaga Endavant', () => {
    const nostres = COMPONENTS.filter(esPs04);
    expect(nostres.map((r) => [r.prelud, r.cos, r.pares])).toEqual([
      [ENDAVANT, 'display: none;', ['@layer components', CONSULTA]],
      [ENDAVANT_RAIL, 'display: none;', ['@layer components', SUPORT, XARXA_MEDIA]],
    ]);
    /* Dins de les dues consultes noves no hi ha cap altra regla. */
    expect(COMPONENTS.filter((r) => r.pares.includes(CONSULTA) || r.pares.includes(XARXA_MEDIA))).toEqual(nostres);
  });

  test('xarxa sense @container: amb el rail i finestra de menys de 392 px, Endavant s’amaga; a partir de 392, no', () => {
    /* Sense @container, el coixí i la separació de la barra són els de la
       xarxa de layout.css (capa legacy, fora del model): es mira només què
       es veu. */
    const header = barra();
    for (const finestra of [360, 375, 385, 391]) expect(amagats(header, { contenidors: false, finestra }), `${finestra}px`).toEqual(['Tornar endavant']);
    for (const finestra of [392, 430, 480]) expect(amagats(header, { contenidors: false, finestra }), `${finestra}px`).toEqual([]);
  });

  test('amb @container, la xarxa no hi entra: sense rail, a 336 px Endavant continua', () => {
    const header = barra({ rail: false });
    expect(geometria(header, 336, { finestra: 336 }).amagats).toEqual([]);
    expect(geometria(header, 330, { finestra: 330 }).amagats).toEqual(['Tornar endavant']);
  });

  test('sense rail, un telèfon de 320: el «+» perdia 16 px (Chrome, /events/aplec-2023) i ara hi cap amb sis cel·les', () => {
    const header = barra({ rail: false });
    expect(geometria(header, 320, { finestra: 320, fulls: SENSE_PS04 }).sobreix).toBe(16);
    const g = geometria(header, 320, { finestra: 320 });
    expect(g.amagats).toEqual(['Tornar endavant']);
    expect([g.celles, g.sobreix]).toEqual([6, 0]);
  });

  /* [DEFECTE · residu D-2] La regla mira l'ample de la barra, no quantes
     cel·les hi ha. En una barra de sis (sense CONNECTAR, com /connectar; o
     un objecte privat sense Comentar, useAccions.js) Endavant hi cabria de
     288 a 335 px i també s'amaga (Chrome, /connectar a 320: de 6 a 5
     cel·les). Afinar-ho demana una classe a BarraBlava.jsx i és decisió D-2
     del Mestre: quan es faça, esta prova es gira (Endavant visible de 288 a
     335 en les barres de sis). */
  test('[DEFECTE · residu D-2] en una barra de sis cel·les Endavant també s’amaga per davall de 336, encara que hi cabria fins a 288', () => {
    for (const forma of [{ connectarVisible: false }, { comentarVisible: false }]) {
      const header = barra(forma);
      for (const w of franja(288, 335)) {
        const clau = `${JSON.stringify(forma)} ${w}px`;
        expect(geometria(header, w, { fulls: SENSE_PS04 }), clau).toMatchObject({ celles: 6, demana: 6 * TOUCH, sobreix: 0 });
        expect(geometria(header, w), clau).toMatchObject({ amagats: ['Tornar endavant'], celles: 5, sobreix: 0 });
      }
      expect(geometria(header, 336).amagats, JSON.stringify(forma)).toEqual([]);
      cleanup();
    }
  });
});
