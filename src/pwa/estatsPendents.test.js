// @vitest-environment node
/* Onada R24 · CODEX-R24-13 (P1, deute R22 pwa-01 ronda 3). La recuperació de desplegament
   (recuperacioChunkDeploy.js) recarrega sola quan un tros retirat no arriba, llevat que la persona ja hi haja
   escrit, enganxat, triat o deixat anar res, o que hi haja un camp ple al DOM. L'estat que naix només d'un toc i
   viu fora del DOM (l'esborrany d'una conversa que ja no es veu, amb l'emoticona del calaix o l'informe
   d'«Informa d'un error», desaEsborrany) es perdia: el motor té el veto `tePendents`, però l'entrada
   (registre.js) no el passava. Ací: un registre explícit (estatsPendents.js) que els proveïdors marquen i netegen,
   sense cap contingut; l'entrada el passa al motor; els esborranys s'hi marquen mentre n'hi ha cap; i quan canvia
   la persona (XatContext → buidaEsborranys) la marca se'n va amb ells. Cap clic no marca res: el clic d'una
   navegació és el que troba el tros retirat, i un veto a tots els clics deixaria la recuperació sense cap cas.
   Proves escrites ABANS del fix (vegeu _investigacio_ia_de_poble/261114_r24_claude_botigues_i_consola_zero_kit/
   onada3/gestoria_proves). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { buidaEsborranys, desaEsborrany, esborraEsborrany, llegixEsborrany } from '../sections/xat/esborranys.js';
import { buidaEstatsPendents, hiHaEstatPendent, marcaEstatPendent, netejaEstatPendent } from './estatsPendents.js';
import { aturaRecuperacioChunkDeploy, recuperaErrorChunkDeploy } from './recuperacioChunkDeploy.js';
import { registraServiceWorker } from './registre.js';

const ORIGEN = 'https://socdepoble.org';
const VELL = '/assets/index-Vell1234.js';
const NOU = '/assets/index-Nou12345.js';
const TROS = '/assets/FitxaVivaDeComunitat-CQbREbBV.js';
const fallada = () => new TypeError(`Failed to fetch dynamically imported module: ${ORIGEN}${TROS}`);
const html = (ruta) => `<!doctype html><html><head><script type="module" src="${ruta}"></script></head><body></body></html>`;

/* La web pròpia en producció, a la ruta del Xat, amb un build nou publicat i el tros vell retirat (404). */
function webPropia() {
  const dades = new Map();
  const oients = new Map();
  const finestra = {
    isSecureContext: true,
    document: { readyState: 'loading', querySelectorAll: (selector) => (selector.startsWith('script') ? [{ getAttribute: () => VELL }] : []) },
    sessionStorage: { getItem: (clau) => dades.get(clau) ?? null, setItem: (clau, valor) => { dades.set(clau, valor); } },
    location: { origin: ORIGEN, href: `${ORIGEN}/xat/fil-B`, reload: vi.fn() },
    addEventListener: vi.fn((tipus, oient) => { oients.set(tipus, oient); }),
    removeEventListener: vi.fn((tipus) => { oients.delete(tipus); })
  };
  finestra.top = finestra;
  finestra.self = finestra;
  const fetchFn = vi.fn(async (url) => (String(url).endsWith('/index.html')
    ? new Response(html(NOU), { headers: { 'content-type': 'text/html; charset=utf-8' } })
    : new Response(null, { status: 404 })));
  return { finestra, navegador: { onLine: true }, fetchFn, oients };
}

/* L'entrada de veres: registraServiceWorker instal·la la recuperació (sense service worker, com un navegador que no en té). */
async function instalLaWebPropia() {
  const web = webPropia();
  vi.stubGlobal('fetch', web.fetchFn);
  await registraServiceWorker({ produccio: true, navegador: web.navegador, finestra: web.finestra });
  return web;
}

