// @vitest-environment node
/* Fase 0 de l'empaquetat mòbil (261003) · el registre del service worker.
   Només a l'entrada pròpia (src/main.jsx), només en producció, en context
   segur, fora d'iframe i fora de l'app nativa. Tot amb dobles: cap navegador. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test, vi } from 'vitest';
import { ABAST_DEL_SW, RUTA_DEL_SW, motiuPerNoRegistrar, registraServiceWorker } from './registre.js';

/** Un navigator i una finestra de mostra, en producció i en condicions de registrar. */
function entorn({ readyState = 'complete', segur = true, incrustat = false, capacitor, register } = {}) {
  const escoltes = new Map();
  const navegador = {
    serviceWorker: { register: register || vi.fn(async (ruta, opcions) => ({ ruta, opcions })) }
  };
  const finestra = {
    isSecureContext: segur,
    document: { readyState },
    addEventListener: vi.fn((tipus, funcio) => escoltes.set(tipus, funcio)),
    Capacitor: capacitor
  };
  finestra.self = finestra;
  finestra.top = incrustat ? {} : finestra;
  return { navegador, finestra, escoltes };
}

describe('motiuPerNoRegistrar (pura)', () => {
  test('en producció, amb suport, segur, al nivell superior i al navegador: es registra', () => {
    const { navegador, finestra } = entorn();
    expect(motiuPerNoRegistrar({ produccio: true, navegador, finestra })).toBeNull();
  });

  test('cada condició que falla té el seu motiu', () => {
    const { navegador, finestra } = entorn();
    expect(motiuPerNoRegistrar({ produccio: false, navegador, finestra })).toBe('desenvolupament');
    expect(motiuPerNoRegistrar({ produccio: undefined, navegador, finestra })).toBe('desenvolupament');
    expect(motiuPerNoRegistrar({ produccio: 'true', navegador, finestra })).toBe('desenvolupament');
    expect(motiuPerNoRegistrar({ produccio: true, navegador: {}, finestra })).toBe('sense-suport');
    expect(motiuPerNoRegistrar({ produccio: true, navegador: undefined, finestra })).toBe('sense-suport');
    expect(motiuPerNoRegistrar({ produccio: true, navegador, finestra: entorn({ segur: false }).finestra })).toBe('context-insegur');
    expect(motiuPerNoRegistrar({ produccio: true, navegador, finestra: undefined })).toBe('context-insegur');
    expect(motiuPerNoRegistrar({ produccio: true, navegador, finestra: entorn({ incrustat: true }).finestra })).toBe('incrustat');
    expect(motiuPerNoRegistrar()).toBe('desenvolupament');
  });

  test('dins de l\'app de Capacitor no es registra; Capacitor en el web, sí', () => {
    const { navegador } = entorn();
    const nativa = entorn({ capacitor: { isNativePlatform: () => true } }).finestra;
    const web = entorn({ capacitor: { isNativePlatform: () => false } }).finestra;
    const estrany = entorn({ capacitor: { isNativePlatform: true } }).finestra;
    expect(motiuPerNoRegistrar({ produccio: true, navegador, finestra: nativa })).toBe('nativa');
    expect(motiuPerNoRegistrar({ produccio: true, navegador, finestra: web })).toBeNull();
    expect(motiuPerNoRegistrar({ produccio: true, navegador, finestra: estrany })).toBeNull();
  });
});

