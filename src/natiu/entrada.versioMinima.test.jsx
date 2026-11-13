/* P0-23 (BOT-A2; Gauntlet Claude 261025_1705; rebasat a l'assalt 261101) · La
   porta de versió mínima de l'app nativa: els tres camins de l'entrada (una app més vella que el mínim
   pinta «Cal actualitzar l'app»; la mateixa versió o una de més nova entra;
   un error, la capacitat absent o una arrencada fallida entren igual), la web
   que no pregunta mai, la pantalla (textos per t() i enllaços https) i la
   guarda de VERSIO_CLIENT_NATIU contra el versionCode d'Android. Com
   entrada.test.jsx: host.js i l'App no pinten res i s'espien; el port només
   simula la capacitat 'versioClient'; tot és sintètic. Rebasat sobre l'entrada
   amb TE-05: el dispositiu parla una llengua que l'app no té ('oc') i l'App es
   pinta a l'acte; un cas propi prova la pantalla en la llengua del dispositiu. */
import '../../tests/helpers/diccionaris.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { VERSIO_CLIENT_NATIU } from '../data/contracte.js';
import { LANGUAGE_STORAGE_KEY, desaIdiomaTriat } from '../config/i18n.js';
import { delVal } from '../config/storage.js';
import CalActualitzarDeDalt from './CalActualitzar.jsx';
import { bloqueigDeVersio, enllacSegur } from './versioMinima.js';

vi.hoisted(() => {
  for (const [variable, valor] of Object.entries({
    VITE_SUPABASE_URL: 'https://paquet.supabase.test',
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_del_paquet',
    VITE_TENANT_ID: '11111111-1111-4111-8111-111111111111'
  })) vi.stubEnv(variable, valor);
});
const pintats = vi.hoisted(() => []);
/* TE-05 · La llengua del dispositiu (navigator.languages del WebView): 'oc' no la parla l'app. */
const dispositiu = vi.hoisted(() => ({ llengues: ['oc'] }));
/* El port: només la capacitat 'versioClient' és simulada; la resta, la de veres. */
const porta = vi.hoisted(() => ({ capacitat: true, resposta: null, fallada: null, crides: [] }));

vi.mock('../host.js', () => ({ configura: vi.fn(), arrenca: vi.fn(async () => ({ fase: 'segellat' })), arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('react-dom/client', () => ({ createRoot: () => ({ render: (node) => pintats.push(node) }) }));
vi.mock('../PedraSecaEmbed.jsx', () => ({ default: () => null }));
vi.mock('../css/index.css?inline', () => ({ default: '' }));
vi.mock('@capgo/capacitor-social-login', () => ({ SocialLogin: { initialize: vi.fn(), login: vi.fn(), logout: vi.fn() } }));
vi.mock('../data/backendPort.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    teCapacitat: (cap) => (cap === 'versioClient' ? porta.capacitat : original.teCapacitat(cap)),
    versioMinimaClient: async (...args) => {
      porta.crides.push(args);
      if (porta.fallada) throw porta.fallada;
      return porta.resposta;
    }
  };
});

const PLAY = 'https://play.google.com/store/apps/details?id=org.socdepoble.app';
const CAPA_NATIVA = Object.freeze({
  supabaseUrl: 'https://paquet.supabase.test',
  supabaseAnonKey: 'sb_publishable_del_paquet',
  dataMode: 'remote',
  tenantId: '11111111-1111-4111-8111-111111111111'
});
const unTorn = () => new Promise((resolve) => { setTimeout(resolve, 0); });

/** Avalua l'entrada en un registre de mòduls nou, a la plataforma donada. */
async function avalua(plataforma) {
  vi.resetModules();
  pintats.length = 0;
  if (plataforma) vi.stubGlobal('Capacitor', { getPlatform: () => plataforma });
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'root' }));
  await import('./entrada.jsx');
  return { CalActualitzar: (await import('./CalActualitzar.jsx')).default };
}

/** Espera que la porta haja preguntat (o que no ho faça mai) i un torn més. */
async function esperaLaPorta(crides = 1) {
  await vi.waitFor(() => expect(porta.crides).toHaveLength(crides));
  await unTorn();
}

