import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import * as servei from './veuIaiaService.js';

const WAV_FIXTURE = Uint8Array.from(atob('UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQIAAAAAAA=='), char => char.charCodeAt(0));
const PUNT = 'https://veu.test/tts';
let audios, synth, enunciats, fetchFals, sessions;
const diferit = () => { let resolve, reject; const promise = new Promise((r, j) => { resolve = r; reject = j; }); return { promise, resolve, reject }; };
const microtasques = async () => { for (let i = 0; i < 16; i += 1) await Promise.resolve(); };
const sessio = (opcions = {}) => { const s = servei.creaSessioVeu(opcions); sessions.push(s); return s; };
beforeEach(() => {
  sessions = []; audios = []; enunciats = [];
  servei.reiniciaVeuPerProves(); servei.fixaPuntNode0(PUNT);
  synth = {
    speaking: false, pending: false, getVoices: () => [{ lang: 'ca-ES' }],
    speak: vi.fn((u) => { enunciats.push(u); synth.pending = true; }),
    cancel: vi.fn(() => { synth.speaking = false; synth.pending = false; })
  };
  window.speechSynthesis = synth;
  window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  vi.stubGlobal('Audio', class extends EventTarget {
    constructor(src = '') { super(); this.src = src; this.pause = vi.fn(); this.load = vi.fn(); audios.push(this); }
    play() { queueMicrotask(() => this.dispatchEvent(new Event('playing'))); return Promise.resolve(); }
    removeAttribute(nom) { if (nom === 'src') this.src = ''; }
    acaba() { this.dispatchEvent(new Event('ended')); }
  });
  URL.createObjectURL = vi.fn(() => `blob:${URL.createObjectURL.mock.calls.length}`);
  URL.revokeObjectURL = vi.fn();
  fetchFals = vi.fn(async (_url, opcions) => opcions.method === 'GET'
    ? { ok: true }
    : new Response(WAV_FIXTURE, { headers: { 'content-type': 'audio/wav' } }));
  vi.stubGlobal('fetch', fetchFals);
});
afterEach(() => {
  sessions.forEach((s) => s.tanca()); servei.reiniciaVeuPerProves();
  delete window.speechSynthesis; delete window.SpeechSynthesisUtterance;
  vi.unstubAllGlobals(); vi.restoreAllMocks();
});
const posts = () => fetchFals.mock.calls.filter(([, o]) => o.method === 'POST');
const iniciaNativa = (i) => { synth.speaking = true; enunciats[i].onstart?.(); };
const acabaNativa = (i) => { synth.speaking = false; synth.pending = false; enunciats[i].onend?.(); };

test('la factory exposa preparació, parla i tancament explícit sense començar a parlar', () => {
  expect(typeof servei.creaSessioVeu).toBe('function');
  const s = sessio();
  expect(typeof s.precarregaVeu).toBe('function'); expect(typeof s.parla).toBe('function'); expect(typeof s.tanca).toBe('function');
  expect(servei.estaParlant()).toBe(false); expect(fetchFals).not.toHaveBeenCalled();
});

test('privat:true i auto_navegador no fan ni salut ni POST durant precàrrega o parla', async () => {
  for (const opcions of [{ privat: true }, { veu: servei.VEU_AUTO_NAVEGADOR }]) {
    const s = sessio(opcions); await s.precarregaVeu('Privat.');
    const parlant = s.parla('Privat.'); parlant.catch(() => {});
    await microtasques(); const i = enunciats.length - 1; iniciaNativa(i); acabaNativa(i); await parlant; s.tanca();
  }
  expect(fetchFals).not.toHaveBeenCalled();
});

test('precàrrega deduplicada no reproduïx ni marca inici; parlar consumix el mateix àudio sense altre POST', async () => {
  const s = sessio({ veu: 'arnau_valencia' }); const onInici = vi.fn();
  await Promise.all([s.precarregaVeu('Títol'), s.precarregaVeu('Títol')]);
  expect(posts()).toHaveLength(1); expect(audios).toHaveLength(0); expect(URL.createObjectURL).not.toHaveBeenCalled(); expect(servei.estaParlant()).toBe(false);
  const parlant = s.parla('Títol', { onInici });
  await vi.waitFor(() => expect(onInici).toHaveBeenCalledOnce());
  expect(posts()).toHaveLength(1); expect(JSON.parse(posts()[0][1].body)).toEqual({ text: 'Títol.', idioma: 'ca', veu: 'arnau_valencia' });
  audios[0].acaba(); await parlant;
});

