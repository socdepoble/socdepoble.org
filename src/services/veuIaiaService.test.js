/* IDEA-108 (261106) · La veu de la IAIA: servei amb speechSynthesis, fetch i
   Audio simulats. Cap xarxa de veres. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CODI_VEU_AVORTADA,
  creaSessioVeu,
  CODI_VEU_NO_DISPONIBLE,
  TEMPS_LIMIT_NODE0_MS,
  atura,
  desaVeuPreferida,
  estaParlant,
  fixaPuntNode0,
  normalitzaPerVeu,
  parla,
  puntNode0,
  reiniciaVeuPerProves,
  triaVeu,
  veuDisponible,
} from './veuIaiaService.js';

const PUNT = 'https://veu.exemple.test/api/v1/node0/veu';

function instalaSintesi(veus = [{ lang: 'ca-ES', name: 'Montserrat' }], { alParlar } = {}) {
  const parlat = [];
  const synth = {
    getVoices: () => veus,
    cancel: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    speak: vi.fn((enunciat) => {
      parlat.push(enunciat);
      if (alParlar) alParlar(enunciat);
      else queueMicrotask(() => enunciat.onend?.());
    }),
  };
  window.speechSynthesis = synth;
  window.SpeechSynthesisUtterance = function Enunciat(text) { this.text = text; };
  return { synth, parlat };
}

let audios;
function instalaAudio({ error = false } = {}) {
  audios = [];
  globalThis.Audio = function AudioFals(adreca) {
    const oients = {};
    this.adreca = adreca;
    this.pause = vi.fn();
    this.addEventListener = (nom, fn) => { oients[nom] = fn; };
    this.play = () => {
      queueMicrotask(() => (error ? oients.error?.() : oients.ended?.()));
      return Promise.resolve();
    };
    audios.push(this);
  };
  URL.createObjectURL = vi.fn(() => 'blob:fals');
  URL.revokeObjectURL = vi.fn();
}

const WAV_FIXTURE = Uint8Array.from(atob('UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQIAAAAAAA=='), char => char.charCodeAt(0));
const respostaAudio = (tipus = 'audio/wav') => new Response(WAV_FIXTURE, { headers: { 'content-type': tipus } });

beforeEach(() => {
  reiniciaVeuPerProves();
});
afterEach(() => {
  reiniciaVeuPerProves();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
});

describe('normalitzaPerVeu', () => {
  test('lleva el Markdown, els emojis i col·lapsa espais', () => {
    const net = normalitzaPerVeu('# Títol\n\n**Hola**   _món_ 👵🏽 amb [un enllaç](https://exemple.test/x) i `codi`.\n- primer\n- segon', 'ca');
    expect(net).toBe('Títol. Hola món amb un enllaç i codi. primer. segon.');
  });

  test('desplega les abreviatures segons l’idioma', () => {
    expect(normalitzaPerVeu('Viu al c/ Major, núm. 4, pàg. 2 (p. ex. ací).', 'ca'))
      .toBe('Viu al carrer Major, número 4, pàgina 2 (per exemple ací).');
    expect(normalitzaPerVeu('Vive en c/ Mayor, núm. 4 (p. ej. aquí).', 'es'))
      .toBe('Vive en calle Mayor, número 4 (por ejemplo aquí).');
    expect(normalitzaPerVeu('Tom & Jerry', 'en')).toBe('Tom and Jerry.');
  });

  test('V-04 · «etc.» conserva el punt darrere d’«etcètera» i «or.» ja no és una abreviatura basca', () => {
    expect(normalitzaPerVeu('Cebes, tomaques, etc.', 'ca')).toBe('Cebes, tomaques, etcètera.');
    expect(normalitzaPerVeu('Cebes, etc. i més', 'ca')).toBe('Cebes, etcètera. i més.');
    expect(normalitzaPerVeu('Tomates, etc.', 'es')).toBe('Tomates, etcétera.');
    expect(normalitzaPerVeu('Tomatoes, etc.', 'en')).toBe('Tomatoes, et cetera.');
    expect(normalitzaPerVeu('Mugako or. zehatza', 'eu')).toBe('Mugako or. zehatza.');
  });

  test('no toca paraules que només contenen l’abreviatura', () => {
    expect(normalitzaPerVeu('El tarc/ca i el cosa', 'ca')).toBe('El tarc/ca i el cosa.');
  });

  test('aplica el lèxic revisable i ignora les entrades que no són text', () => {
    expect(normalitzaPerVeu('Hola, IAIA!', 'ca')).toBe('Hola, iaia!');
    expect(normalitzaPerVeu('', 'ca')).toBe('');
    expect(normalitzaPerVeu(null, 'ca')).toBe('');
    expect(normalitzaPerVeu('Hola', 'xx')).toBe('Hola.');
  });

  test('és pura: dues crides donen el mateix', () => {
    const text = 'Pregunta núm. 3 🌱';
    expect(normalitzaPerVeu(text, 'ca')).toBe(normalitzaPerVeu(text, 'ca'));
  });
});

describe('triaVeu', () => {
  const veus = [
    { lang: 'es_ES', name: 'a' },
    { lang: 'ca-ES', name: 'b' },
    { lang: 'ca-ES-valencia', name: 'c' },
    { lang: 'en-US', name: 'd' },
    { lang: 'ca-AD', name: 'e' },
  ];
  test('prefereix ca-ES-valencia, després ca-ES, després ca*', () => {
    expect(triaVeu(veus, 'ca').name).toBe('c');
    expect(triaVeu(veus.filter((v) => v.name !== 'c'), 'ca').name).toBe('b');
    expect(triaVeu(veus.filter((v) => v.name === 'e'), 'ca').name).toBe('e');
  });
  test('accepta el guionet baix i les altres llengües', () => {
    expect(triaVeu(veus, 'es').name).toBe('a');
    expect(triaVeu(veus, 'en').name).toBe('d');
    expect(triaVeu(veus, 'eu')).toBeNull();
  });
});

describe('veuIaiaService · navegador', () => {
  test('parla amb la veu valenciana i resol en acabar', async () => {
    const { parlat } = instalaSintesi([{ lang: 'ca-ES', name: 'x' }, { lang: 'ca-ES-valencia', name: 'v' }]);
    await parla('Hola **món**', { idioma: 'ca' });
    expect(parlat).toHaveLength(1);
    expect(parlat[0].text).toBe('Hola món.');
    expect(parlat[0].voice.name).toBe('v');
    expect(parlat[0].lang).toBe('ca-ES-valencia');
    expect(estaParlant()).toBe(false);
  });

  test('sense síntesi: VEU_NO_DISPONIBLE i veuDisponible és false', async () => {
    expect(veuDisponible()).toBe(false);
    await expect(parla('Hola')).rejects.toMatchObject({ codi: CODI_VEU_NO_DISPONIBLE });
  });

  test('espera voiceschanged si les veus arriben tard', async () => {
    const veus = [];
    const { synth, parlat } = instalaSintesi(veus);
    synth.addEventListener = vi.fn((nom, fn) => {
      if (nom === 'voiceschanged') setTimeout(() => { veus.push({ lang: 'ca-ES', name: 'tard' }); fn(); }, 5);
    });
    await parla('Hola');
    expect(parlat[0].voice.name).toBe('tard');
  });

  test('atura() rebutja la locució en curs amb VEU_AVORTADA', async () => {
    const { synth } = instalaSintesi(undefined, { alParlar: () => {} });
    const promesa = parla('Hola');
    await vi.waitFor(() => expect(estaParlant()).toBe(true));
    await vi.waitFor(() => expect(synth.speak).toHaveBeenCalled());
    atura();
    await expect(promesa).rejects.toMatchObject({ codi: CODI_VEU_AVORTADA });
    expect(estaParlant()).toBe(false);
  });

  test('un signal ja cancel·lat o cancel·lat durant la locució avorta', async () => {
    instalaSintesi(undefined, { alParlar: () => {} });
    const ja = new AbortController();
    ja.abort();
    await expect(parla('Hola', { signal: ja.signal })).rejects.toMatchObject({ codi: CODI_VEU_AVORTADA });
    const control = new AbortController();
    const promesa = parla('Hola', { signal: control.signal });
    await vi.waitFor(() => expect(window.speechSynthesis.speak).toHaveBeenCalled());
    control.abort();
    await expect(promesa).rejects.toMatchObject({ codi: CODI_VEU_AVORTADA });
  });

  /* Onada R29 · R29-CV-04 · L'espècimen de /disseny només avorta el signal en desmuntar-se: la
     síntesi del navegador també ha de callar, no només la promesa. */
  test('R29-CV-04 · avortar el signal de la locució vigent crida speechSynthesis.cancel()', async () => {
    const { synth } = instalaSintesi(undefined, { alParlar: () => {} });
    const control = new AbortController();
    const promesa = parla('Hola', { signal: control.signal });
    promesa.catch(() => {});
    await vi.waitFor(() => expect(synth.speak).toHaveBeenCalled());
    const cancelsAbans = synth.cancel.mock.calls.length;
    control.abort();
    expect(synth.cancel.mock.calls.length).toBeGreaterThan(cancelsAbans);
    expect(estaParlant()).toBe(false);
    await expect(promesa).rejects.toMatchObject({ codi: CODI_VEU_AVORTADA });
  });

  test('R29-CV-04 · avortar el signal d’una locució ja substituïda no talla la nova', async () => {
    const { synth } = instalaSintesi(undefined, { alParlar: () => {} });
    const control = new AbortController();
    const vella = parla('Hola', { signal: control.signal });
    vella.catch(() => {});
    await vi.waitFor(() => expect(synth.speak).toHaveBeenCalledTimes(1));
    const nova = parla('Adéu');
    nova.catch(() => {});
    const cancelsAbans = synth.cancel.mock.calls.length;
    control.abort();
    expect(synth.cancel.mock.calls.length).toBe(cancelsAbans);
    expect(estaParlant()).toBe(true);
    await expect(vella).rejects.toMatchObject({ codi: CODI_VEU_AVORTADA });
    atura();
  });

  test('un error de la síntesi és VEU_NO_DISPONIBLE; interrupted és VEU_AVORTADA', async () => {
    instalaSintesi(undefined, { alParlar: (e) => queueMicrotask(() => e.onerror({ error: 'synthesis-failed' })) });
    await expect(parla('Hola')).rejects.toMatchObject({ codi: CODI_VEU_NO_DISPONIBLE });
    instalaSintesi(undefined, { alParlar: (e) => queueMicrotask(() => e.onerror({ error: 'interrupted' })) });
    await expect(parla('Hola')).rejects.toMatchObject({ codi: CODI_VEU_AVORTADA });
  });

  test('un text buit no fa res', async () => {
    const { synth } = instalaSintesi();
    await parla('  🌱  ');
    expect(synth.speak).not.toHaveBeenCalled();
  });

  test('llig articles llargs (> 8.000 caràcters) sencers fins al final encadenant blocs sense tallar als 4.000 caràcters', async () => {
    const { parlat } = instalaSintesi([{ lang: 'ca-ES-valencia', name: 'v' }]);
    const frases = Array.from({ length: 120 }, (_, idx) => `Esta és la frase número ${idx + 1} sobre l’olivera i el Rentonar a La Torre de les Maçanes.`);
    const articleLlarg = `${frases.join(' ')} Frase final de tancament de l’article.`;
    expect(articleLlarg.length).toBeGreaterThan(8500);

    await parla(articleLlarg, { idioma: 'ca' });
    expect(parlat.length).toBeGreaterThanOrEqual(7);
    const totReproduit = parlat.map((u) => u.text).join(' ');
    expect(totReproduit).toContain('Esta és la frase número 1');
    expect(totReproduit).toContain('Frase final de tancament de l’article.');
    expect(estaParlant()).toBe(false);
  });
});