describe('registraServiceWorker', () => {
  test('sense arguments, en proves (import.meta.env.PROD fals), no registra res', async () => {
    expect(import.meta.env.PROD).toBe(false);
    await expect(registraServiceWorker()).resolves.toEqual({ registrat: false, motiu: 'desenvolupament' });
  });

  test('en desenvolupament no toca navigator.serviceWorker (ni un worker vell de localhost)', async () => {
    const { navegador, finestra } = entorn();
    await expect(registraServiceWorker({ produccio: false, navegador, finestra })).resolves.toEqual({ registrat: false, motiu: 'desenvolupament' });
    expect(navegador.serviceWorker.register).not.toHaveBeenCalled();
    expect(finestra.addEventListener).not.toHaveBeenCalled();
  });

  test('en producció i amb la pàgina carregada, registra /sw.js amb abast /', async () => {
    const { navegador, finestra } = entorn();
    const resultat = await registraServiceWorker({ produccio: true, navegador, finestra });
    expect(RUTA_DEL_SW).toBe('/sw.js');
    expect(ABAST_DEL_SW).toBe('/');
    expect(navegador.serviceWorker.register).toHaveBeenCalledTimes(1);
    expect(navegador.serviceWorker.register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    expect(resultat).toEqual({ registrat: true, registre: { ruta: '/sw.js', opcions: { scope: '/' } } });
  });

  test('si la pàgina encara carrega, espera l\'esdeveniment load (una sola vegada)', async () => {
    const { navegador, finestra, escoltes } = entorn({ readyState: 'interactive' });
    const promesa = registraServiceWorker({ produccio: true, navegador, finestra });
    await Promise.resolve();
    expect(navegador.serviceWorker.register).not.toHaveBeenCalled();
    expect(finestra.addEventListener).toHaveBeenCalledWith('load', expect.any(Function), { once: true });
    escoltes.get('load')();
    await expect(promesa).resolves.toMatchObject({ registrat: true });
    expect(navegador.serviceWorker.register).toHaveBeenCalledTimes(1);
  });

  test('un error del registre (asíncron o síncron) no llança: torna el motiu', async () => {
    const error = new Error('SecurityError');
    const asincron = entorn({ register: vi.fn(async () => { throw error; }) });
    await expect(registraServiceWorker({ produccio: true, ...asincron })).resolves.toEqual({ registrat: false, motiu: 'error', error });
    const sincron = entorn({ register: vi.fn(() => { throw error; }) });
    await expect(registraServiceWorker({ produccio: true, ...sincron })).resolves.toEqual({ registrat: false, motiu: 'error', error });
  });

  test('dins d\'un iframe, sense context segur o dins de l\'app nativa, no es registra', async () => {
    for (const opcions of [{ incrustat: true }, { segur: false }, { capacitor: { isNativePlatform: () => true } }]) {
      const { navegador, finestra } = entorn(opcions);
      const resultat = await registraServiceWorker({ produccio: true, navegador, finestra });
      expect(resultat.registrat, JSON.stringify(Object.keys(opcions))).toBe(false);
      expect(navegador.serviceWorker.register).not.toHaveBeenCalled();
    }
  });
});

/* ─────────── Frontera: entrada pròpia sí, paquet autònom i amfitrions no ─────────── */

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const esProva = (ruta) => /\.test\.[cm]?jsx?$/.test(ruta) || ruta.includes('/__fixtures__/');

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    if (entrada.name === 'node_modules') continue;
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.(?:m?js|jsx)$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

describe('frontera', () => {
  const PRODUCCIO = fitxersDe('src').filter((ruta) => !esProva(ruta));

  test('només src/main.jsx importa el registre', () => {
    const importen = PRODUCCIO.filter((ruta) => /from\s+['"][^'"]*pwa\/registre(?:\.js)?['"]/.test(llig(ruta)));
    expect(importen).toEqual(['src/main.jsx']);
    expect(llig('src/main.jsx')).toMatch(/^registraServiceWorker\(\);$/m);
  });

  test('cap altre fitxer de producció de src/ toca el service worker', () => {
    const patro = new RegExp(['service', 'Worker'].join(''));
    expect(PRODUCCIO.filter((ruta) => patro.test(llig(ruta)))).toEqual(['src/pwa/registre.js']);
  });

  test('el paquet autònom entra per embed.jsx, que no importa main.jsx ni la PWA', () => {
    const embed = llig('src/embed.jsx');
    expect(embed).not.toMatch(/from\s+['"][^'"]*(?:main(?:\.jsx)?|pwa\/[^'"]*)['"]/);
    expect(embed).not.toMatch(/import\(\s*['"][^'"]*(?:main|pwa)/);
    expect(llig('vite.standalone.config.js')).toMatch(/entry:\s*path\.resolve\(__dirname,\s*'src\/embed\.jsx'\)/);
  });
});
