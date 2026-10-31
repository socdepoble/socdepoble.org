/** Porta de contrast i de Pedra Seca de la vista Mes (fase visual del
 *  calendari, prompt 261001_0445; front Mes i 2 setmanes). Resol fins als
 *  primitius, en clar i en fosc, cada parella de colors que pinta VistaMes i
 *  comprova WCAG AA: text ≥ 4,5:1 i senyals gràfics (punts, tires, la vora
 *  del triat i l'anell de focus) ≥ 3:1 sobre la cel·la, la triada i el
 *  hover. Les parelles de
 *  font es llegixen de les regles .sdp-cal-font--* de modules.css: si algú en
 *  canvia una, la porta ho torna a mesurar. També comprova com a text que les
 *  regles del mes fan servir eixes parelles i cap hex, primitiu, ombra ni
 *  scroll propi. Cap import relatiu: tot es resol des de l'arrel. */
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
  return Object.fromEntries(cos.split(';').map((part) => /^\s*([\w-]+)\s*:\s*(.+)$/s.exec(part.trim())).filter(Boolean).map((m) => [m[1], m[2].trim()]));
}

const FONTS = ['esdeveniment', 'publicacio', 'producte', 'pagina', 'agenda'];
/* Els àlies de color de les vistes (--cal-hui-*, --cal-bloc-* per defecte…): la regla que declara --cal-hui-fons. */
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

/* Les superfícies d'una cel·la del mes: la targeta, el dia triat i el hover. */
const SUPERFICIES = ['var(--sdp-fons-targeta)', 'var(--sdp-accio-subtil)', 'var(--sdp-fons-subtil)'];

for (const [tema, mapaTema] of Object.entries(TEMES)) {
  const mapa = { ...mapaTema, ...ALIES };

  test(`${tema}: el text de cada barra sobre el seu fons passa de 4,5:1`, (t) => {
    for (const font of FONTS) {
      const m = { ...mapa, ...deFont(font) };
      const r = contrast('var(--cal-bloc-text)', 'var(--cal-bloc-fons)', m);
      t.diagnostic(`${tema} · barra ${font}: ${r.toFixed(2)}:1`);
      assert(r >= 4.5, `${font}: ${r.toFixed(2)}:1`);
    }
  });

  test(`${tema}: números, línies d'acte, «+N» i abreviatures sobre la cel·la, la triada i el hover passen de 4,5:1`, (t) => {
    for (const text of ['var(--sdp-text-cos)', 'var(--sdp-text-suau)']) {
      for (const fons of SUPERFICIES) {
        const r = contrast(text, fons, mapa);
        t.diagnostic(`${tema} · ${text} sobre ${fons}: ${r.toFixed(2)}:1`);
        assert(r >= 4.5, `${text} sobre ${fons}: ${r.toFixed(2)}:1`);
      }
    }
  });

  test(`${tema}: el cercle de hui (número sobre el cercle) passa de 4,5:1 i el cercle es distingix de la cel·la`, (t) => {
    const numero = contrast('var(--cal-hui-text)', 'var(--cal-hui-fons)', mapa);
    const cercle = contrast('var(--cal-hui-fons)', 'var(--sdp-fons-targeta)', mapa);
    t.diagnostic(`${tema} · hui: número ${numero.toFixed(2)}:1, cercle ${cercle.toFixed(2)}:1`);
    assert(numero >= 4.5 && cercle >= 3);
  });

  /* El fons triat (--sdp-accio-subtil) quasi no es distingix de la targeta en
     fosc: l'estat el porta la vora, que ha de passar de 3:1 tota sola. */
  test(`${tema}: la vora del dia triat es distingix de la cel·la (≥ 3:1)`, (t) => {
    const vora = regla('.sdp-cal-dia[aria-pressed="true"]')['border-color'];
    const r = contrast(vora, 'var(--sdp-fons-targeta)', mapa);
    const fons = contrast('var(--sdp-accio-subtil)', 'var(--sdp-fons-targeta)', mapa);
    t.diagnostic(`${tema} · vora del dia triat (${vora}): ${r.toFixed(2)}:1; fons triat: ${fons.toFixed(2)}:1`);
    assert(r >= 3, `${vora}: ${r.toFixed(2)}:1`);
  });

  /* Revisió de la fase visual · El punt dels dos modes i la tira del compacte
     pinten amb el color del text de la font: el punt és l'únic senyal de la
     font de l'acte (l'hora i el títol no la diuen), i ha de passar de 3:1 en
     els tres estats reals de la cel·la, no només en repòs. L'anell i el
     contorn de l'agenda, també. */
  test(`${tema}: punts i tires (color del text de la font) passen de 3:1 sobre la cel·la, la triada i el hover`, (t) => {
    for (const font of FONTS) {
      const m = { ...mapa, ...deFont(font) };
      for (const fons of SUPERFICIES) {
        const r = contrast('var(--cal-bloc-text)', fons, m);
        t.diagnostic(`${tema} · punt i tira ${font} sobre ${fons}: ${r.toFixed(2)}:1`);
        assert(r >= 3, `${font} sobre ${fons}: ${r.toFixed(2)}:1`);
      }
    }
  });

  /* Revisió de la fase visual · En clar, --sdp-focus i la vora del triat eren
     el mateix blau: el focus quedava amagat damunt del dia triat. El focus del
     mes ha de tindre un altre color, anar dins de la vora del dia (no la tapa)
     i passar de 3:1 sobre les tres superfícies. */
  test(`${tema}: el focus del dia es distingix del dia triat: un altre color, dins de la vora, ≥ 3:1`, (t) => {
    const focus = regla('.sdp-cal-mes .sdp-cal-dia:focus-visible');
    const triat = regla('.sdp-cal-dia[aria-pressed="true"]')['border-color'];
    const [, gruix, color] = /^(\d+)px solid (var\(--[\w-]+\))$/.exec(focus.outline) ?? [];
    assert(color, `anell inesperat: ${focus.outline}`);
    const vora = Number.parseInt(regla('.sdp-cal-dia').border, 10);
    assert.equal(Number.parseInt(focus['outline-offset'], 10), -(vora + Number(gruix)), 'l’anell ha d’anar just dins de la vora del dia');
    assert.notEqual(resol(color, mapa), resol(triat, mapa), 'el focus i el dia triat tenen el mateix color');
    t.diagnostic(`${tema} · focus (${color}) contra la vora del triat: ${contrast(color, triat, mapa).toFixed(2)}:1`);
    for (const fons of SUPERFICIES) {
      const r = contrast(color, fons, mapa);
      t.diagnostic(`${tema} · focus sobre ${fons}: ${r.toFixed(2)}:1`);
      assert(r >= 3, `focus sobre ${fons}: ${r.toFixed(2)}:1`);
    }
  });
}

