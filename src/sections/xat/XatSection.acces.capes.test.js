/* Gauntlet 261022_0225 (XATR-5) · L'accés sense sessió (AccesAlXat) als fulls
   d'estil. jsdom no resol la cascada ni fa disposició: es comproven les
   regles de modules.css. El DOM (on viu el peu) el comprova
   XatSection.avatars.test.jsx.
   XAT-1 · El peu de l'accés és l'últim fill del cos amb scroll de la
   columna: el cos continua sent el que s'encongix i fa scroll (abans el peu
   vivia fora, no s'encongia i en un mòbil apaïsat deixava la llista a 0 px),
   i amb poc contingut el peu baixa al fons. En una pantalla baixa, compacte:
   la frase cau. XATR-2 · El peu no hi suma un segon coixí. XATR-7 · L'avís
   d'un fil de només lectura s'encongix dins de la seua barra.
   Gauntlet v1.2.16, ronda 2 (L1R2-02, L6R2-02) · Les proves 261026_2126 també munten l'accés viu
   (XatSection sense sessió, com XatSection.avatars.test.jsx) per a saber a quins elements casen
   de veres els selectors que fixen: un selector sense cap element no guarda cap píxel. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { XatContext } from './XatContext';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), params: new URLSearchParams() }));

vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement: crea } = await import('react');
  return {
    useNavigate: () => mocks.navigate,
    useLocation: () => ({ pathname: '/xat' }),
    useSearchParams: () => [mocks.params],
    useParams: () => ({ threadId: null }),
    useRouter: () => ({ navigate: mocks.navigate, currentPath: '/xat' }),
    Link: ({ to, children, className, ...rest }) => crea('a', { href: to, className, ...rest }, children)
  };
});
vi.mock('../../pages/NotFoundPage', () => ({ default: () => null }));
vi.mock('../text/TextSection', () => ({ default: () => null }));
vi.mock('./components/FitxaVivaDeComunitat.jsx', () => ({ default: () => null }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', pageCopy: {}, towns: [] }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, resolveAsset: (v) => v }),
  useUIState: () => ({ language: 'ca', locale: 'ca-ES', externalConfig: {} })
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: vi.fn() }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

const modules = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();

/** El valor d'una propietat a les regles d'un selector exacte (l'última guanya). */
function valor(selector, propietat, full = modules) {
  let trobat = null;
  for (const m of full.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = net(m[1].split(';').pop()).split(',').map(net);
    if (!selectors.includes(selector)) continue;
    for (const declaracio of m[2].split(';')) {
      const [prop, ...resta] = declaracio.split(':');
      if (net(prop || '') === propietat) trobat = net(resta.join(':'));
    }
  }
  return trobat;
}

/** Cada bloc `@media <condicio>`: { inici, fi, cos } (amb les claus aparellades). */
function trossosMedia(condicio) {
  const trossos = [];
  let des = 0;
  for (;;) {
    const inici = modules.indexOf(`@media ${condicio}`, des);
    if (inici < 0) return trossos;
    const obri = modules.indexOf('{', inici);
    let fondaria = 1;
    let i = obri + 1;
    for (; i < modules.length && fondaria; i += 1) {
      if (modules[i] === '{') fondaria += 1;
      else if (modules[i] === '}') fondaria -= 1;
    }
    trossos.push({ inici, fi: i, cos: modules.slice(obri + 1, i - 1) });
    des = i;
  }
}
const blocsMedia = (condicio) => trossosMedia(condicio).map((tros) => tros.cos);
/** El full sense els blocs `@media <condicio>`. */
const foraDeMedia = (condicio) => trossosMedia(condicio).reverse()
  .reduce((full, { inici, fi }) => full.slice(0, inici) + full.slice(fi), modules);

const COS = '.sdp-workspace-column__body';
const AMB_PEU = `${COS}.sdp-xat-cos--amb-peu`;
const RESERVA = 'calc(var(--sdp-alt-nav-mobil) + env(safe-area-inset-bottom, 0px))';

test('XAT-1 · el cos que porta l’accés continua sent el que s’encongix i fa scroll', () => {
  expect(valor(`.sdp-xat ${COS}`, 'flex')).toBe('1 1 0');
  expect(valor(`.sdp-xat ${COS}`, 'min-height')).toBe('0');
  expect(valor(`.sdp-xat ${COS}`, 'overflow-y')).toBe('auto');
  /* Cap regla de l'accés li ho trau. */
  for (const propietat of ['flex', 'flex-shrink', 'min-height', 'height', 'overflow', 'overflow-y']) {
    expect(valor(AMB_PEU, propietat), propietat).toBeNull();
  }
});