describe('veuIaiaService · Node 0', () => {
  test('per defecte no hi ha punt, i només s’accepta https', () => {
    expect(puntNode0()).toBeNull();
    fixaPuntNode0('http://192.0.2.1/veu');
    expect(puntNode0()).toBeNull();
    fixaPuntNode0('https://usuari:clau@exemple.test/veu');
    expect(puntNode0()).toBeNull();
    fixaPuntNode0(`${PUNT}/`);
    expect(puntNode0()).toBe(PUNT);
  });

  test('llig el punt de la variable de compilació', () => {
    vi.stubEnv('VITE_SDP_VEU_NODE0_URL', PUNT);
    expect(puntNode0()).toBe(PUNT);
    vi.stubEnv('VITE_SDP_VEU_NODE0_URL', 'http://exemple.test');
    expect(puntNode0()).toBeNull();
  });

  test('privat no fa cap fetch, ni tan sols la comprovació de salut', async () => {
    const fetchFals = vi.fn();
    vi.stubGlobal('fetch', fetchFals);
    fixaPuntNode0(PUNT);
    const { parlat } = instalaSintesi();
    await parla('Hola', { privat: true });
    expect(fetchFals).not.toHaveBeenCalled();
    expect(parlat).toHaveLength(1);
  });

  test('amb salut bona fa POST {text, idioma}, reprodueix i revoca el blob', async () => {
    instalaAudio();
    const { synth } = instalaSintesi();
    const fetchFals = vi.fn(async (url, opcions) => (opcions.method === 'GET' ? { ok: true } : respostaAudio()));
    vi.stubGlobal('fetch', fetchFals);
    fixaPuntNode0(PUNT);
    await parla('Hola núm. 2', { idioma: 'ca' });
    const post = fetchFals.mock.calls.find(([, o]) => o.method === 'POST');
    expect(post[0]).toBe(PUNT);
    expect(JSON.parse(post[1].body)).toEqual({ text: 'Hola número 2.', idioma: 'ca' });
    expect(post[1].credentials).toBe('omit');
    expect(audios).toHaveLength(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fals');
    expect(synth.speak).not.toHaveBeenCalled();
  });

  test('V-03 · si atura() avorta la comprovació de salut, no es desa com a dolenta', async () => {
    instalaAudio();
    instalaSintesi();
    let primera = true;
    const fetchFals = vi.fn((url, opcions) => {
      if (opcions.method !== 'GET') return Promise.resolve(respostaAudio());
      if (primera) {
        primera = false;
        return new Promise((resolve, reject) => {
          opcions.signal.addEventListener('abort', () => reject(Object.assign(new Error('abort'), { name: 'AbortError' })));
        });
      }
      return Promise.resolve({ ok: true });
    });
    vi.stubGlobal('fetch', fetchFals);
    fixaPuntNode0(PUNT);
    const primeraLocucio = parla('Una').catch((error) => error);
    atura();
    expect((await primeraLocucio).codi).toBe(CODI_VEU_AVORTADA);
    await parla('Dues');
    expect(fetchFals.mock.calls.filter(([, o]) => o.method === 'GET')).toHaveLength(2);
    expect(fetchFals.mock.calls.some(([, o]) => o.method === 'POST')).toBe(true);
  });

  test('la salut es guarda en memòria: la segona locució no torna a comprovar-la', async () => {
    instalaAudio();
    instalaSintesi();
    const fetchFals = vi.fn(async (url, opcions) => (opcions.method === 'GET' ? { ok: true } : respostaAudio()));
    vi.stubGlobal('fetch', fetchFals);
    fixaPuntNode0(PUNT);
    await parla('Una');
    await parla('Dues');
    expect(fetchFals.mock.calls.filter(([, o]) => o.method === 'GET')).toHaveLength(1);
  });

  test('si la salut falla, cau a la veu del navegador i no fa POST', async () => {
    const { parlat } = instalaSintesi();
    const fetchFals = vi.fn(async () => ({ ok: false }));
    vi.stubGlobal('fetch', fetchFals);
    fixaPuntNode0(PUNT);
    await parla('Hola');
    expect(fetchFals.mock.calls.every(([, o]) => o.method === 'GET')).toBe(true);
    expect(parlat).toHaveLength(1);
  });

  test('si el servidor es passa del temps, cau en silenci a la veu del navegador', async () => {
    vi.useFakeTimers();
    const { parlat } = instalaSintesi();
    const fetchFals = vi.fn((url, opcions) => {
      if (opcions.method === 'GET') return Promise.resolve({ ok: true });
      return new Promise((resolve, reject) => {
        opcions.signal.addEventListener('abort', () => reject(Object.assign(new Error('abort'), { name: 'AbortError' })));
      });
    });
    vi.stubGlobal('fetch', fetchFals);
    fixaPuntNode0(PUNT);
    const promesa = parla('Hola');
    await vi.advanceTimersByTimeAsync(TEMPS_LIMIT_NODE0_MS + 100);
    await promesa;
    expect(parlat).toHaveLength(1);
    expect(parlat[0].text).toBe('Hola.');
  });

  test('encadena articles llargs pel Node 0 en blocs amb la veu triada (Matxa-TTS v2) i sense caure al navegador', async () => {
    instalaAudio();
    const { synth } = instalaSintesi();
    desaVeuPreferida('arnau_valencia');
    const fetchFals = vi.fn(async (url, opcions) => (opcions.method === 'GET' ? { ok: true } : respostaAudio()));
    vi.stubGlobal('fetch', fetchFals);
    fixaPuntNode0(PUNT);

    const frases = Array.from({ length: 12 }, (_, idx) => `Frase número ${idx + 1} des de La Torre de les Maçanes sobre l’oli d’oliva i el Rentonar.`);
    await parla(frases.join(' '), { idioma: 'ca' });

    const posts = fetchFals.mock.calls.filter(([, o]) => o.method === 'POST');
    expect(posts.length).toBeGreaterThanOrEqual(4);
    for (const [, init] of posts) {
      expect(JSON.parse(init.body).veu).toBe('arnau_valencia');
    }
    expect(synth.speak).not.toHaveBeenCalled();
  });

  test('una resposta que no és àudio o un error de xarxa també cauen al navegador', async () => {
    const { parlat } = instalaSintesi();
    vi.stubGlobal('fetch', vi.fn(async (url, o) => (o.method === 'GET' ? { ok: true } : respostaAudio('text/html'))));
    fixaPuntNode0(PUNT);
    await parla('Hola');
    expect(parlat).toHaveLength(1);
    fixaPuntNode0(PUNT);
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('xarxa'); }));
    await parla('Hola');
    expect(parlat).toHaveLength(2);
  });

  test('un àudio del Node 0 que no es pot reproduir cau al navegador', async () => {
    instalaAudio({ error: true });
    const { parlat } = instalaSintesi();
    vi.stubGlobal('fetch', vi.fn(async (url, o) => (o.method === 'GET' ? { ok: true } : respostaAudio())));
    fixaPuntNode0(PUNT);
    await parla('Hola');
    expect(parlat).toHaveLength(1);
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  test('veuDisponible: el punt Node 0 compta per al públic però no per al privat', () => {
    fixaPuntNode0(PUNT);
    expect(veuDisponible()).toBe(true);
    expect(veuDisponible({ privat: true })).toBe(false);
  });
});

