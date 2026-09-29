import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

/* jsdom no calcula ni graelles, ni capes, ni @media, ni @container: es
   comprova la regla escrita (T33, T37, T38 i T53, ordres del Mestre 260927-28). */
const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const components = net('src/css/components.css');
const moduls = net('src/css/modules.css');

/* El bloc que obri `obertura` (comptant claus) i conté `regla`. Es proven
   totes les obertures: n'hi ha més d'una `@container (max-width: 400px)`. */
const blocDe = (text, obertura, regla) => {
  for (let obri = text.indexOf(obertura); obri >= 0; obri = text.indexOf(obertura, obri + 1)) {
    let fons = 0;
    for (let i = text.indexOf('{', obri); i < text.length; i += 1) {
      if (text[i] === '{') fons += 1;
      else if (text[i] === '}' && (fons -= 1) === 0) {
        const bloc = text.slice(obri, i + 1);
        if (bloc.includes(regla)) return bloc;
        break;
      }
    }
  }
  return '';
};

/* T33 · l'espaiador de la fila de l'arbre pren l'alçada de la fila: el
   taronja de l'entrada activa arriba a la vora sense franja de 16px. */
const FILA = '.sdp-workspace-folder-row { display: flex; align-items: stretch;';
test('T33 · la fila de l’arbre estira les cel·les, dins de @layer components', () => {
  expect(moduls).toContain(FILA);
  expect(blocDe(moduls, '@layer components {', FILA)).toContain(FILA);
});

const GRAELLA = 'header.bar-blue { display: grid; grid-template-columns: minmax(max-content, 1fr) max-content minmax(max-content, 1fr); }';
test('T37 · la barra blava és una graella de tres columnes que no deixa baixar cap extrem del seu contingut', () => {
  expect(components).toContain(GRAELLA);
});

test('T37 · la graella viu dins de @layer components, que guanya al display:flex de layout.css (legacy)', () => {
  expect(blocDe(components, '@layer components {', GRAELLA)).toContain(GRAELLA);
});

test('T37 · la col·locació va per classe: sense CONNECTAR el trio continua a la columna del mig', () => {
  expect(components).toContain('.bar-blue-left { grid-column: 1; justify-self: start; }');
  expect(components).toContain('.bar-blue .sp-card-actions { grid-column: 2; justify-self: center; }');
  expect(components).toContain('.bar-blue .btn-connectar.sp-card-connect { grid-column: 3; justify-self: end; }');
});

/* T53 · CONNECTAR passa a «+» amb 480 d'ample de BARRA (abans 400: entre
   401 i 474 la paraula sobreeixia). El @container de 400 que queda és el de
   la barra taronja (T38) i no ha de tindre cap regla de la blava. */
const PLUS = '.bar-blue .sp-card-connect-plus { display: inline; }';
const compacta = () => blocDe(components, '@container (max-width: 480px) {', PLUS);
test('T53 · el «+» de CONNECTAR viu al @container de 480px de la barra blava, amb la paraula amagada i el cercle', () => {
  expect(compacta()).toContain(PLUS);
  expect(compacta()).toContain('.bar-blue .sp-card-connect-text { display: none; }');
  expect(compacta()).toContain('.bar-blue .btn-connectar.sp-card-connect { width: var(--sdp-touch-comode); padding: 0; }');
  expect(compacta()).toContain('header.bar-blue { gap: var(--sdp-space-2); padding: 0 var(--sdp-space-2); }');
  expect(blocDe(components, '@layer components {', compacta())).not.toBe('');
});

test('T53 · cap @container de 400px conté regles de la barra blava', () => {
  expect(blocDe(components, '@container (max-width: 400px) {', '.bar-blue')).toBe('');
});

test('T53 · la xarxa @media de 480px continua per als navegadors sense @container', () => {
  expect(blocDe(components, '@media (max-width: 480px) {', '.sp-card-connect-plus { display: inline; }')).not.toBe('');
});

test('T53 · les fletxes acosten el glif al llibre; la cel·la tàctil no canvia', () => {
  expect(components).toContain('.bar-blue-left .bar-blue-left__arrere .icon { margin-inline-start: var(--sdp-space-2); }');
  expect(components).toContain('.bar-blue-left .bar-blue-left__endavant .icon { margin-inline-end: var(--sdp-space-2); }');
  expect(components).toContain('.bar-blue-left .sp-card-action, .bar-blue .sp-card-actions .sp-card-action { width: var(--sdp-touch); min-width: var(--sdp-touch); height: var(--sdp-touch); min-height: var(--sdp-touch); }');
});

test('T53 · la graella base no canvia: el trio continua centrat respecte a tota la barra (variant A)', () => {
  expect(components).toContain(GRAELLA);
  expect(compacta()).not.toContain('grid-template-columns');
  expect(blocDe(components, '@container (max-width: 336px) {', 'header.bar-blue')).not.toContain('grid-template-columns');
});

test('T53 · les mostres del catàleg tenen contenidor propi i l’estreta fa 28rem', () => {
  expect(components).toContain('.sdp-especimen__barres--contenidor { container-type: inline-size; }');
  expect(components).toContain('.sdp-especimen__barres--estreta { inline-size: min(100%, 28rem); }');
});