test('XAT-1 · amb poc contingut, el peu de l’accés baixa al fons del cos; amb molt, va darrere', () => {
  expect(valor(AMB_PEU, 'display')).toBe('flex');
  expect(valor(AMB_PEU, 'flex-direction')).toBe('column');
  expect(valor(`${AMB_PEU} > *`, 'flex-shrink')).toBe('0');
  expect(valor(`${AMB_PEU} > .sdp-xat-llista__peu`, 'margin-top')).toBe('auto');
  /* La fitxa (min-height: 100%) no empeny l'accés davall del plec. */
  expect(valor(`${AMB_PEU} > .sdp-xat-fitxa-comunitat`, 'min-height')).toBe('0');
  expect(valor(`${AMB_PEU} > .sdp-xat-fitxa-comunitat`, 'flex-grow')).toBe('1');
});

test('XAT-1 · en una pantalla baixa, l’accés es compacta i la frase cau', () => {
  const blocs = blocsMedia('(max-height: 500px)').filter((bloc) => bloc.includes('.sdp-xat-acces'));
  expect(blocs).toHaveLength(1);
  expect(valor('.sdp-xat-acces > p', 'display', blocs[0])).toBe('none');
  expect(valor('.sdp-alerta.sdp-xat-acces', 'padding', blocs[0])).toBe('var(--sdp-space-2) var(--sdp-space-3)');
});

test('XATR-2 · el peu de l’accés no hi suma coixí; en compacte, l’alerta porta la reserva de la barra mòbil', () => {
  expect(valor('.sdp-xat-llista__peu.sdp-xat-llista__peu--acces', 'padding')).toBe('0');
  expect(valor(':where(.sdp-root.is-compact) .app-grid-shell .sdp-xat-llista__peu.sdp-xat-llista__peu--acces', 'padding')).toBe('0');
  /* La mateixa caixa que quan l'alerta era el peu: el seu coixí més la reserva. */
  const alerta = ':where(.sdp-root.is-compact) .app-grid-shell .sdp-xat-llista__peu--acces > .sdp-xat-acces';
  expect(valor(alerta, 'padding-bottom', foraDeMedia('(max-height: 500px)'))).toBe(`calc(var(--sdp-space-4) + ${RESERVA.slice('calc('.length)}`);
  const [baixa] = blocsMedia('(max-height: 500px)').filter((bloc) => bloc.includes('.sdp-xat-acces'));
  expect(valor(alerta, 'padding-bottom', baixa)).toBe(`calc(var(--sdp-space-2) + ${RESERVA.slice('calc('.length)}`);
  /* El que hi ha damunt ja no la repetix (una coma dins de :is(): el text sencer). */
  expect(net(modules)).toContain(':where(.sdp-root.is-compact) .app-grid-shell .sdp-xat-cos--amb-peu :is(.sdp-xat-llista, .sdp-xat-resultats) { padding-bottom: 0; }');
});

test('XATR-7 · l’avís d’un fil de només lectura s’encongix dins de la seua barra', () => {
  expect(valor('.sdp-xat-compositor', 'flex')).toBe('none');
  expect(valor('.sdp-xat-compositor-barra-avis > .sdp-xat-compositor--avis', 'flex')).toBe('0 1 auto');
  expect(valor('.sdp-xat-compositor-barra-avis > .sdp-xat-compositor--avis', 'min-width')).toBe('0');
});

test('puresa visual de l’accés: sense vora lateral de cita ni fons d’alerta, amb text i botons centrats', () => {
  expect(valor('.sdp-alerta.sdp-xat-acces', 'border')).toBe('none');
  expect(valor('.sdp-alerta.sdp-xat-acces', 'border-inline-start-width')).toBe('0');
  expect(valor('.sdp-alerta.sdp-xat-acces', 'background')).toBe('transparent');
  expect(valor('.sdp-alerta.sdp-xat-acces', 'text-align')).toBe('center');
  expect(valor('.sdp-alerta.sdp-xat-acces', 'align-items')).toBe('center');
  expect(valor('.sdp-xat-acces > p', 'text-align')).toBe('center');
  expect(valor('.sdp-xat-acces > .sdp-alerta__accions', 'justify-content')).toBe('center');
});

/* Ordre del Mestre (261026, prompt 261026_1615, tasca 4) · «Connectar-se» i
   «Registrar-se» comparteixen fila: la mateixa amplària, el buit de la
   reixeta entre les dues i, com a molt, l'amplària de la columna del llistat. */
const ACCIONS = '.sdp-xat-acces > .sdp-alerta__accions';

