/* El Bar · l'entrada «TPV» (ordre del Mestre, 261006: TPV Universal) dins de
   la plataforma de veres (RutaApps → ClosaAplicacio, àrea única), amb un
   magatzem en memòria, el rellotge i l'atzar fixos i la sessió fixada a
   l'entorn (ProveidorPlataforma, entorn.sessio): sense sessió es veu la carta
   però no es ven; amb sessió, la marca, el toc, el camí, l'editor de línia,
   «Cobra» cap al cobrament de la Caixa i el cicle complet amb la tornada al
   TPV (?torna=tpv: cobrament, nota i tancar-la), el diàleg «tria», el preu obert (amb
   variants i el focus de tornada), la carta per emportar, el diàleg dels
   tiquets oberts i el nom del tiquet actiu. També: la renovació del JWT pels
   contexts (SessionContext simulat, sense entorn.sessio), un manifest que
   demana superadmin, la disposició estreta, els canals que es desen a la
   fitxa del producte (Carta.jsx) i tiquetDeComanda (vestits.js) amb línies
   anul·lades, convidades i pagaments parcials. Correccions de la revisió
   (261006): sense permís els tiquets oberts es miren; la tornada de la xarxa
   no buida el teclat del preu (TPV i Caixa); «Cobra» i «Dividix» de la
   comanda del costat i la divisió conserven la tornada al TPV. */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { muntaPlataforma, ENTORN_OBERT } from '../../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../../plataforma/registreApps.js';
import manifestBar from '../manifest.js';
import AppBar from '../AppBar.jsx';
import { creaMagatzemBar } from '../magatzem.js';
import { obriTorn } from '../nucli/torn.js';
import { llavorCarta } from '../nucli/llavor.js';
import { afegeixProducte, anullaLinia, convida, creaComanda, marxa } from '../nucli/comanda.js';
import { afegeixPagament } from '../nucli/cobrament.js';
import { euros, tiquetDeComanda } from './vestits.js';

/* La sessió dels contexts, per a les proves sense entorn.sessio: undefined és
   el context de veres (sense proveïdor, null). `recuperable`: undefined, la
   sessió desada de veres; un booleà, el que diria sessioRecuperable. */
const m = vi.hoisted(() => ({ sessio: undefined, recuperable: undefined }));
vi.mock('../../../app/contexts/SessionContext.jsx', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, useSessioOpcional: () => (m.sessio === undefined ? real.useSessioOpcional() : m.sessio) };
});
vi.mock('../../../data/identitat.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, sessioRecuperable: () => (m.recuperable === undefined ? real.sessioRecuperable() : m.recuperable) };
});

const ARA = '2026-10-02T07:30:00.000Z';
const BASE = Object.freeze({ ...ENTORN_OBERT, produccio: false });
/* La sessió fixada del tot (en línia i en mode remot): cap prova depén del navegador ni de la configuració. */
const DINS = Object.freeze({ ...BASE, sessio: { estat: 'dins', enLinia: true, modeProves: false, marca: { nom: 'La Parròquia', slug: 'la-parroquia' } } });
const FORA = Object.freeze({ ...BASE, sessio: { estat: 'fora', enLinia: true, modeProves: false } });
const CAFE = llavorCarta().productes.find((p) => p.id === 'cafe-sol');
const TALLAT = llavorCarta().productes.find((p) => p.id === 'tallat');

function rellotgeDeProva() {
  let ms = Date.parse('2026-10-02T08:00:00.000Z');
  return () => {
    ms += 1000;
    return new Date(ms).toISOString();
  };
}

function atzarDeProva() {
  let x = 0;
  return () => {
    x = (x + 0.137) % 1;
    return x;
  };
}

async function magatzemDeProva() {
  const magatzem = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
  await magatzem.carrega();
  const torn = obriTorn({ id: 'torn-prova', per: 'Cambrer 1', fonsInicialCents: 0, ara: '2026-10-02T07:00:00.000Z' });
  await magatzem.desaTorn(torn);
  await magatzem.desaMeta('tornActual', torn.id);
  return magatzem;
}

function munta(url, magatzem, entorn, manifest = manifestBar) {
  const rellotge = rellotgeDeProva();
  const atzar = atzarDeProva();
  const App = () => <AppBar magatzem={magatzem} rellotge={rellotge} atzar={atzar} />;
  const registre = creaRegistre({ internes: [{ ...manifest, carrega: () => Promise.resolve({ default: App }) }] });
  return muntaPlataforma(url, { registre, entorn });
}

/* Munta el TPV i espera que la peça hi siga («El meu bar» → «TPV del meu bar»). */
async function obriTpv(url, magatzem, entorn = DINS, manifest = manifestBar) {
  munta(url, magatzem, entorn, manifest);
  return screen.findByRole('region', { name: 'TPV del meu bar' });
}

