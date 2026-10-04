import { readdirSync, readFileSync } from 'node:fs';
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
  /* Correcció final (ordre del Mestre, 261004) · el pas de 336 passa a 367 (vegeu la prova de davall). */
  expect(blocDe(components, '@container (max-width: 367px) {', 'header.bar-blue')).not.toContain('grid-template-columns');
});

/* Correcció final (ordre del Mestre, 261004; revisió final de la nit) · Amb
   --sdp-touch de 48, la barra compacta demana 8 + 144 + 8 + 144 + 8 + 48 + 8
   = 368px: el pas que la deixa sense separació ni coixí era a 336 (el càlcul
   de 44px) i entre 337 i 367px de barra CONNECTAR sobreeixia fins a 31px.
   Ara és a 367: res canvia a 368 o més. Per davall de 336 continua sense
   cabre (decisió pendent del Mestre). Derogada la xifra de 336 de la prova de
   dalt (ordre del Mestre, 261004). */
test('261004 · el pas compacte de la barra blava és a 367px de barra: sense separació ni coixí, CONNECTAR a la cel·la de 48', () => {
  const pas = blocDe(components, '@container (max-width: 367px) {', 'header.bar-blue { gap: 0; padding: 0; }');
  expect(pas).toContain('header.bar-blue { gap: 0; padding: 0; }');
  expect(pas).toContain('.bar-blue .btn-connectar.sp-card-connect { width: var(--sdp-touch); min-width: var(--sdp-touch); height: var(--sdp-touch); min-height: var(--sdp-touch); }');
  expect(blocDe(components, '@container (max-width: 336px) {', 'bar-blue')).toBe('');
  expect(blocDe(components, '@layer components {', pas)).not.toBe('');
  // El pas de 480 (separació i coixí de 8) continua igual: entre 368 i 480 hi cap.
  expect(compacta()).toContain('header.bar-blue { gap: var(--sdp-space-2); padding: 0 var(--sdp-space-2); }');
  expect(net('src/css/tokens.css')).toContain('--sdp-touch: 48px;');
});

test('T53 · les mostres del catàleg tenen contenidor propi i l’estreta fa 28rem', () => {
  expect(components).toContain('.sdp-especimen__barres--contenidor { container-type: inline-size; }');
  expect(components).toContain('.sdp-especimen__barres--estreta { inline-size: min(100%, 28rem); }');
});

/* T38 (260928: en mòbil i en columna estreta la barra taronja de pàgina no
   es pintava; l'editor del Perfil n'era l'excepció i les eines ancorades
   pujaven a davall de la blava) · Derogat per l'ordre del Mestre del 261004:
   barra taronja universal. La regla que l'amagava ja la va revertir el
   Mestre (T24, components.css) i les cinc proves que l'exigien queden
   derogades. En el seu lloc, la regla nova: cap full l'amaga. */
const AMAGA_PAGINA = /\.sdp-universal-page-container\s*>\s*section\.bar-orange\s*\{\s*display:\s*none;?\s*\}/;
const AMAGA_QUALSEVOL = /(?:^|[\s,}])(?:section)?\.bar-orange\s*\{[^}]*display:\s*none/;

/* M1 (verificació del front «barra-autoria», 261004) · La guarda recorre TOTS
   els fulls CSS de src/ (layout, utilities, AppGridShell, PerfilShell,
   apps, pecesApps, catalegColleccio, wiki…), no només components i modules.
   Mira cada regla, també dins de @media, @container i @layer, i també quan
   la barra és un selector d'una llista ('.x, .bar-orange { … }'): si el
   subjecte del selector (l'últim compost) és la barra i la regla l'apaga
   (display: none, visibility: hidden o collapse), és una infracció. Un
   descendent de la barra (el poble de l'autor en mòbil) no ho és. */
const fullsCss = (dir) => readdirSync(resolve(process.cwd(), dir), { withFileTypes: true }).flatMap((entrada) => {
  const ruta = `${dir}/${entrada.name}`;
  if (entrada.isDirectory()) return fullsCss(ruta);
  return entrada.name.endsWith('.css') ? [ruta] : [];
});
const APAGA = /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse))\s*(?:!important\s*)?(?:;|$)/;
/* Les regles fulla d'un full sense comentaris: [selectors, cos]. */
const reglesFulla = (css) => [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]*)\{([^{}]*)\}/g)]
  .map(([, selectors, cos]) => [selectors.trim(), cos.trim()]);
const subjecteEsLaBarra = (selector) => {
  const compostos = selector.trim().split(/\s*[\s>+~]\s*/).filter(Boolean);
  return /\.bar-orange(?![\w-])/.test(compostos[compostos.length - 1] || '');
};
const amaguenLaBarra = (css) => reglesFulla(css)
  .filter(([selectors, cos]) => APAGA.test(cos) && selectors.split(',').some(subjecteEsLaBarra))
  .map(([selectors]) => selectors);

