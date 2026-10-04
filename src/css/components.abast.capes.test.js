import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

/* Abast de components.css a la setena passada (pla 261004_0050 i decisions
   Q1-Q8 del Mestre). Bessona de modules.abast.capes.test.js: jsdom no
   calcula animacions, capes ni @media, i es comprova la regla escrita.
     · Fase A · cap `transition: all`, cap propietat individual de
       transformació (Chrome 104, fora de la Baseline 2022), cap temps literal
       d'interacció i cap ombra animada.
     · Fase B · tot :hover viu dins de @media (hover: hover) and (pointer: fine).
     · Fase C · el premut (0,97) amb regles noves, la bafarada entra amb
       tokens i la família de barra no es mou mai (Q3).
     · Fase E · hover de perill en fosc AAA, anell en colors forçats i cap
       text translúcid al Bancal.
   Les regles fixades per altres proves de capes (copien el bloc exacte) no
   es toquen: van a la llista FIXADES, i esta prova exigix que hi siguen. */

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles fulla d'un full: { prelud, cos, pares } (pares: els blocs que la contenen). */
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
      if (marc && !marc.fills) {
        eixida.push({ prelud: marc.prelud, cos: tros.replace(/\s+/g, ' ').trim(), pares: pila.map((p) => p.prelud) });
      }
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}

/** Declaracions d'un cos: [[propietat, valor], …]. */
const declaracions = (cos) => cos.split(';')
  .map((d) => d.trim())
  .filter((d) => d.includes(':'))
  .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]);

/** Selectors d'un prelud, tallats per les comes de primer nivell. */
const selectors = (prelud) => prelud.split(/,(?![^(]*\))/).map((s) => s.trim());

const FULL = llig('src/css/components.css');
const COMPONENTS = regles(FULL);
const DECLS = COMPONENTS.flatMap((r) => declaracions(r.cos).map(([propietat, valor]) => ({ ...r, propietat, valor })));
const on = (d) => `${d.prelud} { ${d.propietat}: ${d.valor} }`;
const enKeyframes = (r) => r.pares.some((p) => p.startsWith('@keyframes'));

/** Valor de la propietat a les regles amb eixe prelud exacte (la darrera guanya). */
const valorDe = (prelud, propietat) => DECLS.filter((d) => d.prelud === prelud && d.propietat === propietat).map((d) => d.valor).pop();
const reglesDe = (prelud) => COMPONENTS.filter((r) => r.prelud === prelud);

/* ── Tokens: clar, fosc i Bancal, com els resol el navegador ── */
const TOKENS = [...regles(llig('src/css/design-tokens.css')), ...regles(llig('src/css/tokens.css'))];
const CLAR = new Map();
const FOSC = new Map();
const BANCAL_CLAR = new Map();
const BANCAL_FOSC = new Map();
for (const r of TOKENS) {
  if (r.pares.some((p) => p.startsWith('@media'))) continue;
  const fosc = r.prelud.includes('data-theme="dark"');
  const bancal = r.prelud.includes('data-contrast="bancal"');
  const clar = /^:root\b/.test(r.prelud) && !r.prelud.includes('[');
  for (const [nom, valor] of declaracions(r.cos)) {
    if (!nom.startsWith('--')) continue;
    if (clar && !CLAR.has(nom)) CLAR.set(nom, valor);
    if (fosc && !bancal && !FOSC.has(nom)) FOSC.set(nom, valor);
    if (bancal && !fosc && !BANCAL_CLAR.has(nom)) BANCAL_CLAR.set(nom, valor);
    if (bancal && fosc && !BANCAL_FOSC.has(nom)) BANCAL_FOSC.set(nom, valor);
  }
}
const TEMES = {
  clar: CLAR,
  fosc: new Map([...CLAR, ...FOSC]),
  'bancal clar': new Map([...CLAR, ...BANCAL_CLAR]),
  'bancal fosc': new Map([...CLAR, ...FOSC, ...BANCAL_CLAR, ...BANCAL_FOSC])
};

