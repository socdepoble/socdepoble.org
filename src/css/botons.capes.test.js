// @vitest-environment node
/* P1-37 (ordre del Mestre, 261026_2057; pla 261028_1526 §3.5.1) · Botons
   unificats Pedra Seca: l'aire d'un botó de bloc que va a soles i el buit
   entre els botons d'un grup són tres àlies de la reixeta, declarats una sola
   vegada al bloc principal de tokens.css i cap tema no els redefinix. Els
   consumixen, amb els mateixos píxels d'abans (16, 12 i 12), la píndola de la
   IAIA i el bloc d'accions canònic. Els buits de 8px del diàleg «Nova
   conversa» i de ControlsAdjunt no hi entren: passar-los a 12 seria un canvi
   visible, i és del Mestre. jsdom no calcula res: es lligen els fulls. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const declaracions = (text) => Object.fromEntries(
  [...senseComentaris(text).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
);
const TOKENS = llig('src/css/tokens.css');

/** El cos del bloc que obri `selector {` a principi de línia (el patró de tokens.contracte.test.js). */
function bloc(text, selector) {
  const inici = text.indexOf(`\n${selector} {`);
  expect(inici, `falta el bloc ${selector}`).toBeGreaterThan(-1);
  const obre = text.indexOf('{', inici);
  let prof = 0;
  for (let i = obre; i < text.length; i++) {
    if (text[i] === '{') prof++;
    if (text[i] === '}' && --prof === 0) return text.slice(obre + 1, i);
  }
  throw new Error(`bloc sense tancar: ${selector}`);
}
const PRINCIPAL = bloc(TOKENS, ':root, :host, .sdp-root');
const ALTRES = [
  ':root[data-theme="dark"], :host([data-theme="dark"]),\n:root[data-theme="dark"] .sdp-root, :host([data-theme="dark"]) .sdp-root',
  '.sdp-root[data-contrast="bancal"],\n:root[data-contrast="bancal"], :host([data-contrast="bancal"]),\n:root[data-contrast="bancal"] .sdp-root, :host([data-contrast="bancal"]) .sdp-root',
  ':root[data-theme="dark"] .sdp-root[data-contrast="bancal"],\n:root[data-theme="dark"][data-contrast="bancal"], :host([data-theme="dark"][data-contrast="bancal"]),\n'
    + ':root[data-theme="dark"][data-contrast="bancal"] .sdp-root, :host([data-theme="dark"][data-contrast="bancal"]) .sdp-root'
].map((selector) => bloc(TOKENS, selector));

const MAPA = { ...declaracions(llig('src/css/design-tokens.css')), ...declaracions(PRINCIPAL) };
function resol(valor, vistos = new Set()) {
  return valor.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    expect(vistos.has(nom), `cicle a ${nom}`).toBe(false);
    expect(MAPA[nom], `falta ${nom}`).toBeDefined();
    return resol(MAPA[nom], new Set([...vistos, nom]));
  }).trim();
}

/** El valor d'una propietat a les regles d'un selector exacte d'un full (l'última guanya). */
function valor(full, selector, propietat) {
  const net = (t) => t.replace(/\s+/g, ' ').trim();
  let trobat = null;
  for (const m of senseComentaris(full).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!net(m[1].split(';').pop()).split(',').map(net).includes(selector)) continue;
    for (const d of m[2].split(';')) {
      const [prop, ...resta] = d.split(':');
      if (net(prop || '') === propietat) trobat = net(resta.join(':'));
    }
  }
  return trobat;
}

function fullsCss(carpeta = 'src') {
  const eixida = [];
  for (const nom of readdirSync(resolve(ARREL, carpeta))) {
    const ruta = join(carpeta, nom);
    if (statSync(resolve(ARREL, ruta)).isDirectory()) eixida.push(...fullsCss(ruta));
    else if (nom.endsWith('.css')) eixida.push(ruta);
  }
  return eixida;
}