test('261026 · les dues píndoles de l’accés van en línia i de la mateixa amplària, sense el 100% de sèrie', () => {
  const pindola = `${ACCIONS} > .sdp-xat-pindola`;
  expect(valor(pindola, 'flex')).toBe('1 1 0');
  expect(valor(pindola, 'width')).toBe('auto');
  expect(valor(pindola, 'min-inline-size')).toBe('max-content');
  /* La regla de sèrie continua portant el 100%: és la de l'accés la que el desfà. */
  expect(valor('.sdp-xat-pindola', 'width')).toBe('100%');
});

/* P1-37 (261026_2057) · El buit i els marges de l'accés són els tokens dels
   botons (--sdp-boto-*, tokens.css), que valen els mateixos 12px
   (src/css/botons.capes.test.js). Expectatives actualitzades a propòsit. */
test('261026 · la fila de l’accés porta el buit de la reixeta i com a molt l’amplària de la targeta viva', () => {
  expect(valor(ACCIONS, 'gap')).toBe('var(--sdp-boto-separacio)');
  expect(valor(ACCIONS, 'max-inline-size')).toBe('var(--sdp-targeta-viva-ample)');
  expect(valor(ACCIONS, 'justify-content')).toBe('center');
});

test('261026 · en una pantalla baixa ja cap regla de píndola: comparteixen fila sempre', () => {
  const blocs = blocsMedia('(max-height: 500px)');
  expect(blocs.length).toBeGreaterThan(0);
  for (const bloc of blocs) {
    expect(bloc).not.toContain('.sdp-xat-pindola');
    expect(valor(`${ACCIONS} > .sdp-xat-pindola`, 'width', bloc)).toBeNull();
  }
});

/* Ordre del Mestre (261026_2126; prompt 261026_2130, tasca 1; P1-38 i P1-37) ·
   «Descarrega l'App», damunt de la parella, amb el respir de davall de la frase
   que abans portava la parella. Entre la seua fila i la parella, només el buit
   de l'alerta, el mateix que entre «Entrar» i «Registrar-se».
   Onada R32.28 · C-2 · El xip «Lletra gran» (ControlModeSenior amb etiquetaCurta)
   comparteix la primera fila d'accions (.sdp-xat-acces > .sdp-alerta__accions) i
   baixa centrat quan no hi cap; s'hi retiren les dues regles CSS mortes que
   quedaven a modules.css:6188-6199.
   v1.2.18 · Gauntlet R1 (L1-02) · El mínim és min-inline-size: auto, amb
   max-inline-size: 100%, a la franja i a «Descarrega l'App». El d'abans,
   min(100%, max-content), era CSS invàlid i el navegador el descartava: la prova
   comparava una cadena que no s'aplicava. Expectatives actualitzades a propòsit, i
   una guarda perquè cap paraula clau intrínseca torne dins de min()/max()/clamp().
   v1.2.18 · Gauntlet R1 (L1-04) · La fila única de 48 px no és per a totes les
   llengües (es i eu baixen a 360 px): és la decisió C-2 del Mestre pendent (L1-03).
   v1.2.18 · Gauntlet R2 (L1R2-04) · Per això la frase de l'Onada R32.28 ja no diu
   «resolta definitivament»: descriu el comportament, no tanca la decisió C-2. */
const DESCARREGA = `${ACCIONS} > .sdp-xat-acces__descarrega`;
const PINDOLA_DE_LA_FILA = `${ACCIONS} > .sdp-xat-pindola`;
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const components = senseComentaris(readFileSync(resolve(process.cwd(), 'src/css/components.css'), 'utf8'));
const diferit = senseComentaris(readFileSync(resolve(process.cwd(), 'src/css/diferit-mode-senior.css'), 'utf8'));

