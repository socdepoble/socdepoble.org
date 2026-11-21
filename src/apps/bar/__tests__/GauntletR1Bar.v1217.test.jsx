/* v1.2.17 · Gauntlet R1 · Les correccions del Bar sobre el kit de Gemini R32.26 (IDEA-304):
   L3-08 el dibuix de la família només a la Carta (glyph de modelCartaWorkspace) i una endevinalla que
   respecta la icona pròpia; L3-11 la Demo només sense torn i sense sessió, i sempre amb la carta i el bar
   d'exemple; L3-12 una línia que no es pot afegir no tomba la Demo; L3-13 «Obri el torn» torna a ser primari.
   El nucli de la comanda és el de veres: el mock només posa la línia a 999 unitats quan la prova ho demana.
   v1.2.17 · Gauntlet R2 (L3R2-05) · En entrar i en eixir de la Demo, el focus no cau mai a <body>. */
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ENTORN_OBERT, muntaPlataforma } from '../../plataforma/__fixtures__/munta.jsx';
import { LLENGUES_APP } from '../../plataforma/manifestApp.js';
import { creaRegistre } from '../../plataforma/registreApps.js';
import AppBar from '../AppBar.jsx';
import { TEXTOS_ERRORS_BAR, TEXTOS_UI_BAR } from '../i18nBar.js';
import { creaMagatzemBar } from '../magatzem.js';
import manifestBar from '../manifest.js';
import { ESTABLIMENT_EXEMPLE, llavorCarta } from '../nucli/llavor.js';
import { obriTorn } from '../nucli/torn.js';
import { modelCartaWorkspace } from '../vistes/modelCartaWorkspace.js';
import { articlesDeCarta, articlesDelTpv, pictogramaFamiliaBar } from '../vistes/vestits.js';

/* `ple`: la comanda de la Demo arriba al nucli amb cada línia a 999 unitats (MAX_QUANTITAT). */
const m = vi.hoisted(() => ({ ple: false }));
vi.mock('../nucli/comanda.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    afegeixProducte: (comanda, dades, context) => real.afegeixProducte(
      m.ple ? { ...comanda, linies: comanda.linies.map((l) => ({ ...l, quantitat: real.MAX_QUANTITAT })) } : comanda,
      dades,
      context
    )
  };
});

const BASE = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const FORA = Object.freeze({ ...BASE, sessio: { estat: 'fora', enLinia: true, modeProves: false } });
const COMPROVANT = Object.freeze({ ...BASE, sessio: { estat: 'comprovant', enLinia: true, modeProves: false } });
const DINS = Object.freeze({ ...BASE, sessio: { estat: 'dins', enLinia: true, modeProves: false } });
const tx = TEXTOS_UI_BAR.ca;

async function magatzem({ ambTorn = false } = {}) {
  const m2 = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
  await m2.carrega();
  if (ambTorn) {
    const torn = obriTorn({ id: 'torn-prova', per: 'Cambrer 1', fonsInicialCents: 0, ara: '2026-10-02T07:00:00.000Z' });
    await m2.desaTorn(torn);
    await m2.desaMeta('tornActual', torn.id);
  }
  return m2;
}

function munta(magatzemBar, entorn, manifest = manifestBar) {
  const App = () => <AppBar magatzem={magatzemBar} />;
  const registre = creaRegistre({ internes: [{ ...manifest, carrega: () => Promise.resolve({ default: App }) }] });
  return muntaPlataforma('/app/bar/tpv', { registre, entorn });
}

const botoDemo = () => screen.queryByRole('button', { name: tx.provaTpvDemo });
/* El tiquet de la Demo pel seu nom: «Tiquet Barra · Demo local N», amb N unitats. */
const tiquetDemo = (unitats) => screen.getByRole('region', { name: `Tiquet ${tx.demoNomTiquet} ${unitats}` });

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1280);
});

