/* T8 · P2-14 (pla 261101_1246) · L'estat additiu de recepció, contra un
   servidor HTTP de veritat. L'«estatRecepcio» del pla és el camp
   `verificacio` de telemetria.js (bdd26c86f): 'intent' = pendent, 'acceptat'
   i 'fallat' = fallit. Ací no hi ha cap fetch simulat: el fetch natiu de Node
   parla amb un node:http que escolta a 127.0.0.1 i fa de comptador d'Umami.
   Es comprova el que les proves amb vi.fn() no poden vore: que la crida
   torna abans que el servidor responga, que el que arriba pel cable és la
   ruta tapada sense query, hash ni títol, i que la resposta HTTP (200, 503 o
   la connexió refusada) canvia l'estat de la MATEIXA entrada, sense cap
   entrada nova ni cap recompte doble. */
import http from 'node:http';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import {
  ESDEVENIMENT_DOM, CLAU_APAGADA, configTelemetria, darrersEnviaments, registraVisita, _reiniciaTelemetria
} from './telemetria.js';

const ID = '0f8d6c1e-7a2b-4c3d-9e8f-1a2b3c4d5e6f';
const FETCH_NATIU = globalThis.fetch;

let servidor;
let port;
/* Cada petició rebuda: mètode, camí, capçaleres i cos. */
const rebudes = [];
/* Com respon el servidor: el codi i, si n'hi ha, una porta que cal obrir abans de respondre. */
const mode = { codi: 200, porta: null };

beforeAll(async () => {
  servidor = http.createServer((peticio, resposta) => {
    let cos = '';
    peticio.setEncoding('utf8');
    peticio.on('data', (tros) => { cos += tros; });
    peticio.on('end', async () => {
      rebudes.push({ metode: peticio.method, cami: peticio.url, capcaleres: peticio.headers, cos });
      if (mode.porta) await mode.porta;
      resposta.writeHead(mode.codi, { 'content-type': 'application/json' });
      resposta.end('{}');
    });
  });
  await new Promise((fet) => servidor.listen(0, '127.0.0.1', fet));
  port = servidor.address().port;
});

afterAll(async () => {
  window.fetch = FETCH_NATIU;
  servidor.closeAllConnections?.();
  await new Promise((fet) => servidor.close(fet));
});

beforeEach(() => {
  _reiniciaTelemetria();
  rebudes.length = 0;
  Object.assign(mode, { codi: 200, porta: null });
  window.localStorage.removeItem(CLAU_APAGADA);
  delete window.umami;
  window.fetch = FETCH_NATIU;
  document.title = 'Nota secreta de la Rosa';
});

afterEach(() => {
  delete window.__SDP_EMBEDDED__;
});

const cfgDe = (p) => configTelemetria({ VITE_UMAMI_WEBSITE_ID: ID, VITE_UMAMI_HOST: `http://127.0.0.1:${p}` });

/** Els estats de `verificacio` que el DOM anuncia, i una espera fins que n'arribe un de final. */
function escoltaEstats() {
  const estats = [];
  let avisa = () => {};
  const escolta = (e) => { estats.push(e.detail.verificacio); avisa(); };
  window.addEventListener(ESDEVENIMENT_DOM, escolta);
  const final = (ms = 5000) => new Promise((fet, falla) => {
    const temps = setTimeout(() => falla(new Error(`cap estat final en ${ms} ms: ${estats.join(', ')}`)), ms);
    avisa = () => { if (['acceptat', 'fallat', 'no_comprovat'].includes(estats.at(-1))) { clearTimeout(temps); fet(estats.at(-1)); } };
    avisa();
  });
  return { estats, final, para: () => window.removeEventListener(ESDEVENIMENT_DOM, escolta) };
}