test('dues locucions de la mateixa sessió són serials amb un sol Audio; cada URL es revoca una vegada', async () => {
  const s = sessio(); const a = s.parla('Primer.'); const b = s.parla('Segon.');
  await vi.waitFor(() => expect(audios).toHaveLength(1));
  expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  audios[0].acaba(); await a;
  await vi.waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(2));
  expect(audios).toHaveLength(1); audios[0].acaba(); await b; s.tanca();
  expect(posts()).toHaveLength(2);
  expect(URL.revokeObjectURL.mock.calls.map(([url]) => url).sort()).toEqual(['blob:1', 'blob:2']);
});

test('precàrregues en curs ocupen com a màxim quatre slots, també si la xarxa no torna', async () => {
  const pendents = [];
  fetchFals.mockImplementation(async (_url, o) => {
    if (o.method === 'GET') return { ok: true };
    const p = diferit(); pendents.push(p); return p.promise;
  });
  const s = sessio();
  const preparacions = Array.from({ length: 9 }, (_, i) => s.precarregaVeu(`Títol ${i}.`).catch(() => false));
  await microtasques(); expect(posts().length).toBeLessThanOrEqual(4); expect(posts().length).toBeGreaterThan(0);
  s.tanca(); await Promise.all(preparacions);
  expect(audios).toHaveLength(0);
});

test('quatre precàrregues pendents no obrin una cinquena connexió per una demanda diferent', async () => {
  fetchFals.mockImplementation((_url, o) => o.method === 'GET' ? Promise.resolve({ ok: true }) : new Promise(() => {}));
  const s = sessio();
  const futures = Array.from({ length: 4 }, (_, i) => s.precarregaVeu(`Futur ${i}.`).catch(() => false));
  await vi.waitFor(() => expect(posts()).toHaveLength(4));
  const actual = s.parla('Demanda fora de la finestra.'); actual.catch(() => {});
  await vi.waitFor(() => expect(enunciats).toHaveLength(1));
  expect(posts()).toHaveLength(4);
  iniciaNativa(0); acabaNativa(0); await actual; s.tanca(); await Promise.all(futures);
});

test('l’entrada pública precarregaVeu alimenta la pròxima parla amb el mateix context', async () => {
  await servei.precarregaVeu('Preparada.', { idioma: 'es', veu: 'arnau_valencia' });
  const parlant = servei.parla('Preparada.', { idioma: 'es', veu: 'arnau_valencia' });
  await vi.waitFor(() => expect(audios).toHaveLength(1)); audios[0].acaba(); await parlant;
  expect(posts()).toHaveLength(1); expect(JSON.parse(posts()[0][1].body).idioma).toBe('es');
});

test('canviar preferència buida una precàrrega implícita, inclús si tenia una veu explícita', async () => {
  await servei.precarregaVeu('Preferència nova.', { veu: 'arnau_valencia' });
  servei.desaVeuPreferida('gina_valencia');
  const parlant = servei.parla('Preferència nova.', { veu: 'arnau_valencia' });
  await vi.waitFor(() => expect(audios).toHaveLength(1)); audios[0].acaba(); await parlant;
  expect(posts()).toHaveLength(2);
});

test('un bloc llarg només anticipa el primer fragment i no sintetitza el paràgraf sencer de colp', async () => {
  const s = sessio();
  await s.precarregaVeu(Array.from({ length: 20 }, (_, i) => `Frase ${i} de la pàgina amb moltes paraules.`).join(' '));
  expect(posts()).toHaveLength(1);
  expect(JSON.parse(posts()[0][1].body).text.length).toBeLessThanOrEqual(240);
});

test('tancar amb resposta tardana d’un fetch que ignora abort no crea Audio ni objectURL', async () => {
  const pendent = diferit();
  fetchFals.mockImplementation((_url, o) => o.method === 'GET' ? Promise.resolve({ ok: true }) : pendent.promise);
  const s = sessio(); const parlant = s.parla('Antic.'); parlant.catch(() => {});
  await vi.waitFor(() => expect(posts()).toHaveLength(1)); s.tanca();
  await expect(parlant).rejects.toMatchObject({ codi: servei.CODI_VEU_AVORTADA });
  pendent.resolve(new Response(WAV_FIXTURE, { headers: { 'content-type': 'audio/wav' } }));
  await microtasques(); expect(audios).toHaveLength(0); expect(URL.createObjectURL).not.toHaveBeenCalled();
});

