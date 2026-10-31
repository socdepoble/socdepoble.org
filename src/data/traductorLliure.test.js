/**
 * Proves del transport lliure d'Apertium des del navegador (IDEA-31,
 * ampliació del Mestre 261030): data/traductorLliure.js. Cap xarxa real: el
 * fetch és fals i el rellotge de la sessió s'injecta.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  APERTIUM_BETA, APERTIUM_RESERVA, LIMITS_LLIURE, LIMITS_MYMEMORY, MOTORS_TRADUCCIO, MYMEMORY, buidaSessioLliure,
  creaTraductorApertium, fixaTraductorLliure, partixPerBytes, traductorLliureDelLloc
} from './traductorLliure.js';
import { CODI_TRADUCCIO, LIMITS_TRADUCCIO, LLENGUES_TRADUCCIO, bytesDe, tradueixTot } from './traductor.js';

const resposta = (status, cos) => ({ status, ok: status >= 200 && status < 300, json: async () => cos });
const bona = (cos) => resposta(200, {
  responseData: { translatedText: `${cos.get('langpair').split('|')[1]}:${cos.get('q')}` }, responseDetails: null, responseStatus: 200
});
/* La forma d'una resposta bona de MyMemory (mesura real del 261030): la
   traducció del motor és l'entrada «MT!» de `matches`, amb el segment enviat.
   `ambMotor` la fa per a qualsevol `translatedText` (cicle 2: només val eixa). */
const ambMotor = (cos, q) => ({
  ...cos,
  matches: [{ id: 0, segment: q, translation: cos.responseData.translatedText, 'created-by': 'MT!', match: 0.85, reference: 'Machine Translation.' }],
});
const bonaMyMemory = (parametres) => ambMotor({
  responseData: { translatedText: `${parametres.get('langpair').split('|')[1]}:${parametres.get('q')}`, match: 0.85 },
  quotaFinished: false, responseDetails: '', responseStatus: 200,
}, parametres.get('q'));

/* Doble dels serveis: `fail` fa caure un extrem ('xarxa' o un estat HTTP);
   `cos` és la resposta d'Apertium i `mymemory(parametres)`, la de MyMemory. */
function falsFetch({ fail = {}, cos, mymemory } = {}) {
  const crides = [];
  const fetch = vi.fn(async (url, opcions) => {
    const deMyMemory = String(url).startsWith(`${MYMEMORY}?`);
    const parametres = deMyMemory ? new URL(url).searchParams : opcions.body;
    const base = deMyMemory ? MYMEMORY : url;
    crides.push({ url: base, opcions, q: parametres.get('q'), langpair: parametres.get('langpair'), completa: url });
    const falla = fail[base];
    if (falla === 'xarxa') throw new TypeError('Failed to fetch');
    if (typeof falla === 'number') return resposta(falla, {});
    if (deMyMemory) return resposta(200, mymemory ? mymemory(parametres) : bonaMyMemory(parametres));
    return cos ? resposta(200, cos) : bona(opcions.body);
  });
  return { fetch, crides };
}

const rellotge = { t: 0 };
const ara = () => rellotge.t;
const amb = (opcions, limits, limitsMyMemory) => {
  const doble = falsFetch(opcions);
  return {
    ...doble,
    traductor: creaTraductorApertium({ fetch: doble.fetch, ara, ...(limits ? { limits } : {}), ...(limitsMyMemory ? { limitsMyMemory } : {}) })
  };
};
const errorDe = (promesa) => promesa.then(() => null, (error) => error);

beforeEach(() => {
  buidaSessioLliure();
  rellotge.t = Date.UTC(2026, 9, 30, 0, 0, 0);
});
afterEach(() => fixaTraductorLliure(null));