const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const ves = (url) => act(async () => {
  window.history.pushState(null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
});
const comandesDe = (magatzem) => magatzem.base.totes('comandes');
const graella = () => screen.getByRole('list', { name: /^Productes/ });
const rajola = (nom) => within(graella()).getByRole('button', { name: new RegExp(`^${nom},`) });
/* El tiquet porta el nom de l'actiu: «Tiquet Barra 0», «Tiquet Taula 3 1», «Tiquet Barra · 08:00 2». */
const tiquet = () => screen.getByRole('region', { name: /^Tiquet .+ \d+$/ });
const BARRA_AMB_HORA = (unitats) => new RegExp(`^Tiquet Barra · \\d\\d:\\d\\d ${unitats}$`);
const tecleja = (teclat, xifres) => {
  for (const xifra of xifres) fireEvent.click(within(teclat).getByRole('button', { name: xifra }));
};
/* navigator.onLine és un getter del prototip: es tapa a la instància (useEnLinia.test.jsx). */
const posaEnLinia = (valor) => Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => valor });
const canviaXarxa = (valor) => act(async () => {
  posaEnLinia(valor);
  window.dispatchEvent(new Event(valor ? 'online' : 'offline'));
});
const SENSE_XARXA_DESADA = 'Sense connexió: cada venda es desa en este dispositiu. La sessió es comprovarà quan torne la xarxa.';
const unaComanda = (id, origen, ambCafe = false) => {
  const buida = creaComanda({ id, tornId: 'torn-prova', origen, ara: ARA, per: 'Cambrer 1' });
  return ambCafe ? afegeixProducte(buida, { producte: CAFE, ivaPerDefecte: 10 }, { ara: ARA, idLinia: `l-${id}` }) : buida;
};

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  delete window.navigator.onLine;
  m.sessio = undefined;
  m.recuperable = undefined;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('l’entrada «TPV»', () => {
  test('és una àrea única amb el nom de l’app: el tiquet i els productes de costat, sense columnes', async () => {
    const magatzem = await magatzemDeProva();
    const tpv = await obriTpv('/app/bar/tpv', magatzem);
    expect(tpv.closest('.sdp-app-unica').getAttribute('aria-label')).toBe('El Bar');
    expect(tpv.dataset.mida).toBe('ampla');
    expect(document.getElementById('app-grid-main')).toBeNull();
    expect(within(tpv).getByRole('region', { name: 'Tiquet Barra 0' })).toBeTruthy();
    expect(within(tpv).getByRole('region', { name: 'Productes' })).toBeTruthy();
    expect(within(tiquet()).getByText('El tiquet és buit')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Cobra/ }).disabled).toBe(true);
  });

  test('en una pantalla estreta (375 px): la barra d’accions dalt i les pestanyes «Productes» i «Tiquet N»', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(375);
    const magatzem = await magatzemDeProva();
    const tpv = await obriTpv('/app/bar/tpv', magatzem);
    expect(tpv.dataset.mida).toBe('estreta');
    expect(tpv.firstElementChild.className).toBe('sdp-tpv__accions');
    expect(within(tpv.firstElementChild).getByRole('button', { name: /^Cobra/ })).toBeTruthy();
    const pestanyes = within(screen.getByRole('tablist', { name: 'Vista' })).getAllByRole('tab');
    expect(pestanyes.map((pestanya) => pestanya.textContent)).toEqual(['Productes', 'Tiquet 0']);
    expect(pestanyes[0].getAttribute('aria-selected')).toBe('true');
  });
});