const ESPERATS = Object.freeze({
  '--sdp-boto-marge-inline': ['var(--sdp-space-4)', '16px'],
  '--sdp-boto-marge-block': ['var(--sdp-space-3)', '12px'],
  '--sdp-boto-separacio': ['var(--sdp-space-3)', '12px']
});

describe('P1-37 · els tokens dels botons', () => {
  test('cada un es declara una sola vegada, al bloc principal, com a àlies de la reixeta', () => {
    const P = declaracions(PRINCIPAL);
    for (const [nom, [alies]] of Object.entries(ESPERATS)) {
      expect(P[nom], nom).toBe(alies);
      const declarat = new RegExp(`${nom}\\s*:`, 'g');
      const vegades = fullsCss().reduce((n, ruta) => n + (senseComentaris(llig(ruta)).match(declarat)?.length ?? 0), 0);
      expect(vegades, nom).toBe(1);
    }
  });

  test('resolen a 16, 12 i 12 px, múltiples de 4', () => {
    for (const [nom, [, px]] of Object.entries(ESPERATS)) {
      const resolt = resol(`var(${nom})`);
      expect(resolt, nom).toBe(px);
      expect(Number.parseInt(resolt, 10) % 4, nom).toBe(0);
    }
  });

  test('ni el tema fosc ni el Bancal els redefinixen: valen igual a tot arreu', () => {
    for (const cos of ALTRES) for (const nom of Object.keys(ESPERATS)) expect(declaracions(cos)[nom], nom).toBeUndefined();
  });

  test('els consumix el bloc d’accions canònic, i la píndola/modal ConsultaIAIA ja no existix a modules.css (R21.3)', () => {
    const moduls = senseComentaris(llig('src/css/modules.css'));
    expect(moduls).not.toMatch(/\.sdp-xat-pindola--iaia\b/);
    expect(moduls).not.toMatch(/\.sdp-iaia-consulta\b/);
    const components = llig('src/css/components.css');
    expect(valor(components, '.sdp-accions', 'justify-content')).toBe('center');
    expect(valor(components, '.sdp-accions', 'gap')).toBe('var(--sdp-boto-separacio)');
    // Els 24px de dalt i de baix de l'Accions són la distància al text (IDEA-26/27), no un marge de botó.
    expect(valor(components, '.sdp-accions', 'margin-block')).toBe('var(--sdp-space-6)');
    // Ordre del Mestre (261114) · Tots els botons sols o grups d'acció van centrats, inclòs «Escolta la IAIA».
    expect(valor(components, '.sdp-veu-lectura-marc', 'justify-content')).toBe('center');
  });
});

/* R26.2 · La respiració lateral es comprova també a les variants que guanyen
   el botó base. Un sol test de .sdp-boto deixava passar l'App Store a 12px
   i els peus del workspace a 8px. El navegador es mesura a part a 360×640. */
function espaiPx(valorCss) {
  const resolt = resol(valorCss);
  if (resolt === '0') return 0;
  expect(resolt).toMatch(/^\d+(?:\.\d+)?px$/);
  return Number.parseFloat(resolt);
}
function coixi(full, selector) {
  const curt = valor(full, selector, 'padding')?.split(/\s+(?![^()]*\))/);
  const bloc = valor(full, selector, 'padding-block') || curt?.[0] || '0';
  const lateral = valor(full, selector, 'padding-inline') || curt?.[1] || curt?.[0];
  return { bloc: espaiPx(bloc), lateral: espaiPx(lateral) };
}