test('261026_2126 · C-2 · «Descarrega l’App» i el xip «Lletra gran» tenen geometria neta i min-inline-size sense regles mortes', () => {
  expect(valor('.sdp-xat-pindola', 'min-height')).toBe('var(--sdp-touch)');
  expect(valor('.sdp-xat-pindola', 'width')).toBe('100%');
  expect(valor(PINDOLA_DE_LA_FILA, 'flex')).toBe('1 1 0');
  expect(valor(PINDOLA_DE_LA_FILA, 'width')).toBe('auto');
  expect(valor(PINDOLA_DE_LA_FILA, 'min-inline-size')).toBe('max-content');
  for (const propietat of ['min-height', 'height']) expect(valor(PINDOLA_DE_LA_FILA, propietat), propietat).toBeNull();
  expect(valor(ACCIONS, 'margin')).toBe('var(--sdp-boto-marge-block) auto 0');
  expect(valor(ACCIONS, 'max-inline-size')).toBe('var(--sdp-targeta-viva-ample)');
  expect(valor('.sdp-xat-acces .sdp-mode-senior-franja', 'flex', diferit)).toBe('1 1 auto');
  expect(valor('.sdp-xat-acces .sdp-mode-senior-franja', 'min-inline-size', diferit)).toBe('auto');
  expect(valor('.sdp-xat-acces .sdp-mode-senior-franja', 'max-inline-size', diferit)).toBe('100%');
  expect(valor(DESCARREGA, 'flex')).toBe('1 1 auto');
  expect(valor(DESCARREGA, 'min-inline-size')).toBe('auto');
  expect(valor(DESCARREGA, 'max-inline-size')).toBe('100%');
  expect(valor('.sdp-mode-senior-xip--curt', 'white-space', diferit)).toBe('nowrap');
  for (const propietat of ['width', 'min-height', 'height', 'margin']) {
    expect(valor(DESCARREGA, propietat), propietat).toBeNull();
  }
  for (const propietat of ['width', 'min-height', 'height', 'flex', 'margin', 'max-inline-size']) {
    expect(valor(DESCARREGA, propietat, diferit), `${propietat} (diferit)`).toBeNull();
  }
});

/* v1.2.18 · Gauntlet R1 (L1-02) · Una paraula clau intrínseca (min-content, max-content,
   fit-content) dins de min(), max() o clamp() fa invàlida la declaració sencera:
   CSS.supports('min-inline-size', 'min(100%, max-content)') torna false a Chrome 158.
   v1.2.18 · Gauntlet R2 (L1R2-01) · La guarda mira només dins de cada funció, amb els
   parèntesis aparellats: la regex d'abans seguia fins al final de la declaració i feia caure
   graelles vàlides (min(100%, 12rem) max-content 1fr). També hi entren calc(), round(), mod()
   i rem(), igual d'invàlides amb una paraula clau intrínseca, i els noms en majúscules. */