describe('la sessió (pont de només lectura)', () => {
  test('sense sessió: la carta es veu però no ven, els tiquets oberts es miren, i l’avís porta a entrar', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(unaComanda('c-taula-3', { tipus: 'taula', taulaId: 't3' }, true));
    const tpv = await obriTpv('/app/bar/tpv', magatzem, FORA);
    expect(within(tpv).getByText('Entra per a vendre.')).toBeTruthy();
    const rajoles = within(graella()).getAllByRole('button');
    expect(rajoles.length).toBeGreaterThan(0);
    expect(rajoles.every((boto) => boto.disabled)).toBe(true);
    /* Cap rajola enfocable: la graella rep el focus per a fer-hi scroll amb el teclat. */
    expect(graella().tabIndex).toBe(0);
    expect(screen.getByRole('button', { name: /^Cobra/ }).disabled).toBe(true);
    /* Sense marca d'organització, la capçalera porta el nom de l'establiment. */
    expect(within(tiquet()).getByText('El meu bar')).toBeTruthy();
    fireEvent.click(rajola('Cafè sol'));
    await act(async () => {});
    expect((await comandesDe(magatzem)).map((c) => c.id)).toEqual(['c-taula-3']);
    /* Mirar sí: la llista dels tiquets oberts s'obri i porta a la taula, però sense «Nou tiquet de barra». */
    const oberts = screen.getByRole('button', { name: 'Tiquets oberts 1' });
    expect(oberts.disabled).toBe(false);
    fireEvent.click(oberts);
    expect(ubicacio()).toBe('/app/bar/tpv?oberts=1');
    const dialeg = await screen.findByRole('dialog', { name: 'Tiquets oberts' });
    expect(within(dialeg).queryByRole('button', { name: 'Nou tiquet de barra' })).toBeNull();
    fireEvent.click(within(dialeg).getByRole('button', { name: /^Taula 3 / }));
    expect(ubicacio()).toBe('/app/bar/tpv/c-taula-3');
    await waitFor(() => expect(within(tiquet()).getByText('Cafè sol')).toBeTruthy());
    /* La línia es veu però no s'edita, i res no s'ha escrit. */
    expect(within(tiquet()).queryByRole('button', { name: /^Cafè sol 1 unitat/ })).toBeNull();
    expect((await comandesDe(magatzem)).map((c) => [c.id, c.linies.length])).toEqual([['c-taula-3', 1]]);
    fireEvent.click(within(tpv).getByRole('button', { name: 'Entra' }));
    expect(ubicacio()).toBe('/registre?mode=entrar&tornar=%2Fapp%2Fbar%2Ftpv%2Fc-taula-3');
  });

  test('mentre es comprova la sessió, ho diu i tampoc no ven', async () => {
    const magatzem = await magatzemDeProva();
    const tpv = await obriTpv('/app/bar/tpv', magatzem, { ...BASE, sessio: { estat: 'comprovant', enLinia: true, modeProves: false } });
    expect(within(tpv).getByText('Comprovant la sessió…')).toBeTruthy();
    expect(within(tpv).queryByText('Entra per a vendre.')).toBeNull();
    expect(within(graella()).getAllByRole('button').every((boto) => boto.disabled)).toBe(true);
  });

  test('un manifest que demana superadmin: una sessió sense el permís ho diu i no ven', async () => {
    const magatzem = await magatzemDeProva();
    const nomesSuperadmin = { ...manifestBar, permisos: { veure: 'public', escriure: 'superadmin' } };
    const tpv = await obriTpv('/app/bar/tpv', magatzem, { ...BASE, sessio: { estat: 'dins', esSuperadmin: false, enLinia: true, modeProves: false } }, nomesSuperadmin);
    expect(within(tpv).getByText('Esta sessió no pot vendre.')).toBeTruthy();
    expect(within(tpv).queryByText('Entra per a vendre.')).toBeNull();
    expect(within(graella()).getAllByRole('button').every((boto) => boto.disabled)).toBe(true);
    /* Mirar els tiquets oberts és lectura: el botó respon. */
    expect(screen.getByRole('button', { name: /^Tiquets oberts/ }).disabled).toBe(false);
  });

  test('amb sessió: la marca de l’organització, el toc afig al tiquet i la comanda passa al camí', async () => {
    const magatzem = await magatzemDeProva();
    const tpv = await obriTpv('/app/bar/tpv', magatzem);
    expect(within(tpv).queryByText('Entra per a vendre.')).toBeNull();
    expect(within(tiquet()).getByText('La Parròquia')).toBeTruthy();
    fireEvent.click(rajola('Cafè sol'));
    await waitFor(() => expect(within(tiquet()).getByText('Cafè sol')).toBeTruthy());
    const [comanda] = await comandesDe(magatzem);
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/tpv/${comanda.id}`));
    fireEvent.click(rajola('Cafè sol'));
    await waitFor(() => expect(screen.getByRole('region', { name: BARRA_AMB_HORA(2) })).toBeTruthy());
    /* El missatge d'estat de la peça (no el de les alertes de la base) diu les unitats del tiquet actiu. */
    expect(tpv.querySelector(':scope > p.sdp-nomes-lector[role="status"]').textContent).toMatch(/^Tiquet Barra · \d\d:\d\d: 2 unitats$/);
    /* La rajola diu que ja és a la comanda, i la insígnia, quantes unitats (el número, i al lector de què és). */
    const cafe = rajola('Cafè sol');
    expect(cafe.getAttribute('aria-label')).toMatch(/, A la comanda$/);
    const insignia = document.getElementById(cafe.getAttribute('aria-describedby'));
    expect(insignia.querySelector('[aria-hidden="true"]').textContent).toBe('2');
    expect(insignia.querySelector('.sdp-nomes-lector').textContent).toBe('2 unitats a la comanda');
    /* El resum: l'IVA inclòs (informatiu) i el total. */
    expect(within(tiquet()).getByText('IVA del 10 % inclòs')).toBeTruthy();
    expect(within(tiquet()).getByText('Total')).toBeTruthy();
    expect((await comandesDe(magatzem))[0].linies.map((l) => [l.producteId, l.quantitat])).toEqual([['cafe-sol', 2]]);
  });

  test('la renovació del JWT (comprovant amb el mateix compte, pels contexts) no para la venda ni buida el teclat del preu', async () => {
    const magatzem = await magatzemDeProva();
    m.sessio = { estat: 'dins', esSuperadmin: false, currentUser: { id: 'usuari-sonda-1' } };
    await obriTpv('/app/bar/tpv', magatzem, BASE);
    fireEvent.click(rajola('Varis'));
    tecleja(await screen.findByRole('group', { name: 'Preu' }), ['2', '5']);
    /* El testimoni es renova: SessionContext dona 'comprovant' amb el mateix usuari. */
    m.sessio = { ...m.sessio, estat: 'comprovant' };
    await ves('/app/bar/tpv?preu=varis');
    expect(screen.queryByText('Comprovant la sessió…')).toBeNull();
    expect(rajola('Cafè sol').disabled).toBe(false);
    const preu = screen.getByRole('group', { name: 'Preu' });
    tecleja(preu, ['0']);
    fireEvent.click(within(preu).getByRole('button', { name: 'Afig' }));
    await waitFor(() => expect(within(tiquet()).getByText('Varis')).toBeTruthy());
    const [comanda] = await comandesDe(magatzem);
    expect(comanda.linies.map((l) => [l.producteId, l.preuUnitariCents])).toEqual([['varis', 250]]);
  });

  /* Correcció de la revisió (261006): quan torna la xarxa, sessionService diu
     'comprovant' sense compte i, després, 'comprovant' amb el compte mentre llig
     el rol. Amb la sessió desada, el Bar no deixa de vendre en cap moment, i el
     teclat del preu obert no es desmunta. */
  test.each([
    ['el TPV', '/app/bar/tpv?preu=varis'],
    ['la Caixa', '/app/bar/caixa?preu=varis']
  ])('la xarxa torna després de vendre sense xarxa: %s conserva el preu teclejat (comprovant sense compte, amb compte i dins)', async (_on, url) => {
    const magatzem = await magatzemDeProva();
    posaEnLinia(false);
    m.sessio = { estat: 'fora', esSuperadmin: false, currentUser: null };
    m.recuperable = true;
    munta(url, magatzem, BASE);
    tecleja(await screen.findByRole('group', { name: 'Preu' }), ['2', '5']);
    expect(screen.getByText(SENSE_XARXA_DESADA)).toBeTruthy();
    /* sessionService escolta 'online' abans que useEnLinia: ja diu 'comprovant' sense compte. */
    m.sessio = { ...m.sessio, estat: 'comprovant' };
    await canviaXarxa(true);
    expect(screen.getByText('Comprovant la sessió…')).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Preu' })).toBeTruthy();
    /* La renovació torna el compte; el rol encara es llig. */
    m.sessio = { estat: 'comprovant', esSuperadmin: false, currentUser: { id: 'usuari-sonda-1' } };
    m.recuperable = false;
    await ves(url);
    expect(screen.queryByText('Comprovant la sessió…')).toBeNull();
    m.sessio = { ...m.sessio, estat: 'dins' };
    await ves(url);
    const preu = screen.getByRole('group', { name: 'Preu' });
    tecleja(preu, ['0']);
    fireEvent.click(within(preu).getByRole('button', { name: 'Afig' }));
    await waitFor(async () => expect((await comandesDe(magatzem)).flatMap((c) => c.linies.map((l) => [l.producteId, l.preuUnitariCents])))
      .toEqual([['varis', 250]]));
  });
});

describe('el tiquet i «Cobra»', () => {
  test('tocar una línia obri l’editor a la consulta; «Cobra» porta al cobrament de la Caixa amb la tornada al TPV', async () => {
    const magatzem = await magatzemDeProva();
    await obriTpv('/app/bar/tpv', magatzem);
    fireEvent.click(rajola('Cafè sol'));
    await waitFor(() => expect(within(tiquet()).getByText('Cafè sol')).toBeTruthy());
    const [comanda] = await comandesDe(magatzem);
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/tpv/${comanda.id}`));
    fireEvent.click(within(tiquet()).getByRole('button', { name: /^Cafè sol 1 unitat/ }));
    expect(ubicacio()).toMatch(new RegExp(`^/app/bar/tpv/${comanda.id}\\?linia=l-`));
    const editor = await screen.findByRole('dialog', { name: '1 × Cafè sol' });
    fireEvent.click(within(editor).getByRole('button', { name: 'Tanca' }));
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/tpv/${comanda.id}`));

    const cobra = screen.getByRole('button', { name: /^Cobra 1,20/ });
    expect(cobra.disabled).toBe(false);
    fireEvent.click(cobra);
    expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}/cobrar?torna=tpv`);
    const cobrament = within(document.getElementById('app-grid-main'));
    fireEvent.click(await cobrament.findByRole('button', { name: /^Exacte en efectiu/ }));
    await screen.findByRole('dialog', { name: 'Nota de consum · no és factura' });
    const [venut] = await magatzem.tiquetsDelTorn('torn-prova');
    expect(venut).toMatchObject({ id: comanda.id, tipus: 'venda', totals: expect.objectContaining({ totalCents: 120 }) });
  });

  test('el cicle complet: TPV → «Cobra» → la nota del client → tancar-la torna al TPV', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(unaComanda('c-taula-3', { tipus: 'taula', taulaId: 't3' }, true));
    await obriTpv('/app/bar/tpv', magatzem);
    fireEvent.click(rajola('Cafè sol'));
    fireEvent.click(rajola('Tallat'));
    await waitFor(() => expect(within(tiquet()).getByText('Tallat')).toBeTruthy());
    const comanda = (await comandesDe(magatzem)).find((c) => c.origen.tipus === 'barra');
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/tpv/${comanda.id}`));
    fireEvent.click(screen.getByRole('button', { name: /^Cobra 2,50/ }));
    expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}/cobrar?torna=tpv`);
    const cobrament = within(document.getElementById('app-grid-main'));

    /* El mètode no perd la tornada, i «arrere» porta al TPV, a la mateixa comanda. */
    fireEvent.click(await cobrament.findByRole('button', { name: 'Targeta' }));
    expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}/cobrar?torna=tpv&metode=targeta`);
    fireEvent.click(cobrament.getByRole('button', { name: 'Torna al TPV' }));
    expect(ubicacio()).toBe(`/app/bar/tpv/${comanda.id}`);
    await waitFor(() => expect(within(tiquet()).getByText('Tallat')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /^Cobra 2,50/ }));
    fireEvent.click(await within(document.getElementById('app-grid-main')).findByRole('button', { name: /^Exacte en efectiu/ }));
    const nota = await screen.findByRole('dialog', { name: 'Nota de consum · no és factura' });
    expect(ubicacio()).toBe(`/app/bar/tiquets/${comanda.id}?nota=1&torna=tpv`);
    expect(within(document.getElementById('app-grid-main')).getByRole('button', { name: 'Torna al TPV' })).toBeTruthy();
    fireEvent.click(within(nota).getByRole('button', { name: 'Tanca la nota' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/bar/tpv'));
    /* De tornada, el TPV: la comanda venuda ja és un tiquet i la taula continua oberta. */
    await screen.findByRole('region', { name: 'TPV del meu bar' });
    expect(within(tiquet()).getByText('El tiquet és buit')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tiquets oberts 1' })).toBeTruthy();
    const [venut] = await magatzem.tiquetsDelTorn('torn-prova');
    expect(venut).toMatchObject({ id: comanda.id, tipus: 'venda', totals: expect.objectContaining({ totalCents: 250 }) });
    expect((await comandesDe(magatzem)).map((c) => c.id)).toEqual(['c-taula-3']);
  });

  test('des del cobrament que ve del TPV, «Cobra» i «Dividix» de la comanda del costat conserven la tornada fins a la nota', async () => {
    const magatzem = await magatzemDeProva();
    await obriTpv('/app/bar/tpv', magatzem);
    fireEvent.click(rajola('Cafè sol'));
    await waitFor(() => expect(within(tiquet()).getByText('Cafè sol')).toBeTruthy());
    const [comanda] = await comandesDe(magatzem);
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/tpv/${comanda.id}`));
    fireEvent.click(screen.getByRole('button', { name: /^Cobra 1,20/ }));
    expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}/cobrar?torna=tpv`);
    const mig = within(document.getElementById('app-grid-list'));
    fireEvent.click(await mig.findByRole('button', { name: 'Cobra' }));
    expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}/cobrar?torna=tpv`);
    fireEvent.click(mig.getByRole('button', { name: 'Dividix' }));
    expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}/dividir?torna=tpv`);
    const detall = within(document.getElementById('app-grid-main'));
    fireEvent.click(await detall.findByRole('button', { name: 'A parts iguals' }));
    expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}/dividir?torna=tpv&mode=parts`);
    fireEvent.click(await detall.findByRole('button', { name: /^Part 1 en efectiu/ }));
    fireEvent.click(await detall.findByRole('button', { name: 'Part 2 amb targeta' }));
    const nota = await screen.findByRole('dialog', { name: 'Nota de consum · no és factura' });
    expect(ubicacio()).toBe(`/app/bar/tiquets/${comanda.id}?nota=1&torna=tpv`);
    fireEvent.click(within(nota).getByRole('button', { name: 'Tanca la nota' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/bar/tpv'));
  });

  /* MCR o3_tpv_gestoria.1.4 (261016): «arrere» de la divisió ignorava ?torna=tpv i duia a la Caixa. */
  test('TPV → «Cobra» → «Dividix» → «Torna al TPV»: la divisió torna al TPV, a la mateixa comanda (també a parts iguals)', async () => {
    const magatzem = await magatzemDeProva();
    await obriTpv('/app/bar/tpv', magatzem);
    fireEvent.click(rajola('Cafè sol'));
    await waitFor(() => expect(within(tiquet()).getByText('Cafè sol')).toBeTruthy());
    const [comanda] = await comandesDe(magatzem);
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/tpv/${comanda.id}`));
    fireEvent.click(screen.getByRole('button', { name: /^Cobra 1,20/ }));
    expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}/cobrar?torna=tpv`);
    fireEvent.click(await within(document.getElementById('app-grid-list')).findByRole('button', { name: 'Dividix' }));
    expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}/dividir?torna=tpv`);
    const detall = within(document.getElementById('app-grid-main'));
    /* La columna de la divisió ja és a la pantalla: el seu «arrere» diu on porta. */
    await detall.findByRole('button', { name: 'A parts iguals' });
    expect(detall.queryByRole('button', { name: 'Torna a la comanda' })).toBeNull();
    fireEvent.click(detall.getByRole('button', { name: 'Torna al TPV' }));
    expect(ubicacio()).toBe(`/app/bar/tpv/${comanda.id}`);
    await waitFor(() => expect(within(tiquet()).getByText('Cafè sol')).toBeTruthy());

    /* A parts iguals, el mateix: el mode va a la consulta i «arrere» no el perd ni duu a la Caixa. */
    await ves(`/app/bar/caixa/${comanda.id}/dividir?torna=tpv&mode=parts`);
    const parts = within(document.getElementById('app-grid-main'));
    await parts.findByRole('group', { name: 'Parts' });
    fireEvent.click(parts.getByRole('button', { name: 'Torna al TPV' }));
    expect(ubicacio()).toBe(`/app/bar/tpv/${comanda.id}`);
    /* Res no s'ha cobrat ni dividit: la comanda continua sencera i oberta. */
    expect((await comandesDe(magatzem)).map((c) => [c.id, c.linies.length, c.pagaments.length])).toEqual([[comanda.id, 1, 0]]);
  });

  test('una divisió del TPV d’una comanda ja tancada: «Res a dividir» torna al TPV, no a la Caixa', async () => {
    const magatzem = await magatzemDeProva();
    munta('/app/bar/caixa/c-ja-tancada/dividir?torna=tpv', magatzem, DINS);
    /* El cos de la columna del detall porta el títol de l'estat buit com a nom de la regió. */
    const buit = await screen.findByRole('region', { name: 'Res a dividir' });
    const detall = within(document.getElementById('app-grid-main'));
    expect(buit.closest('#app-grid-main')).toBeTruthy();
    expect(detall.queryByRole('button', { name: 'Torna a la caixa' })).toBeNull();
    fireEvent.click(detall.getByRole('button', { name: 'Torna al TPV' }));
    expect(ubicacio()).toBe('/app/bar/tpv');
  });

  test('«Separa i cobra» de la divisió que ve del TPV porta al cobrament de la part amb la tornada', async () => {
    const magatzem = await magatzemDeProva();
    await obriTpv('/app/bar/tpv', magatzem);
    fireEvent.click(rajola('Cafè sol'));
    fireEvent.click(rajola('Tallat'));
    await waitFor(() => expect(within(tiquet()).getByText('Tallat')).toBeTruthy());
    const [comanda] = await comandesDe(magatzem);
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/tpv/${comanda.id}`));
    await ves(`/app/bar/caixa/${comanda.id}/dividir?torna=tpv`);
    const detall = within(document.getElementById('app-grid-main'));
    fireEvent.click(await detall.findByRole('button', { name: 'Suma una unitat: Tallat' }));
    fireEvent.click(detall.getByRole('button', { name: 'Separa i cobra' }));
    await waitFor(() => expect(ubicacio()).toMatch(/^\/app\/bar\/caixa\/[^/]+\/cobrar\?torna=tpv$/));
    expect(ubicacio()).not.toContain(comanda.id);
  });

  test('un pagament parcial: «Ja cobrat» al resum, el total diu «Pendent» i «Cobra», el que queda', async () => {
    const magatzem = await magatzemDeProva();
    const part = afegeixPagament(unaComanda('c-part', { tipus: 'barra' }, true), { metode: 'efectiu', importCents: 50 }, { id: 'p-1', ara: ARA });
    await magatzem.desaComanda(part);
    await obriTpv('/app/bar/tpv/c-part', magatzem);
    expect(within(tiquet()).getByText('Ja cobrat')).toBeTruthy();
    expect(within(tiquet()).getByText('Pendent')).toBeTruthy();
    expect(within(tiquet()).queryByText('Total')).toBeNull();
    const cobra = screen.getByRole('button', { name: /^Cobra / });
    expect(cobra.textContent).toBe(`Cobra ${euros(70)}`);
    expect(cobra.disabled).toBe(false);
  });

  test('amb línies però res pendent (convidada), «Cobra» queda desactivat', async () => {
    const magatzem = await magatzemDeProva();
    const convidada = convida(unaComanda('c-convidada', { tipus: 'barra' }, true), 'l-c-convidada', { motiu: 'De la casa', ara: ARA });
    await magatzem.desaComanda(convidada);
    await obriTpv('/app/bar/tpv/c-convidada', magatzem);
    expect(within(tiquet()).getByText('Cafè sol')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Cobra/ }).disabled).toBe(true);
  });
});