describe('R26.2 · respiració lateral sense comprimir per encaixar', () => {
  test('el botó gran de marca conserva el mateix coixí que WordPress.org', () => {
    const full = llig('src/css/components.css');
    const gran = coixi(full, '.sdp-boto--gran');
    expect(gran.lateral).toBe(32);
    expect(gran.lateral).toBeGreaterThan(gran.bloc * 2);
    expect(valor(full, '.sdp-boto--marca.sdp-boto--gran', 'padding-inline'))
      .toBe(valor(full, '.sdp-boto--gran', 'padding').split(' ').slice(1).join(' '));
    expect(valor(full, '.sdp-boto--gran', 'max-inline-size')).toBe('100%');
    expect(valor(full, '.sdp-boto--gran', 'white-space')).toBe('normal');
  });

  test('les famílies amb text superen 2× el coixí vertical', () => {
    const famílies = {
      'src/css/components.css': ['.sdp-boto', '.btn', '.btn-sm', '.page-btn', '.pill', '.sdp-joc-parla__opcio'],
      'src/css/modules.css': ['.search-filters button', '.sdp-classificacio-botonera > .sdp-boto',
        '.sdp-enquadrament__format-pindola', '.sdp-tpv__accio', '.sdp-xat-iaia-accio', '.sdp-btn',
        '.sdp-directori-filtres__boto', '.sdp-workspace-llibres__tab']
    };
    for (const [ruta, selectors] of Object.entries(famílies)) for (const selector of selectors) {
      const { bloc, lateral } = coixi(llig(ruta), selector);
      expect(lateral, `${ruta} ${selector}`).toBeGreaterThan(bloc * 2);
      expect(lateral, `${ruta} ${selector}`).toBeGreaterThanOrEqual(20);
    }
  });

  test('els contextos estrets no tornen a llevar el coixí del botó', () => {
    const full = llig('src/css/modules.css');
    /* Integració R26 · Fora de la llista, amb motiu: '.sdp-workspace .sdp-workspace-column__peu .sdp-boto'
       ocupa tota l'amplària de la columna i conserva el coixí de HEAD (G-D1 i G2-05, MultimediaSection.test.jsx). */
    for (const selector of [
      '.sdp-classificacio-botonera > .sdp-boto',
      '.sdp-enquadrament__dialeg--senzill .sdp-dialeg__peu .sdp-boto',
      '.sdp-cal-vistes .sdp-pindola__opcio', '.sdp-cerca__filtres .sdp-pindola__opcio'
    ]) expect(espaiPx(valor(full, selector, 'padding-inline')), selector).toBeGreaterThanOrEqual(20);
  });

  test('els grups afectats baixen centrats i els segments no retallen el text', () => {
    const full = llig('src/css/modules.css');
    /* Integració R26 · '.sdp-xat-pindoles' queda fora, amb motiu: és una fila de filtres que es desplaça en
       horitzontal (patró WhatsApp) i que no pot passar a dues files sense que l'alçada bote en obrir la lupa
       (P1-36, FiltreConverses.test.jsx). Les seues píndoles sí que respiren 20 px pels costats. */
    expect(valor(full, '.sdp-xat-pindoles', 'overflow-x')).toBe('auto');
    expect(espaiPx(valor(full, '.sdp-xat-pindoles__boto', 'padding').split(' ')[1])).toBeGreaterThanOrEqual(20);
    for (const selector of ['.sdp-xat-segments']) {
      expect(valor(full, selector, 'display'), selector).toBe('flex');
      expect(valor(full, selector, 'flex-wrap'), selector).toBe('wrap');
      expect(valor(full, selector, 'justify-content'), selector).toBe('center');
    }
    expect(valor(full, '.sdp-xat-segments__opcio', 'white-space')).toBe('normal');
    expect(valor(full, '.sdp-xat-segments__opcio', 'text-overflow')).toBe('clip');
    expect(valor(full, '.sdp-xat-segments__opcio', 'flex')).toBe('0 1 auto');
  });

  test('Cerca també baixa centrada i cap regla compacta reinstaura la fila desplaçable', () => {
    const full = senseComentaris(llig('src/css/modules.css'));
    expect(valor(full, '.sdp-cerca__filtres', 'flex-wrap')).toBe('wrap');
    expect(valor(full, '.sdp-cerca__filtres', 'justify-content')).toBe('center');
    expect(valor(full, '.sdp-cerca__filtres', 'overflow-x')).toBe('visible');
    for (const regla of full.matchAll(/\.sdp-cerca__filtres\s*\{([^{}]*)\}/g)) {
      expect(regla[1]).not.toMatch(/flex-wrap\s*:\s*nowrap|justify-content\s*:\s*flex-start|overflow-x\s*:\s*auto/);
    }
  });

  test('la base heretada de BotoVeuIaia continua a 20/8 i el punt volat PWA és U+00B7', () => {
    const full = llig('src/css/components.css');
    expect(coixi(full, '.sdp-boto')).toEqual({ bloc: 8, lateral: 20 });
    const font = llig('src/sections/detail/InstalaLaPwa.jsx');
    expect(font).toContain('"Instal\u00b7lar l\'App (PWA)"');
    expect(font).not.toMatch(/Instal[\u00ad\u200b]lar/);
  });
});