/* La barra i el dia triat del mes els pinta la base compartida (.sdp-cal-barra,
   .sdp-cal-dia): si algú la canvia, el mes canvia i esta porta ho diu. */
test('les regles del mes pinten amb eixes parelles', () => {
  assert.equal(regla('.sdp-cal-mes').background, 'var(--sdp-fons-targeta)');
  assert.deepEqual(
    [regla('.sdp-cal-barra').background, regla('.sdp-cal-barra').color],
    ['var(--cal-bloc-fons)', 'var(--cal-bloc-text)']
  );
  assert.equal(regla('.sdp-cal-barra--punt').background, 'transparent');
  assert.equal(regla('.sdp-cal-mes .sdp-cal-barra--punt').color, 'var(--sdp-text-cos)');
  assert.equal(regla('.sdp-cal-dia[aria-pressed="true"]').background, 'var(--sdp-accio-subtil)');
  // El punt (els dos modes) i la tira del compacte, plens amb el color del text de la font.
  assert.equal(regla('.sdp-cal-mes__punt').background, 'var(--cal-bloc-text)');
  assert.equal(regla('.sdp-cal-mes--compacte .sdp-cal-barra').background, 'var(--cal-bloc-text)');
  assert.equal(regla('.sdp-cal-mes--compacte .sdp-cal-mes__punt').background, undefined);
  // L'agenda comparteix el color de la publicació (text de cos): la distingix la forma, anell i contorn.
  assert.equal(deFont('agenda')['--cal-bloc-text'], deFont('publicacio')['--cal-bloc-text']);
  for (const selector of ['.sdp-cal-font--agenda .sdp-cal-mes__punt', '.sdp-cal-mes--compacte .sdp-cal-barra.sdp-cal-font--agenda:not(.sdp-cal-barra--punt)']) {
    const r = regla(selector);
    assert.deepEqual([r.border, r.background], ['2px solid var(--cal-bloc-text)', 'transparent'], selector);
  }
  const hui = regla('.sdp-cal-mes .sdp-cal-dia[aria-current="date"] .sdp-cal-dia__numero');
  assert.deepEqual([hui.background, hui.color], ['var(--cal-hui-fons)', 'var(--cal-hui-text)']);
  assert.equal(regla('.sdp-cal-dia--fora').color, 'var(--sdp-text-suau)');
});

