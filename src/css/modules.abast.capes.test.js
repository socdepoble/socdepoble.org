import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

/* Abast de modules.css a la setena passada (pla 261004_0050 i decisions
   Q1-Q8 del Mestre). jsdom no calcula animacions, capes ni @media: es
   comprova la regla escrita i es resolen els tokens com ho fa el navegador.
     · Fase A · cap `transition: all`, cap propietat individual de
       transformació (rotate, translate i scale arriben amb Chrome 104, fora
       de la Baseline 2022), cap temps literal i cap ombra animada.
     · Fase B · tot :hover viu dins de @media (hover: hover) and (pointer: fine).
     · Fase C · el calaix de l'Índex s'anima (Q4), la transició de vista no
       escala la pàgina (article 1) i menús i avisos entren amb tokens.
     · Fase E · correccions AAA, sòl de 14px i bloc Bancal. */

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

const MODULS = regles(llig('src/css/modules.css'));
const DECLS = MODULS.flatMap((r) => declaracions(r.cos).map(([propietat, valor]) => ({ ...r, propietat, valor })));
const on = (d) => `${d.prelud} { ${d.propietat}: ${d.valor} }`;

/** Valor de la propietat a les regles amb eixe prelud exacte (la darrera guanya). */
const valorDe = (prelud, propietat) => DECLS.filter((d) => d.prelud === prelud && d.propietat === propietat).map((d) => d.valor).pop();

/* ── Tokens: clar (primera declaració de cada nom) i fosc ── */
const TOKENS = [...regles(llig('src/css/design-tokens.css')), ...regles(llig('src/css/tokens.css'))];
const CLAR = new Map();
const FOSC = new Map();
for (const r of TOKENS) {
  if (r.pares.some((p) => p.startsWith('@media'))) continue;
  const esClar = /^:root\b/.test(r.prelud) && !r.prelud.includes('[');
  const esFosc = r.prelud.includes('data-theme="dark"') && !r.prelud.includes('data-contrast');
  for (const [nom, valor] of declaracions(r.cos)) {
    if (!nom.startsWith('--')) continue;
    if (esClar && !CLAR.has(nom)) CLAR.set(nom, valor);
    if (esFosc && !FOSC.has(nom)) FOSC.set(nom, valor);
  }
}
const TEMA_FOSC = new Map([...CLAR, ...FOSC]);

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

/** Una sola animació és vàlida amb una corba com a molt i dos temps (durada i retard). */
function animacioValida(valor) {
  const parts = trossos(resol(valor));
  return parts.filter((p) => CORBA.test(p)).length <= 1 && parts.filter((p) => TEMPS.test(p)).length <= 2;
}

/* ── Contrast WCAG 2.x ── */
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

/* ═══ Fase C · Q4 · el calaix de l'Índex (prova roja abans de la correcció) ═══ */

test('Q4 · la comprovació detecta la forma vella: `var(--sdp-t) ease-out` porta dues corbes', () => {
  expect(animacioValida('sdp-fade-in var(--sdp-t) ease-out')).toBe(false);
  expect(animacioValida('sdp-fade-in var(--sdp-durada-base) var(--sdp-corba-eixida)')).toBe(true);
});

test('Q4 · el vel i el calaix de l’Índex porten una animació vàlida, de token: 200ms de fosa i 280ms de calaix', () => {
  const vel = valorDe('.toc-overlay', 'animation');
  const calaix = valorDe('.toc-drawer', 'animation');
  expect(animacioValida(vel), `.toc-overlay { animation: ${vel} }`).toBe(true);
  expect(animacioValida(calaix), `.toc-drawer { animation: ${calaix} }`).toBe(true);
  expect(vel).toBe('sdp-fade-in var(--sdp-durada-base) var(--sdp-corba-eixida)');
  expect(calaix).toBe('slideInLeft var(--sdp-durada-panell) var(--sdp-corba-calaix)');
});