// Refutació independent R26.2: el nom «opcio» o «visor» no prova que siga una icona.
describe('R26.2 · variants textuals refutades per l’àrbitre', () => {
  test('els filtres de comunitats no tornen a estrényer la píndola base', () => {
    const full = llig('src/css/modules.css');
    const filtre = coixi(full, '.sdp-comu .sdp-comu__filtres .sdp-pindola__opcio');
    expect(filtre.lateral).toBeGreaterThanOrEqual(20);
    expect(filtre.lateral).toBeGreaterThan(filtre.bloc * 2);
    expect(valor(full, '.sdp-comu .sdp-comu__filtres', 'justify-content')).toBe('center');
    expect(valor(full, '.sdp-comu .sdp-comu__filtres', 'flex-wrap')).toBe('wrap');
  });

  test('Fixar la informació és una pastilla de text també dins del visor i el Perfil', () => {
    for (const [ruta, selector] of [
      ['src/css/components.css', '.sdp-visor__fixar'],
      ['src/css/modules.css', '.sdp-visor .sdp-visor__fixar'],
      ['src/css/components.css', '.sp-card-label__action']
    ]) expect(coixi(llig(ruta), selector).lateral, `${ruta} ${selector}`).toBeGreaterThanOrEqual(20);
  });
});

// Les pestanyes són controls de text; la instal·lació compacta, una icona explícita.
describe('R26.2 · pestanyes i instal·lació en la barra', () => {
  test('les pestanyes conserven 20px i baixen en files centrades', () => {
    for (const [ruta, boto, grup] of [
      ['src/css/components.css', '.sdp-pestanyes__pestanya', '.sdp-pestanyes__llista'],
      ['src/css/modules.css', '.sdp-xat-adjunts-panell__pestanya', '.sdp-xat-adjunts-panell__pestanyes']
    ]) {
      const full = llig(ruta);
      const { lateral, bloc } = coixi(full, boto);
      expect(lateral).toBeGreaterThanOrEqual(20);
      expect(lateral).toBeGreaterThan(bloc * 2);
      expect(valor(full, grup, 'flex-wrap')).toBe('wrap');
      expect(valor(full, grup, 'justify-content')).toBe('center');
      expect(valor(full, boto, 'white-space')).toBe('normal');
    }
    const full = llig('src/css/components.css');
    expect(valor(full, '.sdp-pestanyes--centrades .sdp-pestanyes__pestanya:first-child', 'margin-inline-start')).toBe('0');
    expect(valor(full, '.sdp-pestanyes--centrades .sdp-pestanyes__pestanya:last-child', 'margin-inline-end')).toBe('0');
  });
  test('Instal·lar té coixí de text en escriptori i conserva la icona sola en compacte', () => {
    const full = llig('src/css/utilities.css');
    expect(coixi(full, '.sdp-top-bar-btn.sdp-top-bar-btn--instal').lateral).toBe(20);
    expect(valor(full, ':where(.sdp-root.is-compact) .sdp-top-bar-btn.sdp-top-bar-btn--instal', 'padding')).toBe('0');
  });
});

