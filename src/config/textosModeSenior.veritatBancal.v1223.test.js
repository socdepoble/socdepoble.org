/* v1.2.23 · D-V1223-TEXT-BANCAL (ordre del Mestre 261123) · El text del Mode Bancal diu només el que fa el codi.
   Ordre literal: «Actualitza el text descriptiu del Mode Bancal en les 5 llengües perquè diga exactament la veritat
   matemàtica (contrast màxim AAA (≥ 7:1), cos 18px, jerarquia Títol > Subtítol > Paràgraf i taronja #FF7300), eliminant
   qualsevol menció a ≥ 10:1.»
   Esta prova no confia en cap comentari de ràtio: mesura la luminància WCAG 2.x dels tokens de src/css/tokens.css en l'estat
   que pinta el Mode Bancal (data-sdp-senior="true" i data-contrast="bancal" alhora, DOL-31), en clar i en fosc, i exigix
   que cada xifra «N:1» dels textos vius del mode siga com a molt el mínim mesurat. Si un dia el mínim puja, el text pot
   pujar; si algú torna a escriure «10:1» amb el taronja de marca al damunt (7,12:1), la prova cau. També comprova al CSS
   els 18 px del cos, la jerarquia 24 > 20 > 18 px de les targetes (IDEA-328 v2), els 56 px de les dianes primàries i que
   l'accent de l'estat combinat és el taronja de marca. La crònica de /versions (pageContent.r10.js) diu el que es va
   lliurar aleshores i no entra ací. Les de l'R32.15 a /page/node-zero (dins de «Què fa hui el Node 0») i
   /page/fediversity sí que hi entren: diuen «AAA (≥ 7:1)», cert aleshores i hui. */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { TEXTOS_MODE_SENIOR } from './textosModeSenior.js';
import { CODIS_IDIOMA_GUIA_PAS_A_PAS, TEXTOS_APARADOR_GUIA } from '../sections/text/i18nAparadorGuiaPasAPas.js';
import { PAGINA_POTS_FER } from '../sections/text/pageContent.potsFer.js';
import {
  APARTAT_NODE_ZERO_R32_15,
  BLOC_DISSENY_R32_15,
  FEDIVERSITY_R32_15_PREAMBUL,
} from '../sections/text/pageContent.coherenciaR32_15.js';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const TOKENS = llig('src/css/tokens.css');
const CANON = llig('src/css/design-tokens.css');
const MODE_SENIOR_CSS = llig('src/css/diferit-mode-senior.css');

const TARONJA_MARCA = /* ALLOW_RAW_COLOR */ '#FF7300';
const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];

const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
/* v1.2.23 · L3-01 (Gauntlet R1) · Per a numerar infraccions: cada comentari deixa els seus salts de línia, i el número que
   dona la porta és la línia real del fitxer (grep -n), també després d'un comentari de diverses línies. */