beforeEach(() => {
  Object.assign(porta, { capacitat: true, resposta: null, fallada: null, crides: [] });
  dispositiu.llengues = ['oc'];
  Object.defineProperty(window.navigator, 'languages', { configurable: true, get: () => dispositiu.llengues });
  Object.defineProperty(window.navigator, 'language', { configurable: true, get: () => dispositiu.llengues[0] ?? '' });
});
afterAll(() => {
  delete window.navigator.languages;
  delete window.navigator.language;
});
afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
  vi.clearAllMocks();
  delVal(LANGUAGE_STORAGE_KEY);
});

describe('P0-23 · els tres camins de l’entrada nativa', () => {
  test('una app més vella que el mínim pinta «Cal actualitzar l’app» en lloc de l’App, amb l’enllaç del node', async () => {
    porta.resposta = { versioMinima: VERSIO_CLIENT_NATIU + 1, enllac: PLAY };
    const { CalActualitzar } = await avalua('android');
    await vi.waitFor(() => expect(pintats).toHaveLength(2));
    expect(porta.crides).toEqual([['android', CAPA_NATIVA]]);
    // Primer l'App, que no espera la resposta; després la pantalla, en lloc seu.
    expect(pintats[0].props.isFirstInstance).toBe(true);
    expect(pintats[1].type).toBe(CalActualitzar);
    expect(pintats[1].props).toEqual({ enllac: PLAY, amfitrio: null });
  });

  test('a iOS sense enllaç (o amb un que no és https) la pantalla ix igual, sense botó de botiga', async () => {
    porta.resposta = { versioMinima: VERSIO_CLIENT_NATIU + 5, enllac: 'javascript:alert(1)' };
    const { CalActualitzar } = await avalua('ios');
    await vi.waitFor(() => expect(pintats).toHaveLength(2));
    expect(porta.crides).toEqual([['ios', CAPA_NATIVA]]);
    expect(pintats[1].type).toBe(CalActualitzar);
    expect(pintats[1].props).toEqual({ enllac: null, amfitrio: null });
  });

  /* TE-05 · La pantalla parla la llengua de l'App: la del dispositiu quan no n'hi ha cap de triada. */
  test('amb el telèfon en castellà, la pantalla rep la llengua del dispositiu i parla castellà', async () => {
    dispositiu.llengues = ['es-ES'];
    porta.resposta = { versioMinima: VERSIO_CLIENT_NATIU + 1, enllac: PLAY };
    const { CalActualitzar } = await avalua('android');
    const { carregaDiccionari } = await import('../config/i18n.js');
    await carregaDiccionari('es');
    await vi.waitFor(() => expect(pintats).toHaveLength(2));
    expect(pintats[0].props.config.language).toBe('es');
    expect(pintats[1].type).toBe(CalActualitzar);
    expect(pintats[1].props).toEqual({ enllac: PLAY, amfitrio: 'es' });
    const html = renderToStaticMarkup(pintats[1]);
    expect(html).toContain('Hay que actualizar la app');
    expect(html).toContain('Actualizar la app');
  });

  test('la mateixa versió, una de més nova o cap mínim: entra, i l’App es pinta una sola vegada', async () => {
    for (const resposta of [{ versioMinima: VERSIO_CLIENT_NATIU, enllac: PLAY }, { versioMinima: 1, enllac: null }, null]) {
      porta.crides = [];
      porta.resposta = resposta;
      await avalua('android');
      await esperaLaPorta();
      expect(pintats, JSON.stringify(resposta)).toHaveLength(1);
      expect(pintats[0].props.isFirstInstance).toBe(true);
    }
  });

  test('un error del node o una resposta que no s’entén: entra igual (fail-open) i ho diu per la consola', async () => {
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      porta.fallada = Object.assign(new Error('Supabase 500: error intern'), { status: 500 });
      await avalua('ios');
      await esperaLaPorta();
      expect(pintats).toHaveLength(1);
      expect(avis).toHaveBeenCalledWith('[natiu] No s’ha pogut saber la versió mínima; l’app entra igual:', 'Supabase 500: error intern');
      for (const resposta of [{ versioMinima: '99' }, { versioMinima: 1.5 }, 'tres', []]) {
        Object.assign(porta, { fallada: null, resposta, crides: [] });
        await avalua('ios');
        await esperaLaPorta();
        expect(pintats, JSON.stringify(resposta)).toHaveLength(1);
      }
    } finally {
      avis.mockRestore();
    }
  });

  test('sense la capacitat, o amb una arrencada fallida, no pregunta res i l’App queda com està', async () => {
    porta.capacitat = false;
    porta.resposta = { versioMinima: VERSIO_CLIENT_NATIU + 1, enllac: PLAY };
    await avalua('android');
    await unTorn();
    expect(porta.crides).toEqual([]);
    expect(pintats).toHaveLength(1);

    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const senseAmo = vi.fn();
    process.on('unhandledRejection', senseAmo);
    try {
      porta.capacitat = true;
      const fallada = new Error('tros caigut');
      (await import('../host.js')).arrenca.mockRejectedValueOnce(fallada);
      await avalua('android');
      await unTorn();
      await unTorn();
      expect(error).toHaveBeenCalledWith('[natiu] Arrencada fallida:', fallada);
      expect(porta.crides).toEqual([]);
      expect(pintats).toHaveLength(1);
      expect(senseAmo).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', senseAmo);
      error.mockRestore();
    }
  });

  test('sense el pont de l’app (la web), no pregunta mai, encara que el node bloquejara', async () => {
    porta.resposta = { versioMinima: VERSIO_CLIENT_NATIU + 1, enllac: PLAY };
    await avalua(null);
    await unTorn();
    await unTorn();
    expect(porta.crides).toEqual([]);
    expect(pintats).toHaveLength(1);
  });
});