/* R32.11 Lot11: actual admission path, not a direct mocked parser. */
describe('Node0 bounded audio admission', () => {
  test.each(['audio/wav', 'audio/mpeg'])('refuses HTML disguised as %s during prefetch', async (mime) => {
    fixaPuntNode0(PUNT);
    vi.stubGlobal('fetch', vi.fn(async (_url, options) => options.method === 'GET' ? { ok: true }
      : new Response('<html>upstream proxy error</html>', { headers: { 'content-type': mime } })));
    const session = creaSessioVeu();
    try { await expect(session.precarregaVeu('Hola poble.')).rejects.toMatchObject({ codi: CODI_VEU_NO_DISPONIBLE }); }
    finally { session.tanca(); }
  });
  test('refuses a real response above the explicit8MiB policy before caching', async () => {
    fixaPuntNode0(PUNT);
    vi.stubGlobal('fetch', vi.fn(async (_url, options) => options.method === 'GET' ? { ok: true }
      : new Response(new Uint8Array(8 * 1024 * 1024 + 1), { headers: { 'content-type': 'audio/wav' } })));
    const session = creaSessioVeu();
    try { await expect(session.precarregaVeu('Hola poble.')).rejects.toMatchObject({ codi: CODI_VEU_NO_DISPONIBLE }); }
    finally { session.tanca(); }
  });
});