describe('tiquetDeComanda (vestits.js)', () => {
  const BUIT = { unitats: 0, linies: [], total: null, resum: [], pendentCents: 0 };

  test('sense comanda o sense línies: ni total ni resum', () => {
    expect(tiquetDeComanda(null)).toEqual(BUIT);
    expect(tiquetDeComanda(unaComanda('c-buida', { tipus: 'barra' }))).toEqual(BUIT);
  });

  test('una línia anul·lada es veu, però no compta a les unitats ni al total', () => {
    let c = marxa(unaComanda('c-1', { tipus: 'barra' }, true), { ara: ARA });
    c = afegeixProducte(c, { producte: TALLAT, ivaPerDefecte: 10 }, { ara: ARA, idLinia: 'l-tallat' });
    c = anullaLinia(c, 'l-c-1', { motiu: 'Equivocada', ara: ARA });
    const t = tiquetDeComanda(c);
    expect(t.unitats).toBe(1);
    expect(t.linies.map((l) => [l.id, l.estat])).toEqual([['l-c-1', 'anullat'], ['l-tallat', 'normal']]);
    expect(t.total).toEqual({ etiqueta: 'Total', valor: euros(130) });
    expect(t.pendentCents).toBe(130);
  });

  test('un pagament parcial: «Ja cobrat» al resum i el total és el pendent', () => {
    const c = afegeixPagament(unaComanda('c-1', { tipus: 'barra' }, true), { metode: 'efectiu', importCents: 50 }, { id: 'p-1', ara: ARA });
    const t = tiquetDeComanda(c);
    expect(t.resum.map((fila) => fila.etiqueta)).toEqual(['IVA del 10 % inclòs', 'Ja cobrat']);
    expect(t.resum[1].valor).toBe(euros(50));
    expect(t.total).toEqual({ etiqueta: 'Pendent', valor: euros(70) });
    expect(t.pendentCents).toBe(70);
  });

  test('pagada del tot o convidada: res pendent', () => {
    const pagada = afegeixPagament(unaComanda('c-1', { tipus: 'barra' }, true), { metode: 'targeta', importCents: 120 }, { id: 'p-1', ara: ARA });
    expect(tiquetDeComanda(pagada)).toMatchObject({ unitats: 1, total: { etiqueta: 'Pendent', valor: euros(0) }, pendentCents: 0 });
    const convidada = convida(unaComanda('c-2', { tipus: 'barra' }, true), 'l-c-2', { motiu: 'De la casa', ara: ARA });
    expect(tiquetDeComanda(convidada)).toMatchObject({ unitats: 1, total: { etiqueta: 'Total', valor: euros(0) }, pendentCents: 0 });
  });
});