test('cap animació del full porta dues corbes', () => {
  const dolentes = DECLS
    .filter((d) => d.propietat === 'animation' && d.valor !== 'none')
    .filter((d) => d.valor.split(',').some((una) => !animacioValida(una.trim())))
    .map(on);
  expect(dolentes).toEqual([]);
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

test('cap ombra animada: el canvi d’ombra és instantani', () => {
  const dolentes = DECLS
    .filter((d) => /^transition(-property)?$/.test(d.propietat) && /\bbox-shadow\b/.test(d.valor))
    .map(on);
  expect(dolentes).toEqual([]);
});

/* Temps literals admesos: carregadors (gir continu), el ressalt informatiu
   de la cita del Xat (1,6s, lligat a MS_RESSALT de conversa.js) i la
   resplendor d'ambient de la IAIA. Cap és una interacció. */
const ANIMACIONS_EXEMPTES = new Set(['spin', 'sdp-xat-ressalt', 'sdp-iaia-resplendor']);

test('cap temps literal a transicions ni animacions d’interacció: durada i corba de token', () => {
  const dolentes = [];
  for (const d of DECLS.filter((x) => /^(transition|animation)(-duration|-delay)?$/.test(x.propietat))) {
    for (const una of d.valor.split(',')) {
      const parts = trossos(una.trim());
      if (d.propietat === 'animation' && parts.some((p) => ANIMACIONS_EXEMPTES.has(p))) continue;
      if (parts.some((p) => TEMPS.test(p))) dolentes.push(on(d));
    }
  }
  expect(dolentes).toEqual([]);
});

test('fora els @keyframes morts: sdp-reveal, sdp-parallax, sosp-spin i sosp-pulse', () => {
  const noms = new Set(MODULS.flatMap((r) => r.pares).filter((p) => p.startsWith('@keyframes')).map((p) => p.split(' ')[1]));
  for (const mort of ['sdp-reveal', 'sdp-parallax', 'sosp-spin', 'sosp-pulse']) expect(noms.has(mort), mort).toBe(false);
});

/* ═══ Fase B · cap hover enganxat al tàctil ═══ */

/* Excepcions: regles que no són un efecte de passar-hi per damunt.
   · Les accions de la bombolla del Xat s'amaguen i es revelen amb el
     ratolí; amb (hover: none) ja són sempre visibles.
   · Dos neutralitzadors que tornen la targeta al seu repòs (cap elevació):
     al tàctil han de valdre igual, perquè el hover que neutralitzen viu a
     components.css. */
const HOVER_EXEMPTS = [
  '.sdp-xat-bombolla-wrap:hover .sdp-xat-bombolla__accions',
  '.sdp-connectar__previsualitzacio .sp-card:hover',
  '.sp-card--action.sdp-consola__quieta:hover',
];

test('Fase B · tot :hover viu dins de @media (hover: hover) and (pointer: fine)', () => {
  const dolentes = MODULS
    .filter((r) => r.prelud.includes(':hover'))
    .filter((r) => !HOVER_EXEMPTS.some((e) => r.prelud.startsWith(e)))
    .filter((r) => !r.pares.some((p) => p.startsWith('@media') && p.includes('(hover: hover)')))
    .map((r) => r.prelud);
  expect(dolentes).toEqual([]);
});

test('Fase C · cap hover alça ni engrandix: sense translateY ni scale en passar-hi per damunt', () => {
  const dolentes = DECLS
    .filter((d) => d.prelud.includes(':hover') && d.propietat === 'transform' && d.valor !== 'none')
    .map(on);
  expect(dolentes).toEqual([]);
});

/* ═══ Fase C · transició de vista, menús i avisos ═══ */

const keyframes = (nom) => MODULS.filter((r) => r.pares.includes(`@keyframes ${nom}`));

test('article 1 · la transició de vista és una fosa d’opacitat de 200ms, sense escalar la pàgina', () => {
  const vista = DECLS.filter((d) => d.prelud.startsWith('::view-transition'));
  expect(vista.length).toBeGreaterThan(0);
  const durades = vista.filter((d) => d.propietat === 'animation-duration').map((d) => d.valor);
  expect(durades).toEqual(['var(--sdp-durada-base)']);
  const noms = vista.filter((d) => d.propietat === 'animation-name').map((d) => d.valor);
  expect(noms.length).toBe(2);
  for (const nom of noms) {
    const passos = keyframes(nom);
    expect(passos.length, `@keyframes ${nom}`).toBeGreaterThan(0);
    for (const pas of passos) expect(pas.cos, `@keyframes ${nom}`).not.toMatch(/transform|scale/);
  }
});

test('menús: entrada des de --sdp-escala-aparicio i l’opacitat, amb l’origen a la cantonada del disparador', () => {
  const ENTRADA = 'sdp-aparicio-menu var(--sdp-durada-rapida) var(--sdp-corba-eixida)';
  expect(valorDe('.sdp-xat-menu', 'animation')).toBe(ENTRADA);
  expect(valorDe('.sdp-slash-menu', 'animation')).toBe(ENTRADA);
  expect(valorDe('.sdp-xat-menu', 'transform-origin')).toBe('top right');
  /* Ordre del Mestre (261026_2126, P1-36) · El menú del «…» de la llista
     (.sdp-xat-menu--esquerra, MenuLlista) s'ha retirat amb el component. */
  expect(valorDe('.sdp-xat-item--altre .sdp-xat-menu', 'transform-origin')).toBe('top left');
  expect(valorDe('.sdp-slash-menu', 'transform-origin')).toBe('top left');
  const des = keyframes('sdp-aparicio-menu').find((r) => r.prelud === 'from');
  expect(des?.cos).toMatch(/opacity: 0/);
  expect(des?.cos).toMatch(/transform: scale\(var\(--sdp-escala-aparicio\)\)/);
});

test('avisos: entrada de 200ms des de 8px més avall, sense perdre el centrat translateX(-50%)', () => {
  expect(valorDe('.sdp-avisador-efimer', 'animation')).toBe('sdp-aparicio-avisador var(--sdp-durada-base) var(--sdp-corba-eixida)');
  expect(valorDe('.sdp-avisador-efimer', 'transform')).toBe('translateX(-50%)');
  const des = keyframes('sdp-aparicio-avisador').find((r) => r.prelud === 'from');
  expect(des?.cos).toMatch(/opacity: 0/);
  expect(des?.cos).toMatch(/transform: translateX\(-50%\) translateY\(var\(--sdp-despl-aparicio\)\)/);
});

test('l’aparició del diàleg compon `transform:` i el desplaçament de token', () => {
  const des = keyframes('sdp-aparicio').find((r) => r.prelud === 'from');
  expect(des?.cos).toBe('opacity: 0; transform: translateY(var(--sdp-despl-aparicio));');
});

test('contracte de moviment reduït: escala i desplaçament d’aparició neutres (els consumix este full)', () => {
  const reduit = TOKENS.filter((r) => r.pares.some((p) => p.includes('prefers-reduced-motion: reduce')));
  const decls = new Map(reduit.flatMap((r) => declaracions(r.cos)));
  expect(decls.get('--sdp-escala-aparicio')).toBe('1');
  expect(decls.get('--sdp-despl-aparicio')).toBe('0');
});

/* ═══ Fase E · AAA, sòl de lletra, sòl tàctil i Bancal ═══ */

test('AAA · la píndola premuda pinta blanc sobre --sdp-accio-control: ≥ 7:1 en clar i en fosc', () => {
  const PREMUDA = '.sdp-pindola__opcio[aria-pressed="true"], .sdp-pindola__opcio[aria-current="page"]';
  expect(valorDe(PREMUDA, 'background')).toBe('var(--sdp-accio-control)');
  expect(valorDe(PREMUDA, 'color')).toBe('var(--sdp-sobre-accio)');
  for (const tema of [CLAR, TEMA_FOSC]) expect(contrast(tema, '--sdp-sobre-accio', '--sdp-accio-control')).toBeGreaterThanOrEqual(7);
});

test('AAA · el valor d’estadística (24px en negreta, text gran) passa de 4,5:1 sobre la seua targeta en clar i en fosc', () => {
  expect(valorDe('.sdp-stat-value', 'color')).toBe('var(--sdp-accent-text-hover)');
  for (const tema of [CLAR, TEMA_FOSC]) expect(contrast(tema, '--sdp-accent-text-hover', '--sdp-fons-subtil')).toBeGreaterThanOrEqual(4.5);
});

/* Ordre del Mestre (261026_2126, pla 261026_1615 §5) · El nivell 3 passa del
   blau de l'H1 al color de títol de secció (--sdp-text-titol), també en
   hover i focus. */
test('AAA · el hover de l’Índex no baixa de banda: nivell 2 amb --sdp-accent-text-hover i nivell 3 amb --sdp-text-titol', () => {
  expect(valorDe('.toc-level-2 button:hover', 'color')).toBe('var(--sdp-accent-text-hover)');
  expect(valorDe('.toc-level-2 button:focus-visible', 'color')).toBe('var(--sdp-accent-text-hover)');
  expect(valorDe('.toc-level-3 button:hover', 'color')).toBe('var(--sdp-text-titol)');
  expect(valorDe('.toc-level-3 button:focus-visible', 'color')).toBe('var(--sdp-text-titol)');
  for (const tema of [CLAR, TEMA_FOSC]) {
    expect(contrast(tema, '--sdp-accent-text-hover', '--sdp-fons-targeta')).toBeGreaterThanOrEqual(7);
    expect(contrast(tema, '--sdp-text-titol', '--sdp-fons-subtil')).toBeGreaterThanOrEqual(7);
  }
});

/* §5 (261026_2126) · L'H1 de la capçalera és ara la primera entrada de
   l'Índex de totes les pàgines: el seu hover i el seu focus conserven el blau
   d'acció sobre el fons del hover (--sdp-fons-subtil, .toc-item button), i
   eixe parell no baixa de 7:1 en clar ni en fosc. */
test('AAA · el hover i el focus de l’entrada de nivell 1 (l’H1): --sdp-accio-text sobre --sdp-fons-subtil, ≥ 7:1 en clar i en fosc', () => {
  expect(valorDe('.toc-item button:focus-visible', 'background')).toBe('var(--sdp-fons-subtil)');
  expect(valorDe('.toc-item button:hover', 'background')).toBe('var(--sdp-fons-subtil)');
  expect(valorDe('.toc-level-1 button:hover', 'color')).toBe('var(--sdp-accio-text)');
  expect(valorDe('.toc-level-1 button:focus-visible', 'color')).toBe('var(--sdp-accio-text)');
  for (const tema of [CLAR, TEMA_FOSC]) {
    expect(contrast(tema, '--sdp-accio-text', '--sdp-fons-subtil')).toBeGreaterThanOrEqual(7);
  }
});

/* §5 (261026_2126) · Jerarquia cromàtica de l'Índex amb tokens de Pedra
   Seca (cap color cru): H1 blau d'acció, H2 terracota, H3 títol de secció i,
   del 4 al 6, l'escala que baixa un esglaó per nivell, sagnada de 8 en 8. Cada
   color de text passa de 4,5:1 sobre la targeta del calaix en clar i en fosc:
   --sdp-accent-titol és AA de disseny (5,51:1 en clar, tokens.css «h2, h4»;
   el Bancal el puja a AAA), i la resta passen de 7:1. */
test('§5 · l’Índex: H1 --sdp-accio-text, H2 --sdp-accent-titol, H3 --sdp-text-titol, H4-H6 sagnats de 8 en 8, amb contrast sobre la targeta', () => {
  const COLORS = ['var(--sdp-accio-text)', 'var(--sdp-accent-titol)', 'var(--sdp-text-titol)', 'var(--sdp-text-cos)', 'var(--sdp-text-cos)', 'var(--sdp-text-suau)'];
  expect([1, 2, 3, 4, 5, 6].map((n) => valorDe(`.toc-level-${n} button`, 'color'))).toEqual(COLORS);
  expect([1, 2, 3, 4, 5, 6].map((n) => valorDe(`.toc-level-${n} button`, 'font-weight'))).toEqual(['800', '700', '600', '500', '500', '400']);
  expect([4, 5, 6].map((n) => valorDe(`.toc-level-${n} button`, 'padding-left'))).toEqual([
    'calc(var(--sdp-space-2) + var(--sdp-space-2))',
    'calc(var(--sdp-space-2) + var(--sdp-space-4))',
    'calc(var(--sdp-space-2) + var(--sdp-space-6))'
  ]);
  for (const tema of [CLAR, TEMA_FOSC]) {
    for (const color of new Set(COLORS)) {
      const minim = color === 'var(--sdp-accent-titol)' ? 4.5 : 7;
      expect(contrast(tema, color.slice(4, -1), '--sdp-fons-targeta'), `${color} sobre la targeta`).toBeGreaterThanOrEqual(minim);
    }
  }
});

/* §5 (261026_2126) · El vel i el calaix naixen davall de la barra negra
   (header.bar-black, layout.css: var(--sdp-alt-negra) més la zona segura de
   dalt), amb l'alçada de la resta de la pantalla (vh i, després, dvh), i el
   calaix porta respiració de dalt. */
test('§5 · el vel de l’Índex comença davall de la barra negra, vh abans de dvh, i el calaix respira de dalt', () => {
  const BARRA = 'calc(var(--sdp-alt-negra) + env(safe-area-inset-top, 0px))';
  expect(valorDe('.toc-overlay', 'top')).toBe(BARRA);
  const altures = DECLS.filter((d) => d.prelud === '.toc-overlay' && d.propietat === 'height').map((d) => d.valor);
  expect(altures).toEqual([
    'calc(100vh - var(--sdp-alt-negra) - env(safe-area-inset-top, 0px))',
    'calc(100dvh - var(--sdp-alt-negra) - env(safe-area-inset-top, 0px))'
  ]);
  expect(valorDe('.toc-drawer', 'padding-block')).toBe('var(--sdp-space-2) env(safe-area-inset-bottom, 0px)');
});

/* El mapa de fons de la conversa del Xat (T14, 0,05) és decoració, no text:
   no compta. Al Bancal, a més, desapareix. */
const OPACITAT_DECORATIVA = /\.sdp-xat-conversa::before$/;

test('AAA · cap text amb opacitat per davall d’1 fora dels estats desactivats i de la decoració', () => {
  const dolentes = DECLS
    .filter((d) => d.propietat === 'opacity' && Number(d.valor) > 0 && Number(d.valor) < 1)
    .filter((d) => !/disabled|aria-disabled|@keyframes/.test(`${d.prelud} ${d.pares.join(' ')}`))
    .filter((d) => !OPACITAT_DECORATIVA.test(d.prelud))
    .map(on);
  expect(dolentes).toEqual([]);
});

/* Sòl de lletra: 14px (--sdp-text-meta), sense cap excepció. Fase A (261006):
   les dues que hi havia (.sdp-consola__estrategia i .sdp-consola__ajust, amb
   tokens inexistents) s'han retirat amb el panell de Crèdits. */
const LLETRA_EXEMPTA = new Set();

function pxDe(valor) {
  const m = /^([\d.]+)(px|rem|em)$/.exec(valor.trim());
  if (!m) return null;
  return Number(m[1]) * (m[2] === 'px' ? 1 : 16);
}

test('sòl de 14px: cap font-size per davall, ni literal ni de token', () => {
  const dolentes = [];
  for (const d of DECLS.filter((x) => x.propietat === 'font-size' && !LLETRA_EXEMPTA.has(x.prelud))) {
    let valor;
    try {
      valor = resol(d.valor);
    } catch (error) {
      dolentes.push(`${on(d)} · ${error.message}`);
      continue;
    }
    const minim = /^clamp\(/.test(valor) ? valor.slice(6).split(',')[0] : valor;
    const px = pxDe(minim);
    if (px !== null && px < 14) dolentes.push(`${on(d)} · ${px}px`);
  }
  expect(dolentes).toEqual([]);
});

test('sòl tàctil: cap 44px literal; la mida la dona --sdp-touch', () => {
  expect(DECLS.filter((d) => /\b44px\b/.test(d.valor)).map(on)).toEqual([]);
});

const BANCAL = MODULS.filter((r) => r.prelud.includes('data-contrast="bancal"'));

test('Bancal · el bloc existix, cobrix :root i :host i viu a @layer components', () => {
  expect(BANCAL.length).toBeGreaterThan(0);
  for (const r of BANCAL) {
    const parts = r.prelud.split(/,(?![^(]*\))/).map((s) => s.trim());
    const arrel = parts.filter((s) => s.startsWith(':root[data-contrast="bancal"]'));
    const host = parts.filter((s) => s.startsWith(':host([data-contrast="bancal"])'));
    expect(arrel.length, r.prelud).toBeGreaterThan(0);
    expect(host.length, r.prelud).toBe(arrel.length);
    expect(r.pares, r.prelud).toContain('@layer components');
  }
});

test('Bancal · text opac, pes de 600 o més i les ombres de sempre (Q6)', () => {
  const dolentes = [];
  for (const r of BANCAL) {
    for (const [propietat, valor] of declaracions(r.cos)) {
      if (propietat === 'opacity' && Number(valor) < 1) dolentes.push(`${r.prelud} { opacity: ${valor} }`);
      if (propietat === 'font-weight' && Number(valor) < 600) dolentes.push(`${r.prelud} { font-weight: ${valor} }`);
      if (propietat === 'box-shadow') dolentes.push(`${r.prelud} { box-shadow: ${valor} }`);
      if (/#[0-9a-f]{3,8}\b|rgba?\(/i.test(valor)) dolentes.push(`${r.prelud} { ${propietat}: ${valor} }`);
    }
  }
  expect(dolentes).toEqual([]);
  const opacs = BANCAL.filter((r) => /opacity: 1\b/.test(r.cos));
  const pesos = BANCAL.filter((r) => /font-weight: (600|700|800)\b/.test(r.cos));
  expect(opacs.length).toBeGreaterThan(0);
  expect(pesos.length).toBeGreaterThan(0);
});

/* §5 (261026_2126) · Al Bancal, la lletra menuda de l'Índex (H4 a H6) puja a
   600 tota junta: abans hi entraven l'H4 i l'H6 i no l'H5, i l'escala feia
   600 > 500 < 600. Els nivells 1 a 3 no hi entren (ja van a 600 o més). El
   pes de cada nivell al Bancal: el del bloc, si n'hi és (a :root i a :host),
   i si no, el de sempre. */
test('Bancal · el pes de l’Índex no torna a pujar: H1-H3 els de sempre i H4, H5 i H6 a 600, a :root i a :host', () => {
  const selectorsDe = (r) => r.prelud.split(/[(),]/).map((s) => s.trim());
  const pesAlBancal = (n) => {
    const selector = `.toc-level-${n} button`;
    const delBloc = BANCAL.filter((r) => selectorsDe(r).includes(selector) && /font-weight:/.test(r.cos));
    if (!delBloc.length) return { pes: valorDe(selector, 'font-weight'), cobertura: 0 };
    const regla = delBloc.at(-1);
    return {
      pes: declaracions(regla.cos).filter(([propietat]) => propietat === 'font-weight').pop()[1],
      cobertura: selectorsDe(regla).filter((s) => s === selector).length
    };
  };
  const nivells = [1, 2, 3, 4, 5, 6].map(pesAlBancal);
  expect(nivells.map(({ pes }) => pes)).toEqual(['800', '700', '600', '600', '600', '600']);
  // :root i :host porten els tres nivells menuts; els tres primers, cap.
  expect(nivells.map(({ cobertura }) => cobertura)).toEqual([0, 0, 0, 2, 2, 2]);
  const pesos = nivells.map(({ pes }) => Number(pes));
  for (let n = 1; n < pesos.length; n += 1) {
    expect(pesos[n], `H${n + 1} no pesa més que H${n}`).toBeLessThanOrEqual(pesos[n - 1]);
  }
});