describe('P0-23 · la porta, pura', () => {
  const port = (resposta, { capacitat = true } = {}) => ({
    teCapacitat: vi.fn((cap) => capacitat && cap === 'versioClient'),
    versioMinimaClient: vi.fn(async () => (resposta instanceof Error ? Promise.reject(resposta) : resposta))
  });

  test('bloqueja només si el mínim és un enter més gran que la versió del client', async () => {
    expect(await bloqueigDeVersio({ plataforma: 'android', config: {}, versio: 2, port: port({ versioMinima: 3, enllac: PLAY }) }))
      .toEqual({ versioMinima: 3, enllac: PLAY });
    for (const versioMinima of [2, 1, '3', 3.5, null, undefined, Number.NaN]) {
      expect(await bloqueigDeVersio({ plataforma: 'android', config: {}, versio: 2, port: port({ versioMinima, enllac: PLAY }) }), String(versioMinima)).toBeNull();
    }
    expect(await bloqueigDeVersio({ plataforma: 'ios', config: {}, versio: 2, port: port(null) })).toBeNull();
  });

  test('cap plataforma que no siga iOS o Android pregunta; sense capacitat tampoc; un rebuig és null', async () => {
    for (const plataforma of ['web', 'wordpress', '', undefined]) {
      const p = port({ versioMinima: 99, enllac: null });
      expect(await bloqueigDeVersio({ plataforma, config: {}, port: p }), String(plataforma)).toBeNull();
      expect(p.teCapacitat).not.toHaveBeenCalled();
    }
    const sense = port({ versioMinima: 99, enllac: null }, { capacitat: false });
    expect(await bloqueigDeVersio({ plataforma: 'ios', config: {}, port: sense })).toBeNull();
    expect(sense.versioMinimaClient).not.toHaveBeenCalled();
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(await bloqueigDeVersio({ plataforma: 'ios', config: {}, port: port(new Error('tall')) })).toBeNull();
      const llança = { teCapacitat: () => { throw new Error('port trencat'); }, versioMinimaClient: vi.fn() };
      expect(await bloqueigDeVersio({ plataforma: 'ios', config: {}, port: llança })).toBeNull();
      expect(avis).toHaveBeenCalledTimes(2);
    } finally {
      avis.mockRestore();
    }
    expect(await bloqueigDeVersio()).toBeNull();
  });

  test('l’enllaç: només una adreça https; la resta, null', () => {
    expect(enllacSegur(PLAY)).toBe(PLAY);
    expect(enllacSegur('https://apps.apple.com/app/id1')).toBe('https://apps.apple.com/app/id1');
    for (const valor of ['javascript:alert(1)', 'http://play.google.com/', 'itms-beta://x', 'data:text/html,hola', '/relatiu', 'https://', '', null, 7, { href: PLAY },
      `https://a.test/${'x'.repeat(2048)}`]) {
      expect(enllacSegur(valor), String(valor).slice(0, 40)).toBeNull();
    }
  });
});