describe('el diàleg «tria» i el preu obert', () => {
  test('un grup obligatori obri el diàleg a la consulta; un toc afig l’opció triada', async () => {
    const magatzem = await magatzemDeProva();
    await obriTpv('/app/bar/tpv', magatzem);
    fireEvent.click(rajola('Torrada amb tomaca'));
    expect(ubicacio()).toBe('/app/bar/tpv?tria=torrada-tomaca');
    const dialeg = await screen.findByRole('dialog', { name: 'Torrada amb tomaca' });
    expect(within(dialeg).getByText('Tria una opció de «Pa».')).toBeTruthy();
    fireEvent.click(within(dialeg).getByRole('button', { name: /^Pa sense gluten/ }));
    await waitFor(() => expect(within(tiquet()).getByText('Torrada amb tomaca')).toBeTruthy());
    expect(within(tiquet()).getByText(/Pa sense gluten/)).toBeTruthy();
    const [comanda] = await comandesDe(magatzem);
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/tpv/${comanda.id}`));
    expect(comanda.linies.map((l) => [l.producteId, l.modificadors.map((mod) => mod.opcioId)])).toEqual([['torrada-tomaca', ['sense-gluten']]]);
  });

  test('dues variants sense grup obligatori: el toc obri la tria (com a Loyverse) i ven la variant triada, no la primera', async () => {
    const magatzem = await magatzemDeProva();
    await obriTpv('/app/bar/tpv', magatzem);
    fireEvent.click(rajola('Aigua'));
    expect(ubicacio()).toBe('/app/bar/tpv?tria=aigua');
    const dialeg = await screen.findByRole('dialog', { name: 'Aigua' });
    expect(within(dialeg).getByText('Tria la variant.')).toBeTruthy();
    fireEvent.click(within(dialeg).getByRole('button', { name: /^Gran/ }));
    await waitFor(() => expect(within(tiquet()).getByText('Aigua')).toBeTruthy());
    const [comanda] = await comandesDe(magatzem);
    expect(comanda.linies.map((l) => [l.producteId, l.varianteId, l.preuUnitariCents])).toEqual([['aigua', 'gran', 180]]);
  });

  test('tancar el diàleg sense triar no afig res i torna la consulta com era', async () => {
    const magatzem = await magatzemDeProva();
    await obriTpv('/app/bar/tpv', magatzem);
    fireEvent.click(rajola('Carajillo'));
    expect(ubicacio()).toBe('/app/bar/tpv?tria=carajillo');
    fireEvent.click(within(await screen.findByRole('dialog', { name: 'Carajillo' })).getByRole('button', { name: 'Tancar' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/bar/tpv'));
    expect(await comandesDe(magatzem)).toEqual([]);
  });

  test('el preu obert es tecleja amb el diàleg de la Caixa', async () => {
    const magatzem = await magatzemDeProva();
    await obriTpv('/app/bar/tpv', magatzem);
    fireEvent.click(rajola('Varis'));
    expect(ubicacio()).toBe('/app/bar/tpv?preu=varis');
    const preu = await screen.findByRole('group', { name: 'Preu' });
    tecleja(preu, ['2', '5', '0']);
    fireEvent.click(within(preu).getByRole('button', { name: 'Afig' }));
    await waitFor(() => expect(within(tiquet()).getByText('Varis')).toBeTruthy());
    const [comanda] = await comandesDe(magatzem);
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/tpv/${comanda.id}`));
    expect(comanda.linies.map((l) => [l.producteId, l.preuUnitariCents])).toEqual([['varis', 250]]);
  });

  test('preu obert amb dues variants: primer la tria de la variant i després el teclat, amb la variant al títol', async () => {
    const magatzem = await magatzemDeProva();
    const carta = llavorCarta();
    const varis = carta.productes.find((p) => p.id === 'varis');
    const malibu = {
      ...varis, id: 'malibu', nom: 'Malibú', ordre: 1000, imatge: { slug: 'licoreria-malibu', estat: 'marcador' },
      variants: [{ id: 'botella', nom: 'Botella', preuCents: 0 }, { id: 'copa', nom: 'Copa', preuCents: 0 }]
    };
    await magatzem.desaCarta({ ...carta, productes: [...carta.productes, malibu] });
    await obriTpv('/app/bar/tpv', magatzem);
    fireEvent.click(rajola('Malibú'));
    expect(ubicacio()).toBe('/app/bar/tpv?tria=malibu');
    fireEvent.click(within(await screen.findByRole('dialog', { name: 'Malibú' })).getByRole('button', { name: /^Copa/ }));
    await waitFor(() => expect(ubicacio().startsWith('/app/bar/tpv?')).toBe(true));
    const consulta = new URLSearchParams(ubicacio().split('?')[1]);
    expect([consulta.get('preu'), consulta.get('variant'), consulta.get('tria')]).toEqual(['malibu', 'copa', null]);
    const teclat = within(await screen.findByRole('dialog', { name: 'Malibú · Copa' })).getByRole('group', { name: 'Preu' });
    tecleja(teclat, ['2', '5', '0']);
    fireEvent.click(within(teclat).getByRole('button', { name: 'Afig' }));
    await waitFor(() => expect(within(tiquet()).getByText('Malibú')).toBeTruthy());
    const [comanda] = await comandesDe(magatzem);
    expect(comanda.linies.map((l) => [l.producteId, l.varianteId, l.preuUnitariCents])).toEqual([['malibu', 'copa', 250]]);
  });

  test('tancar el teclat del preu torna el focus a la rajola, i reobrir-lo dona un teclat a zero', async () => {
    const magatzem = await magatzemDeProva();
    await obriTpv('/app/bar/tpv', magatzem);
    rajola('Varis').focus();
    fireEvent.click(rajola('Varis'));
    tecleja(await screen.findByRole('group', { name: 'Preu' }), ['7']);
    const cancela = screen.getByRole('button', { name: 'Cancel·la' });
    cancela.focus();
    fireEvent.click(cancela);
    await waitFor(() => expect(ubicacio()).toBe('/app/bar/tpv'));
    /* El <dialog> s'ha tancat (no desmuntat): el focus torna a qui l'havia obert. */
    expect(document.activeElement).toBe(rajola('Varis'));
    fireEvent.click(rajola('Varis'));
    const preu = await screen.findByRole('group', { name: 'Preu' });
    tecleja(preu, ['2', '5', '0']);
    fireEvent.click(within(preu).getByRole('button', { name: 'Afig' }));
    await waitFor(() => expect(within(tiquet()).getByText('Varis')).toBeTruthy());
    const [comanda] = await comandesDe(magatzem);
    expect(comanda.linies.map((l) => l.preuUnitariCents)).toEqual([250]);
  });
});