test('beta primer: parells cat|spa, cat|eng i cat|fra en formulari, sense galetes, referent ni capçaleres pròpies; la reserva no es toca', async () => {
  const { traductor, crides } = amb();
  expect(traductor.disponible).toBe(true);
  expect(await traductor.tradueix(['Bon dia', 'Poble'], 'ES')).toEqual({ traduccions: ['spa:Bon dia', 'spa:Poble'], desti: 'ES', cache: false });
  expect((await traductor.tradueix(['Bon dia'], 'EN-GB')).traduccions).toEqual(['eng:Bon dia']);
  expect((await traductor.tradueix(['Bon dia'], 'FR')).traduccions).toEqual(['fra:Bon dia']);
  expect(crides.map((c) => [c.url, c.opcions.body.get('langpair'), c.q])).toEqual([
    [APERTIUM_BETA, 'cat|spa', 'Bon dia'], [APERTIUM_BETA, 'cat|spa', 'Poble'], [APERTIUM_BETA, 'cat|eng', 'Bon dia'], [APERTIUM_BETA, 'cat|fra', 'Bon dia']
  ]);
  for (const { opcions } of crides) {
    expect(opcions).toMatchObject({ method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', mode: 'cors', cache: 'no-store', redirect: 'error' });
    expect(opcions.body).toBeInstanceOf(URLSearchParams);
    expect(opcions.body.get('markUnknown')).toBe('no');
    // C6 (Codex 261030): l'APy, sense format, desformata com a HTML.
    expect(opcions.body.get('format')).toBe('txt');
    expect(opcions.headers).toBeUndefined();
    expect(opcions.signal).toBeInstanceOf(AbortSignal);
  }
  const html = amb();
  await html.traductor.tradueix(['<p>Bon dia</p>'], 'ES', { format: 'html' });
  expect(html.crides[0].opcions.body.get('format')).toBe('html');
});

/* Decisió del Mestre (261030 00:40): la reserva només quan la beta cau, i
   cada text torna a provar primer la beta (la reserva escriu errors hui). */
test('beta caiguda (5xx o xarxa) → reserva apertium.org; el text següent torna a provar primer la beta', async () => {
  for (const falla of [500, 503, 'xarxa']) {
    buidaSessioLliure();
    const { traductor, crides } = amb({ fail: { [APERTIUM_BETA]: falla } });
    expect((await traductor.tradueix(['Bon dia'], 'ES')).traduccions).toEqual(['spa:Bon dia']);
    expect(crides.map((c) => c.url)).toEqual([APERTIUM_BETA, APERTIUM_RESERVA]);
    await traductor.tradueix(['Nit'], 'ES');
    expect(crides.slice(2).map((c) => c.url)).toEqual([APERTIUM_BETA, APERTIUM_RESERVA]);
  }
  buidaSessioLliure();
  const { traductor, crides } = amb();
  await traductor.tradueix(['Altra', 'Una més'], 'ES');
  expect(crides.map((c) => c.url)).toEqual([APERTIUM_BETA, APERTIUM_BETA]);
});

test('tots dos extrems caiguts: xarxa → INABASTABLE, 5xx → SERVIDOR amb l’estat; res a la cache', async () => {
  const xarxa = amb({ fail: { [APERTIUM_BETA]: 'xarxa', [APERTIUM_RESERVA]: 'xarxa' } });
  expect(await errorDe(xarxa.traductor.tradueix(['Bon dia'], 'ES'))).toMatchObject({ codi: CODI_TRADUCCIO.INABASTABLE, status: 0 });
  expect(xarxa.crides.map((c) => c.url)).toEqual([APERTIUM_BETA, APERTIUM_RESERVA]);
  buidaSessioLliure();
  const errors = amb({ fail: { [APERTIUM_BETA]: 502, [APERTIUM_RESERVA]: 500 } });
  expect(await errorDe(errors.traductor.tradueix(['Bon dia'], 'ES'))).toMatchObject({ codi: CODI_TRADUCCIO.SERVIDOR, status: 500 });
  buidaSessioLliure();
  const bo = amb();
  await bo.traductor.tradueix(['Bon dia'], 'ES');
  expect(bo.crides).toHaveLength(1);
});

test('un 4xx no canvia d’extrem; 429 i 403 paren la sessió 60 s sense cap crida (429 amb el codi del límit)', async () => {
  const refusat = amb({ fail: { [APERTIUM_BETA]: 400 } });
  expect(await errorDe(refusat.traductor.tradueix(['Bon dia'], 'ES'))).toMatchObject({ codi: CODI_TRADUCCIO.SERVIDOR, status: 400 });
  expect(refusat.crides.map((c) => c.url)).toEqual([APERTIUM_BETA]);
  for (const [estat, codiServidor] of [[429, 'sdp_traduccio_limit'], [403, null]]) {
    buidaSessioLliure();
    const limitat = amb({ fail: { [APERTIUM_BETA]: estat } });
    expect(await errorDe(limitat.traductor.tradueix(['Bon dia'], 'ES'))).toMatchObject({ codi: CODI_TRADUCCIO.SERVIDOR, status: estat, codiServidor });
    expect(await errorDe(limitat.traductor.tradueix(['Nit'], 'ES'))).toMatchObject({ codiServidor: 'sdp_traduccio_limit' });
    expect(limitat.crides).toHaveLength(1);
    rellotge.t += LIMITS_LLIURE.pausa + 1;
    await errorDe(limitat.traductor.tradueix(['Nit'], 'ES'));
    expect(limitat.crides).toHaveLength(2);
  }
});

test('resposta malformada o buida: RESPOSTA_INVALIDA i res a la cache', async () => {
  for (const cos of [{ responseStatus: 200 }, { responseStatus: 400, responseData: { translatedText: 'x' } },
    { responseStatus: '200', responseData: { translatedText: 'x' } }, { responseStatus: 200, responseData: { translatedText: '' } },
    { responseStatus: 200, responseData: { translatedText: 5 } }, { responseStatus: 200, responseData: 'x' }]) {
    buidaSessioLliure();
    const { traductor } = amb({ cos });
    expect(await errorDe(traductor.tradueix(['Bon dia'], 'ES'))).toMatchObject({ codi: CODI_TRADUCCIO.RESPOSTA_INVALIDA });
    const segona = amb();
    expect((await segona.traductor.tradueix(['Bon dia'], 'ES')).cache).toBe(false);
  }
  const senseJson = creaTraductorApertium({ fetch: async () => ({ status: 200, ok: true, json: async () => { throw new SyntaxError('no és JSON'); } }) });
  expect(await errorDe(senseJson.tradueix(['Nit'], 'ES'))).toMatchObject({ codi: CODI_TRADUCCIO.RESPOSTA_INVALIDA });
});

test('límits i contracte de creaTraductor: cap crida fora dels límits; l’HTML no va a MyMemory', async () => {
  const { traductor, crides } = amb();
  const casos = [
    [[Array(51).fill('a'), 'ES'], CODI_TRADUCCIO.PETICIO_INVALIDA], [[[], 'ES'], CODI_TRADUCCIO.PETICIO_INVALIDA],
    [['Bon dia', 'ES'], CODI_TRADUCCIO.PETICIO_INVALIDA], [[[1], 'ES'], CODI_TRADUCCIO.PETICIO_INVALIDA],
    [[['Bon dia'], 'ZZ'], CODI_TRADUCCIO.PETICIO_INVALIDA], [[['Bon dia'], 'ES', { format: 'xml' }], CODI_TRADUCCIO.PETICIO_INVALIDA],
    [[[' ', ''], 'ES'], CODI_TRADUCCIO.PETICIO_INVALIDA], [[['é'.repeat(LIMITS_TRADUCCIO.caracters + 1)], 'ES'], CODI_TRADUCCIO.MASSA_LLARGA],
    [[['€'.repeat(5000), '€'.repeat(1700)], 'ES'], CODI_TRADUCCIO.MASSA_LLARGA],
    [[['<p>Bon dia</p>'], 'DE', { format: 'html' }], CODI_TRADUCCIO.NO_DISPONIBLE],
    [[['<p>Bon dia</p>'], 'EU', { format: 'html' }], CODI_TRADUCCIO.NO_DISPONIBLE]
  ];
  for (const [args, codi] of casos) expect([JSON.stringify(args).slice(0, 40), (await errorDe(traductor.tradueix(...args)))?.codi]).toEqual([JSON.stringify(args).slice(0, 40), codi]);
  expect(crides).toHaveLength(0);
  const senseFetch = creaTraductorApertium({ fetch: undefined });
  expect(senseFetch.disponible).toBe(typeof globalThis.fetch === 'function');
});

test('memòria cau de la sessió: una crida per text distint, buits tal qual, i cache:true sense crides', async () => {
  const { traductor, crides } = amb();
  expect((await traductor.tradueix(['Bon dia', '', 'Poble', 'Bon dia', '  '], 'ES')).traduccions).toEqual(['spa:Bon dia', '', 'spa:Poble', 'spa:Bon dia', '  ']);
  expect(crides.map((c) => c.q)).toEqual(['Bon dia', 'Poble']);
  expect(await traductor.tradueix(['Poble', 'Bon dia'], 'ES')).toEqual({ traduccions: ['spa:Poble', 'spa:Bon dia'], desti: 'ES', cache: true });
  const altra = amb();
  expect((await altra.traductor.tradueix(['Poble'], 'ES')).cache).toBe(true);
  await altra.traductor.tradueix(['Poble'], 'FR');
  await altra.traductor.tradueix(['Poble'], 'ES', { format: 'html' });
  expect(altra.crides).toHaveLength(2);
});

test('com a molt 2 crides alhora per no castigar el servei públic', async () => {
  let enVol = 0;
  let maxim = 0;
  const traductor = creaTraductorApertium({ ara, fetch: async (url, { body }) => {
    enVol += 1;
    maxim = Math.max(maxim, enVol);
    await new Promise((resolve) => setTimeout(resolve, 5));
    enVol -= 1;
    return bona(body);
  } });
  const textos = Array.from({ length: 7 }, (_, i) => `text ${i}`);
  expect((await traductor.tradueix(textos, 'ES')).traduccions).toEqual(textos.map((text) => `spa:${text}`));
  expect(maxim).toBe(LIMITS_LLIURE.concurrencia);
  expect(LIMITS_LLIURE.concurrencia).toBe(2);
});

test('cancel·lació amb signal: CANCELLADA i les crides en vol s’avorten', async () => {
  const senyals = [];
  const traductor = creaTraductorApertium({ ara, fetch: (url, { signal }) => new Promise((_, reject) => {
    senyals.push(signal);
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  }) });
  const control = new AbortController();
  const promesa = errorDe(traductor.tradueix(['u', 'dos', 'tres'], 'ES', { signal: control.signal }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  control.abort();
  expect(await promesa).toMatchObject({ codi: CODI_TRADUCCIO.CANCELLADA });
  expect(senyals).toHaveLength(2);
  expect(senyals.every((s) => s.aborted)).toBe(true);
  const abans = new AbortController();
  abans.abort();
  expect(await errorDe(traductor.tradueix(['u'], 'ES', { signal: abans.signal }))).toMatchObject({ codi: CODI_TRADUCCIO.CANCELLADA });
});

test('termini: 12 s per crida i 30 s per lot (decisió del Mestre 261030 §2); passat el del lot, INABASTABLE', async () => {
  const penjat = (url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
  const lot = creaTraductorApertium({ ara, fetch: penjat, limits: { ...LIMITS_LLIURE, lot: 30, crida: 5000 } });
  expect(await errorDe(lot.tradueix(['u'], 'ES'))).toMatchObject({ codi: CODI_TRADUCCIO.INABASTABLE });
  const urls = [];
  const crida = creaTraductorApertium({ ara, fetch: (url, opcions) => { urls.push(url); return penjat(url, opcions); }, limits: { ...LIMITS_LLIURE, crida: 20 } });
  expect(await errorDe(crida.tradueix(['dos'], 'ES'))).toMatchObject({ codi: CODI_TRADUCCIO.INABASTABLE });
  expect(urls).toEqual([APERTIUM_BETA, APERTIUM_RESERVA]);
  expect(LIMITS_LLIURE).toMatchObject({ crida: 12000, lot: 30000 });
  expect(LIMITS_MYMEMORY).toMatchObject({ crida: 12000, lot: 30000 });
  // El lot deixa passar una crida lenta sencera i la reserva.
  expect(LIMITS_LLIURE.lot).toBeGreaterThan(2 * LIMITS_LLIURE.crida);
});

test('ritme de la sessió: 30 lots sense cache cada 10 minuts, com el del servidor per client', async () => {
  const { traductor, crides } = amb();
  for (let i = 0; i < 30; i += 1) await traductor.tradueix([`text${i}`], 'ES');
  expect(await errorDe(traductor.tradueix(['text30'], 'ES'))).toMatchObject({ codi: CODI_TRADUCCIO.SERVIDOR, codiServidor: 'sdp_traduccio_limit' });
  expect((await traductor.tradueix(['text0'], 'ES')).cache).toBe(true);
  expect(crides).toHaveLength(30);
  rellotge.t += LIMITS_LLIURE.finestra + 1;
  await traductor.tradueix(['text30'], 'ES');
  expect(crides).toHaveLength(31);
});

test('amb tradueixTot: el pressupost per pàgina i la partició en lots del client valen igual', async () => {
  const { traductor, crides } = amb();
  expect(await errorDe(tradueixTot(traductor, ['a'.repeat(LIMITS_TRADUCCIO.caractersPagina + 1)], 'ES'))).toMatchObject({ codi: CODI_TRADUCCIO.MASSA_LLARGA });
  expect(crides).toHaveLength(0);
  const textos = Array.from({ length: 60 }, (_, i) => `bloc ${i}`);
  expect(await tradueixTot(traductor, textos, 'EN-GB')).toEqual(textos.map((text) => `eng:${text}`));
  expect(crides).toHaveLength(60);
});

test('només l’entrada pròpia l’activa: fixaTraductorLliure accepta només «apertium»', () => {
  expect(traductorLliureDelLloc()).toBeNull();
  for (const nom of ['deepl', 'APERTIUM', '', null, undefined, { nom: 'apertium' }]) expect(fixaTraductorLliure(nom)).toBeNull();
  expect(fixaTraductorLliure('apertium')).toBe('apertium');
  expect(traductorLliureDelLloc()).toBe('apertium');
});

/* Un amfitrió (WordPress, Sollutia) no el pot posar: no és cap clau de config,
   atribut ni global, i només src/main.jsx crida fixaTraductorLliure. */
test('cap amfitrió no el pot activar: fora dels contractes d’amfitrió, i només main.jsx el fixa', () => {
  const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const llig = (rel) => fs.readFileSync(path.join(src, rel), 'utf8');
  for (const rel of ['PedraSecaEmbed.jsx', 'config/contracteAmfitrio.js', 'data/sessionService.js', 'embed.jsx', 'natiu/entrada.jsx', 'host.js']) {
    expect([rel, /traductorLliure|traductor-lliure|fixaTraductorLliure/.test(llig(rel))]).toEqual([rel, false]);
  }
  /* Gauntlet 261030 (cicle 2) · La via viu a traductorDelLloc.js, que la
     definix (i traductorLliure.js la reexporta). */
  const fonts = fs.readdirSync(src, { recursive: true })
    .filter((rel) => /\.(?:js|jsx)$/.test(rel) && !/\.test\.(?:js|jsx)$/.test(rel)
      && !rel.endsWith('traductorLliure.js') && !rel.endsWith('traductorDelLloc.js'));
  expect(fonts.filter((rel) => /fixaTraductorLliure\(/.test(llig(rel)))).toEqual(['main.jsx']);
  expect(fonts.filter((rel) => /fixaCarregadorLliure\(/.test(llig(rel)))).toEqual(['main.jsx']);
});

/* Gauntlet 261030 (cicle 2, traductor-lliure-al-tros-entrada) · L'adaptador
   (Apertium, MyMemory i les seues URL) no va al tros d'entrada ni als paquets
   de WordPress i natiu: cap import estàtic fora de les proves; només el
   import() dinàmic de main.jsx, que el carrega en triar una llengua. */
test('cap import estàtic de traductorLliure.js: només el import() de main.jsx', () => {
  const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const llig = (rel) => fs.readFileSync(path.join(src, rel), 'utf8');
  const fonts = fs.readdirSync(src, { recursive: true })
    .filter((rel) => /\.(?:js|jsx|mjs)$/.test(rel) && !/\.test\.(?:js|jsx|mjs)$/.test(rel) && !rel.endsWith('traductorLliure.js'));
  const estatics = fonts.filter((rel) => /(?:import|export)\s[^;()]*?from\s+['"][^'"]*traductorLliure(?:\.js)?['"]/.test(llig(rel)));
  expect(estatics).toEqual([]);
  const dinamics = fonts.filter((rel) => /import\(\s*['"][^'"]*traductorLliure(?:\.js)?['"]\s*\)/.test(llig(rel)));
  expect(dinamics).toEqual(['main.jsx']);
  // La via no depén de res: es pot fixar sense carregar cap altre mòdul.
  expect(llig('data/traductorDelLloc.js')).not.toMatch(/^\s*import\s/m);
});

/* ── Cicle 2 del Gauntlet (261030): GL i EU, MyMemory, G10, §2, C6 ───────── */

test('MOTORS_TRADUCCIO: la matriu de capacitats per destí, congelada; GL només la beta; cada llengua del menú hi és', () => {
  expect(MOTORS_TRADUCCIO).toEqual({
    ES: { motor: 'apertium', parell: 'cat|spa', extrems: [APERTIUM_BETA, APERTIUM_RESERVA] },
    GL: { motor: 'apertium', parell: 'cat|glg', extrems: [APERTIUM_BETA] },
    EU: { motor: 'mymemory', parell: 'ca|eu' },
    'EN-GB': { motor: 'apertium', parell: 'cat|eng', extrems: [APERTIUM_BETA, APERTIUM_RESERVA] },
    FR: { motor: 'apertium', parell: 'cat|fra', extrems: [APERTIUM_BETA, APERTIUM_RESERVA] },
    DE: { motor: 'mymemory', parell: 'ca|de' },
  });
  expect(Object.isFrozen(MOTORS_TRADUCCIO)).toBe(true);
  for (const motor of Object.values(MOTORS_TRADUCCIO)) {
    expect(Object.isFrozen(motor)).toBe(true);
    if (motor.extrems) expect(Object.isFrozen(motor.extrems)).toBe(true);
  }
  expect(Object.keys(MOTORS_TRADUCCIO).sort()).toEqual(LLENGUES_TRADUCCIO.map(({ codi }) => codi).sort());
  const { traductor } = amb();
  expect(LLENGUES_TRADUCCIO.map(({ codi }) => [codi, traductor.admetHtml(codi)]))
    .toEqual([['ES', true], ['GL', true], ['EU', false], ['EN-GB', true], ['FR', true], ['DE', false]]);
});

test('GL: cat|glg només a la beta, amb format txt; si la beta cau, error net sense tocar apertium.org', async () => {
  const bo = amb();
  expect((await bo.traductor.tradueix(['El gat dorm.'], 'GL')).traduccions).toEqual(['glg:El gat dorm.']);
  expect(bo.crides.map((c) => [c.url, c.langpair, c.opcions.body.get('format')])).toEqual([[APERTIUM_BETA, 'cat|glg', 'txt']]);
  for (const [falla, codi] of [[503, CODI_TRADUCCIO.SERVIDOR], ['xarxa', CODI_TRADUCCIO.INABASTABLE]]) {
    buidaSessioLliure();
    const caiguda = amb({ fail: { [APERTIUM_BETA]: falla } });
    expect(await errorDe(caiguda.traductor.tradueix(['Bon dia'], 'GL'))).toMatchObject({ codi });
    expect(caiguda.crides.map((c) => c.url)).toEqual([APERTIUM_BETA]);
  }
});

/* Decisions 261030 03:25 §3 · Quan Apertium cau, cap reserva cap a un tercer. */
test('Apertium caigut per al castellà: error net, mai MyMemory', async () => {
  const caigut = amb({ fail: { [APERTIUM_BETA]: 'xarxa', [APERTIUM_RESERVA]: 503 } });
  expect(await errorDe(caigut.traductor.tradueix(['Bon dia'], 'ES'))).toMatchObject({ codi: CODI_TRADUCCIO.SERVIDOR, status: 503 });
  expect(caigut.crides.map((c) => c.url)).toEqual([APERTIUM_BETA, APERTIUM_RESERVA]);
});

/* C6 · Resposta REAL de beta.apertium.org (261030, cat|spa, format=txt, frase
   inventada): els angles, l'entitat, l'acrònim i l'URL tornen tal qual, i el
   client no els toca. */
const REAL_SPA_TXT = Object.freeze({
  q: 'Si a < b i c > d, R&amp;D de la UE: https://socdepoble.org/page/consola?a=1&b=2.',
  traduit: 'Si a < b y c > d, R&amp;D de la UE: https://socdepoble.org/page/consola?a=1&b=2.',
});
test('C6: el text pla va amb format txt i torna tal qual, amb <, >, &amp;, acrònims i URLs (resposta real)', async () => {
  const { traductor, crides } = amb({ cos: { responseData: { translatedText: REAL_SPA_TXT.traduit }, responseDetails: null, responseStatus: 200 } });
  expect((await traductor.tradueix([REAL_SPA_TXT.q], 'ES')).traduccions).toEqual([REAL_SPA_TXT.traduit]);
  expect(crides.map((c) => [c.opcions.body.get('format'), c.q])).toEqual([['txt', REAL_SPA_TXT.q]]);
  const html = amb();
  await html.traductor.tradueix(['Bon <strong data-sdp="0">dia</strong>'], 'FR', { format: 'html' });
  expect(html.crides[0].opcions.body.get('format')).toBe('html');
});

test('MyMemory: talls de com a molt 450 bytes per frase, en ordre, un GET simple per tros, i ajuntats', async () => {
  const text = 'La gallina blava pon ous al mur de pedra seca del poble. '.repeat(12).trim();
  const { traductor, crides } = amb();
  const { traduccions } = await traductor.tradueix([text], 'EU');
  expect(crides.length).toBeGreaterThan(1);
  expect(crides.every((c) => c.url === MYMEMORY && c.langpair === 'ca|eu' && bytesDe(c.q) <= LIMITS_MYMEMORY.bytes)).toBe(true);
  expect(crides.slice(0, -1).every((c) => c.q.trim().endsWith('.'))).toBe(true);
  expect(crides.map((c) => c.q.trim()).join(' ')).toBe(text);
  expect(traduccions).toEqual([crides.map((c) => `eu:${c.q}`.trim()).join(' ')]);
  for (const { opcions, completa } of crides) {
    expect(opcions).toMatchObject({ method: 'GET', credentials: 'omit', referrerPolicy: 'no-referrer', mode: 'cors', cache: 'no-store', redirect: 'error' });
    expect(opcions.headers).toBeUndefined();
    expect(opcions.body).toBeUndefined();
    expect([...new URL(completa).searchParams.keys()]).toEqual(['q', 'langpair']);
  }
});

test('partixPerBytes: mai a mitjan caràcter; per frase, per espai o amb un tall dur', () => {
  expect(partixPerBytes('Bon dia')).toEqual(['Bon dia']);
  const as = 'à'.repeat(226);
  expect(partixPerBytes(as).map(bytesDe)).toEqual([450, 2]);
  expect(partixPerBytes(as).join('')).toBe(as);
  expect(partixPerBytes('x'.repeat(600)).map((tros) => tros.length)).toEqual([450, 150]);
  expect(partixPerBytes(`${'a'.repeat(448)}🍅b`)).toEqual(['a'.repeat(448), '🍅b']);
  const pedres = 'pedra '.repeat(80).trim();
  const perEspai = partixPerBytes(pedres);
  expect(perEspai.every((tros) => bytesDe(tros) <= 450)).toBe(true);
  expect(perEspai[0].endsWith('pedra')).toBe(true);
  expect(perEspai.join('')).toBe(pedres);
  const frases = 'Una frase curta. '.repeat(30).trim();
  const perFrase = partixPerBytes(frases);
  expect(perFrase.slice(0, -1).every((tros) => tros.trim().endsWith('.'))).toBe(true);
  expect(perFrase.join('')).toBe(frases);
});

/* Resposta REAL de MyMemory (261030 01:59 UTC, un text inventat de 577
   bytes): un HTTP 200 amb l'error dins i responseStatus com a cadena. */
const REAL_MM_LLARGARIA = Object.freeze({
  responseData: { translatedText: 'QUERY LENGTH LIMIT EXCEEDED. MAX ALLOWED QUERY : 500 CHARS' }, quotaFinished: null, mtLangSupported: null,
  responseDetails: 'QUERY LENGTH LIMIT EXCEEDED. MAX ALLOWED QUERY : 500 CHARS', responseStatus: '403', responderId: null, exception_code: null, matches: '',
});
test('MyMemory: els errors que arriben amb un 200 són errors, mai traducció; sense pausa si no és la quota', async () => {
  const dolentes = [
    REAL_MM_LLARGARIA,
    { responseData: { translatedText: 'INVALID LANGUAGE PAIR SPECIFIED. EXAMPLE: LANGPAIR=EN|IT' }, responseStatus: 200, quotaFinished: false },
    { responseData: { translatedText: '  ' }, responseStatus: 200 },
    { responseData: { translatedText: 'x' }, responseStatus: 500 },
    { responseData: null, responseStatus: 200 },
  ];
  for (const cos of dolentes) {
    buidaSessioLliure();
    const { traductor, crides } = amb({ mymemory: () => cos });
    expect(await errorDe(traductor.tradueix(['Bon dia'], 'EU'))).toMatchObject({ codi: CODI_TRADUCCIO.RESPOSTA_INVALIDA });
    await errorDe(traductor.tradueix(['Bona nit'], 'EU'));
    expect(crides).toHaveLength(2);
  }
  buidaSessioLliure();
  const cadena = amb({ mymemory: (parametres) => ({ ...bonaMyMemory(parametres), responseStatus: '200' }) });
  expect((await cadena.traductor.tradueix(['Bon dia'], 'EU')).traduccions).toEqual(['eu:Bon dia']);
});

test('MyMemory: quota esgotada (quotaFinished, l’avís dins del text, 429 al cos, 429 o 403 HTTP) → límit i pausa NOMÉS de MyMemory fins a les 00:00 UTC', async () => {
  const quotes = [
    { mymemory: (parametres) => ({ ...bonaMyMemory(parametres), quotaFinished: true }) },
    { mymemory: () => ({ responseData: { translatedText: 'MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY.' }, responseStatus: 200, quotaFinished: false }) },
    { mymemory: () => ({ responseData: { translatedText: 'x' }, responseStatus: '429' }) },
    { fail: { [MYMEMORY]: 429 } },
    { fail: { [MYMEMORY]: 403 } },
  ];
  for (const opcions of quotes) {
    buidaSessioLliure();
    rellotge.t = Date.UTC(2026, 9, 30, 21, 0, 0);
    const { traductor, crides } = amb(opcions);
    expect(await errorDe(traductor.tradueix(['Bon dia'], 'DE'))).toMatchObject({ codi: CODI_TRADUCCIO.SERVIDOR, codiServidor: 'sdp_traduccio_limit' });
    expect(await errorDe(traductor.tradueix(['Nit'], 'EU'))).toMatchObject({ codiServidor: 'sdp_traduccio_limit' });
    expect(crides).toHaveLength(1);
    expect((await traductor.tradueix(['Nit'], 'ES')).traduccions).toEqual(['spa:Nit']);
    rellotge.t = Date.UTC(2026, 9, 30, 23, 59, 59);
    await errorDe(traductor.tradueix(['Nit'], 'EU'));
    expect(crides.filter((c) => c.url === MYMEMORY)).toHaveLength(1);
    rellotge.t = Date.UTC(2026, 9, 31, 0, 0, 0);
    await errorDe(traductor.tradueix(['Nit'], 'EU'));
    expect(crides.filter((c) => c.url === MYMEMORY)).toHaveLength(2);
  }
});

test('pauses per motor: un 429 d’Apertium para Apertium 60 s, però el basc continua', async () => {
  const { traductor, crides } = amb({ fail: { [APERTIUM_BETA]: 429 } });
  await errorDe(traductor.tradueix(['Bon dia'], 'ES'));
  expect(await errorDe(traductor.tradueix(['Bon dia'], 'GL'))).toMatchObject({ codiServidor: 'sdp_traduccio_limit' });
  expect((await traductor.tradueix(['Bon dia'], 'EU')).traduccions).toEqual(['eu:Bon dia']);
  expect(crides.map((c) => c.url)).toEqual([APERTIUM_BETA, MYMEMORY]);
});

/* Decisió del Mestre (261030 §2) · La pausa de 60 s només per 403/429. */
test('§2: un termini puntual no obri cap pausa: la crida següent ix', async () => {
  let penja = true;
  const traductor = creaTraductorApertium({
    ara,
    limits: { ...LIMITS_LLIURE, crida: 20 },
    fetch: (url, { signal, body }) => (penja
      ? new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))
      : Promise.resolve(bona(body))),
  });
  expect(await errorDe(traductor.tradueix(['Bon dia'], 'ES'))).toMatchObject({ codi: CODI_TRADUCCIO.INABASTABLE, status: 0 });
  penja = false;
  expect((await traductor.tradueix(['Bon dia'], 'ES')).traduccions).toEqual(['spa:Bon dia']);
});

test('termini de la crida també per a la lectura del cos: un JSON que no arriba mai passa a la reserva', async () => {
  const urls = [];
  const traductor = creaTraductorApertium({
    ara,
    limits: { ...LIMITS_LLIURE, crida: 20 },
    fetch: async (url, { body }) => {
      urls.push(url);
      if (url === APERTIUM_BETA) return { status: 200, ok: true, json: () => new Promise(() => {}) };
      return bona(body);
    },
  });
  expect((await traductor.tradueix(['Bon dia'], 'ES')).traduccions).toEqual(['spa:Bon dia']);
  expect(urls).toEqual([APERTIUM_BETA, APERTIUM_RESERVA]);
});

/* G10 (Gemini 261030) · Un lot cancel·lat abans d'acabar no gasta el ritme. */
test('G10: un lot cancel·lat abans d’acabar no compta al ritme de la sessió', async () => {
  const traductor = creaTraductorApertium({
    ara,
    limits: { ...LIMITS_LLIURE, lots: 1 },
    fetch: (url, { signal, body }) => (body.get('q') === 'penja'
      ? new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))
      : Promise.resolve(bona(body))),
  });
  const control = new AbortController();
  const promesa = errorDe(traductor.tradueix(['penja'], 'ES', { signal: control.signal }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  control.abort();
  expect(await promesa).toMatchObject({ codi: CODI_TRADUCCIO.CANCELLADA });
  expect((await traductor.tradueix(['Bon dia'], 'ES')).traduccions).toEqual(['spa:Bon dia']);
  expect(await errorDe(traductor.tradueix(['Nit'], 'ES'))).toMatchObject({ codiServidor: 'sdp_traduccio_limit' });
});

test('MyMemory: el comptador diari (4500 caràcters per dia UTC) atura la pàgina ABANS d’enviar res', async () => {
  const { traductor, crides } = amb();
  expect(await errorDe(tradueixTot(traductor, ['a'.repeat(2300), 'b'.repeat(2300)], 'EU'))).toMatchObject({ codi: CODI_TRADUCCIO.MASSA_LLARGA });
  expect(crides).toHaveLength(0);
  const quatreMil = Array.from({ length: 10 }, (_, i) => `${i}${'c'.repeat(399)}`);
  await tradueixTot(traductor, quatreMil, 'EU');
  const fetes = crides.length;
  expect(fetes).toBe(10);
  expect(await errorDe(tradueixTot(traductor, ['d'.repeat(300), 'e'.repeat(300)], 'DE'))).toMatchObject({ codiServidor: 'sdp_traduccio_limit' });
  expect(crides).toHaveLength(fetes);
  // El que ja és a la memòria cau no gasta res.
  expect(await tradueixTot(traductor, [quatreMil[0]], 'EU')).toEqual([`eu:${quatreMil[0]}`]);
  rellotge.t = Date.UTC(2026, 9, 31, 0, 0, 1);
  await tradueixTot(traductor, ['d'.repeat(300), 'e'.repeat(300)], 'DE');
  expect(crides).toHaveLength(fetes + 2);
});

test('MyMemory: el lot també es comprova sol (sense tradueixTot), abans de cap crida', async () => {
  const { traductor, crides } = amb();
  expect(await errorDe(traductor.tradueix(['x'.repeat(2400), 'y'.repeat(2400)], 'EU'))).toMatchObject({ codi: CODI_TRADUCCIO.MASSA_LLARGA });
  await traductor.tradueix(Array.from({ length: 10 }, (_, i) => `${i}${'c'.repeat(399)}`), 'EU');
  expect(await errorDe(traductor.tradueix(['z'.repeat(600)], 'DE'))).toMatchObject({ codiServidor: 'sdp_traduccio_limit' });
  expect(crides).toHaveLength(10);
});

test('MyMemory: una pàgina de dos lots que no cap sencera no envia ni el primer (cap traducció a mitges)', async () => {
  const { traductor, crides } = amb();
  await tradueixTot(traductor, Array.from({ length: 10 }, (_, i) => `${i}${'c'.repeat(399)}`), 'EU');
  const pagina = Array.from({ length: 60 }, (_, i) => `t${String(i).padStart(2, '0')}${'w'.repeat(7)}`);
  expect(await errorDe(tradueixTot(traductor, pagina, 'EU'))).toMatchObject({ codiServidor: 'sdp_traduccio_limit' });
  expect(crides).toHaveLength(10);
});

test('MyMemory: una entitat de la resposta es desfà si l’original no en portava (la traducció és text)', async () => {
  const entitats = amb({ mymemory: (p) => ambMotor({ responseData: { translatedText: 'l&#39;etxea &amp; &lt;b&gt;' }, responseStatus: 200, quotaFinished: false }, p.get('q')) });
  expect((await entitats.traductor.tradueix(['La casa'], 'EU')).traduccions).toEqual(['l\'etxea & <b>']);
  buidaSessioLliure();
  const original = amb({ mymemory: (p) => ambMotor({ responseData: { translatedText: 'R&amp;D' }, responseStatus: 200, quotaFinished: false }, p.get('q')) });
  expect((await original.traductor.tradueix(['R&amp;D'], 'EU')).traduccions).toEqual(['R&amp;D']);
});

/* ── Cicle 2 del Gauntlet, corrector de l'àrea traductor-client ─────────── */

/* mymemory-entitats-amb-ampersand · Un «&» a l'original no deixa crues les
   altres entitats: es conserva només la que l'original ja portava escrita. */
test('MyMemory: amb un «&» a l’original, les entitats que no hi eren es desfan (R&D, l&#39;)', async () => {
  const { traductor } = amb({ mymemory: (p) => ambMotor({ responseData: { translatedText: 'R&D eta Udalaren l&#39;agiria' }, responseStatus: 200, quotaFinished: false }, p.get('q')) });
  expect(await tradueixTot(traductor, ['R&D i l\'acta de l\'Ajuntament'], 'EU')).toEqual(['R&D eta Udalaren l\'agiria']);
  buidaSessioLliure();
  // Resposta REAL de MyMemory (ca|eu, 261030, frase inventada): «&quot;» i «&#39;» amb un «&» nu a l'original.
  const real = 'Pobles & Gent-ek &quot;L&#39;Hostal d&#39;Ares&quot; taberna irekiko du astelehenean.';
  const viu = amb({ mymemory: (p) => ambMotor({ responseData: { translatedText: real }, responseStatus: 200, quotaFinished: false }, p.get('q')) });
  expect(await tradueixTot(viu.traductor, ['Pobles & Gent obri el bar «L\'Hostal d\'Ares» dilluns.'], 'EU'))
    .toEqual(['Pobles & Gent-ek "L\'Hostal d\'Ares" taberna irekiko du astelehenean.']);
  buidaSessioLliure();
  // L'entitat que l'original ja portava escrita es queda (i la resta, també ací, es desfà).
  const mixt = amb({ mymemory: (p) => ambMotor({ responseData: { translatedText: 'R&amp;D l&#39;agiria' }, responseStatus: 200, quotaFinished: false }, p.get('q')) });
  expect((await mixt.traductor.tradueix(['R&amp;D acta'], 'EU')).traduccions).toEqual(['R&amp;D l\'agiria']);
});

/* mymemory-memoria-collaborativa · `translatedText` pot vindre de la memòria
   col·laborativa (qualsevol hi escriu sense clau i una coincidència exacta
   guanya el motor). Només val l'entrada «MT!» amb el segment enviat; si no
   n'hi ha, el text es queda en l'original (tradueixTot el marca). */
const INJECCIO = (q) => ({
  responseData: { translatedText: 'TEXT INJECTAT: truca al 900 000 000', match: 1 },
  quotaFinished: false, responseDetails: '', responseStatus: 200,
  matches: [{ id: '777', segment: q, translation: 'TEXT INJECTAT: truca al 900 000 000', 'created-by': 'anonymous', match: 1 }],
});
test('MyMemory: una «traducció» de la memòria col·laborativa no arriba mai a la pàgina; el text es queda en l’original', async () => {
  const { traductor, crides } = amb({ mymemory: (p) => INJECCIO(p.get('q')) });
  const originals = [];
  expect(await tradueixTot(traductor, ['El forn obri a les set.', 'Sóc de Poble'], 'DE', { enOriginal: (i) => originals.push(i) }))
    .toEqual(['El forn obri a les set.', 'Sóc de Poble']);
  expect(originals).toEqual([0, 1]);
  expect(crides).toHaveLength(2);
  // Una entrada «MT!» d'un altre segment tampoc no val.
  buidaSessioLliure();
  const altre = amb({ mymemory: (p) => ({ ...INJECCIO(p.get('q')), matches: [{ id: 0, segment: 'Un altre text', translation: 'X', 'created-by': 'MT!', match: 0.85 }] }) });
  expect((await altre.traductor.tradueix(['Bon dia'], 'EU')).traduccions).toEqual(['Bon dia']);
  // Una coincidència exacta del corpus públic (forma real del 261030) sense l'entrada del motor, tampoc.
  buidaSessioLliure();
  const corpus = amb({ mymemory: (p) => ({
    responseData: { translatedText: 'Taularen informazioa', match: 1 }, quotaFinished: false, responseDetails: '', responseStatus: 200,
    matches: [{ id: '305', segment: p.get('q'), translation: 'Taularen informazioa', 'created-by': 'Public_Corpora', match: 1 }],
  }) });
  expect((await corpus.traductor.tradueix(['Informació de la taula'], 'EU')).traduccions).toEqual(['Informació de la taula']);
});

test('MyMemory: la traducció del motor («MT!», resposta real) guanya el que diga translatedText; un text partit amb un tros sense motor es queda sencer en l’original', async () => {
  // Resposta REAL (ca|de, 261030, frase inventada) amb una entrada del corpus al costat.
  const q = 'Què diu la candidatura';
  const real = {
    responseData: { translatedText: 'Was die Anwendung sagt', match: 0.85 }, quotaFinished: false, responseDetails: '', responseStatus: 200,
    matches: [
      { id: 0, segment: q, translation: 'Was die Anwendung sagt', 'created-by': 'MT!', match: 0.85 },
      { id: '424073489', segment: 'Què diu la Cora?', translation: 'Was sagt Cora?', 'created-by': 'Public_Corpora', match: 0.65 },
    ],
  };
  const { traductor } = amb({ mymemory: () => real });
  expect((await traductor.tradueix([q], 'DE')).traduccions).toEqual(['Was die Anwendung sagt']);
  buidaSessioLliure();
  const injectat = amb({ mymemory: (p) => ({ ...real, responseData: { translatedText: 'INJECTAT', match: 1 }, matches: [{ ...real.matches[0], segment: p.get('q'), translation: 'Bo' }] }) });
  expect((await injectat.traductor.tradueix(['Bon dia'], 'DE')).traduccions).toEqual(['Bo']);
  buidaSessioLliure();
  const frase = `${'Una frase prou llarga per a omplir el tros. '.repeat(12)}Final.`;
  let n = 0;
  const partit = amb({ mymemory: (p) => { n += 1; return n === 2 ? INJECCIO(p.get('q')) : bonaMyMemory(p); } });
  expect((await partit.traductor.tradueix([frase], 'EU')).traduccions).toEqual([frase]);
});

/* mymemory-pressupost-duplicats · El pressupost diari compta cada text una
   vegada, com l'envia `tradueix`. */
test('MyMemory: els textos repetits compten una vegada al pressupost diari (cap «massa llarga» de més)', async () => {
  const { traductor, crides } = amb();
  const llarg = `${'a'.repeat(1598)}.`;
  const [u, dos, tres] = await tradueixTot(traductor, [llarg, llarg, llarg], 'EU');
  expect(u.startsWith('eu:')).toBe(true);
  expect([dos, tres]).toEqual([u, u]);
  expect(crides.reduce((suma, c) => suma + c.q.length, 0)).toBe(1599);
  // Amb 3000 caràcters gastats hui, 1000 únics i «Pendent» ×100 (1007 de veritat) hi caben.
  buidaSessioLliure();
  const segon = amb();
  await tradueixTot(segon.traductor, Array.from({ length: 10 }, (_, i) => `${i}${'c'.repeat(299)}`), 'EU');
  const pagina = [...Array.from({ length: 10 }, (_, i) => `${i}${'p'.repeat(99)}`), ...Array.from({ length: 100 }, () => 'Pendent')];
  expect((await tradueixTot(segon.traductor, pagina, 'EU')).slice(-1)).toEqual(['eu:Pendent']);
});

/* apertium-beta-penjada-esgota-lot-navegador · Dins d'un lot, una beta que
   no respon (ni rebutja) costa un sol termini per crida en vol: la resta de
   textos va a la reserva i el lot acaba. El lot següent torna a provar la beta. */
test('beta penjada: dins del lot, la resta de textos va a apertium.org; el lot acaba bé', async () => {
  const urls = [];
  const penjada = (signal) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
  const traductor = creaTraductorApertium({
    ara,
    limits: { ...LIMITS_LLIURE, crida: 40, lot: 150 },
    fetch: (url, { signal, body }) => {
      urls.push(url);
      return url === APERTIUM_BETA ? penjada(signal) : Promise.resolve(bona(body));
    },
  });
  const textos = Array.from({ length: 10 }, (_, i) => `Text ${i}`);
  expect((await traductor.tradueix(textos, 'ES')).traduccions).toEqual(textos.map((text) => `spa:${text}`));
  const beta = urls.filter((url) => url === APERTIUM_BETA).length;
  expect(beta).toBeLessThanOrEqual(LIMITS_LLIURE.concurrencia);
  expect(urls.filter((url) => url === APERTIUM_RESERVA)).toHaveLength(10);
  // El lot següent comença per la beta.
  urls.length = 0;
  await errorDe(traductor.tradueix(['Un altre'], 'ES'));
  expect(urls[0]).toBe(APERTIUM_BETA);
  // El gallec només té la beta: es continua provant (error net si no respon).
  urls.length = 0;
  expect(await errorDe(traductor.tradueix(['Gal 1', 'Gal 2', 'Gal 3'], 'GL'))).toMatchObject({ codi: CODI_TRADUCCIO.INABASTABLE });
  expect(urls.every((url) => url === APERTIUM_BETA)).toBe(true);
});

/* ── Cicle 4 (auditoria matinal de Gemini 261030, ALT-02) ──────────────── */

/* MyMemory escriu entitats en els camps que torna (translatedText del
   261030: «L&#39;Hostal d&#39;Ares»). Si el segment del motor torna així, un
   text amb apòstrof («L'Alcoià») no trobava la seua entrada «MT!» i es
   quedava sense traduir. */
test('ALT-02 · el segment del motor amb entitats (&#39;, &amp;, &quot;) és el mateix tros: el text es traduïx', async () => {
  const escapa = (text) => text.replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const ambSegment = (segment) => (p) => ({
    responseData: { translatedText: 'INJECTAT', match: 1 }, quotaFinished: false, responseDetails: '', responseStatus: 200,
    matches: [{ id: 0, segment: segment(p.get('q')), translation: `de:${p.get('q')}`, 'created-by': 'MT!', match: 0.85 }],
  });
  const textos = ['L\'Alcoià obri dilluns.', 'Pobles & Gent diu "bon dia".', 'R&amp;D, escrit així.'];
  const escapat = amb({ mymemory: ambSegment(escapa) });
  expect((await escapat.traductor.tradueix(textos, 'DE')).traduccions).toEqual(textos.map((text) => `de:${text}`));
  // El segment tal qual, com fins ara, també val.
  buidaSessioLliure();
  const pla = amb({ mymemory: ambSegment((q) => q) });
  expect((await pla.traductor.tradueix(textos, 'DE')).traduccions).toEqual(textos.map((text) => `de:${text}`));
  // Un altre segment, encara que siga desfent-ne les entitats, no: el text es queda en l'original.
  buidaSessioLliure();
  const altre = amb({ mymemory: ambSegment((q) => `${escapa(q)} i més`) });
  expect((await altre.traductor.tradueix(['L\'Alcoià obri dilluns.'], 'DE')).traduccions).toEqual(['L\'Alcoià obri dilluns.']);
});

/* Un text que torna igual que l'original (MyMemory sense l'entrada del
   motor, o un motor que no l'ha traduït) no es desa a la memòria cau: la
   vegada següent es torna a demanar. Els traduïts, sí. */
test('ALT-02 · un text que torna en l’original no es desa a la memòria cau de la sessió; la vegada següent es torna a demanar', async () => {
  let ambEntrada = false;
  const { traductor, crides } = amb({
    mymemory: (p) => (ambEntrada || p.get('q') !== 'Bon dia' ? bonaMyMemory(p) : INJECCIO(p.get('q'))),
  });
  expect(await tradueixTot(traductor, ['Bon dia', 'Poble'], 'DE')).toEqual(['Bon dia', 'de:Poble']);
  ambEntrada = true;
  expect(await tradueixTot(traductor, ['Bon dia', 'Poble'], 'DE')).toEqual(['de:Bon dia', 'de:Poble']);
  expect(crides.map((crida) => crida.q)).toEqual(['Bon dia', 'Poble', 'Bon dia']);
  expect(await traductor.tradueix(['Bon dia', 'Poble'], 'DE')).toEqual({ traduccions: ['de:Bon dia', 'de:Poble'], desti: 'DE', cache: true });
  // Apertium que torna el text tal com l'ha rebut: tampoc es desa.
  const igual = amb({ cos: null });
  igual.fetch.mockImplementation(async (_, { body }) => resposta(200, { responseData: { translatedText: body.get('q') }, responseStatus: 200 }));
  await igual.traductor.tradueix(['Twitter'], 'ES');
  expect((await igual.traductor.tradueix(['Twitter'], 'ES')).cache).toBe(false);
  expect(igual.fetch).toHaveBeenCalledTimes(2);
});