const FUNCIO_MATEMATICA = /\b(?:min|max|clamp|calc|round|mod|rem)\(/gi;
function intrinsequesEnFuncio(css) {
  const trobades = [];
  for (const m of css.matchAll(FUNCIO_MATEMATICA)) {
    let fondaria = 1;
    let i = m.index + m[0].length;
    for (; i < css.length && fondaria; i += 1) {
      if (css[i] === '(') fondaria += 1;
      else if (css[i] === ')') fondaria -= 1;
    }
    if (/\b(?:min|max|fit)-content\b/i.test(css.slice(m.index + m[0].length, i - 1))) trobades.push(css.slice(m.index, i));
  }
  return trobades;
}

test('v1.2.18 · L1-02 · cap paraula clau intrínseca dins d’una funció matemàtica a modules.css ni al full diferit', () => {
  /* La guarda mateixa: caça els invàlids i deixa passar els valors vàlids. */
  for (const invalid of ['min(100%, max-content)', 'calc(100% - max-content)', 'MIN(100%, MAX-CONTENT)']) {
    expect(intrinsequesEnFuncio(`a { min-inline-size: ${invalid}; }`), invalid).toEqual([invalid]);
  }
  for (const valid of [
    'min(100%, 12rem) max-content 1fr',
    'minmax(min(100%, 16rem), max-content)',
    'calc-size(max-content, min(size, 100%))',
    'minmax(min-content, max-content) 1fr'
  ]) {
    expect(intrinsequesEnFuncio(`a { grid-template-columns: ${valid}; }`), valid).toEqual([]);
  }
  expect(intrinsequesEnFuncio(modules)).toEqual([]);
  expect(intrinsequesEnFuncio(diferit)).toEqual([]);
});

/* v1.2.18 · Gauntlet R2 (L1R2-01) · «Descarrega l'App» porta les dues classes (el DOM viu ho
   comprova més avall), i les dues regles de modules.css tenen especificitat 0,3,0: el
   min-inline-size: auto i el flex: 1 1 auto de DESCARREGA només guanyen al max-content i al
   flex: 1 1 0 de PINDOLA_DE_LA_FILA perquè van després. valor() compara cadenes per selector i no
   veu l'ordre: si s'intercanviaren, tornaria el desbordament de L1-02 amb totes les cadenes bé. */
test('v1.2.18 · L1R2-01 · la regla de «Descarrega l’App» va després de la de la píndola de la fila', () => {
  const pindola = modules.indexOf(`${PINDOLA_DE_LA_FILA} {`);
  expect(pindola).toBeGreaterThanOrEqual(0);
  expect(modules.indexOf(`${DESCARREGA} {`)).toBeGreaterThan(pindola);
});

test('261026_2126 · P1-37 · B11c · entre la fila de «Descarrega l’App» i la parella, només el buit de l’alerta', () => {
  /* El margin-top: 0 és el de la regla diferida de B11c; modules.css no en porta cap de viu. */
  expect(valor(`${ACCIONS} + .sdp-alerta__accions`, 'margin-top', diferit)).toBe('0');
  expect(valor(`${ACCIONS} + .sdp-alerta__accions`, 'margin-top')).toBeNull();
  expect(valor('.sdp-alerta', 'gap', components)).toBe('var(--sdp-space-3)');
  expect(valor('.sdp-alerta.sdp-xat-acces', 'gap')).toBeNull();
  expect(valor(ACCIONS, 'gap')).toBe('var(--sdp-boto-separacio)');
});

/* L'accés viu: XatSection sense sessió a l'aterratge del Xat, amb el context de veres
   (XatContext.Provider), com XatSection.avatars.test.jsx. */
function contextSenseSessio() {
  return {
    scopeKey: 'A', ambitEstable: 'P', status: 'ready', avis: null, chatThreads: [],
    getThreadMessages: () => [], sendChatMessage: vi.fn(async () => []), obriFil: () => {}, creaFil: vi.fn(),
    cercaMembres: vi.fn(async () => []), totalNoLlegits: 0, hiHaMesAntics: () => false,
    carregantAntics: () => false, carregaMesAntics: () => {}, reintenta: () => {}, descartaFallit: () => {},
    marcaVist: () => {}, comunitats: [], contactesFrequents: [], marcaLlegides: () => 0,
    obriFilDePagina: vi.fn(async () => null), joId: null, joNom: null, senseSessio: true,
    modeDades: 'remote', consumixEntrada: undefined
  };
}

function muntaAcces() {
  render(createElement(XatContext.Provider, { value: contextSenseSessio() }, createElement(XatSection)));
  const totes = document.querySelectorAll('.sdp-xat-acces');
  expect(totes).toHaveLength(1);
  return totes[0];
}

/** Els selectors de modules.css (sense comentaris) que nomenen una classe. */
function selectorsAmb(classe) {
  const trobats = new Set();
  for (const m of modules.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const selector of net(m[1].split(';').pop()).split(',').map(net)) if (selector.includes(classe)) trobats.add(selector);
  }
  return [...trobats];
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.navigate.mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('261026_2126 · C-2 · al DOM viu, el botó i el xip conviuen a la primera fila i no queden regles mortes a modules.css', () => {
  const acces = muntaAcces();
  const boto = screen.getByRole('button', { name: "Descarrega l'App" });
  const xip = screen.getByRole('switch', { name: 'Lletra gran' });
  expect(boto.matches(DESCARREGA)).toBe(true);
  expect(boto.matches(PINDOLA_DE_LA_FILA)).toBe(true);
  expect(xip.classList.contains('sdp-mode-senior-xip--curt')).toBe(true);
  const files = acces.querySelectorAll(':scope > .sdp-alerta__accions');
  expect(files).toHaveLength(2);
  expect(files[0].contains(boto)).toBe(true);
  expect(files[0].contains(xip)).toBe(true);
  expect([...document.querySelectorAll(`${ACCIONS} + .sdp-alerta__accions`)]).toEqual([files[1]]);
  expect(within(files[1]).getAllByRole('button').map((b) => b.textContent)).toEqual(['Entrar', 'Registrar-se']);
  expect(selectorsAmb('.sdp-xat-acces__descarrega')).toEqual([DESCARREGA]);
});

test('261026_2126 · C-2 · dins de l’app nativa (sense botó de descàrrega), el xip ocupa la primera fila netament', () => {
  window.Capacitor = { isNativePlatform: () => true };
  try {
    muntaAcces();
    expect(screen.queryByRole('button', { name: "Descarrega l'App" })).toBeNull();
    expect(screen.getByRole('switch', { name: 'Lletra gran' })).toBeTruthy();
    expect(document.querySelectorAll(`${ACCIONS} + .sdp-alerta__accions`)).toHaveLength(1);
  } finally {
    delete window.Capacitor;
  }
});

test('261026_2126 · C-2 · zero regles mortes de .sdp-xat-acces__descarrega a modules.css: tota regla casa amb un element viu', () => {
  muntaAcces();
  const selectors = selectorsAmb('.sdp-xat-acces__descarrega');
  expect(selectors).toEqual([DESCARREGA]);
  for (const selector of selectors) {
    expect(document.querySelectorAll(selector).length, selector).toBeGreaterThan(0);
  }
});