describe('per emportar', () => {
  test('una comanda per emportar només veu la carta per a casa, i l’avís ho diu', async () => {
    const magatzem = await magatzemDeProva();
    const carta = llavorCarta();
    await magatzem.desaCarta({
      ...carta,
      productes: carta.productes.map((p) => (p.id === 'cava' ? { ...p, canals: { cartaDigital: true, perEmportar: false } } : p))
    });
    await magatzem.desaComanda(unaComanda('c-emportar', { tipus: 'emportar' }));
    const tpv = await obriTpv('/app/bar/tpv/c-emportar', magatzem);
    expect(within(tpv).getByText('Per emportar: només la carta per a casa.')).toBeTruthy();
    expect(within(graella()).queryByRole('button', { name: /^Cava,/ })).toBeNull();
    fireEvent.click(rajola('Cafè sol'));
    await waitFor(() => expect(within(tiquet()).getByText('Cafè sol')).toBeTruthy());
    expect(ubicacio()).toBe('/app/bar/tpv/c-emportar');
    expect((await comandesDe(magatzem)).map((c) => [c.id, c.linies.length])).toEqual([['c-emportar', 1]]);
    /* A la barra, la carta sencera i cap avís d'emportar. */
    await ves('/app/bar/tpv');
    expect(rajola('Cava')).toBeTruthy();
    expect(screen.queryByText('Per emportar: només la carta per a casa.')).toBeNull();
  });
});

