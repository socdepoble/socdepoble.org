/**
 * Decisió 3 del Mestre (261007, confirmada: «Imatges externes al Mur:
 * PROHIBIDES (PRIVACITAT)») · Relleu 261007 (peça «imatges-detall») · El mode
 * estricte del Mur (esFontImatgePropia) només admet els orígens registrats.
 * Les llavors que resolen imatges EN IMPORTAR-SE (marketContent.js,
 * townsContent.js) porten l'origen de l'script que ha carregat el paquet
 * (ORIGEN_DEL_PAQUET de PedraSecaEmbed.jsx), no el del plugin-url: quan són
 * diferents, l'element <soc-de-poble> (_aplicaBaseRecursos) registra tots dos.
 *
 * ORIGEN_DEL_PAQUET es calcula en avaluar-se PedraSecaEmbed.jsx, amb la base
 * que el paquet ja sap (assetResolver.js amb el currentScript del monolític,
 * o provisionalDelPaquet.js amb la del carregador del trossejat). Ací la fixa
 * el doble d'assetResolver.js en importar-se, abans que l'element s'avalue:
 * per això és un fitxer a banda de PedraSecaEmbed.config.test.jsx, on la base
 * del paquet és buida. permetOrigenMitjans és el de veres, espiat. Els
 * orígens són sintètics.
 */
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { act, cleanup } from '@testing-library/react';

const PAQUET = vi.hoisted(() => {
  /* El backend de compilació, fix (el mateix que PedraSecaEmbed.config.test.jsx):
     les proves no depenen del .env de qui les executa. */
  for (const [variable, valor] of Object.entries({
    VITE_SUPABASE_URL: 'https://paquet.supabase.test',
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_del_paquet',
    VITE_DATA_MODE: 'seed',
    VITE_TENANT_ID: '11111111-1111-4111-8111-111111111111'
  })) vi.stubEnv(variable, valor);
  return 'https://cdn-paquet.example/soc-de-poble/dist';
});
vi.mock('./config/assetResolver.js', async (importOriginal) => {
  const original = await importOriginal();
  original.fixaBaseRecursos(PAQUET);
  return { ...original };
});
vi.mock('./utils/sanitize.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, permetOrigenMitjans: vi.fn(original.permetOrigenMitjans) };
});
vi.mock('./css/index.css?inline', () => ({ default: '.sdp-root { display: flex; }' }));
vi.mock('./app/App.jsx', () => ({ default: () => null }));
vi.mock('./app/contexts/UIContext.jsx', () => ({ UIProvider: ({ children }) => children }));
vi.mock('./app/contexts/SessionContext.jsx', () => ({ SessionProvider: ({ children }) => children }));
vi.mock('./app/contexts/IdentitatContext.jsx', () => ({ IdentitatProvider: ({ children }) => children }));

import { activeElements, defineCustomElement } from './PedraSecaEmbed.jsx';
import { baseRecursos, fixaBaseRecursos, resolveAsset } from './config/assetResolver.js';
import { esFontImatgePropia, permetOrigenMitjans } from './utils/sanitize.js';

const ORIGEN_DEL_PAQUET = new URL(PAQUET).origin;
const PLUGIN = 'https://wp-amfitrio.example/wp-content/plugins/soc-de-poble/dist';

async function munta(atributs = {}) {
  const element = document.createElement('soc-de-poble');
  for (const [nom, valor] of Object.entries(atributs)) element.setAttribute(nom, valor);
  await act(async () => { document.body.appendChild(element); });
  return element;
}

beforeAll(() => {
  defineCustomElement();
});

afterEach(async () => {
  cleanup();
  await act(async () => {
    for (const element of [...activeElements]) {
      element.remove();
      element._desmuntaAra();
    }
  });
  document.body.replaceChildren();
  // Cada prova torna a la base que el paquet va deduir en avaluar-se.
  fixaBaseRecursos(PAQUET);
  vi.clearAllMocks();
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('l’origen del paquet, registrat com a nostre', () => {
  test('sonda: el paquet sap on viu abans que s’avalue l’element (un altre origen que la pàgina)', () => {
    expect(baseRecursos()).toBe(PAQUET);
    expect(ORIGEN_DEL_PAQUET).not.toBe(window.location.origin);
  });

  /* El primer muntatge del fitxer: el registre d'orígens és estat del mòdul
     (sanitize.js) i no es buida, i la precondició ho comprova. */
  test('una foto de la llavor resolta en importar-se (l’origen de l’script) passa el mode estricte; una de tercers, no', async () => {
    const deLaLlavor = resolveAsset('/assets/uploads/mercat/mel.webp');
    expect(deLaLlavor).toBe(`${PAQUET}/assets/uploads/mercat/mel.webp`);
    expect(esFontImatgePropia(deLaLlavor)).toBe(false);
    await munta({ 'plugin-url': `${PLUGIN}/` });
    expect(esFontImatgePropia(deLaLlavor)).toBe(true);
    expect(esFontImatgePropia(`${PLUGIN}/assets/uploads/mercat/mel.webp`)).toBe(true);
    expect(esFontImatgePropia('https://lh3.googleusercontent.com/a/pepa.png')).toBe(false);
    expect(esFontImatgePropia('https://rastreig.example/p.gif')).toBe(false);
  });

  test('plugin-url d’un altre origen: es registren el seu i el del paquet', async () => {
    await munta({ 'plugin-url': `${PLUGIN}/` });
    expect(baseRecursos()).toBe(PLUGIN);
    expect(permetOrigenMitjans).toHaveBeenCalledWith(PLUGIN);
    expect(permetOrigenMitjans).toHaveBeenCalledWith(ORIGEN_DEL_PAQUET);
  });

  test('sense plugin-url, la base és la del paquet: el seu origen, com sempre', async () => {
    await munta();
    expect(baseRecursos()).toBe(PAQUET);
    expect(permetOrigenMitjans).toHaveBeenCalledWith(PAQUET);
    expect(permetOrigenMitjans).toHaveBeenCalledWith(ORIGEN_DEL_PAQUET);
  });

  test('plugin-url del mateix lloc que la pàgina (camí): el del paquet sí, el de la pàgina no', async () => {
    await munta({ 'plugin-url': '/wp-content/plugins/soc-de-poble/dist/' });
    expect(permetOrigenMitjans).toHaveBeenCalledTimes(1);
    expect(permetOrigenMitjans).toHaveBeenCalledWith(ORIGEN_DEL_PAQUET);
  });
});