test('voice Markdown link scan stays below25ms on64KiB missing closing delimiters with identical text', () => {
  const input = '['.repeat(65536), start = performance.now();
  const actual = normalitzaPerVeu(input);
  expect(actual).toBe(input + '.');
  expect(performance.now() - start).toBeLessThan(25);
});

test('a hanging body reader times out through the actual Node0 deadline and releases its resources', async () => {
  vi.useFakeTimers(); fixaPuntNode0(PUNT);
  const reader = { read: vi.fn(() => new Promise(() => {})), cancel: vi.fn(() => new Promise(() => {})), releaseLock: vi.fn() };
  vi.stubGlobal('fetch', vi.fn(async (_url, options) => options.method === 'GET' ? { ok: true }
    : { ok: true, headers: new Headers({ 'content-type': 'audio/wav' }), body: { getReader: () => reader } }));
  const session = creaSessioVeu();
  try {
    const pending = expect(session.precarregaVeu('Termini del lector.')).rejects.toMatchObject({ codi: CODI_VEU_NO_DISPONIBLE });
    await vi.advanceTimersByTimeAsync(TEMPS_LIMIT_NODE0_MS + 1); await pending;
    expect(reader.read).toHaveBeenCalledOnce(); expect(reader.cancel).toHaveBeenCalledOnce(); expect(reader.releaseLock).toHaveBeenCalledOnce();
  } finally { session.tanca(); }
});

test('HTML under audio MIME reaches the honest browser fallback without creating a Node0 objectURL', async () => {
  fixaPuntNode0(PUNT); instalaAudio(); const { synth } = instalaSintesi();
  vi.stubGlobal('fetch', vi.fn(async (_url, options) => options.method === 'GET' ? { ok: true }
    : new Response('<html>upstream error</html>', { headers: { 'content-type': 'audio/wav' } })));
  await parla('La mateixa locució continua al navegador.');
  expect(audios).toHaveLength(0); expect(URL.createObjectURL).not.toHaveBeenCalled(); expect(synth.speak).toHaveBeenCalledOnce();
});