describe('els canals de la fitxa del producte (Carta.jsx)', () => {
  /* Apaga un interruptor de la fitxa i desa el producte. */
  const apagaIDesa = async (nom) => {
    const interruptor = await screen.findByRole('switch', { name: nom });
    expect(interruptor.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(interruptor);
    expect(interruptor.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Desa el producte' }));
    await screen.findByText('Desat. Les comandes ja fetes no canvien.');
  };
  const canalsDelCava = async (magatzem) => (await magatzem.base.obte('cataleg', 'carta')).productes.find((p) => p.id === 'cava').canals;

  test('«Per emportar» apagat: es desa a la carta i el Cava ix de la carta per emportar del TPV', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(unaComanda('c-emportar', { tipus: 'emportar' }));
    munta('/app/bar/productes/cava', magatzem, DINS);
    await apagaIDesa('Per emportar');
    expect(await canalsDelCava(magatzem)).toEqual({ cartaDigital: true, perEmportar: false });
    await ves('/app/bar/tpv/c-emportar');
    await screen.findByRole('region', { name: 'TPV del meu bar' });
    expect(within(graella()).queryByRole('button', { name: /^Cava,/ })).toBeNull();
    await ves('/app/bar/tpv');
    expect(rajola('Cava')).toBeTruthy();
  });

  test('«A la carta digital» apagat: es desa la seua clau, i la carta per emportar no canvia', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(unaComanda('c-emportar', { tipus: 'emportar' }));
    munta('/app/bar/productes/cava', magatzem, DINS);
    await apagaIDesa('A la carta digital');
    expect(await canalsDelCava(magatzem)).toEqual({ cartaDigital: false, perEmportar: true });
    await ves('/app/bar/tpv/c-emportar');
    await screen.findByRole('region', { name: 'TPV del meu bar' });
    expect(rajola('Cava')).toBeTruthy();
  });
});