describe('P0-23 · la pantalla «Cal actualitzar l’app»', () => {
  test('textos per t(), l’enllaç de la botiga i el de la web, que s’obrin fora de l’app', () => {
    const html = renderToStaticMarkup(<CalActualitzarDeDalt enllac={PLAY} />);
    expect(html).toContain('<main class="sdp-buit sdp-cal-actualitzar" aria-labelledby="sdp-cal-actualitzar-titol">');
    expect(html).toContain('<h2 id="sdp-cal-actualitzar-titol" tabindex="-1" class="sdp-buit__titol">Cal actualitzar l’app</h2>');
    expect(html).toContain('ja no s’entén amb el servidor de poble');
    expect(html).toContain(`<a class="sdp-boto sdp-boto--primari sdp-boto--gran" href="${PLAY}" target="_blank" rel="noopener noreferrer">Actualitza l’app</a>`);
    expect(html).toMatch(/<a class="sdp-boto sdp-boto--fantasma" href="https?:\/\/[^"]+" target="_blank" rel="noopener noreferrer">Obri Sóc de Poble al navegador<\/a>/);
    /* Cap capçalera de primer nivell fora de la de pàgina (Pedra Seca §4). El
       nom es compon a trossos: design_guard llig les fonts com a marcatge. */
    expect(html.includes(['<', 'h1'].join(''))).toBe(false);
  });

  test('la llengua del dispositiu (amfitrio) quan no n’hi ha cap de triada; la triada hi guanya', () => {
    const basc = renderToStaticMarkup(<CalActualitzarDeDalt enllac={PLAY} amfitrio="eu" />);
    expect(basc).toContain('Aplikazioa eguneratu behar da');
    expect(desaIdiomaTriat('gl')).toBe(true);
    const gallec = renderToStaticMarkup(<CalActualitzarDeDalt enllac={PLAY} amfitrio="eu" />);
    expect(gallec).toContain('Cómpre actualizar a app');
  });

  test('sense enllaç de botiga, només la web; en la llengua triada', () => {
    expect(desaIdiomaTriat('es')).toBe(true);
    const html = renderToStaticMarkup(<CalActualitzarDeDalt enllac={null} />);
    expect(html).toContain('Hay que actualizar la app');
    expect(html).toContain('Abrir Sóc de Poble en el navegador');
    expect(html).not.toContain('sdp-boto--primari');
  });

  /* Arriba tard i sense avís, quan la persona potser ja escrivia dins de
     l'App: en muntar-se, el focus va al títol (el lector anuncia el canvi).
     Amb el react-dom de veres: el d'este fitxer només apunta què es pinta. */
  test('en muntar-se, el focus passa del camp de l’App al títol de la pantalla', async () => {
    const { createRoot } = await vi.importActual('react-dom/client');
    const actiu = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const camp = document.body.appendChild(document.createElement('input'));
    camp.focus();
    expect(document.activeElement).toBe(camp);
    const lloc = document.body.appendChild(document.createElement('div'));
    const arrel = createRoot(lloc);
    try {
      camp.remove();
      await act(async () => { arrel.render(<CalActualitzarDeDalt enllac={PLAY} />); });
      const titol = lloc.querySelector('h2');
      expect(titol.textContent).toBe('Cal actualitzar l’app');
      expect(document.activeElement).toBe(titol);
    } finally {
      act(() => arrel.unmount());
      globalThis.IS_REACT_ACT_ENVIRONMENT = actiu;
    }
  });
});

describe('P0-23 · la versió del client', () => {
  /* VERSIO_CLIENT_NATIU puja a cada build de botiga. El versionCode
     d'android/app/build.gradle (el --build de puja-android.mjs) no la pot
     passar mai: una app nova amb la versió vella es bloquejaria ella mateixa
     quan el servidor demanara la nova. */
  test('és un enter ≥ 2 i no queda mai per davall del versionCode d’Android', () => {
    expect(Number.isSafeInteger(VERSIO_CLIENT_NATIU) && VERSIO_CLIENT_NATIU >= 2).toBe(true);
    const gradle = readFileSync(path.join(process.cwd(), 'android/app/build.gradle'), 'utf8');
    const versionCode = Number(/^\s*versionCode\s+(\d+)\s*$/m.exec(gradle)?.[1]);
    expect(Number.isSafeInteger(versionCode)).toBe(true);
    expect(VERSIO_CLIENT_NATIU).toBeGreaterThanOrEqual(versionCode);
  });
});