/* Onada 6 (prompt 261009_0230, punt 1; pla de l'Onada 5, tasca 16) · L'enllaç
   de cada esdeveniment hereta el color i la lletra de la seua peça: cap
   parella de colors nova que mesurar (les d'amunt ja ho són). Al Mes i a la
   Setmana només es pot clicar amb ratolí: les peces fan 24px i en tàctil
   (Pedra Seca §6) el toc passa al dia. A l'Agenda, que no tria cap dia, la
   fila fa --sdp-touch en tàctil i el toc és de l'enllaç. */
test('Onada 6 · l’enllaç de l’esdeveniment hereta el color, cobrix la peça i en tàctil només el toca l’Agenda, de --sdp-touch', () => {
  const enllac = regla('.sdp-cal-enllac');
  assert.deepEqual([enllac.color, enllac['text-decoration'], enllac['pointer-events']], ['inherit', 'none', 'none']);
  assert.deepEqual([regla('.sdp-cal-enllac::after').position, regla('.sdp-cal-enllac::after').inset], ['absolute', '0']);
  const posicionades = /(?:^|\n)\s*\.sdp-cal-barra--enllac,\s*\.sdp-cal-agenda__acte--enllac\s*\{([^{}]*)\}/.exec(modules)?.[1] ?? '';
  assert.match(posicionades, /position:\s*relative/);
  const ratoli = /@media \(pointer: fine\) \{\s*\.sdp-cal-enllac \{([^{}]*)\}/.exec(modules)?.[1] ?? '';
  assert.match(ratoli, /pointer-events:\s*auto/);
  // El subratllat, amb la guarda de ratolí de tot :hover (modules.abast.capes.test.js, Fase B).
  assert.match(modules, /@media \(hover: hover\) and \(pointer: fine\) \{\s*\.sdp-cal-enllac:hover \{[^{}]*text-decoration:\s*underline/);
  // Revisió · L'Agenda no tria cap dia: en tàctil la fila fa --sdp-touch i el toc és de l'enllaç.
  const tactil = /@media \(pointer: coarse\) \{\s*\.sdp-cal-agenda__acte \{([^{}]*)\}\s*\.sdp-cal-agenda__acte--enllac \.sdp-cal-enllac \{([^{}]*)\}/.exec(modules);
  assert(tactil, 'no trobe la regla tàctil de l’Agenda');
  assert.match(tactil[1], /min-block-size:\s*var\(--sdp-touch\)/);
  assert.match(tactil[2], /pointer-events:\s*auto/);
  // Fora d'eixos dos blocs, cap regla torna a encendre el punter de l'enllaç (el Mes i la Setmana, en tàctil, passen el toc al dia).
  const encenen = [...modules.matchAll(/[{}]([^{}]*\.sdp-cal-enllac[^{}]*)\{[^{}]*pointer-events:\s*auto/g)].map(([, prelud]) => prelud.trim().replace(/\s+/g, ' '));
  assert.deepEqual(encenen, ['.sdp-cal-enllac', '.sdp-cal-agenda__acte--enllac .sdp-cal-enllac']);
  // La capa del mes continua sense rebre el clic: el rep el dia de davall.
  assert.match(modules, /\.sdp-cal-mes__barres \{[^{}]*pointer-events:\s*none/);
});

test('Pedra Seca a les regles del mes: cap hex ni primitiu, radis de l’escala, espais de 0,25rem, cap ombra ni scroll', () => {
  const inici = modules.indexOf('/* Mes i 2 setmanes (VistaMes).');
  const fi = modules.indexOf('.sdp-cal-mes--compacte .sdp-cal-mes__punt', inici);
  assert(inici > 0 && fi > inici, 'no trobe les regles del mes');
  const text = modules.slice(inici, modules.indexOf('}', fi) + 1).replace(/\/\*[\s\S]*?\*\//g, '');
  const dolents = [];
  if (/#[0-9a-f]{3,8}\b/i.test(text)) dolents.push('hex');
  if (/--sdp-(pedra|primary|secondary|exit|error|avis)-\d/.test(text)) dolents.push('primitiu');
  if (/box-shadow|:has\(|@container|subgrid|overflow[\w-]*\s*:\s*(auto|scroll)/.test(text)) dolents.push('ombra, :has(), @container, subgrid o scroll');
  if (/@media\s*\(\s*(max|min)-width/.test(text)) dolents.push('media query de viewport');
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