test('senyal ja avortat evita xarxa i so, també en precàrrega', async () => {
  const c = new AbortController(); c.abort(); const s = sessio({ signal: c.signal });
  await s.precarregaVeu('Cancel·lat.').catch(() => {});
  await expect(s.parla('Cancel·lat.')).rejects.toMatchObject({ codi: servei.CODI_VEU_AVORTADA });
  expect(fetchFals).not.toHaveBeenCalled(); expect(audios).toHaveLength(0); expect(synth.speak).not.toHaveBeenCalled();
});

test('la cua nativa encola abans de naturalend, informa només onstart i no fa cancel fred', async () => {
  const s = sessio({ privat: true }); const iniciaA = vi.fn(), iniciaB = vi.fn();
  const a = s.parla('Primer.', { onInici: iniciaA }); const b = s.parla('Segon.', { onInici: iniciaB });
  await vi.waitFor(() => expect(synth.speak).toHaveBeenCalledTimes(2));
  expect(iniciaA).not.toHaveBeenCalled(); expect(iniciaB).not.toHaveBeenCalled(); expect(synth.cancel).not.toHaveBeenCalled();
  iniciaNativa(0); expect(iniciaA).toHaveBeenCalledOnce(); expect(iniciaB).not.toHaveBeenCalled();
  acabaNativa(0); await a; iniciaNativa(1); acabaNativa(1); await b; s.tanca();
  expect(synth.cancel).not.toHaveBeenCalled(); expect(iniciaB).toHaveBeenCalledOnce();
});

test('el navegador només manté dos enunciats natius en cua, també en un text llarg', async () => {
  const s = sessio({ privat: true }); const parlant = s.parla('Una frase de prova prou llarga per a omplir diversos fragments. '.repeat(80)); parlant.catch(() => {});
  await vi.waitFor(() => expect(enunciats).toHaveLength(2));
  iniciaNativa(0); acabaNativa(0);
  expect(enunciats).toHaveLength(3);
  s.tanca(); await expect(parlant).rejects.toMatchObject({ codi: servei.CODI_VEU_AVORTADA });
});

test('l’error síncron de play revoca l’URL i passa al navegador sense deixar la promesa penjada', async () => {
  vi.stubGlobal('Audio', class extends EventTarget {
    constructor() { super(); this.src = ''; this.pause = () => {}; }
    play() { throw new Error('autoplay'); }
  });
  const s = sessio(); const parlant = s.parla('Fallback.'); parlant.catch(() => {});
  await vi.waitFor(() => expect(enunciats).toHaveLength(1));
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
  iniciaNativa(0); acabaNativa(0); await parlant;
});

test('un setter src que falla després de crear URL també la revoca exactament una vegada', async () => {
  vi.stubGlobal('Audio', class extends EventTarget {
    set src(_valor) { throw new Error('No es pot assignar src'); }
    pause() {}
  });
  const s = sessio(); const parlant = s.parla('No fuita.'); parlant.catch(() => {});
  await vi.waitFor(() => expect(enunciats).toHaveLength(1));
  expect(URL.revokeObjectURL.mock.calls).toEqual([['blob:1']]);
  iniciaNativa(0); acabaNativa(0); await parlant; s.tanca();
  expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
});

test('una veu aliena substituïx la sessió; tancar la sessió antiga no talla la nova', async () => {
  const a = sessio({ privat: true }); const antiga = a.parla('Antiga.'); antiga.catch(() => {});
  await vi.waitFor(() => expect(enunciats).toHaveLength(1)); iniciaNativa(0);
  const b = sessio({ privat: true }); const nova = b.parla('Nova.'); nova.catch(() => {});
  await expect(antiga).rejects.toMatchObject({ codi: servei.CODI_VEU_AVORTADA });
  await vi.waitFor(() => expect(enunciats).toHaveLength(2)); const cancelAbans = synth.cancel.mock.calls.length;
  a.tanca(); expect(synth.cancel).toHaveBeenCalledTimes(cancelAbans);
  iniciaNativa(1); acabaNativa(1); await nova;
});

test('aturar una cua nativa rebutja també els futurs i cancel·la una sola vegada', async () => {
  const s = sessio({ privat: true }); const a = s.parla('Primer.'), b = s.parla('Segon.'); a.catch(() => {}); b.catch(() => {});
  await vi.waitFor(() => expect(enunciats).toHaveLength(2)); iniciaNativa(0); servei.atura();
  await expect(a).rejects.toMatchObject({ codi: servei.CODI_VEU_AVORTADA }); await expect(b).rejects.toMatchObject({ codi: servei.CODI_VEU_AVORTADA });
  expect(synth.cancel).toHaveBeenCalledOnce(); expect(servei.estaParlant()).toBe(false);
});