describe('els tiquets oberts', () => {
  test('el diàleg va a la consulta: la barra és l’actual, un toc porta a la taula i «Nou tiquet de barra» n’obri un', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(unaComanda('c-taula-3', { tipus: 'taula', taulaId: 't3' }, true));
    await obriTpv('/app/bar/tpv', magatzem);
    fireEvent.click(screen.getByRole('button', { name: 'Tiquets oberts 1' }));
    expect(ubicacio()).toBe('/app/bar/tpv?oberts=1');
    const dialeg = await screen.findByRole('dialog', { name: 'Tiquets oberts' });
    const opcions = within(within(dialeg).getByRole('list', { name: 'Tiquets oberts' })).getAllByRole('button');
    expect(opcions.map((boto) => [boto.textContent.split(' ')[0], boto.getAttribute('aria-current')])).toEqual([['Barra', 'true'], ['Taula', null]]);
    fireEvent.click(within(dialeg).getByRole('button', { name: /^Taula 3 / }));
    expect(ubicacio()).toBe('/app/bar/tpv/c-taula-3');
    await waitFor(() => expect(within(tiquet()).getByText('Cafè sol')).toBeTruthy());
    expect(screen.queryByRole('dialog', { name: 'Tiquets oberts' })).toBeNull();
    /* La capçalera diu de quin tiquet es tracta: no es pot afegir ni cobrar a la taula equivocada. */
    expect(screen.getByRole('region', { name: 'Tiquet Taula 3 1' })).toBeTruthy();
    expect(within(tiquet()).getByText('Taula 3').className).toBe('sdp-tpv__nom-tiquet');

    fireEvent.click(screen.getByRole('button', { name: 'Tiquets oberts 1' }));
    const altra = await screen.findByRole('dialog', { name: 'Tiquets oberts' });
    expect(within(altra).getByRole('button', { name: /^Taula 3 / }).getAttribute('aria-current')).toBe('true');
    fireEvent.click(within(altra).getByRole('button', { name: 'Nou tiquet de barra' }));
    await waitFor(async () => expect(await comandesDe(magatzem)).toHaveLength(2));
    const nova = (await comandesDe(magatzem)).find((c) => c.origen.tipus === 'barra');
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/tpv/${nova.id}`));
    expect(within(tiquet()).getByText('El tiquet és buit')).toBeTruthy();
    expect(screen.getByRole('region', { name: BARRA_AMB_HORA(0) })).toBeTruthy();
  });

  test('un paràmetre que no és «1» no obri el diàleg (Clàusula dels Slugs)', async () => {
    const magatzem = await magatzemDeProva();
    await obriTpv('/app/bar/tpv?oberts=si', magatzem);
    expect(screen.queryByRole('dialog', { name: 'Tiquets oberts' })).toBeNull();
  });
});