afterEach(() => {
  aturaRecuperacioChunkDeploy();
  buidaEsborranys();
  buidaEstatsPendents();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('estatsPendents.js · el registre', () => {
  test('marca i neteja per clau; cap contingut, només la clau del proveïdor', () => {
    expect(hiHaEstatPendent()).toBe(false);
    marcaEstatPendent('xat.esborranys');
    marcaEstatPendent('xat.esborranys');
    marcaEstatPendent('iaia.historial');
    expect(hiHaEstatPendent()).toBe(true);
    netejaEstatPendent('xat.esborranys');
    expect(hiHaEstatPendent()).toBe(true);
    netejaEstatPendent('iaia.historial');
    expect(hiHaEstatPendent()).toBe(false);
    netejaEstatPendent('mai.marcada');
    expect(hiHaEstatPendent()).toBe(false);
    marcaEstatPendent('xat.esborranys');
    buidaEstatsPendents();
    expect(hiHaEstatPendent()).toBe(false);
  });

  test.each([['', 'buida'], ['Text a mitges de la conversa A', 'amb espais i majúscules'], ['x'.repeat(65), 'massa llarga'], [null, 'nul·la'], [42, 'no és text']])(
    'una clau que no és un identificador de proveïdor (%s: %s) no s’accepta: el registre no guarda mai contingut', (clau) => {
      expect(() => marcaEstatPendent(clau)).toThrow(TypeError);
      expect(hiHaEstatPendent()).toBe(false);
    });
});

describe('CODEX-R24-13 · registre.js passa el veto al motor de la recuperació', () => {
  test('control: sense cap estat pendent, la web pròpia es recupera una vegada', async () => {
    const web = await instalLaWebPropia();
    expect(await recuperaErrorChunkDeploy(fallada())).toBe(true);
    expect(web.finestra.location.reload).toHaveBeenCalledOnce();
  });

  test('un estat pendent registrat veta la recàrrega automàtica; netejat, la recuperació torna a funcionar', async () => {
    const web = await instalLaWebPropia();
    marcaEstatPendent('prova.pendent');
    expect(await recuperaErrorChunkDeploy(fallada())).toBe(false);
    expect(web.finestra.location.reload).not.toHaveBeenCalled();
    expect(web.fetchFn).not.toHaveBeenCalled();
    netejaEstatPendent('prova.pendent');
    expect(await recuperaErrorChunkDeploy(fallada())).toBe(true);
    expect(web.finestra.location.reload).toHaveBeenCalledOnce();
  });

  test('cap clic no marca res: un toc sol (pointerdown, click) no veta, com diu el límit de R22', async () => {
    const web = await instalLaWebPropia();
    for (const tipus of ['pointerdown', 'pointerup', 'click']) web.oients.get(tipus)?.({ type: tipus });
    expect([...web.oients.keys()].filter((tipus) => /pointer|click/.test(tipus))).toEqual([]);
    expect(hiHaEstatPendent()).toBe(false);
    expect(await recuperaErrorChunkDeploy(fallada())).toBe(true);
  });
});

describe('CODEX-R24-13 · l’esborrany nascut d’un toc, fora del DOM, ja no es perd en silenci', () => {
  test('l’emoticona del calaix deixada en l’esborrany d’una altra conversa veta la recàrrega i es conserva', async () => {
    const web = await instalLaWebPropia();
    // Conversa A: un toc a l'emoticona, cap tecla; en obrir la B, Conversa desa l'esborrany d'A al Map del mòdul.
    desaEsborrany('ambit::fil-A', '🍅');
    expect(hiHaEstatPendent()).toBe(true);
    expect(await recuperaErrorChunkDeploy(fallada())).toBe(false);
    expect(web.finestra.location.reload).not.toHaveBeenCalled();
    expect(llegixEsborrany('ambit::fil-A')).toBe('🍅');
  });

  test('l’informe d’«Informa d’un error» (desaEsborrany) també; enviat o buidat, la recuperació torna', async () => {
    const web = await instalLaWebPropia();
    desaEsborrany('ambit::fil-beta', 'Informe d’un error a Sóc de Poble');
    desaEsborrany('ambit::fil-A', '🍅');
    expect(await recuperaErrorChunkDeploy(fallada())).toBe(false);
    esborraEsborrany('ambit::fil-beta');
    expect(hiHaEstatPendent()).toBe(true);
    desaEsborrany('ambit::fil-A', '');
    expect(hiHaEstatPendent()).toBe(false);
    expect(await recuperaErrorChunkDeploy(fallada())).toBe(true);
    expect(web.finestra.location.reload).toHaveBeenCalledOnce();
  });

  test('canviar de persona (XatContext → buidaEsborranys) oblida els esborranys i també la seua marca', async () => {
    const web = await instalLaWebPropia();
    desaEsborrany('persona-1::fil-A', 'Resposta a mitges');
    desaEsborrany('persona-1::fil-B', '👋');
    expect(hiHaEstatPendent()).toBe(true);
    buidaEsborranys();
    expect(hiHaEstatPendent()).toBe(false);
    expect(await recuperaErrorChunkDeploy(fallada())).toBe(true);
    expect(web.finestra.location.reload).toHaveBeenCalledOnce();
    /* El camí de veres del canvi d'actor: l'efecte de clauPersona de XatContext crida buidaEsborranys(). */
    const context = readFileSync(path.join(process.cwd(), 'src/sections/xat/XatContext.jsx'), 'utf8');
    const inici = context.indexOf('const personaPrevia = useRef(clauPersona);');
    expect(inici).toBeGreaterThan(-1);
    const efecte = context.slice(inici, context.indexOf('}, [clauPersona]);', inici));
    expect(efecte).toContain('if (personaPrevia.current === clauPersona) return;');
    expect(efecte).toContain('buidaEsborranys();');
  });
});
