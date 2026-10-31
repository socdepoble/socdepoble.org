/** Porta de contrast i de Pedra Seca de la vista Setmana (fase visual del
 *  calendari, prompt 261001_0445; front Setmana). Germana de
 *  tests/contrast_calendari_mes.test.mjs: resol fins als primitius, en clar i
 *  en fosc, cada parella de colors que pinta VistaSetmana i comprova WCAG AA:
 *  text ≥ 4,5:1 i senyals gràfics (cercle de hui, vora del triat, línia i punt
 *  d'«ara», vora d'inici dels blocs, punt de «té actes») ≥ 3:1. Les parelles
 *  de font es llegixen de les regles .sdp-cal-font--* de modules.css. També
 *  comprova com a text que les regles de la setmana fan servir eixes parelles,
 *  que la capçalera és enganxosa sense cap overflow a la superfície i que no hi
 *  ha cap hex, primitiu, ombra, scroll propi ni media query de viewport. Cap
 *  import relatiu: tot es resol des de l'arrel. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const llig = (ruta) => fs.readFileSync(path.join(ARREL, ruta), 'utf8');
const declaracions = (text) => Object.fromEntries([...text.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const escapa = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const tokens = llig('src/css/tokens.css');
const modules = llig('src/css/modules.css');
const iniciFosc = tokens.indexOf(':root[data-theme="dark"]');
assert(iniciFosc > 0, 'tokens.css no té el bloc fosc');
const clar = { ...declaracions(llig('src/css/design-tokens.css')), ...declaracions(tokens.slice(0, iniciFosc)) };
const TEMES = { clar, fosc: { ...clar, ...declaracions(tokens.slice(iniciFosc, tokens.indexOf('}', iniciFosc))) } };

/* El cos d'una regla de modules.css ({ propietat: valor }). */
function regla(selector) {
  const cos = new RegExp(`(?:^|\\n)\\s*${escapa(selector)}\\s*\\{([^{}]*)\\}`).exec(modules)?.[1];
  assert(cos, `falta la regla ${selector}`);
  return Object.fromEntries(cos.replace(/\/\*[\s\S]*?\*\//g, '').split(';').map((part) => /^\s*([\w-]+)\s*:\s*(.+)$/s.exec(part.trim())).filter(Boolean).map((m) => [m[1], m[2].trim()]));
}

const FONTS = ['esdeveniment', 'publicacio', 'producte', 'pagina', 'agenda'];
const cosAlies = /\{([^{}]*--cal-hui-fons\s*:[^{}]*)\}/.exec(modules)?.[1];
assert(cosAlies, 'modules.css no declara els àlies --cal-*');
const ALIES = declaracions(cosAlies);
const deFont = (font) => regla(`.sdp-cal-font--${font}`);

function resol(valor, mapa, vistos = new Set()) {
  return valor.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    assert(!vistos.has(nom), `cicle a ${nom}`);
    assert(mapa[nom], `falta ${nom}`);
    return resol(mapa[nom], mapa, new Set([...vistos, nom]));
  }).trim();
}
function luminancia(hex) {
  assert.match(hex, /^#[0-9a-f]{6}$/i, `no és un color opac: ${hex}`);
  const [r, g, b] = hex.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255).map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b, mapa) {
  const [la, lb] = [luminancia(resol(a, mapa)), luminancia(resol(b, mapa))];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* Les superfícies d'un botó de dia: la targeta, el dia triat i el hover. */
const SUPERFICIES = ['var(--sdp-fons-targeta)', 'var(--sdp-accio-subtil)', 'var(--sdp-fons-subtil)'];

for (const [tema, mapaTema] of Object.entries(TEMES)) {
  const mapa = { ...mapaTema, ...ALIES };

  test(`${tema}: el text de cada bloc i de cada barra sobre el seu fons passa de 4,5:1`, (t) => {
    for (const font of FONTS) {
      const r = contrast('var(--cal-bloc-text)', 'var(--cal-bloc-fons)', { ...mapa, ...deFont(font) });
      t.diagnostic(`${tema} · bloc ${font}: ${r.toFixed(2)}:1`);
      assert(r >= 4.5, `${font}: ${r.toFixed(2)}:1`);
    }
  });

  test(`${tema}: la vora d'inici de cada bloc es distingix de la targeta (≥ 3:1)`, (t) => {
    for (const font of FONTS) {
      const r = contrast('var(--cal-bloc-vora)', 'var(--sdp-fons-targeta)', { ...mapa, ...deFont(font) });
      t.diagnostic(`${tema} · vora ${font}: ${r.toFixed(2)}:1`);
      assert(r >= 3, `${font}: ${r.toFixed(2)}:1`);
    }
  });

  test(`${tema}: abreviatures, números i etiquetes d'hora sobre la targeta, el triat i el hover passen de 4,5:1`, (t) => {
    for (const text of ['var(--sdp-text-titol)', 'var(--sdp-text-suau)']) {
      for (const fons of SUPERFICIES) {
        const r = contrast(text, fons, mapa);
        t.diagnostic(`${tema} · ${text} sobre ${fons}: ${r.toFixed(2)}:1`);
        assert(r >= 4.5, `${text} sobre ${fons}: ${r.toFixed(2)}:1`);
      }
    }
  });

  test(`${tema}: el cercle de hui (número ≥ 4,5:1) es distingix de la targeta i del triat (≥ 3:1)`, (t) => {
    const numero = contrast('var(--cal-hui-text)', 'var(--cal-hui-fons)', mapa);
    const [targeta, triat] = ['var(--sdp-fons-targeta)', 'var(--sdp-accio-subtil)'].map((fons) => contrast('var(--cal-hui-fons)', fons, mapa));
    t.diagnostic(`${tema} · hui: número ${numero.toFixed(2)}:1, cercle sobre la targeta ${targeta.toFixed(2)}:1, sobre el triat ${triat.toFixed(2)}:1`);
    assert(numero >= 4.5 && targeta >= 3 && triat >= 3);
  });

  test(`${tema}: la vora del dia triat es distingix de la targeta (≥ 3:1)`, (t) => {
    const vora = regla('.sdp-cal-dia[aria-pressed="true"]')['border-color'];
    const r = contrast(vora, 'var(--sdp-fons-targeta)', mapa);
    t.diagnostic(`${tema} · vora del triat (${vora}): ${r.toFixed(2)}:1`);
    assert(r >= 3, `${vora}: ${r.toFixed(2)}:1`);
  });

  test(`${tema}: la línia i el punt d'«ara» es distingixen de la targeta i del fons de cada bloc (≥ 3:1)`, (t) => {
    const targeta = contrast('var(--cal-ara)', 'var(--sdp-fons-targeta)', mapa);
    t.diagnostic(`${tema} · ara sobre la targeta: ${targeta.toFixed(2)}:1`);
    assert(targeta >= 3);
    for (const font of FONTS) {
      const r = contrast('var(--cal-ara)', 'var(--cal-bloc-fons)', { ...mapa, ...deFont(font) });
      t.diagnostic(`${tema} · ara sobre el bloc ${font}: ${r.toFixed(2)}:1`);
      assert(r >= 3, `${font}: ${r.toFixed(2)}:1`);
    }
  });

  test(`${tema}: el punt de «té actes» de la tira es distingix de les tres superfícies (≥ 3:1)`, (t) => {
    const punt = regla('.sdp-cal-dia__punt--ple').background;
    for (const fons of SUPERFICIES) {
      const r = contrast(punt, fons, mapa);
      t.diagnostic(`${tema} · punt sobre ${fons}: ${r.toFixed(2)}:1`);
      assert(r >= 3, `${fons}: ${r.toFixed(2)}:1`);
    }
  });
}

test('les regles de la setmana pinten amb eixes parelles', () => {
  assert.equal(regla('.sdp-cal-setmana').background, 'var(--sdp-fons-targeta)');
  const bloc = regla('.sdp-cal-setmana__bloc');
  assert.deepEqual([bloc.background, bloc.color], ['var(--cal-bloc-fons)', 'var(--cal-bloc-text)']);
  assert.equal(bloc['border-inline-start'], 'var(--sdp-space-1) solid var(--cal-bloc-vora)');
  assert.deepEqual([regla('.sdp-cal-barra').background, regla('.sdp-cal-barra').color], ['var(--cal-bloc-fons)', 'var(--cal-bloc-text)']);
  const hui = regla('.sdp-cal-setmana .sdp-cal-dia[aria-current="date"] .sdp-cal-dia__numero');
  assert.deepEqual([hui.background, hui.color], ['var(--cal-hui-fons)', 'var(--cal-hui-text)']);
  assert.equal(regla('.sdp-cal-setmana .sdp-cal-dia__numero').color, 'var(--sdp-text-titol)');
  assert.equal(regla('.sdp-cal-dia[aria-pressed="true"]').background, 'var(--sdp-accio-subtil)');
  assert.equal(regla('.sdp-cal-setmana__rotul').color, 'var(--sdp-text-suau)');
  assert.equal(regla('.sdp-cal-setmana__ara').background, 'var(--cal-ara)');
  assert.equal(regla('.sdp-cal-setmana__ara::before').background, 'var(--cal-ara)');
});

test('la capçalera és enganxosa i quadrada; la superfície retalla els cantons amb overflow: clip, que no fa contenidor de scroll', () => {
  const capcal = regla('.sdp-cal-setmana__capcal');
  assert.equal(capcal.position, 'sticky');
  assert.equal(capcal['inset-block-start'], 'var(--cal-sostre)');
  assert.equal(capcal.background, 'var(--sdp-fons-targeta)');
  // Enganxada, uns cantons arredonits deixarien veure el que passa per davall.
  assert.equal(Object.keys(capcal).some((p) => p.includes('radius')), false, 'la capçalera no porta radi');
  const superficie = regla('.sdp-cal-setmana');
  assert.equal(superficie.overflow, 'clip');
  assert.equal(superficie['border-radius'], 'var(--sdp-radi-m)');
  // Cap altra propietat overflow*: hidden, auto o scroll farien un contenidor de scroll i trencarien el sticky.
  assert.deepEqual(Object.keys(superficie).filter((p) => p.startsWith('overflow')), ['overflow']);
  for (const selector of ['.sdp-cal-setmana__capcal', '.sdp-cal-setmana__graella', '.sdp-cal-setmana__franja']) {
    assert.equal(Object.keys(regla(selector)).some((p) => p.startsWith('overflow')), false, selector);
  }
});

test('l’interval del bloc mai es parteix i el títol no encongix per davall de les seues línies (en el curt, sí, en amplada)', () => {
  const quan = regla('.sdp-cal-setmana__quan');
  assert.deepEqual([quan['white-space'], quan.overflow, quan['text-overflow'], quan.flex], ['nowrap', 'hidden', 'ellipsis', 'none']);
  assert.equal(regla('.sdp-cal-setmana__titol')['flex-shrink'], '0');
  assert.equal(regla('.sdp-cal-setmana__bloc--curt .sdp-cal-setmana__titol').flex, '1 1 auto');
});

test('la tira: cap pista de la capçalera baixa de --sdp-touch (per davall de 7 × 44px, el darrer dia passa a una altra fila)', () => {
  const tira = regla('.sdp-cal-setmana--tira .sdp-cal-setmana__capcal');
  assert.equal(tira['grid-template-columns'], 'repeat(auto-fit, minmax(var(--sdp-touch), 1fr))');
});

/* D2 (ordre del Mestre, 261004), modules.css: la barra taronja universal es
   conserva a tots els amples; T38 s'ha revertit a components.css. */
test('el sostre del sticky conserva les dues barres a tots els amples; en pantalla completa és zero', () => {
  assert.equal(regla('.sdp-cal-setmana')['--cal-sostre'], 'calc(var(--sdp-alt-accio) * 2)');
  assert.equal(regla('.sdp-pantalla-completa .sdp-cal-setmana.sdp-cal-setmana')['--cal-sostre'], '0px');
  assert.doesNotMatch(modules, /\.sdp-especimen \.sdp-cal-setmana\s*\{/);
  const components = llig('src/css/components.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(components, /\.sdp-universal-page-container\s*>\s*section\.bar-orange\s*\{[^}]*display:\s*none/);
});

test('Pedra Seca a les regles del dia i de la setmana: cap hex ni primitiu, radis de l’escala, espais de 0,25rem, cap ombra, scroll ni media query de viewport', () => {
  const inici = modules.indexOf('/* El dia: la capçalera de la setmana');
  const fi = modules.indexOf('/* Mes i 2 setmanes (VistaMes).', inici);
  assert(inici > 0 && fi > inici, 'no trobe les regles del dia i de la setmana');
  const text = modules.slice(inici, fi).replace(/\/\*[\s\S]*?\*\//g, '');
  const dolents = [];
  if (/#[0-9a-f]{3,8}\b/i.test(text)) dolents.push('hex');
  if (/--sdp-(pedra|primary|secondary|exit|error|avis)-\d/.test(text)) dolents.push('primitiu');
  if (/box-shadow|:has\(|@container|subgrid|overflow[\w-]*\s*:\s*(auto|scroll)/.test(text)) dolents.push('ombra, :has(), @container, subgrid o scroll');
  if (/@media\s*\(\s*(max|min)-(width|height)/.test(text)) dolents.push('media query de viewport');
  for (const [, valor] of text.matchAll(/border(?:-[\w-]+)?-radius\s*:\s*([^;]+);/g)) {
    if (!/^(0|var\(--sdp-radi-[\w-]+\))$/.test(valor.trim())) dolents.push(`radi ${valor.trim()}`);
  }
  for (const [, prop, valor] of text.matchAll(/((?:margin|padding|gap|row-gap|column-gap)[\w-]*)\s*:\s*([^;]+);/g)) {
    for (const [, n, unitat] of valor.matchAll(/(\d*\.?\d+)(rem|px|em)\b/g)) {
      if (unitat !== 'rem' || Math.abs(Number(n) / 0.25 - Math.round(Number(n) / 0.25)) > 1e-9) dolents.push(`${prop}: ${valor.trim()}`);
    }
  }
  assert.deepEqual(dolents, []);
});