afterEach(() => {
  cleanup();
  m.ple = false;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

describe('v1.2.17 · Gauntlet R1 (L3-08) · el dibuix de la família, només a la Carta', () => {
  test('articlesDeCarta i articlesDelTpv no porten pictograma: la Caixa, el TPV i la llista de la Carta pinten com a la v1.2.16', () => {
    const carta = llavorCarta();
    expect(articlesDeCarta(carta, { establiment: ESTABLIMENT_EXEMPLE }).some((a) => Object.hasOwn(a, 'pictograma'))).toBe(false);
    expect(articlesDelTpv(carta, { establiment: ESTABLIMENT_EXEMPLE }).some((a) => Object.hasOwn(a, 'pictograma'))).toBe(false);
  });

  test('al TPV amb sessió, les rajoles sense foto porten la icona de categoria i les inicials, cap pictograma', async () => {
    munta(await magatzem({ ambTorn: true }), DINS);
    await screen.findByRole('region', { name: 'TPV del meu bar' });
    expect(document.querySelector('.sdp-marca-article__pictograma')).toBeNull();
    expect(document.querySelectorAll('.sdp-marca-article__inicials').length).toBeGreaterThan(0);
  });

  test('l’endevinalla: «Plats combinats» és un plat, «Pasta» i «Pastes» no són postres, i la icona pròpia mana abans', () => {
    expect(pictogramaFamiliaBar('m1', 'Plats combinats')).toBe('🍽️');
    expect(pictogramaFamiliaBar('plats-del-dia', 'Plats del dia')).toBe('🍽️');
    expect(pictogramaFamiliaBar('pasta', 'Pasta')).toBe('🍽️');
    expect(pictogramaFamiliaBar('c7', 'Pastes')).toBe('🍽️');
    expect(pictogramaFamiliaBar('c8', 'Pastissos')).toBe('🍰');
    expect(pictogramaFamiliaBar('combinats', 'Combinats')).toBe('🍸');
    /* Amb icona pròpia, l'endevinalla no hi entra. */
    expect(pictogramaFamiliaBar('c9', 'Postres', 'Coffee')).toBe('☕');
    expect(pictogramaFamiliaBar('c10', 'Pastes', 'Soup')).toBe('🍲');
    expect(pictogramaFamiliaBar('m1', 'Plats combinats', 'UtensilsCrossed')).toBe('🍽️');
    expect(pictogramaFamiliaBar('combinats', 'Combinats', 'GlassWater')).toBe('🍸');
    /* Una icona que el Bar no coneix no compta: torna l'endevinalla. */
    expect(pictogramaFamiliaBar('c11', 'Cafès', 'Rocket')).toBe('☕');
    /* La carta d'exemple, igual que al kit de Gemini. */
    expect(pictogramaFamiliaBar('tapes', 'Tapes', 'Utensils')).toBe('🫒');
    expect(pictogramaFamiliaBar('postres', 'Postres', 'IceCreamCone')).toBe('🍰');
  });

  test('modelCartaWorkspace passa la icona de la categoria al glyph', () => {
    const carta = {
      categories: [
        { id: 'm1', nom: 'Plats combinats', icona: 'UtensilsCrossed', ordre: 0, visible: true },
        { id: 'c2', nom: 'Pastes', ordre: 1, visible: true },
        { id: 'c3', nom: 'Del forn', icona: 'Coffee', ordre: 2, visible: true }
      ],
      productes: ['m1', 'c2', 'c3'].map((categoriaId, ordre) => ({
        id: `p-${categoriaId}`, nom: `Producte ${categoriaId}`, categoriaId, ordre, actiu: true, preuObert: false,
        variants: [{ id: 'unica', nom: 'Única', preuCents: 100 }], imatge: { slug: `p-${categoriaId}`, estat: 'marcador' }
      }))
    };
    const glifs = Object.fromEntries(modelCartaWorkspace(carta, ESTABLIMENT_EXEMPLE).items.map((item) => [item.dades.categoriaId, item.glyph]));
    expect(glifs).toEqual({ m1: '🍽️', c2: '🍽️', c3: '☕' });
  });
});

describe('v1.2.17 · Gauntlet R1 (L3-11, L3-13) · la Demo només sense torn i sense sessió', () => {
  test('amb el torn obert i la sessió perduda, l’avís és el de sempre i no oferix la Demo', async () => {
    munta(await magatzem({ ambTorn: true }), FORA);
    const tpv = await screen.findByRole('region', { name: 'TPV del meu bar' });
    expect(within(tpv).getByText(tx.sessioSenseSessio)).toBeTruthy();
    expect(within(tpv).getByRole('button', { name: tx.entra })).toBeTruthy();
    expect(botoDemo()).toBeNull();
  });

  test('amb el torn obert, mentre es comprova la sessió, no oferix la Demo', async () => {
    munta(await magatzem({ ambTorn: true }), COMPROVANT);
    const tpv = await screen.findByRole('region', { name: 'TPV del meu bar' });
    expect(within(tpv).getByText(tx.sessioComprovant)).toBeTruthy();
    expect(botoDemo()).toBeNull();
  });

  test('sense torn, mentre es comprova la sessió, no oferix la Demo i «Obri el torn» és el de la v1.2.16', async () => {
    munta(await magatzem(), COMPROVANT);
    const obri = await screen.findByRole('button', { name: tx.obriTorn });
    expect(screen.getByText(tx.sessioComprovant)).toBeTruthy();
    expect(obri.disabled).toBe(true);
    expect(obri.className).toContain('sdp-boto--primari');
    expect(botoDemo()).toBeNull();
  });

  test('sense torn, amb una sessió sense permís, no oferix la Demo', async () => {
    const nomesSuperadmin = { ...manifestBar, permisos: { veure: 'public', escriure: 'superadmin' } };
    munta(await magatzem(), { ...BASE, sessio: { estat: 'dins', esSuperadmin: false, enLinia: true, modeProves: false } }, nomesSuperadmin);
    await screen.findByRole('button', { name: tx.obriTorn });
    expect(screen.getByText(tx.sessioSensePermis)).toBeTruthy();
    expect(botoDemo()).toBeNull();
  });

  test('sense torn i sense sessió, la Demo s’oferix al costat d’«Entra» i «Obri el torn» és primari i desactivat (L3-13)', async () => {
    munta(await magatzem(), FORA);
    expect(await screen.findByRole('button', { name: tx.provaTpvDemo })).toBeTruthy();
    expect(screen.getByRole('button', { name: tx.entra }).className).toContain('sdp-boto--primari');
    const obri = screen.getByRole('button', { name: tx.obriTorn });
    expect(obri.disabled).toBe(true);
    expect(obri.className).toContain('sdp-boto--primari');
  });

  test('la Demo fa servir sempre la carta i el bar d’exemple, mai els del Bar d’este aparell', async () => {
    const real = await magatzem();
    await real.desaMeta('establiment', { ...ESTABLIMENT_EXEMPLE, nom: 'Bar de la Plaça', slug: 'bar-de-la-placa' });
    const carta = llavorCarta();
    await real.desaCarta({
      ...carta,
      productes: carta.productes.map((p) => (p.id === 'cafe-sol' ? { ...p, nom: 'Cafè de la casa' } : p))
    });
    munta(real, FORA);
    fireEvent.click(await screen.findByRole('button', { name: tx.provaTpvDemo }));
    const demo = await screen.findByRole('region', { name: `${ESTABLIMENT_EXEMPLE.nom} · Demo` });
    expect(within(demo).getByRole('button', { name: /^Cafè sol,/ })).toBeTruthy();
    expect(within(demo).queryByRole('button', { name: /^Cafè de la casa,/ })).toBeNull();
    expect(screen.queryByText(/Bar de la Plaça/)).toBeNull();
    expect(screen.getByText(tx.demoLocalText)).toBeTruthy();
  });
});

describe('v1.2.17 · Gauntlet R1 (L3-12) · una línia que no es pot afegir no tomba la Demo', () => {
  test('a 999 unitats el nucli diu «Massa unitats en una línia» i la Demo ho mostra en una Alerta, sense perdre el tiquet', async () => {
    munta(await magatzem(), FORA);
    fireEvent.click(await screen.findByRole('button', { name: tx.provaTpvDemo }));
    await screen.findByText(tx.demoLocalTitol);
    const cafe = () => screen.getByRole('button', { name: /^Cafè sol,/ });
    fireEvent.click(cafe());
    expect(tiquetDemo(1)).toBeTruthy();

    m.ple = true;
    fireEvent.click(cafe());
    const titol = await screen.findByText(tx.demoErrorTitol);
    const alerta = titol.closest('[role="alert"]');
    expect(alerta).not.toBeNull();
    expect(within(alerta).getByText(TEXTOS_ERRORS_BAR.ca.QUANTITAT)).toBeTruthy();
    /* La vista continua viva i el tiquet no ha canviat. */
    expect(screen.getByText(tx.demoLocalTitol)).toBeTruthy();
    expect(tiquetDemo(1)).toBeTruthy();

    fireEvent.click(within(alerta).getByRole('button'));
    await waitFor(() => expect(screen.queryByText(tx.demoErrorTitol)).toBeNull());

    /* Un error torna a eixir, i l'afegit següent que sí que es pot fer l'esborra. */
    fireEvent.click(cafe());
    await screen.findByText(tx.demoErrorTitol);
    m.ple = false;
    fireEvent.click(cafe());
    await waitFor(() => expect(screen.queryByText(tx.demoErrorTitol)).toBeNull());
    expect(tiquetDemo(2)).toBeTruthy();
  });

  test.each(LLENGUES_APP)('el títol de l’error de la Demo és a i18nBar.js (%s)', (lang) => {
    expect(typeof TEXTOS_UI_BAR[lang].demoErrorTitol).toBe('string');
    expect(TEXTOS_UI_BAR[lang].demoErrorTitol.trim().length).toBeGreaterThan(10);
    expect(typeof TEXTOS_ERRORS_BAR[lang].QUANTITAT).toBe('string');
  });
});

describe('v1.2.17 · Gauntlet R2 (L3R2-05) · el focus en entrar i en eixir de la Demo, mai a <body>', () => {
  const regioDemo = () => screen.getByRole('region', { name: `${ESTABLIMENT_EXEMPLE.nom} · Demo` });
  const botoIx = () => screen.getByRole('button', { name: tx.ixDeLaDemo });

  /* Entra amb «Prova el TPV en local (Demo)», mira on va el focus, ix amb «Ix de la Demo» i mira on torna. */
  async function entraIEix(midaEsperada) {
    munta(await magatzem(), FORA);
    fireEvent.click(await screen.findByRole('button', { name: tx.provaTpvDemo }));
    await screen.findByText(tx.demoLocalTitol);
    expect(regioDemo().dataset.mida).toBe(midaEsperada);
    await waitFor(() => expect(document.activeElement).toBe(botoIx()));
    expect(regioDemo().contains(document.activeElement)).toBe(true);

    fireEvent.click(botoIx());
    const prova = await screen.findByRole('button', { name: tx.provaTpvDemo });
    await waitFor(() => expect(document.activeElement).toBe(prova));
    expect(document.activeElement).not.toBe(document.body);
  }

  test('en pantalla ampla, el focus va a «Ix de la Demo» en entrar i torna a «Prova el TPV en local (Demo)» en eixir', async () => {
    await entraIEix('ampla');
  });

  /* En estret, la peça mesura en muntar i torna a muntar l'avís en la disposició d'una columna: el focus
     ha d'arribar al botó del segon muntatge, no al del primer, que ja no és al document. */
  test('en pantalla estreta, on l’avís es torna a muntar en una columna, el focus també arriba a «Ix de la Demo» i torna', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(375);
    await entraIEix('estreta');
  });

  test('el focus d’entrada es queda a «Ix de la Demo» mentre es ven: tocar un producte no el mou', async () => {
    munta(await magatzem(), FORA);
    fireEvent.click(await screen.findByRole('button', { name: tx.provaTpvDemo }));
    await waitFor(() => expect(document.activeElement).toBe(botoIx()));
    fireEvent.click(screen.getByRole('button', { name: /^Cafè sol,/ }));
    expect(tiquetDemo(1)).toBeTruthy();
    expect(document.activeElement).toBe(botoIx());
  });
});