describe('P2-14 · recepció HTTP verificada amb un servidor propi', () => {
  test('200: torna «intent» abans de la resposta i després la mateixa entrada passa a «acceptat»', async () => {
    let obri;
    mode.porta = new Promise((fet) => { obri = fet; });
    /* El fetch de Node no té pot de galetes ni referent: el cable no pot
       demostrar «sense galetes». El que ho garantix al navegador és l'init
       de la crida, i per això es guarda ací, sense canviar la crida real. */
    const inits = [];
    window.fetch = (url, init) => { inits.push({ url, init }); return FETCH_NATIU(url, init); };
    const { estats, final, para } = escoltaEstats();
    try {
      const r = registraVisita('/notes/7f3a-nota-secreta?item_id=Nota%20secreta#paragraf-2', { cfg: cfgDe(port) });
      // La crida no espera la xarxa: el servidor encara no ha respost.
      expect(r).toMatchObject({ enviat: true, motiu: 'umami', verificacio: 'intent', url: '/notes/*' });
      expect(darrersEnviaments()).toHaveLength(1);
      expect(darrersEnviaments()[0].verificacio).toBe('intent');
      await expect.poll(() => rebudes.length, { timeout: 5000 }).toBe(1);
      expect(darrersEnviaments()[0].verificacio).toBe('intent');
      obri();
      expect(await final()).toBe('acceptat');
    } finally { para(); }

    expect(estats).toEqual(['intent', 'acceptat']);
    expect(darrersEnviaments()).toHaveLength(1);
    expect(darrersEnviaments()[0]).toMatchObject({ enviat: true, motiu: 'umami', verificacio: 'acceptat' });

    // La crida demana al navegador que no envie galetes ni referent.
    expect(inits).toHaveLength(1);
    expect(inits[0].url).toBe(`http://127.0.0.1:${port}/api/send`);
    expect(inits[0].init).toMatchObject({ method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true });

    // El que ha arribat pel cable: un sol POST /api/send amb la ruta tapada.
    expect(rebudes).toHaveLength(1);
    const [{ metode, cami, capcaleres, cos }] = rebudes;
    expect([metode, cami]).toEqual(['POST', '/api/send']);
    expect(capcaleres['content-type']).toBe('application/json');
    expect(capcaleres.cookie).toBeUndefined();
    expect(capcaleres.referer).toBeUndefined();
    const { type, payload } = JSON.parse(cos);
    expect(type).toBe('event');
    expect(payload).toMatchObject({ website: ID, url: '/notes/*' });
    expect(payload.name).toBeUndefined();
    expect(cos).not.toMatch(/secreta|item_id|paragraf|7f3a|Rosa|#/i);
  });

  test('503: la mateixa entrada passa a «fallat»', async () => {
    mode.codi = 503;
    const { estats, final, para } = escoltaEstats();
    try {
      expect(registraVisita('/mur', { cfg: cfgDe(port) })).toMatchObject({ enviat: true, verificacio: 'intent' });
      expect(await final()).toBe('fallat');
    } finally { para(); }
    expect(estats).toEqual(['intent', 'fallat']);
    expect(rebudes).toHaveLength(1);
    expect(darrersEnviaments()).toHaveLength(1);
    expect(darrersEnviaments()[0]).toMatchObject({ enviat: true, motiu: 'umami', verificacio: 'fallat' });
  });

  test('connexió refusada (servidor tancat): «fallat», sense trencar res', async () => {
    // Un port que acaba de quedar lliure: ningú hi escolta.
    const tancat = http.createServer();
    await new Promise((fet) => tancat.listen(0, '127.0.0.1', fet));
    const portTancat = tancat.address().port;
    await new Promise((fet) => tancat.close(fet));

    const { estats, final, para } = escoltaEstats();
    try {
      expect(registraVisita('/pobles', { cfg: cfgDe(portTancat) })).toMatchObject({ enviat: true, verificacio: 'intent' });
      expect(await final()).toBe('fallat');
    } finally { para(); }
    expect(estats).toEqual(['intent', 'fallat']);
    expect(rebudes).toHaveLength(0);
    expect(darrersEnviaments()).toHaveLength(1);
  });

  test('dues visites seguides a la mateixa ruta: un sol POST i una sola entrada', async () => {
    const { final, para } = escoltaEstats();
    try {
      expect(registraVisita('/mercat?filtre=oli', { cfg: cfgDe(port) })).toMatchObject({ enviat: true, verificacio: 'intent' });
      expect(registraVisita('/mercat#oferta', { cfg: cfgDe(port) })).toMatchObject({ enviat: false, motiu: 'repetida' });
      expect(await final()).toBe('acceptat');
    } finally { para(); }
    expect(rebudes).toHaveLength(1);
    expect(darrersEnviaments()).toHaveLength(rebudes.length);
  });
});