const senseComentarisAmbLinies = (text) => text.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ''));
const declaracions = (text) => Object.fromEntries(
  [...senseComentaris(text).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
);

/** El cos d'un bloc de tokens.css que comença, a l'inici de línia, amb el selector exacte. */
function bloc(selector) {
  const inici = TOKENS.indexOf(`\n${selector} {`);
  expect(inici, `falta el bloc ${selector.slice(0, 60)}`).toBeGreaterThan(-1);
  const obre = TOKENS.indexOf('{', inici);
  let prof = 0;
  for (let i = obre; i < TOKENS.length; i += 1) {
    if (TOKENS[i] === '{') prof += 1;
    if (TOKENS[i] === '}' && --prof === 0) return { inici, cos: TOKENS.slice(obre + 1, i) };
  }
  throw new Error(`bloc sense tancar: ${selector}`);
}

/* Els mateixos selectors que mesura modeBancalWcagAAA.r32_35b.test.js, en la variant :root / :host. */
const PRINCIPAL = bloc(':root, :host, .sdp-root');
const FOSC = bloc(':root[data-theme="dark"], :host([data-theme="dark"]),\n:root[data-theme="dark"] .sdp-root, :host([data-theme="dark"]) .sdp-root');
const SENIOR = bloc(':root[data-sdp-senior="true"], :host([data-sdp-senior="true"]),\n:root[data-sdp-senior="true"] .sdp-root, :host([data-sdp-senior="true"]) .sdp-root');
const SENIOR_FOSC = bloc(':root[data-theme=\'dark\'][data-sdp-senior="true"], :host([data-theme=\'dark\'][data-sdp-senior="true"]),\n'
  + ':root[data-theme=\'dark\'][data-sdp-senior="true"] .sdp-root, :host([data-theme=\'dark\'][data-sdp-senior="true"]) .sdp-root');
const BANCAL = bloc(':root[data-contrast="bancal"], :host([data-contrast="bancal"]),\n:root[data-contrast="bancal"] .sdp-root, :host([data-contrast="bancal"]) .sdp-root');
const BANCAL_FOSC = bloc(':root[data-theme="dark"][data-contrast="bancal"], :host([data-theme="dark"][data-contrast="bancal"]),\n'
  + ':root[data-theme="dark"][data-contrast="bancal"] .sdp-root, :host([data-theme="dark"][data-contrast="bancal"]) .sdp-root');

/** La cascada de veres: primer l'especificitat i, si empata, la posició al fitxer. */
const cascada = (blocs) => blocs
  .slice()
  .sort(([a, ea], [b, eb]) => (ea - eb) || (a.inici - b.inici))
  .reduce((mapa, [b]) => ({ ...mapa, ...declaracions(b.cos) }), declaracions(CANON));
const BANCAL_CLAR = cascada([[PRINCIPAL, 1], [SENIOR, 2], [BANCAL, 2]]);
const BANCAL_FOSC_MAPA = cascada([[PRINCIPAL, 1], [FOSC, 2], [SENIOR, 2], [BANCAL, 2], [SENIOR_FOSC, 3], [BANCAL_FOSC, 3]]);

const hex = (r, g, b) => `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
const canals = (h) => h.slice(1).match(/../g).map((x) => parseInt(x, 16));

/** Resol un token fins a un hex opac (també el color-mix in srgb de dos hex del Bancal fosc). */
function resol(nom, mapa, vistos = new Set()) {
  expect(vistos.has(nom), `cicle a ${nom}`).toBe(false);
  expect(mapa[nom], `falta ${nom}`).toBeDefined();
  const valor = mapa[nom].replace(/var\((--[\w-]+)\)/g, (_, n) => resol(n, mapa, new Set([...vistos, nom]))).trim().toLowerCase();
  const mescla = /^color-mix\(in srgb,\s*(#[0-9a-f]{6})\s+(\d+(?:\.\d+)?)%,\s*(#[0-9a-f]{6})\)$/.exec(valor);
  if (mescla) {
    const p = Number(mescla[2]) / 100;
    const [a, b] = [canals(mescla[1]), canals(mescla[3])];
    return hex(...a.map((x, i) => x * p + b[i] * (1 - p)));
  }
  expect(valor, `${nom}: hex opac de 6 xifres`).toMatch(/^#[0-9a-f]{6}$/);
  return valor;
}

function luminancia(h) {
  const [r, g, b] = canals(h)
    .map((x) => x / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const ratio = (a, b, mapa) => {
  const [la, lb] = [luminancia(resol(a, mapa)), luminancia(resol(b, mapa))];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const SUPERFICIES = ['--sdp-fons-targeta', '--sdp-fons-app', '--sdp-fons-subtil', '--sdp-fons-elevat', '--sdp-fons-superficie'];
/* v1.2.23 · L3-01 (Gauntlet R1) · També el text de senyal (error, avís, èxit i informació): el seu token -text. El pitjor
   parell passa a ser --sdp-avis-text damunt del subtil clar (7,07:1); el taronja de marca amb pedra-900 continua a 7,12:1. */
const TEXTOS = [
  '--sdp-text-titol', '--sdp-text-cos', '--sdp-text-suau', '--sdp-accent-text', '--sdp-accent-titol', '--sdp-accent-text-hover', '--sdp-accio-text',
  '--sdp-error-text', '--sdp-avis-text', '--sdp-exit-text', '--sdp-info-text',
];
/* El senyal sense -text (--sdp-error, --sdp-avis, --sdp-exit, --sdp-info) és per a vores, fons i icones: com a lletra no
   arriba a AAA en el Mode Bancal (--sdp-error damunt del subtil, 6,20:1 en clar i 2,29:1 en fosc). */
const SENYALS = ['error', 'avis', 'exit', 'info'];
/* El text sobre els fons massissos: la caputxa taronja (.sp-card-header, .bar-orange) i els botons d'acció. */
const SOBRE_FONS = [
  ['--sdp-sobre-accent', '--sdp-accent'],
  ['--sdp-sobre-accent', '--sdp-accent-hover'],
  ['--sdp-sobre-accio', '--sdp-accio-control'],
  ['--sdp-sobre-accio', '--sdp-accio-control-hover'],
];

function minimDe(mapa) {
  const parells = [...TEXTOS.flatMap((t) => SUPERFICIES.map((s) => [t, s])), ...SOBRE_FONS];
  return parells.reduce((min, [a, b]) => {
    const r = ratio(a, b, mapa);
    return r < min.r ? { r, parell: `${a} / ${b}` } : min;
  }, { r: Infinity, parell: '' });
}

const MINIM_CLAR = minimDe(BANCAL_CLAR);
const MINIM_FOSC = minimDe(BANCAL_FOSC_MAPA);
const MINIM = Math.min(MINIM_CLAR.r, MINIM_FOSC.r);

/** Totes les cadenes (valors) d'un objecte de textos, amb el seu camí. */
function cadenesDe(valor, cami = '') {
  if (typeof valor === 'string') return [[cami, valor]];
  if (Array.isArray(valor)) return valor.flatMap((v, i) => cadenesDe(v, `${cami}[${i}]`));
  if (valor && typeof valor === 'object') {
    return Object.entries(valor).flatMap(([clau, v]) => cadenesDe(v, cami ? `${cami}.${clau}` : clau));
  }
  return [];
}

/** Les xifres de contrast «N:1» d'un text (no les hores com 10:15). */
const xifresDeContrast = (text) => [...String(text).matchAll(/(\d+(?:[.,]\d+)?)\s?:\s?1(?!\d)/g)].map((m) => Number(m[1].replace(',', '.')));

/** Els textos vius que descriuen el Mode Bancal hui. */
const TEXTOS_VIUS = [
  ...LLENGUES.flatMap((codi) => cadenesDe(TEXTOS_MODE_SENIOR[codi], `TEXTOS_MODE_SENIOR.${codi}`)),
  ...CODIS_IDIOMA_GUIA_PAS_A_PAS.flatMap((codi) => cadenesDe(TEXTOS_APARADOR_GUIA[codi], `TEXTOS_APARADOR_GUIA.${codi}`)),
  ...cadenesDe(PAGINA_POTS_FER, 'PAGINA_POTS_FER'),
  ...LLENGUES.map((codi) => [`BLOC_DISSENY_R32_15.${codi}`, BLOC_DISSENY_R32_15[codi]]),
  ...LLENGUES.flatMap((codi) => cadenesDe(APARTAT_NODE_ZERO_R32_15[codi], `APARTAT_NODE_ZERO_R32_15.${codi}`)),
  ...LLENGUES.map((codi) => [`FEDIVERSITY_R32_15_PREAMBUL.${codi}`, FEDIVERSITY_R32_15_PREAMBUL[codi]]),
];

/** La declaració `propietat` de la primera regla CSS el selector de la qual conté `fragment`. */
function declaracioCss(css, fragment, propietat) {
  const net = senseComentaris(css);
  const on = net.indexOf(fragment);
  expect(on, `falta la regla ${fragment}`).toBeGreaterThan(-1);
  const obre = net.indexOf('{', on);
  const cos = net.slice(obre + 1, net.indexOf('}', obre));
  const m = new RegExp(`(?:^|[;\\s])${propietat}\\s*:\\s*([^;]+);`).exec(cos);
  expect(m, `${fragment} no declara ${propietat}`).toBeTruthy();
  return m[1].trim();
}

const remEnPx = (valor) => {
  const m = /^(\d+(?:\.\d+)?)rem$/.exec(valor);
  expect(m, `${valor} en rem`).toBeTruthy();
  return Number(m[1]) * 16;
};

describe('v1.2.23 · D-V1223-TEXT-BANCAL · el text del Mode Bancal diu la veritat matemàtica del CSS', () => {
  test('mesura: en l’estat del Mode Bancal tot el text passa d’AAA (≥ 7:1) en clar i en fosc, i el pitjor parell no arriba a 10:1', () => {
    expect(MINIM_CLAR.r, `clar · ${MINIM_CLAR.parell}`).toBeGreaterThanOrEqual(7);
    expect(MINIM_FOSC.r, `fosc · ${MINIM_FOSC.parell}`).toBeGreaterThanOrEqual(7);
    // Per això cap text pot prometre 10:1: hui el taronja de marca amb pedra-900 al damunt queda a 7,12:1.
    expect(MINIM, `clar ${MINIM_CLAR.parell} · fosc ${MINIM_FOSC.parell}`).toBeLessThan(10);
  });

  /* v1.2.23 · L3-01 (Gauntlet R1) · El títol d'error de ruta (RouteErrorBoundary, damunt de --sdp-fons-subtil) i
     .sdp-text-error pintaven el senyal --sdp-error com a lletra: 6,20:1 en Bancal clar i 2,29:1 en fosc. Cap regla de
     src/css pot pintar text amb el senyal pelat; i el color real del títol es mesura damunt del seu fons. */
  test('L3-01 · el text d’error, avís, èxit i informació pinta el seu token -text, i el títol d’error de ruta passa d’AAA', () => {
    const SENYAL_COM_A_LLETRA = new RegExp(`(?:^|[;{\\s])color\\s*:\\s*var\\(\\s*--sdp-(?:${SENYALS.join('|')})\\s*\\)`);
    const fulls = readdirSync(resolve(process.cwd(), 'src/css')).filter((nom) => nom.endsWith('.css'));
    expect(fulls.length).toBeGreaterThan(20);
    const infraccions = fulls.flatMap((nom) => {
      const cru = llig(`src/css/${nom}`);
      const net = senseComentarisAmbLinies(cru).split('\n');
      expect(net.length, `src/css/${nom}: la numeració ha de ser la del fitxer`).toBe(cru.split('\n').length);
      return net.flatMap((linia, i) => (SENYAL_COM_A_LLETRA.test(linia) ? [`src/css/${nom}:${i + 1} ${linia.trim()}`] : []));
    });
    expect(infraccions, 'el text pinta --sdp-<senyal>-text; el senyal pelat és per a vores i fons').toEqual([]);

    const MODULES = llig('src/css/modules.css');
    expect(declaracioCss(MODULES, '\n.sdp-route-error {', 'background')).toBe('var(--sdp-fons-subtil)');
    const titol = /^var\((--[\w-]+)\)$/.exec(declaracioCss(MODULES, '\n.sdp-route-error__titol {', 'color'))?.[1];
    const textError = /^var\((--[\w-]+)\)$/.exec(declaracioCss(MODULES, '\n.sdp-text-error {', 'color'))?.[1];
    for (const [nom, mapa] of [['clar', BANCAL_CLAR], ['fosc', BANCAL_FOSC_MAPA]]) {
      expect(ratio(titol, '--sdp-fons-subtil', mapa), `${nom} · ${titol} damunt del subtil`).toBeGreaterThanOrEqual(7);
      for (const s of SUPERFICIES) expect(ratio(textError, s, mapa), `${nom} · ${textError} damunt de ${s}`).toBeGreaterThanOrEqual(7);
    }
  });

  test('l’accent de l’estat combinat és el taronja de marca, en clar i en fosc', () => {
    expect(resol('--sdp-accent', BANCAL_CLAR)).toBe(TARONJA_MARCA.toLowerCase());
    expect(resol('--sdp-accent', BANCAL_FOSC_MAPA)).toBe(TARONJA_MARCA.toLowerCase());
  });

  test('CSS: cos de 18 px, jerarquia Títol 24 > Subtítol 20 > Paràgraf 18 a les targetes, i dianes primàries de 56 px', () => {
    // El títol de la targeta (.sp-card-title) pinta --sdp-text-h5, que cap bloc Sènior ni Bancal redefinix.
    expect(declaracioCss(llig('src/css/components.css'), '\n.sp-card-title {', 'font-size')).toBe('var(--sdp-text-h5)');
    for (const b of [SENIOR, SENIOR_FOSC, BANCAL, BANCAL_FOSC]) expect(declaracions(b.cos)['--sdp-text-h5']).toBeUndefined();
    const titol = remEnPx(BANCAL_CLAR['--sdp-text-h5']);
    const subtitol = remEnPx(declaracioCss(MODE_SENIOR_CSS, ':is(.sp-card-subtitle, .sp-card-body h2)', 'font-size'));
    const paragraf = remEnPx(declaracioCss(MODE_SENIOR_CSS, '.sp-card-body :where(p, li, .sp-card-text)', 'font-size'));
    expect([titol, subtitol, paragraf]).toEqual([24, 20, 18]);
    expect(titol).toBeGreaterThan(subtitol);
    expect(subtitol).toBeGreaterThan(paragraf);
    expect(remEnPx(declaracioCss(MODE_SENIOR_CSS, '.sdp-boto,', 'min-height'))).toBe(56);
  });

  /* v1.2.23 · L3-04 (Gauntlet R1) · Amb l'arrel de 359 px o menys, el títol de la targeta amb insígnia lateral baixa a
     --sdp-text-h6 (modules.css, bloc R32.10) i empatava amb el subtítol de 20 px del Mode Bancal. La jerarquia es mesura
     també ací, a la regla @container i a la seua bessona sense consultes de contenidor (@supports not … @media). */
  test('L3-04 · a 359 px o menys, la targeta amb preu o data conserva Títol > Subtítol > Paràgraf (20 > 19 > 18 px)', () => {
    const ESTRET = ['@container sdp-arrel (max-width: 359px)', '@media (max-width: 359px)'];
    const cossosDe = (css, capcalera) => {
      const net = senseComentaris(css);
      const cossos = [];
      for (let on = net.indexOf(capcalera); on > -1; on = net.indexOf(capcalera, on + 1)) {
        const obre = net.indexOf('{', on);
        let prof = 0;
        for (let i = obre; i < net.length; i += 1) {
          if (net[i] === '{') prof += 1;
          if (net[i] === '}' && --prof === 0) { cossos.push(net.slice(obre + 1, i)); break; }
        }
      }
      return cossos;
    };
    const midesEstretes = (css, fragment) => ESTRET.flatMap((capcalera) => cossosDe(css, capcalera))
      .filter((cos) => cos.includes(fragment))
      .map((cos) => declaracioCss(cos, fragment, 'font-size'));

    const titols = midesEstretes(llig('src/css/modules.css'), '.sp-card .sp-card-body.has-aside .sp-card-title');
    expect(titols, '@container i la bessona @media').toEqual(['var(--sdp-text-h6)', 'var(--sdp-text-h6)']);
    for (const b of [SENIOR, SENIOR_FOSC, BANCAL, BANCAL_FOSC]) expect(declaracions(b.cos)['--sdp-text-h6']).toBeUndefined();
    const titol = remEnPx(BANCAL_CLAR['--sdp-text-h6']);
    expect(remEnPx(BANCAL_FOSC_MAPA['--sdp-text-h6'])).toBe(titol);

    const subtitols = midesEstretes(MODE_SENIOR_CSS, ':is(.sp-card-body.has-aside .sp-card-subtitle, .sp-card-body.has-aside h2)');
    expect(subtitols, '@container i la bessona @media').toHaveLength(2);
    const [subtitol, bessona] = subtitols.map(remEnPx);
    expect(bessona).toBe(subtitol);
    const paragraf = remEnPx(declaracioCss(MODE_SENIOR_CSS, '.sp-card-body :where(p, li, .sp-card-text)', 'font-size'));
    expect([titol, subtitol, paragraf]).toEqual([20, 19, 18]);
    expect(titol).toBeGreaterThan(subtitol);
    expect(subtitol).toBeGreaterThan(paragraf);
  });

  test.each(LLENGUES)('%s · la descripció diu AAA (≥ 7:1), 18 px, la jerarquia, 56 px i el taronja de marca, i cap 10:1', (codi) => {
    const { descripcio } = TEXTOS_MODE_SENIOR[codi];
    expect(descripcio).toContain('AAA');
    expect(descripcio).toContain('(≥ 7:1)');
    expect(descripcio).toContain('18 px');
    expect(descripcio).toContain('56 px');
    expect(descripcio).toContain(TARONJA_MARCA);
    expect(descripcio).toMatch(/\S+ > \S+ > \S+/);
    expect(descripcio).not.toContain('10:1');
  });

  test('cap text viu del Mode Bancal promet més contrast del que el CSS dona, ni conté «10:1»', () => {
    expect(TEXTOS_VIUS.length).toBeGreaterThan(50);
    let ambXifra = 0;
    for (const [cami, text] of TEXTOS_VIUS) {
      expect(text, cami).not.toContain('10:1');
      for (const xifra of xifresDeContrast(text)) {
        ambXifra += 1;
        expect(xifra, `${cami} promet ${xifra}:1 i el mínim mesurat és ${MINIM.toFixed(2)}:1`).toBeLessThanOrEqual(MINIM);
      }
    }
    // 5 descripcions + 10 mostres de l'Aparador + 10 passos de «Tot el que pots fer» + 5 blocs de /disseny
    // + 5 apartats de /page/node-zero + 5 preàmbuls de /page/fediversity.
    expect(ambXifra).toBeGreaterThanOrEqual(40);
  });

  /* v1.2.23 · D-V1223-TEXT-BANCAL (ordre del Mestre 261123) · Les guies públiques en Markdown (public/md, que la Wiki
     genera i que també lligen els agents per llms.txt) tampoc no poden prometre 10:1 del Mode Bancal. Una guia nova amb
     10:1 fa caure la prova; si un dia cal tolerar-ne una, s'anota a DEUTE_D_ALTRES_CARRILS amb nom i nombre de línies.
     v1.2.23 · costura K7 (ordre del Mestre 261123, T4) · El deute que hi havia, public/md/guia-pas-a-pas.md:32 («eleva el
     contrast real a 10:1 AAA»), ja està pagat: la font _wiki_de_poble/01_ser/guia_pas_a_pas.md diu «AAA (≥ 7:1)» i el
     «Mode Bancal», i public/md i src/data/wikiManifest.js s'han regenerat des d'ella. La llista queda buida i la guia,
     guardada com la resta. */
  const DEUTE_D_ALTRES_CARRILS = Object.freeze({});
  const CONTEXT_BANCAL = /Mode (?:S[eè]nior|Bancal)|Modo S[eé]nior|Senior Mode|Senior Modua|Lectura Gran/i;
  const PROMESA_10_1 = /(?<![\d,.])10:1(?!\d)/;

  function markdownsPublics(dir = resolve(process.cwd(), 'public/md'), eixida = []) {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const ruta = join(dir, ent.name);
      if (ent.isDirectory()) markdownsPublics(ruta, eixida);
      else if (ent.name.endsWith('.md')) eixida.push(ruta);
    }
    return eixida;
  }

  /* v1.2.23 · L3-02 (Gauntlet R1) · ARCHITECTURE.md (per a equips externs i auditories) prometia «>= 10:1 AAA» del
     «Mode Sènior / Lectura Gran»; també entra a l'escombrada, amb el README.md, i ha de dir el nom viu del mode. */
  test('cap guia pública en Markdown promet 10:1 del Mode Bancal, llevat del deute anotat d’un altre carril', () => {
    const fitxers = [...markdownsPublics(), resolve(process.cwd(), 'ARCHITECTURE.md'), resolve(process.cwd(), 'README.md')];
    expect(fitxers.length).toBeGreaterThan(12);
    const trobades = {};
    for (const ruta of fitxers) {
      const n = readFileSync(ruta, 'utf8').split('\n').filter((linia) => PROMESA_10_1.test(linia) && CONTEXT_BANCAL.test(linia)).length;
      if (n > 0) trobades[relative(process.cwd(), ruta)] = n;
    }
    expect(trobades, 'una guia nova amb 10:1 cau; una guia ja corregida es lleva de DEUTE_D_ALTRES_CARRILS').toEqual(DEUTE_D_ALTRES_CARRILS);

    const arquitectura = llig('ARCHITECTURE.md');
    expect(arquitectura).toContain('### 5.3 Mode Bancal (`data-sdp-senior="true"` + `data-contrast="bancal"`)');
    expect(arquitectura).toContain('**AAA (`>= 7:1`)**');
    expect(arquitectura).not.toMatch(/Mode S[eè]nior|Lectura Gran/);
  });
});