test('261004 · M1 · el recorregut troba tots els fulls de src/, no només els dos canònics', () => {
  const fulls = fullsCss('src');
  expect(fulls).toEqual(expect.arrayContaining([
    'src/css/components.css', 'src/css/modules.css', 'src/css/layout.css', 'src/css/utilities.css',
    'src/components/layout/AppGridShell.css'
  ]));
  expect(fulls.length).toBeGreaterThan(8);
});

test('261004 · M1 · la guarda detecta (casos sintètics en memòria)', () => {
  expect(amaguenLaBarra('.bar-orange { display: none; }')).toHaveLength(1);
  expect(amaguenLaBarra('@media (max-width: 720px) { .sdp-x > section.bar-orange { opacity: 1; display:none } }')).toHaveLength(1);
  expect(amaguenLaBarra('@layer components { .sdp-a, .sdp-b .bar-orange { visibility: hidden; } }')).toHaveLength(1);
  expect(amaguenLaBarra('@container (max-width: 400px) { .sdp-universal-page-container > section.bar-orange { display: none !important; } }')).toHaveLength(1);
  // Lícits: un descendent de la barra, un retoc de mòbil, una altra barra, un display que no l'apaga.
  expect(amaguenLaBarra('.bar-orange .sp-card-author-location { display: none; }')).toEqual([]);
  expect(amaguenLaBarra('@media (max-width: 720px) { section.bar-orange { padding: 0 var(--sdp-space-4); } }')).toEqual([]);
  expect(amaguenLaBarra('.bar-orange-clar { display: none; }')).toEqual([]);
  expect(amaguenLaBarra('section.bar-orange { display: grid; }')).toEqual([]);
});

test('261004 · barra taronja universal: cap full de src/ amaga la barra taronja de pàgina, ni en mòbil ni en columna estreta', () => {
  for (const ruta of fullsCss('src')) {
    const full = net(ruta);
    expect(AMAGA_PAGINA.test(full), ruta).toBe(false);
    expect(AMAGA_QUALSEVOL.test(full), ruta).toBe(false);
    expect(amaguenLaBarra(readFileSync(resolve(process.cwd(), ruta), 'utf8')), ruta).toEqual([]);
  }
  // Un retoc de mòbil (coixí, lletra) és lícit; amagar-la, no.
  for (const obertura of ['@media (max-width: 720px) {', '@container (max-width: 400px) {']) {
    expect(AMAGA_QUALSEVOL.test(blocDe(components, obertura, 'bar-orange')), obertura).toBe(false);
  }
});

/* Ordre del Mestre, 261004 · Sense barra blava ('page' i 'none') la taronja
   s'enganxa a dalt de tot: el modificador de PageFrame té regla pròpia, dins
   de @layer components, i no toca cap pàgina amb barra blava. */
const SENSE_BLAVA = '.sdp-universal-page-container--sense-blava > section.bar-orange { top: 0; }';
test('261004 · sense barra blava, la taronja puja a dalt de tot (modificador propi dins de @layer components)', () => {
  expect(moduls).toContain(SENSE_BLAVA);
  expect(blocDe(moduls, '@layer components {', SENSE_BLAVA)).toContain(SENSE_BLAVA);
});

/* D3 (261004) · L'Admin (chrome 'page') embolcalla una AppGridShell, que és
   absoluta (inset: 0): la graella ha de començar davall de la taronja, no
   davall d'ella. Regla al mateix bloc, dins de @layer components, sense tocar
   AppGridShell.css; (0,3,0) guanya al `.app-grid-page` (0,1,0) de la mateixa
   capa (index.css l'importa a layer(components)). */
const GRAELLA_DAVALL = '.sdp-universal-page-container--sense-blava > .content-wrapper > .app-grid-page { top: var(--sdp-alt-accio); }';
test('261004 · D3 · sense blava, una graella absoluta comença davall de la taronja (mateix bloc, @layer components)', () => {
  expect(moduls).toContain(GRAELLA_DAVALL);
  expect(blocDe(moduls, '@layer components {', SENSE_BLAVA)).toContain(GRAELLA_DAVALL);
  // L'alçada de la taronja és la mateixa variable (layout.css): ni més ni menys.
  expect(net('src/css/layout.css')).toContain('section.bar-orange { height: var(--sdp-alt-accio);');
  // AppGridShell.css continua sense saber res de la barra, i viu a la capa components.
  const graella = net('src/components/layout/AppGridShell.css');
  expect(graella).toContain('.app-grid-page { position: absolute; inset: 0;');
  expect(graella).not.toContain('bar-orange');
  expect(net('src/css/index.css')).toContain("@import url('../components/layout/AppGridShell.css') layer(components);");
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