const AMAGA = '.sdp-universal-page-container > section.bar-orange { display: none; }';
/* T51 · l'excepció torna la barra com a graella, no com a flex. */
const PERFIL = '.perfil-espai .sdp-editor-document .sdp-universal-page-container > section.bar-orange { display: grid; }';
const media = () => blocDe(components, '@media (max-width: 720px) {', AMAGA);
const container = () => blocDe(components, '@container (max-width: 400px) {', AMAGA);

test('T38 · en mòbil i en columna estreta la barra taronja de pàgina no es pinta', () => {
  expect(media()).toContain(AMAGA);
  expect(container()).toContain(AMAGA);
});

test('T38 · l’excepció del Perfil (selector d’identitat i avatar) va darrere i pesa més', () => {
  for (const bloc of [media(), container()]) {
    expect(bloc.indexOf(PERFIL)).toBeGreaterThan(bloc.indexOf(AMAGA));
    expect(bloc).toContain('.perfil-espai .sdp-editor-document .sdp-editor-eines { top: calc(var(--sdp-alt-accio) * 2); }');
  }
});

test('T38 · sense taronja, les eines ancorades pugen a davall de la blava', () => {
  expect(media()).toContain('.sdp-editor-document .sdp-editor-eines { top: var(--sdp-alt-accio); }');
});

test('T38 · la caputxa taronja de les targetes no hi entra', () => {
  expect(media()).not.toContain('sp-card-header');
  expect(container()).not.toContain('sp-card-header');
});

test('T38 · les regles viuen dins de @layer components (guanyen el section.bar-orange de legacy)', () => {
  expect(blocDe(components, '@layer components {', AMAGA)).toContain('@media (max-width: 720px) {');
});

test('T51 · l’excepció del Perfil ja no pot tornar la barra com a flex (esclafaria les tres columnes)', () => {
  expect(components).not.toContain('section.bar-orange { display: flex; }');
});

/* ── T51 (ordre del Mestre, 260928) · la barra taronja ─────────────────── */
const TARONJA = 'section.bar-orange { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(max-content, 1fr); }';
test('T51 · la barra taronja és una graella de tres columnes dins de @layer components', () => {
  expect(components).toContain(TARONJA);
  expect(blocDe(components, '@layer components {', TARONJA)).toContain(TARONJA);
});

test('T51 · la col·locació va per classe: autoria, espai central i accions', () => {
  expect(components).toContain('.bar-orange > .sp-card-author { grid-column: 1; min-width: 0; }');
  expect(components).toContain('.bar-orange > .sdp-emoticona-barra { grid-column: 2; justify-self: center; }');
  expect(components).toContain('.bar-orange > .bar-actions { grid-column: 3; justify-self: end; }');
});

/* El blanc ha de guanyar el `color: currentColor` de .sp-card-action (mateixa
   capa, mateixa especificitat): va darrere, i sense !important. */
const BLANC = '.btn-icon-orange, .sdp-emoticona-barra--boto { color: var(--sdp-sobre-color); }';
const CURRENT = '.sp-card-action { background: transparent; color: currentColor; }';
test('T51 · les icones de la barra taronja són blanques i guanyen la cascada per ordre', () => {
  const capa = blocDe(components, '@layer components {', BLANC);
  expect(capa).toContain(BLANC);
  expect(capa.indexOf(BLANC)).toBeGreaterThan(capa.indexOf(CURRENT));
  expect(capa.indexOf(CURRENT)).toBeGreaterThanOrEqual(0);
  expect(components).toContain('.btn-icon-orange, .sdp-emoticona-barra--boto { background: var(--sdp-crom-scroll-pista); }');
  // La cadena exacta ja exclou un «!important» dins de la regla.
});

test('T51 · el botó d’emoticona és de la família dels cercles (mida, icona de 24 i hover)', () => {
  expect(components).toContain('.sp-card-action, .btn-icon-orange, .sdp-emoticona-barra--boto { width: var(--sdp-touch-comode); padding: 0; }');
  expect(components).toContain('.sdp-emoticona-barra--boto .icon {');
  expect(components).toContain('.sdp-emoticona-barra--boto:hover:not(:disabled) { background: var(--sdp-crom-scroll-puny); }');
});

test('T51 · l’indicador de l’autodesament: icona blanca dins del cercle de vel fosc', () => {
  const regla = blocDe(moduls, '.sdp-estat-desament {', 'color:');
  expect(regla).toContain('background: var(--sdp-crom-scroll-pista);');
  expect(regla).toContain('color: var(--sdp-sobre-color);');
  expect(regla).not.toContain('color: inherit');
  expect(moduls).toContain('.sdp-estat-desament--pendent .icon { stroke-width: 2; }');
  expect(moduls).not.toContain('sdp-estat-desament--ploma');
  expect(blocDe(moduls, '@layer components {', '.sdp-estat-desament {')).not.toBe('');
});

test('T51 · la caputxa de la targeta només passa a graella amb emoticona (modificador propi)', () => {
  expect(components).toContain('.sp-card-header--amb-emoticona { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(max-content, 1fr); }');
  expect(components).toContain('.sp-card-header--amb-emoticona > .sp-card-meta { grid-column: 3; justify-self: end; }');
  // La caputxa de sempre continua en flex.
  expect(blocDe(components, '.sp-card-header {', 'display:')).toContain('display: flex;');
});