describe('R26.2 · text actiu fora dels noms lèxics de botó', () => {
  test('les portes de targeta conserven la pell Boto i no repartixen una base estreta', () => {
    const full = llig('src/css/components.css');
    expect(espaiPx(valor(full, '.sp-card-porta', 'padding-inline'))).toBe(20);
    expect(valor(full, '.sp-card-porta', 'flex')).toBe('0 1 auto');
    expect(valor(full, '.sp-card-portes', 'flex-wrap')).toBe('wrap');
    expect(valor(full, '.sp-card-portes', 'justify-content')).toBe('center');
  });
  test('els CTA del Xat, comunitats i workspace tenen coixí real de text', () => {
    const full = llig('src/css/modules.css');
    for (const selector of ['.sdp-workspace-clear', '.sdp-workspace-tag', '.sdp-xat-pindola',
      '.sdp-subnav-pobles-gent__enllac', '.sdp-xat-iaia-suggeriment', '.sdp-xat-adjunts-panell__salta']) {
      const { lateral, bloc } = coixi(full, selector);
      expect(lateral, selector).toBeGreaterThanOrEqual(20);
      expect(lateral, selector).toBeGreaterThan(bloc * 2);
    }
    expect(espaiPx(valor(full, 'button.sdp-comu__signatura', 'padding-inline'))).toBe(20);
    // El badge span conserva el coixí propi; només el button guanya els laterals nous.
    expect(coixi(full, '.sdp-comu__signatura').lateral).toBe(12);
  });
  test('classificació conserva wrapper0 però la pell visible té20 i el text pot fer línies', () => {
    const full = llig('src/css/modules.css');
    expect(valor(full, '.sdp-classificacio-pindola', 'padding')).toBe('0');
    expect(espaiPx(valor(full, '.sdp-classificacio-pindola > .sp-card-label', 'padding-inline'))).toBe(20);
    expect(valor(full, '.sdp-classificacio-pindola > .sp-card-label', 'height')).toBe('auto');
    expect(valor(full, '.sdp-classificacio-pindola__text', 'white-space')).toBe('normal');
    expect(valor(full, '.sdp-classificacio-pindola__text', 'text-overflow')).toBe('clip');
  });
  test('Pou de Neu conserva20px també quan entra a pantalla completa', () => {
    const full = llig('src/css/components.css');
    expect(coixi(full, '.pou-neu-choice')).toEqual({ bloc: 8, lateral: 20 });
    // valor() tracta comes com selectors: comprovem també el text de la regla funcional completa.
    expect(senseComentaris(full)).toContain(':is(.pou-neu-card.is-fullscreen, .pou-neu-card:fullscreen) .pou-neu-choice { padding-inline: var(--sdp-space-5); }');
  });
});

test('R26.2 · les accions de text del visor Xat conserven20 i les icones mòbils8', () => {
  const full = senseComentaris(llig('src/css/modules.css'));
  expect(full).toMatch(/\.sdp-xat-visor__accio,\s*\.sdp-xat-visor__tanca\s*\{[^}]*padding:\s*0 var\(--sdp-space-5\);/);
  expect(full).toMatch(/@media \(max-width: 600px\)\s*\{\s*\.sdp-xat-visor__accio-text\s*\{ display: none; \}\s*\.sdp-xat-visor__accio\s*\{ padding: 0 var\(--sdp-space-2\); \}/);
});

test('R26.2 · l’excepció de BotoVeuIaia no s’estén als filtres del reproductor', () => {
  const full = llig('src/css/components.css');
  expect(coixi(full, '.sdp-boto')).toEqual({ bloc: 8, lateral: 20 });
  expect(coixi(full, '.sdp-barra-veu__pindola')).toEqual({ bloc: 0, lateral: 20 });
  expect(valor(full, '.sdp-barra-veu__filtres', 'justify-content')).toBe('center');
});