/** Substituïx cada var() pel seu valor; un token sense declarar invalida la declaració. */
function resol(valor, tema = CLAR, prof = 0) {
  if (prof > 12) throw new Error(`cadena de var() massa llarga: ${valor}`);
  if (!/var\(/.test(valor)) return valor;
  return resol(valor.replace(/var\(\s*(--[\w-]+)\s*\)/g, (_, nom) => {
    if (!tema.has(nom)) throw new Error(`token sense declarar: ${nom}`);
    return tema.get(nom);
  }), tema, prof + 1);
}

/** Talla un valor per espais de primer nivell (fora de parèntesis). */
function trossos(valor) {
  const eixida = [];
  let prof = 0;
  let actual = '';
  for (const c of valor) {
    if (c === '(') prof += 1;
    if (c === ')') prof -= 1;
    if (/\s/.test(c) && prof === 0) {
      if (actual) eixida.push(actual);
      actual = '';
    } else {
      actual += c;
    }
  }
  if (actual) eixida.push(actual);
  return eixida;
}

const CORBA = /^(ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end|cubic-bezier\(.*\)|steps\(.*\))$/;
const TEMPS = /^-?\d*\.?\d+m?s$/;
/** Una transició o animació és vàlida amb una corba com a molt i dos temps. */
function unaCorba(valor) {
  const parts = trossos(resol(valor));
  return parts.filter((p) => CORBA.test(p)).length <= 1 && parts.filter((p) => TEMPS.test(p)).length <= 2;
}

/* ── Contrast WCAG 2.x (la fórmula de tractor-cromatic) ── */
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function lluminancia(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`no és un hex de sis xifres: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => lin(parseInt(m[1].slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(tema, a, b) {
  const [x, y] = [lluminancia(resol(`var(${a})`, tema)), lluminancia(resol(`var(${b})`, tema))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/* ═══ Les regles fixades per altres proves (bloc exacte copiat) ═══
   · .sp-card i .sp-card--action:hover: UniversalCard.vinyeta.capes.test.jsx.
   · El peu del diàleg: DialegEsborrarNota.capes.test.js.
   · El hover del vel fosc de la barra taronja: PageFrame.capes.test.js. */
const FIXADES_HOVER = [
  '.sdp-dialeg__peu .sdp-boto--secundari:hover:not(:disabled)',
  '.sdp-dialeg__peu .sdp-boto--perill:hover:not(:disabled)',
  '.sp-card--action:hover',
  '.btn-icon-orange:hover:not(:disabled), .sdp-emoticona-barra--boto:hover:not(:disabled)'
];
/* La lletra fosca del hover de perill del peu en fosc acompanya una regla
   fixada sense guarda: si tinguera guarda, al tàctil quedaria blanc sobre
   el rosa (1,70:1). */
const COMPANYA_FIXADA = ':root[data-theme="dark"] .sdp-dialeg__peu .sdp-boto--perill:hover:not(:disabled), :host([data-theme="dark"]) .sdp-dialeg__peu .sdp-boto--perill:hover:not(:disabled)';
/* Ombra animada i temps literal: només les dues regles fixades de la targeta. */
const FIXADES_MOVIMENT = ['.sp-card', '.sp-card--action:hover'];
/* Carregadors: gir i lluentor continus, no són una interacció. */
const ANIMACIONS_EXEMPTES = new Set(['sdp-gir', 'sdp-lluentor']);

test('les regles fixades hi són, sense guarda, tal com les copien les seues proves', () => {
  for (const prelud of [...FIXADES_HOVER, ...FIXADES_MOVIMENT]) {
    const trobades = reglesDe(prelud);
    expect(trobades.length, prelud).toBeGreaterThan(0);
    expect(trobades.some((r) => r.pares.join(' ') === '@layer components'), prelud).toBe(true);
  }
  expect(valorDe('.sp-card--action:hover', 'transform')).toBe('translateY(-2px)');
  expect(reglesDe('.sdp-boto')[0].cos).toContain('transition: background var(--sdp-t), border-color var(--sdp-t);');
});

/* ═══ Fase A · Baseline 2022 i higiene del moviment ═══ */

test('cap `transition: all` ni `transition-property: all`', () => {
  const dolentes = DECLS
    .filter((d) => /^transition(-property)?$/.test(d.propietat))
    .filter((d) => d.valor.split(',').some((t) => trossos(t.trim())[0] === 'all'))
    .map(on);
  expect(dolentes).toEqual([]);
});

test('cap propietat individual de transformació (rotate, translate, scale): sempre `transform:`', () => {
  const INDIVIDUALS = /^(rotate|translate|scale)$/;
  const dolentes = DECLS.filter((d) => INDIVIDUALS.test(d.propietat)).map(on);
  for (const d of DECLS.filter((x) => /^transition(-property)?$/.test(x.propietat))) {
    if (d.valor.split(',').some((t) => INDIVIDUALS.test(trossos(t.trim())[0]))) dolentes.push(on(d));
  }
  expect(dolentes).toEqual([]);
});

test('la comprovació detecta les formes velles: `translate: 22px 0`, `transition: all 0.2s` i dues corbes', () => {
  const velles = regles('.a { translate: 22px 0; transition: translate var(--sdp-t); } .b { transition: all 0.2s ease-in-out; }')
    .flatMap((r) => declaracions(r.cos));
  expect(velles.some(([p]) => p === 'translate')).toBe(true);
  expect(velles.some(([p, v]) => p === 'transition' && trossos(v)[0] === 'all')).toBe(true);
  expect(unaCorba('sdp-gir var(--sdp-t) ease-out')).toBe(false);
  expect(unaCorba('transform var(--sdp-durada-premut) var(--sdp-corba-eixida)')).toBe(true);
});

test('cap transició ni animació porta dues corbes, i tots els tokens de moviment existixen', () => {
  const dolentes = DECLS
    .filter((d) => /^(transition|animation)$/.test(d.propietat) && d.valor !== 'none')
    .filter((d) => d.valor.split(',').some((una) => !unaCorba(una.trim())))
    .map(on);
  expect(dolentes).toEqual([]);
});

test('cap temps literal a transicions ni animacions d’interacció: durada i corba de token', () => {
  const dolentes = [];
  for (const d of DECLS.filter((x) => /^(transition|animation)(-duration|-delay)?$/.test(x.propietat))) {
    if (FIXADES_MOVIMENT.includes(d.prelud)) continue;
    for (const una of d.valor.split(',')) {
      const parts = trossos(una.trim());
      if (d.propietat === 'animation' && parts.some((p) => ANIMACIONS_EXEMPTES.has(p))) continue;
      if (parts.some((p) => TEMPS.test(p))) dolentes.push(on(d));
    }
  }
  expect(dolentes).toEqual([]);
});

test('cap ombra animada fora de les dues regles fixades de la targeta', () => {
  const dolentes = DECLS
    .filter((d) => /^transition(-property)?$/.test(d.propietat) && /\bbox-shadow\b/.test(d.valor))
    .filter((d) => !FIXADES_MOVIMENT.includes(d.prelud))
    .map(on);
  expect(dolentes).toEqual([]);
});

test('sòl tàctil: cap 44px literal; la mida la donen --sdp-touch i --sdp-touch-min (48px, Q2)', () => {
  expect(DECLS.filter((d) => /\b44px\b/.test(d.valor)).map(on)).toEqual([]);
  expect(resol('var(--sdp-touch)')).toBe('48px');
  expect(resol('var(--sdp-touch-min)')).toBe('48px');
});

/* ═══ Fase B · cap hover enganxat al tàctil ═══ */

const ambGuarda = (r) => r.pares.some((p) => p.startsWith('@media') && p.includes('(hover: hover)') && p.includes('(pointer: fine)'));

test('Fase B · tot :hover viu dins de @media (hover: hover) and (pointer: fine), llevat de les fixades', () => {
  const dolentes = COMPONENTS
    .filter((r) => r.prelud.includes(':hover') && !enKeyframes(r))
    .filter((r) => ![...FIXADES_HOVER, COMPANYA_FIXADA].includes(r.prelud))
    .filter((r) => !ambGuarda(r))
    .map((r) => r.prelud);
  expect(dolentes).toEqual([]);
  expect(reglesDe(COMPANYA_FIXADA).length).toBe(1);
});

test('Fase B · les regles guardades no canvien de capa: continuen dins de @layer components', () => {
  const fora = COMPONENTS.filter((r) => ambGuarda(r) && r.pares[0] !== '@layer components').map((r) => r.prelud);
  expect(fora).toEqual([]);
});

/* ═══ Fase C · premut i entrades ═══ */

test('Fase C · cap hover alça ni engrandix, fora de la regla fixada de .sp-card--action', () => {
  const dolentes = DECLS
    .filter((d) => d.prelud.includes(':hover') && d.propietat === 'transform' && d.valor !== 'none')
    .filter((d) => d.prelud !== '.sp-card--action:hover')
    .map(on);
  expect(dolentes).toEqual([]);
});

const PREMUT = 'scale(var(--sdp-escala-premut))';
const TRANSICIO_PREMUT = 'transform var(--sdp-durada-premut) var(--sdp-corba-eixida)';

test('Fase C · .sdp-boto prem amb regles noves, darrere de la fixada: escala del sistema i transició en repòs', () => {
  expect(valorDe('.sdp-boto:active:not(:disabled):not([aria-disabled="true"])', 'transform')).toBe(PREMUT);
  /* La porta inerta fa una acció (el toast): també respon. */
  expect(valorDe('.sdp-boto[aria-disabled="true"]:active', 'transform')).toBe(PREMUT);
  const boto = reglesDe('.sdp-boto');
  expect(boto.length).toBe(2);
  const nova = declaracions(boto[1].cos).find(([p]) => p === 'transition')[1];
  expect(nova.split(',').map((t) => t.trim())).toContain(TRANSICIO_PREMUT);
  expect(FULL.indexOf('.sdp-boto:active:not(:disabled)')).toBeGreaterThan(FULL.indexOf('.sdp-boto {'));
});

test('Fase C · etiquetes, píndoles, quadrat i .btn premen amb la mateixa escala i transició', () => {
  for (const prelud of ['.sp-card-label__action:active', 'button.pill:active:not(:disabled), a.pill:active', 'button.sp-card-calendar-badge:active', '.btn:active:not(:disabled)']) {
    expect(valorDe(prelud, 'transform'), prelud).toBe(PREMUT);
  }
  for (const prelud of ['.sp-card-label__action', '.pill', '.sp-card-calendar-badge', '.btn']) {
    const transicio = valorDe(prelud, 'transition') ?? '';
    expect(transicio.split(',').map((t) => t.trim()), prelud).toContain(TRANSICIO_PREMUT);
  }
});

test('Fase C · el quadrat: en passar-hi per damunt només el color del crom, sense elevació ni canvi d’ombra', () => {
  const hover = declaracions(reglesDe('button.sp-card-calendar-badge:hover')[0].cos);
  expect(hover).toEqual([['background-color', 'var(--sdp-crom-capcalera-clara)']]);
  /* L'ombra permanent es queda (Q6). */
  expect(valorDe('.sp-card-calendar-badge', 'box-shadow')).toBe('var(--sdp-ombra-1)');
  /* El botó puja damunt del vel enllaç (z-index 1): sense, el hover, el
     premut i el clic se'ls quedava el vel (comprovat al navegador). */
  expect(valorDe('.sp-card-link-overlay', 'z-index')).toBe('1');
  expect(valorDe('button.sp-card-calendar-badge', 'position')).toBe('relative');
  expect(Number(valorDe('button.sp-card-calendar-badge', 'z-index'))).toBeGreaterThan(1);
});

const BARRA = ['.sp-card-action', '.btn-icon-orange', '.sdp-emoticona-barra--boto', '.btn-connectar', '.btn-date-time'];

test('Q3 · barra blava, peu de targeta i CONNECTAR: cap transform; el premut és de color', () => {
  const dolentes = DECLS
    .filter((d) => d.propietat === 'transform' && d.valor !== 'none')
    .filter((d) => selectors(d.prelud).some((s) => BARRA.some((b) => s.includes(b))))
    .map(on);
  expect(dolentes).toEqual([]);
  expect(declaracions(reglesDe('.btn-connectar:active:not(:disabled)')[0].cos)).toEqual([['background', 'var(--sdp-accio-control-hover)']]);
  expect(declaracions(reglesDe('button.btn-date-time:active:not(:disabled)')[0].cos)).toEqual([['background', 'var(--sdp-crom-scroll-puny-viu)']]);
  /* El blau del premut de CONNECTAR porta el blanc a AAA en clar i en fosc. */
  for (const tema of [TEMES.clar, TEMES.fosc]) expect(contrast(tema, '--sdp-sobre-accio', '--sdp-accio-control-hover')).toBeGreaterThanOrEqual(7);
});

test('Fase C · la bafarada entra des de --sdp-escala-aparicio, amb l’origen davall del botó i sense perdre el centrat', () => {
  expect(valorDe('.sdp-pista__bafarada', 'transform')).toBe('translateX(-50%)');
  expect(valorDe('.sdp-pista__bafarada', 'transform-origin')).toBe('top center');
  expect(valorDe('.sdp-pista__bafarada', 'animation')).toBe('sdp-pista-aparicio var(--sdp-durada-base) var(--sdp-corba-eixida)');
  const des = COMPONENTS.find((r) => r.pares.includes('@keyframes sdp-pista-aparicio') && r.prelud === 'from');
  expect(des?.cos).toBe('opacity: 0; transform: translateX(-50%) scale(var(--sdp-escala-aparicio));');
});

test('moviment reduït: l’escala del premut i la d’aparició valen 1 (tokens.css): cap gest es mou', () => {
  const reduit = TOKENS.filter((r) => r.pares.some((p) => p.includes('prefers-reduced-motion: reduce')));
  const decls = new Map(reduit.flatMap((r) => declaracions(r.cos)));
  expect(decls.get('--sdp-escala-premut')).toBe('1');
  expect(decls.get('--sdp-escala-aparicio')).toBe('1');
});

/* ═══ Fase E · AAA, colors forçats i Bancal ═══ */

test('AAA · hover de perill en fosc: la parella vella feia menys de 3:1; la nova passa de 7:1', () => {
  /* Abans: blanc sobre --sdp-error-text en fosc (1,70:1). */
  expect(contrast(TEMES.fosc, '--sdp-sobre-color', '--sdp-error-text')).toBeLessThan(3);
  const guardada = COMPONENTS.filter((r) => r.prelud.includes('.sdp-boto--perill:hover') && r.prelud.includes('data-theme="dark"'));
  expect(guardada.length).toBe(2);
  for (const r of guardada) {
    expect(declaracions(r.cos)).toEqual([['background', 'var(--sdp-error-text)'], ['color', 'var(--sdp-text-invers)']]);
  }
  expect(selectors(guardada.find(ambGuarda).prelud)).toEqual(expect.arrayContaining([
    ':root[data-theme="dark"] .btn-danger:hover:not(:disabled)',
    ':host([data-theme="dark"]) .btn-danger:hover:not(:disabled)'
  ]));
  expect(contrast(TEMES.fosc, '--sdp-text-invers', '--sdp-error-text')).toBeGreaterThanOrEqual(7);
  /* En clar no canvia res: blanc sobre el roig fort. */
  expect(contrast(TEMES.clar, '--sdp-sobre-color', '--sdp-error-text')).toBeGreaterThanOrEqual(7);
});

/* L'anell en colors forçats de tot :focus-visible el posa base.css, sense
   capa (guanya a tots els components): ací es comprova que la targeta
   sencera hi queda coberta, cap a dins, i que components.css no el duplica. */
test('colors forçats: l’anell de la targeta sencera és un outline cap a dins (base.css); la bafarada porta vora', () => {
  const BASE = regles(llig('src/css/base.css')).filter((r) => r.pares.includes('@media (forced-colors: active)'));
  const tot = BASE.find((r) => r.prelud === ':focus-visible');
  expect(declaracions(tot?.cos ?? '').find(([p]) => p === 'outline')?.[1]).toMatch(/^var\(--sdp-focus-gruix\) solid \w+$/);
  const targeta = BASE.find((r) => r.prelud === '.sp-card-link-overlay:focus-visible');
  expect(declaracions(targeta?.cos ?? '')).toContainEqual(['outline-offset', 'calc(var(--sdp-focus-gruix) * -1)']);
  expect(COMPONENTS.some((r) => r.prelud === '.sp-card-link-overlay:focus-visible' && r.pares.includes('@media (forced-colors: active)'))).toBe(false);
  /* La regla fixada (l'ombra interior fora d'este mode) continua igual. */
  const normal = COMPONENTS.find((r) => r.prelud === '.sp-card-link-overlay:focus-visible' && r.pares.join(' ') === '@layer components');
  expect(normal?.cos).toBe('box-shadow: 0 0 0 3px var(--sdp-focus) inset;');
  const bafarada = COMPONENTS.find((r) => r.prelud === '.sdp-pista__bafarada' && r.pares.includes('@media (forced-colors: active)'));
  expect(declaracions(bafarada?.cos ?? '')).toEqual([['border', '1px solid CanvasText']]);
});

const BANCAL = COMPONENTS.filter((r) => r.prelud.includes('data-contrast="bancal"'));

test('Bancal · cada regla cobrix :root i :host, viu a @layer components i no porta colors crus ni ombres (Q6)', () => {
  expect(BANCAL.length).toBeGreaterThan(0);
  for (const r of BANCAL) {
    const parts = selectors(r.prelud);
    const arrel = parts.filter((s) => s.startsWith(':root[data-contrast="bancal"]'));
    const host = parts.filter((s) => s.startsWith(':host([data-contrast="bancal"])'));
    expect(arrel.length, r.prelud).toBeGreaterThan(0);
    expect(host.length, r.prelud).toBe(arrel.length);
    expect(r.pares, r.prelud).toEqual(['@layer components']);
    for (const [propietat, valor] of declaracions(r.cos)) {
      expect(propietat, r.prelud).not.toBe('box-shadow');
      expect(valor, r.prelud).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
      if (propietat === 'opacity') expect(valor, r.prelud).toBe('1');
    }
  }
});

test('Bancal · tot text amb opacitat per davall d’1 torna a ser opac, i el desactivat es llig a AAA', () => {
  const translucids = COMPONENTS
    .filter((r) => !enKeyframes(r) && !r.prelud.includes('data-contrast'))
    .filter((r) => declaracions(r.cos).some(([p, v]) => p === 'opacity' && Number(v) > 0 && Number(v) < 1))
    .flatMap((r) => selectors(r.prelud));
  expect(translucids.length).toBeGreaterThan(0);
  const opacs = new Set(BANCAL.filter((r) => /opacity: 1\b/.test(r.cos)).flatMap((r) => selectors(r.prelud)));
  const sense = translucids.filter((s) => !opacs.has(`:root[data-contrast="bancal"] ${s}`) || !opacs.has(`:host([data-contrast="bancal"]) ${s}`));
  expect(sense).toEqual([]);
  for (const nom of ['bancal clar', 'bancal fosc']) {
    expect(contrast(TEMES[nom], '--sdp-text-suau', '--sdp-fons-subtil'), nom).toBeGreaterThanOrEqual(7);
  }
});

/* ═══ D-C · Pedra Seca al mil·límetre (ordre del Mestre del 261004, prompt
   261004_0515; escombrada global triada al xat a les 06:38) ═══
   Bessones de modules.abast.capes.test.js (sòl de 14px) i de
   apps/comu/qualitat.test.js (espais, cap pseudoclasse relacional), ara sobre
   components.css, on viu la UniversalCard. La pseudoclasse relacional
   s'escriu partida perquè el text de la prova no dispare la Policia del
   Disseny. */

/** El mínim de lletra en px d'un valor resolt; null si no és una longitud.
    Un em per davall d'1 encongix la lletra del pare, que pot ser el sòl: es
    compta contra els 14px, el pitjor cas. max() val el seu argument més gran. */
function minimDeLletra(valor) {
  const v = valor.trim();
  const clamp = /^clamp\(([^,]+),/.exec(v);
  if (clamp) return minimDeLletra(clamp[1]);
  const maxim = /^max\((.+)\)$/.exec(v);
  if (maxim) return Math.max(...maxim[1].split(',').map((p) => minimDeLletra(p) ?? 0));
  const m = /^([\d.]+)(px|rem|em)$/.exec(v);
  if (!m) return null;
  if (m[2] === 'em') return Number(m[1]) * 14;
  return Number(m[1]) * (m[2] === 'px' ? 1 : 16);
}

test('D-C · sòl de 14px: cap font-size per davall, ni literal ni de token', () => {
  const dolentes = [];
  for (const d of DECLS.filter((x) => x.propietat === 'font-size')) {
    let valor;
    try {
      valor = resol(d.valor);
    } catch (error) {
      dolentes.push(`${on(d)} · ${error.message}`);
      continue;
    }
    const px = minimDeLletra(valor);
    if (px !== null && px < 14) dolentes.push(`${on(d)} · ${px}px`);
  }
  expect(dolentes).toEqual([]);
});

test('D-C · la comprovació del sòl veu les formes velles', () => {
  expect(minimDeLletra('0.7rem')).toBeLessThan(14);
  expect(minimDeLletra('0.85rem')).toBeLessThan(14);
  expect(minimDeLletra('0.9em')).toBeLessThan(14);
  expect(minimDeLletra('max(0.9em, 0.875rem)')).toBe(14);
  expect(minimDeLletra('clamp(0.75rem, 1vw, 1rem)')).toBe(12);
});

const RELACIONAL = new RegExp([':ha', 's\\('].join(''), 'g');

test('D-C · cap pseudoclasse relacional (Baseline 2022: Chrome 100 i Firefox 100 tiren la regla sencera)', () => {
  expect(senseComentaris(FULL).match(RELACIONAL) ?? []).toEqual([]);
  expect(`.sp-card-label${[':ha', 's(.sp-card-label__action)'].join('')}`.match(RELACIONAL)).toHaveLength(1);
});

const RADI = /^(0|50%|inherit|var\(--sdp-radi-(s|m|g|xl|pastilla|boto)\))$/;

test('D-C · radis només per token (s, m, g, xl, pastilla, boto), 0, inherit o el cercle del 50 %', () => {
  const dolentes = DECLS
    .filter((d) => /^border(-[\w-]+)?-radius$/.test(d.propietat))
    .filter((d) => !trossos(d.valor).every((t) => RADI.test(t)))
    .map(on);
  expect(dolentes).toEqual([]);
});

/* Espais: 0, auto, l'escala --sdp-space-N, el coixí de contenidor o rem
   múltiples de 0,25, també dins de calc(), clamp(), max(), min() i env().
   Exempts, amb motiu (no són espais de la reixeta):
     · .sdp-nomes-lector, margin -1px: el patró visualment amagat.
     · .sdp-pestanyes__pestanya, margin-bottom -2px: encavalca la vora de 2px.
     · .sdp-anatomia, gap 2px: és el filet; el fons fa de vora entre cel·les.
     · .sdp-alerta__icona, margin-top 2px: ajust òptic de la icona de 24px a
       la primera línia (28,8px). */
const ESPAI_EXEMPT = new Set([
  '.sdp-nomes-lector|margin|-1px',
  '.sdp-pestanyes__pestanya|margin-bottom|-2px',
  '.sdp-anatomia|gap|2px',
  '.sdp-alerta__icona|margin-top|2px'
]);
const ES_ESPAI = /^(margin|padding)(-[\w-]+)?$|^(row-|column-)?gap$|^inset(-[\w-]+)?$/;

function funcioValida(t) {
  const longituds = [...t.matchAll(/(-?\d*\.?\d+)(px|rem|em)\b/g)];
  const tokens = [...t.matchAll(/var\((--[\w-]+)/g)];
  return longituds.every(([, n, u]) => (u === 'px' ? Number(n) === 0 : u === 'rem' && Number.isInteger(Number(n) * 4)))
    && tokens.every(([, nom]) => nom.startsWith('--sdp-'));
}
function espaiValid(valor) {
  return trossos(valor).every((t) => {
    if (/^-?(0|auto|inherit)$/.test(t)) return true;
    if (/^var\(--sdp-(space-\d+|pad-contenidor)\)$/.test(t)) return true;
    const rem = /^-?(\d*\.?\d+)rem$/.exec(t);
    if (rem) return Number.isInteger(Number(rem[1]) * 4);
    if (/^(calc|clamp|max|min|env)\(/.test(t)) return funcioValida(t);
    return false;
  });
}

test('D-C · espais de la reixeta: 0, auto, --sdp-space-N, el coixí de contenidor o rem múltiples de 0,25', () => {
  const dolentes = DECLS
    .filter((d) => ES_ESPAI.test(d.propietat) && !enKeyframes(d))
    .filter((d) => !ESPAI_EXEMPT.has(`${d.prelud}|${d.propietat}|${d.valor}`))
    .filter((d) => !espaiValid(d.valor))
    .map(on);
  expect(dolentes).toEqual([]);
  /* Cada exempció continua existint tal qual: si la regla canvia, es revisa. */
  for (const clau of ESPAI_EXEMPT) {
    const [prelud, propietat, valor] = clau.split('|');
    expect(valorDe(prelud, propietat), clau).toBe(valor);
  }
});

test('D-C · la comprovació d’espais veu les formes velles i deixa passar les bones', () => {
  expect(espaiValid('22px 24px 16px')).toBe(false);
  expect(espaiValid('6px')).toBe(false);
  expect(espaiValid('0.3rem')).toBe(false);
  expect(espaiValid('var(--sdp-space-6) var(--sdp-space-6) var(--sdp-space-4)')).toBe(true);
  expect(espaiValid('calc(var(--sdp-space-4) + env(safe-area-inset-bottom, 0px))')).toBe(true);
  expect(espaiValid('clamp(var(--sdp-space-5), 5vw, var(--sdp-space-8))')).toBe(true);
  expect(espaiValid('calc((100% - var(--sdp-touch)) / 2)')).toBe(true);
});

test('D-C · títols de la targeta amb l’interlineat de títol (1.2), no el de component', () => {
  for (const prelud of ['.sp-card-title', '.sp-card .sp-card-body h1', '.sp-card .sp-card-body h2',
    '.sp-card--action .sp-card-heading-with-icon .sp-card-title', '.sp-card-subtitle', '.sp-card-author-name']) {
    expect(valorDe(prelud, 'line-height'), prelud).toBe('var(--sdp-leading-titol)');
  }
  expect(resol('var(--sdp-leading-titol)')).toBe('1.2');
});

test('D-C · mides de la targeta amb l’escala fixa: l’h1 com el títol, l’h2 i el preu en h6', () => {
  expect(valorDe('.sp-card .sp-card-body h1', 'font-size')).toBe(valorDe('.sp-card-title', 'font-size'));
  expect(valorDe('.sp-card .sp-card-body h2', 'font-size')).toBe('var(--sdp-text-h6)');
  expect(valorDe('.sp-card-price', 'font-size')).toBe('var(--sdp-text-h6)');
});

/* Segona tongada (D-C §6 de la fitxa CSS_MIL_LIMETRE): cap mida de lletra
   literal a la targeta, al quadrat, a la píndola ni al .btn. Les que no
   tenien un token idèntic van al graó més pròxim de l'escala de tokens.css
   (arredoniment documentat a la fitxa). Queden fora, a propòsit: el «+» de
   CONNECTAR (24px, un glif) i els trams del preu del quadrat (3.5, 2.25,
   1.625 i 1.25rem), que UniversalCard.quadrat.capes.test.js llig en rem. */
test('D-C · segona tongada: les mides de lletra de la targeta, el quadrat, .pill i .btn són tokens', () => {
  const esperat = {
    '.btn': 'var(--sdp-text-small)',
    '.sp-card--action .sp-card-subtitle': 'var(--sdp-text-small)',
    '.sp-card-text': 'var(--sdp-text-small)',
    '.sp-card-author-name': 'var(--sdp-text-small)',
    '.sp-card--action .sp-card-heading-with-icon .sp-card-title': 'var(--sdp-text-h6)',
    '.sp-card-subtitle': 'var(--sdp-text-base)',
    '.sp-card-calendar-badge__mes': 'var(--sdp-text-base)',
    '.sp-card-calendar-badge__any': 'var(--sdp-text-meta)',
    '.pill': 'var(--sdp-text-meta)'
  };
  for (const [prelud, valor] of Object.entries(esperat)) expect(valorDe(prelud, 'font-size'), prelud).toBe(valor);
});

test('D-C · etiqueta amb acció: modificador de classe, sense retallar el botó, píndola de 24px i diana de 48px', () => {
  /* Dues classes i darrere de la regla base: dins de .sp-card-labels
     (PageFrame), `.sp-card-labels .sp-card-label` pesa (0,2,0) i una sola
     classe hi perdria el coixí 0 (el que pesava la forma relacional). */
  const MODIFICADOR = '.sp-card-label.sp-card-label--amb-accio';
  expect(reglesDe(MODIFICADOR)).toHaveLength(1);
  expect(reglesDe('.sp-card-label--amb-accio')).toHaveLength(0);
  expect(FULL.indexOf(`${MODIFICADOR} {`)).toBeGreaterThan(FULL.indexOf('.sp-card-labels .sp-card-label,'));
  expect(valorDe(MODIFICADOR, 'overflow')).toBeUndefined();
  expect(valorDe(MODIFICADOR, 'padding')).toBe('0');
  expect(valorDe('.sp-card-labels .sp-card-label, .sp-card-label', 'height')).toBe('24px');
  expect(valorDe('.sp-card-label--amb-accio > .sp-card-label__action', 'position')).toBe('relative');
  const diana = '.sp-card-label--amb-accio > .sp-card-label__action::after';
  expect(valorDe(diana, 'inset-block')).toBe('calc((100% - var(--sdp-touch)) / 2)');
  expect(valorDe(diana, 'inset-inline')).toBe('0');
  /* (24 − 48) / 2 = −12px per dalt i per baix: 48px de diana. */
  expect(resol('var(--sdp-touch)')).toBe('48px');
});

test('D-C · el placeholder de l’EditableField: una sola forma, :empty, sense pseudoclasse relacional', () => {
  const placeholder = COMPONENTS.filter((r) => r.prelud.includes('[data-placeholder]'));
  expect(placeholder.map((r) => r.prelud)).toEqual(['[data-placeholder]:not(:focus):empty::before']);
  expect(declaracions(placeholder[0].cos)).toContainEqual(['content', 'attr(data-placeholder)']);
});
