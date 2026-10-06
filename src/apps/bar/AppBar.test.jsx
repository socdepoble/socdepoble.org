/* El Bar dins de la plataforma de veres (RutaApps → ClosaAplicacio →
   esquelet comú), amb un magatzem en memòria i un rellotge fix (disseny del
   Bar §A.13, vistes): obrir el torn, la comanda ràpida de punta a punta
   (tocar, cobrar exacte i veure el tiquet a l'historial), les taules,
   dividir a parts, una devolució i el tancament amb diferència de caixa i
   la lectura obligatòria del traspàs en obrir el torn següent.
   La sessió va SEMPRE fixada a l'entorn (ProveidorPlataforma, entorn.sessio):
   el permís «escriure: 'sessio'» és de tot el Bar (ordre del Mestre, 261006),
   i les proves que venen ho fan amb la sessió dins i en línia. Les del
   permís (sense sessió en mode remot, mode de proves, sense xarxa amb la
   sessió desada i la guarda de l'estat) són a «el permís de sessió». */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { muntaPlataforma, ENTORN_OBERT } from '../plataforma/__fixtures__/munta.jsx';
import { ProveidorApp } from '../plataforma/PlataformaContext.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import manifestBar from './manifest.js';
import AppBar from './AppBar.jsx';
import { ProveidorBar, useBar } from './estat/ProveidorBar.jsx';
import { creaMagatzemBar } from './magatzem.js';
import { obriTorn } from './nucli/torn.js';
import { costEscandall } from './nucli/escandall.js';
import { ESTABLIMENT_EXEMPLE, llavorCarta } from './nucli/llavor.js';
import { afegeixProducte, creaComanda, totals } from './nucli/comanda.js';
import { afegeixPagament, tanca } from './nucli/cobrament.js';

/* La sessió de cada prova: dins i en línia (venen), sense sessió en mode remot,
   en mode de proves, i sense xarxa amb la sessió desada en el dispositiu. */
const BASE = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const ENTORN = Object.freeze({ ...BASE, sessio: { estat: 'dins', enLinia: true, modeProves: false } });
const SENSE_SESSIO = Object.freeze({ ...BASE, sessio: { estat: 'fora', enLinia: true, modeProves: false } });
const MODE_PROVES = Object.freeze({ ...BASE, sessio: { estat: 'fora', enLinia: true, modeProves: true } });
const FORA_DE_LINIA = Object.freeze({ ...BASE, sessio: { estat: 'fora', enLinia: false, modeProves: false, recuperable: true } });

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

async function magatzemDeProva({ ambTorn = true, fons = 0 } = {}) {
  const magatzem = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
  await magatzem.carrega();
  if (ambTorn) {
    const torn = obriTorn({ id: 'torn-prova', per: 'Cambrer 1', fonsInicialCents: fons, ara: '2026-10-02T07:00:00.000Z' });
    await magatzem.desaTorn(torn);
    await magatzem.desaMeta('tornActual', torn.id);
  }
  return magatzem;
}

function munta(url, magatzem, entorn = ENTORN) {
  const rellotge = rellotgeDeProva();
  const atzar = atzarDeProva();
  const App = () => <AppBar magatzem={magatzem} rellotge={rellotge} atzar={atzar} />;
  const registre = creaRegistre({ internes: [{ ...manifestBar, carrega: () => Promise.resolve({ default: App }) }] });
  return muntaPlataforma(url, { registre, entorn });
}

const columna = (id) => within(document.getElementById(id));
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const ves = (url) => act(async () => {
  window.history.pushState(null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
});
const ambAmplada = (amplada) => vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(amplada);
const producte = (nom) => columna('app-grid-main').getByRole('button', { name: new RegExp(`^${nom} `) });
const tecleja = (teclat, xifres) => {
  for (const xifra of xifres) fireEvent.click(within(teclat).getByRole('button', { name: xifra }));
};

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  ambAmplada(1400);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('el torn', () => {
  test('sense torn, la caixa ho diu i porta a obrir-lo; obrir-lo deixa vendre', async () => {
    const magatzem = await magatzemDeProva({ ambTorn: false });
    munta('/app/bar/caixa', magatzem);
    const tancats = await screen.findAllByText('El torn està tancat');
    expect(tancats.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(columna('app-grid-main').getByRole('button', { name: 'Obri el torn' }));
    expect(ubicacio()).toBe('/app/bar/torn');
    const detall = columna('app-grid-main');
    fireEvent.change(await detall.findByLabelText(/Qui obri el torn/), { target: { value: 'Cambrer 1' } });
    tecleja(detall.getByRole('group', { name: 'Fons inicial de caixa' }), ['5', '0', '0', '0']);
    fireEvent.click(detall.getByRole('button', { name: 'Obri el torn' }));
    expect(await detall.findByRole('heading', { name: /Torn de Cambrer 1/ })).toBeTruthy();
    const torns = await magatzem.base.totes('torns');
    expect(torns).toEqual([expect.objectContaining({ estat: 'obert', obertPer: 'Cambrer 1', fonsInicialCents: 5000 })]);
  });
});

describe('la comanda ràpida (§A.6, flux 1)', () => {
  test('«dos cafès i una torrada»: tocar, el diàleg menut del pa, cobrar exacte i la nota al client', async () => {
    const magatzem = await magatzemDeProva();
    munta('/app/bar/caixa', magatzem);
    await screen.findByRole('region', { name: 'Productes' });
    fireEvent.click(producte('Cafè sol'));
    await waitFor(() => expect(columna('app-grid-list').getByText('Cafè sol')).toBeTruthy());
    fireEvent.click(producte('Cafè sol'));
    await waitFor(() => expect(document.querySelector('[data-linia] .sdp-linies__quantitat [aria-hidden="true"]').textContent).toBe('2 ×'));
    /* La torrada porta un grup obligatori (el pa): un toc tria i tanca. */
    fireEvent.click(producte('Torrada amb tomaca'));
    const dialeg = await screen.findByRole('dialog', { name: 'Torrada amb tomaca' });
    fireEvent.click(within(dialeg).getByRole('button', { name: /^Pa de pagès/ }));
    await waitFor(() => expect(columna('app-grid-list').getByText('Torrada amb tomaca')).toBeTruthy());
    expect(columna('app-grid-list').getByText(/Pa de pagès/)).toBeTruthy();
    const resum = columna('app-grid-list').getByRole('heading', { level: 3 });
    expect(resum.textContent).toBe('Comanda 2 línies');
    expect(columna('app-grid-list').getByText(/4,90/)).toBeTruthy();

    /* La comanda nova ja és al camí (BAR-R7): /caixa/<comanda>/cobrar. */
    expect(ubicacio()).toMatch(/^\/app\/bar\/caixa\/c-[a-z0-9-]+$/);
    fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Cobra' }));
    expect(ubicacio()).toMatch(/^\/app\/bar\/caixa\/c-[a-z0-9-]+\/cobrar$/);
    fireEvent.click(await columna('app-grid-main').findByRole('button', { name: /^Exacte en efectiu/ }));
    const nota = await screen.findByRole('dialog', { name: 'Nota de consum · no és factura' });
    expect(within(nota).getByText(/Nota 0001/)).toBeTruthy();
    expect(ubicacio()).toMatch(/^\/app\/bar\/tiquets\/c-[a-z0-9-]+\?nota=1$/);
    expect(columna('app-grid-list').getByRole('link', { name: /^Nota 0001 · Barra/ })).toBeTruthy();
    const tiquets = await magatzem.tiquetsDelTorn('torn-prova');
    expect(tiquets).toHaveLength(1);
    expect(tiquets[0]).toMatchObject({ tipus: 'venda', numero: 1, totals: expect.objectContaining({ totalCents: 490 }) });
    expect(await magatzem.base.totes('comandes')).toEqual([]);
  });

  test('tres tocs seguits, sense esperar, fan una sola comanda (la cua d’operacions)', async () => {
    const magatzem = await magatzemDeProva();
    munta('/app/bar/caixa', magatzem);
    await screen.findByRole('region', { name: 'Productes' });
    fireEvent.click(producte('Tallat'));
    fireEvent.click(producte('Tallat'));
    fireEvent.click(producte('Infusió'));
    await waitFor(() => expect(columna('app-grid-list').getByText('Infusió')).toBeTruthy());
    const comandes = await magatzem.base.totes('comandes');
    expect(comandes).toHaveLength(1);
    expect(comandes[0].linies.map((l) => [l.producteId, l.quantitat])).toEqual([['tallat', 2], ['infusio', 1]]);
  });

  test('una línia marxada no es lleva: s’obri l’editor per a anul·lar-la amb motiu', async () => {
    const magatzem = await magatzemDeProva();
    munta('/app/bar/caixa', magatzem);
    await screen.findByRole('region', { name: 'Productes' });
    fireEvent.click(producte('Olives'));
    await waitFor(() => expect(columna('app-grid-list').getByText('Olives')).toBeTruthy());
    fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Marxa' }));
    await waitFor(() => expect(columna('app-grid-list').getByText('Marxat')).toBeTruthy());
    fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Lleva Olives' }));
    const editor = await screen.findByRole('dialog', { name: '1 × Olives' });
    expect(ubicacio()).toMatch(/\?linia=l-/);
    fireEvent.click(within(editor).getByRole('button', { name: 'Anul·la' }));
    fireEvent.click(within(editor).getAllByRole('button', { name: 'Anul·la' }).at(-1));
    expect(await within(editor).findByText('Cal dir el motiu.')).toBeTruthy();
    fireEvent.change(within(editor).getByLabelText(/Motiu/), { target: { value: 'Caigudes a terra' } });
    fireEvent.click(within(editor).getAllByRole('button', { name: 'Anul·la' }).at(-1));
    await waitFor(() => expect(columna('app-grid-list').getByText('Anul·lat')).toBeTruthy());
    const [comanda] = await magatzem.base.totes('comandes');
    expect(comanda.linies[0]).toMatchObject({ estat: 'anullada', motiuAnullacio: 'Caigudes a terra' });
  });
});

describe('les taules (§A.6, flux 2)', () => {
  test('el plànol per zones: tocar una taula hi porta i el primer producte li obri la comanda', async () => {
    const magatzem = await magatzemDeProva();
    munta('/app/bar/taules', magatzem);
    await screen.findByRole('region', { name: 'Sala' });
    fireEvent.click(await columna('app-grid-main').findByRole('button', { name: /^Taula 3 / }));
    expect(ubicacio()).toBe('/app/bar/taules/t3');
    await screen.findByRole('region', { name: 'Productes' });
    expect(columna('app-grid-list').getByRole('heading', { level: 3 }).textContent).toBe('Comanda 0 línies');
    fireEvent.click(producte('Cava'));
    await waitFor(() => expect(columna('app-grid-list').getByText('Cava')).toBeTruthy());
    const [comanda] = await magatzem.base.totes('comandes');
    expect(comanda.origen).toEqual({ tipus: 'taula', taulaId: 't3' });
    await ves('/app/bar/taules');
    const oberta = await columna('app-grid-main').findByRole('button', { name: /^Taula 3 / });
    expect(oberta.closest('li').textContent).toMatch(/3,00/);
    expect(oberta.closest('li').className).toContain('sdp-graella-articles__element--en-colleccio');
  });
});

describe('dividir i retornar', () => {
  test('a parts iguals: dues parts, una en efectiu i l’altra amb targeta, tanquen el compte', async () => {
    const magatzem = await magatzemDeProva();
    munta('/app/bar/caixa', magatzem);
    await screen.findByRole('region', { name: 'Productes' });
    fireEvent.click(producte('Plat combinat del dia'));
    await waitFor(() => expect(columna('app-grid-list').getByText('Plat combinat del dia')).toBeTruthy());
    fireEvent.click(producte('Aigua'));
    await waitFor(() => expect(columna('app-grid-list').getByText('Aigua')).toBeTruthy());
    fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Dividix' }));
    expect(ubicacio()).toMatch(/^\/app\/bar\/caixa\/c-[a-z0-9-]+\/dividir$/);
    const detall = columna('app-grid-main');
    fireEvent.click(await detall.findByRole('button', { name: 'A parts iguals' }));
    fireEvent.click(await detall.findByRole('button', { name: /^Part 1 en efectiu \(5,50/ }));
    fireEvent.click(await detall.findByRole('button', { name: 'Part 2 amb targeta' }));
    await screen.findByRole('dialog', { name: 'Nota de consum · no és factura' });
    const [tiquet] = await magatzem.tiquetsDelTorn('torn-prova');
    expect(tiquet.pagaments.map((p) => [p.metode, p.importCents, p.part])).toEqual([['efectiu', 550, 1], ['targeta', 550, 2]]);
  });

  test('una devolució enllaçada amb motiu: un tiquet nou, l’original no canvia', async () => {
    const magatzem = await magatzemDeProva();
    munta('/app/bar/caixa', magatzem);
    await screen.findByRole('region', { name: 'Productes' });
    fireEvent.click(producte('Refresc de cola'));
    await waitFor(() => expect(columna('app-grid-list').getByText('Refresc de cola')).toBeTruthy());
    fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Cobra' }));
    fireEvent.click(await columna('app-grid-main').findByRole('button', { name: /^Exacte en efectiu/ }));
    await screen.findByRole('dialog', { name: 'Nota de consum · no és factura' });
    const [venda] = await magatzem.tiquetsDelTorn('torn-prova');
    await ves(`/app/bar/tiquets/${venda.id}/retorn`);
    const detall = columna('app-grid-main');
    fireEvent.click(await detall.findByRole('button', { name: 'Suma una unitat: Refresc de cola' }));
    fireEvent.change(detall.getByLabelText(/Motiu/), { target: { value: 'Estava calent' } });
    fireEvent.click(detall.getByRole('button', { name: 'Fes la devolució' }));
    await waitFor(() => expect(ubicacio()).toMatch(/^\/app\/bar\/tiquets\/k-/));
    expect(columna('app-grid-list').getByRole('link', { name: /^Nota 0002 · Devolució/ })).toBeTruthy();
    const tiquets = await magatzem.tiquetsDelTorn('torn-prova');
    expect(tiquets.map((t) => [t.tipus, t.totals.totalCents])).toEqual([['venda', 200], ['devolucio', -200]]);
  });
});

/* Les correccions de la revisió del lot (BAR-R1…R8): cada prova reproduïx la troballa. */
const comandesDe = (magatzem) => magatzem.base.totes('comandes');
const ambUnProducte = async (magatzem, nom, url = '/app/bar/caixa') => {
  munta(url, magatzem);
  await screen.findByRole('region', { name: 'Productes' });
  fireEvent.click(producte(nom));
  await waitFor(() => expect(columna('app-grid-list').getByText(nom)).toBeTruthy());
};

describe('BAR-R1 · dividir a parts iguals', () => {
  test('el teclat de parts admet 3 (C i 3) i les tres parts sumen el pendent: 334 + 333 + 333', async () => {
    const magatzem = await magatzemDeProva();
    await ambUnProducte(magatzem, 'Plat combinat del dia');
    fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Dividix' }));
    const detall = columna('app-grid-main');
    fireEvent.click(await detall.findByRole('button', { name: 'A parts iguals' }));
    const teclat = await detall.findByRole('group', { name: 'Parts' });
    fireEvent.click(within(teclat).getByRole('button', { name: 'C, posa a zero' }));
    expect(detall.queryByRole('button', { name: /^Part 1 en efectiu/ })).toBeNull();
    expect(detall.getByText('Tria entre 2 i 50 parts.')).toBeTruthy();
    tecleja(teclat, ['3']);
    fireEvent.click(await detall.findByRole('button', { name: /^Part 1 en efectiu \(3,34/ }));
    fireEvent.click(await detall.findByRole('button', { name: 'Part 2 amb targeta' }));
    fireEvent.click(await detall.findByRole('button', { name: 'Part 3 amb targeta' }));
    await screen.findByRole('dialog', { name: 'Nota de consum · no és factura' });
    const [tiquet] = await magatzem.tiquetsDelTorn('torn-prova');
    expect(tiquet.pagaments.map((p) => [p.metode, p.importCents, p.part])).toEqual([['efectiu', 334, 1], ['targeta', 333, 2], ['targeta', 333, 3]]);
  });
});

describe('BAR-R2 · una comanda amb totes les línies anul·lades', () => {
  test('es tanca sense cobrar: un tiquet de 0 € que conserva l’anul·lació, i no passa de torn', async () => {
    const magatzem = await magatzemDeProva();
    await ambUnProducte(magatzem, 'Olives');
    fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Marxa' }));
    await waitFor(() => expect(columna('app-grid-list').getByText('Marxat')).toBeTruthy());
    fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Lleva Olives' }));
    const editor = await screen.findByRole('dialog', { name: '1 × Olives' });
    fireEvent.click(within(editor).getByRole('button', { name: 'Anul·la' }));
    fireEvent.change(within(editor).getByLabelText(/Motiu/), { target: { value: 'Se n’ha anat' } });
    fireEvent.click(within(editor).getAllByRole('button', { name: 'Anul·la' }).at(-1));
    await waitFor(() => expect(columna('app-grid-list').getByText('Anul·lat')).toBeTruthy());
    fireEvent.click(await columna('app-grid-list').findByRole('button', { name: 'Tanca sense cobrar' }));
    await waitFor(async () => expect(await comandesDe(magatzem)).toEqual([]));
    const [tiquet] = await magatzem.tiquetsDelTorn('torn-prova');
    expect(tiquet).toMatchObject({ tipus: 'venda', totals: expect.objectContaining({ totalCents: 0, anullatsCents: 200 }) });
    expect(tiquet.linies[0]).toMatchObject({ estat: 'anullada', motiuAnullacio: 'Se n’ha anat' });
  });
});

describe('BAR-R5 · dos tocs seguits no perden ni dupliquen operacions', () => {
  test('dos + seguits a una línia sumen dues unitats', async () => {
    const magatzem = await magatzemDeProva();
    await ambUnProducte(magatzem, 'Tallat');
    const mes = columna('app-grid-list').getByRole('button', { name: 'Suma una unitat: Tallat' });
    fireEvent.click(mes);
    fireEvent.click(mes);
    await waitFor(async () => expect((await comandesDe(magatzem))[0].linies[0].quantitat).toBe(3));
    fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Resta una unitat: Tallat' }));
    fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Resta una unitat: Tallat' }));
    await waitFor(async () => expect((await comandesDe(magatzem))[0].linies[0].quantitat).toBe(1));
  });

  test('dos tocs seguits a «El datàfon ha cobrat» anoten un sol pagament', async () => {
    const magatzem = await magatzemDeProva();
    await ambUnProducte(magatzem, 'Plat combinat del dia');
    fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Cobra' }));
    const detall = columna('app-grid-main');
    fireEvent.click(await detall.findByRole('button', { name: 'Targeta' }));
    const teclat = await detall.findByRole('group', { name: 'Import' });
    fireEvent.click(within(teclat).getByRole('button', { name: 'C, posa a zero' }));
    tecleja(teclat, ['5', '0', '0']);
    const boto = detall.getByRole('button', { name: /^El datàfon ha cobrat 5,00/ });
    fireEvent.click(boto);
    fireEvent.click(boto);
    await waitFor(async () => expect((await comandesDe(magatzem))[0].pagaments).toHaveLength(1));
    await act(async () => {});
    const [comanda] = await comandesDe(magatzem);
    expect(comanda.pagaments.map((p) => [p.metode, p.importCents])).toEqual([['targeta', 500]]);
    expect(await magatzem.tiquetsDelTorn('torn-prova')).toEqual([]);
  });

  test('dos + seguits a l’arqueig compten dues peces', async () => {
    const magatzem = await magatzemDeProva();
    munta('/app/bar/tancament/arqueig', magatzem);
    const mes = await screen.findByRole('button', { name: /^Suma una unitat: 1,00/ });
    const arqueig = columna('app-grid-main');
    fireEvent.click(mes);
    fireEvent.click(mes);
    await waitFor(() => expect(arqueig.getByRole('heading', { level: 3 }).textContent).toBe('Comptat 2 peces'));
    expect((await magatzem.base.obte('meta', 'tancament')).valor.perDenominacio).toEqual({ 100: 2 });
  });
});

describe('BAR-R6 · el cost de l’escandall arriba a la línia venuda', () => {
  test('un entrepà de truita porta el cost per ració del seu escandall', async () => {
    const magatzem = await magatzemDeProva();
    munta('/app/bar/caixa', magatzem);
    await screen.findByRole('region', { name: 'Productes' });
    fireEvent.click(producte('Entrepà de truita'));
    const dialeg = await screen.findByRole('dialog', { name: 'Entrepà de truita' });
    fireEvent.click(within(dialeg).getByRole('button', { name: /^Pa de barra/ }));
    await waitFor(() => expect(columna('app-grid-list').getByText('Entrepà de truita')).toBeTruthy());
    const carta = llavorCarta();
    const esperat = costEscandall(carta.escandalls.find((e) => e.producteId === 'entrepa-truita'), carta.ingredients).costRacioCents;
    expect(esperat).toBeGreaterThan(0);
    const [comanda] = await comandesDe(magatzem);
    expect(comanda.linies[0].costUnitariCents).toBe(esperat);
  });
});

describe('BAR-R7 · on és la persona va a la URL (Clàusula dels Slugs)', () => {
  test('el primer producte a /caixa posa la comanda al camí', async () => {
    const magatzem = await magatzemDeProva();
    await ambUnProducte(magatzem, 'Cafè sol');
    const [comanda] = await comandesDe(magatzem);
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}`));
  });

  test('«Mou», el preu obert, el mètode de cobrament i el mode de divisió viuen a la consulta', async () => {
    const magatzem = await magatzemDeProva();
    await ambUnProducte(magatzem, 'Cafè sol');
    const [comanda] = await comandesDe(magatzem);
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}`));
    fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Mou' }));
    expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}?mou=1`);
    expect(await screen.findByRole('dialog', { name: 'Mou o ajunta la comanda' })).toBeTruthy();
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Mou o ajunta la comanda' })).getByRole('button', { name: 'Cancel·la' }));
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}`));

    fireEvent.click(producte('Varis'));
    expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}?preu=varis`);
    expect(await screen.findByRole('group', { name: 'Preu' })).toBeTruthy();
    /* Des del detall de l'esquelet (?article=): el detall es tanca i el preu s'obri, sense xafar-se. */
    await ves(`/app/bar/caixa/${comanda.id}?article=varis`);
    const detallVaris = await screen.findByRole('dialog', { name: 'Varis' });
    fireEvent.click(within(detallVaris).getByRole('button', { name: 'Afig' }));
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}?preu=varis`));
    const preu = await screen.findByRole('group', { name: 'Preu' });
    tecleja(preu, ['2', '5', '0']);
    fireEvent.click(within(preu).getByRole('button', { name: 'Afig' }));
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}`));
    await waitFor(async () => expect((await comandesDe(magatzem))[0].linies.map((l) => [l.producteId, l.preuUnitariCents])).toEqual([['cafe-sol', 120], ['varis', 250]]));

    await ves(`/app/bar/caixa/${comanda.id}/cobrar?metode=targeta`);
    expect(await columna('app-grid-main').findByText('Cobra amb el datàfon')).toBeTruthy();
    fireEvent.click(columna('app-grid-main').getByRole('button', { name: 'Efectiu' }));
    expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}/cobrar`);

    await ves(`/app/bar/caixa/${comanda.id}/dividir`);
    fireEvent.click(await columna('app-grid-main').findByRole('button', { name: 'A parts iguals' }));
    expect(ubicacio()).toBe(`/app/bar/caixa/${comanda.id}/dividir?mode=parts`);
    expect(await columna('app-grid-main').findByRole('group', { name: 'Parts' })).toBeTruthy();
  });
});

describe('BAR-R8 · els tiquets oberts no marquen cap ubicació falsa', () => {
  test('a /taules i a /emportar cap targeta és l’actual; a /caixa, la barra sí', async () => {
    const magatzem = await magatzemDeProva();
    munta('/app/bar/taules', magatzem);
    const actuals = () => screen.getByRole('region', { name: 'Tiquets oberts' }).querySelectorAll('[aria-current]');
    await screen.findByRole('region', { name: 'Sala' });
    expect(actuals()).toHaveLength(0);
    await ves('/app/bar/emportar');
    await screen.findByRole('button', { name: 'Nova comanda per emportar' });
    expect(actuals()).toHaveLength(0);
    await ves('/app/bar/caixa');
    await screen.findByRole('region', { name: 'Productes' });
    expect([...actuals()].map((a) => a.textContent)).toEqual([expect.stringMatching(/^Barra/)]);
  });
});

describe('Ajustos › Carta (Onada 3, T2): la llavor de La Parròquia', () => {
  const ARA = '2026-10-02T07:30:00.000Z';
  const CAFE = llavorCarta().productes.find((p) => p.id === 'cafe-sol');
  /* Un establiment que la persona ja ha ajustat a Ajustos › Caixa. */
  const PROPI = Object.freeze({ ...ESTABLIMENT_EXEMPLE, nom: 'Bar propi', ivaPerDefecte: 21, denominacions: [2000, 1000, 500, 200, 100, 50] });
  const LA_PARROQUIA = { accio: 'Carrega la carta de La Parròquia', nom: 'La Parròquia · Menjar i Beure', id: 'la-parroquia' };
  const EXEMPLE = { accio: 'Torna a la carta d’exemple', nom: 'Carta d’exemple', id: 'exemple' };
  const dialegDe = (llavor) => screen.findByRole('dialog', { name: `Substituïx la carta per «${llavor.nom}»?` });

  /* Obri Ajustos › Carta i tria la llavor: el diàleg destructiu va a la consulta (?llavor=). */
  const obri = async (magatzem, llavor) => {
    munta('/app/bar/ajustos/carta', magatzem);
    await screen.findByRole('button', { name: llavor.accio });
    const ajust = columna('app-grid-main');
    fireEvent.click(ajust.getByRole('button', { name: llavor.accio }));
    expect(ubicacio()).toBe(`/app/bar/ajustos/carta?llavor=${llavor.id}`);
    return { ajust, dialeg: await dialegDe(llavor) };
  };
  /* ... i la confirma. */
  const carrega = async (magatzem, llavor = LA_PARROQUIA) => {
    const { ajust, dialeg } = await obri(magatzem, llavor);
    expect(within(dialeg).getByText('Els canvis fets a la carta d’ara es perdran.')).toBeTruthy();
    expect(within(dialeg).getByText(/el TPV encara no la pot tornar a carregar/)).toBeTruthy();
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Substituïx la carta' }));
    return ajust;
  };
  /* Tanca el torn de prova al disc (el tancament de veres té la seua prova a «el tancament»). */
  const tancaElTorn = async (magatzem) => {
    const [torn] = await magatzem.base.totes('torns');
    await magatzem.desaTorn({ ...torn, estat: 'tancat', tancatA: ARA, tancatPer: 'Cambrer 1' });
    await magatzem.desaMeta('tornActual', null);
  };
  const ambUnCafe = (id) => afegeixProducte(creaComanda({ id, tornId: 'torn-prova', origen: { tipus: 'barra' }, ara: ARA, per: 'Cambrer 1' }),
    { producte: CAFE, ivaPerDefecte: 10 }, { ara: ARA, idLinia: `l-${id}` });
  const intactes = async (magatzem) => ({
    sala: await magatzem.base.obte('sala', 'sala'), torns: await magatzem.base.totes('torns'), tiquets: await magatzem.base.totes('tiquets')
  });

  test('amb el torn tancat substituïx la carta i conserva l’IVA i la caixa del bar: el Bombó a 1,50 €, el Penalti i el Malibú per copa', async () => {
    const magatzem = await magatzemDeProva({ ambTorn: false });
    await magatzem.desaMeta('establiment', PROPI);
    const ajust = await carrega(magatzem);
    expect(await ajust.findByText(/té 327 productes en 12 categories/, {}, { timeout: 10000 })).toBeTruthy();
    expect(ubicacio()).toBe('/app/bar/ajustos/carta');
    expect(ajust.getByRole('heading', { level: 3 }).textContent).toBe('Carta 327 productes');
    expect((await magatzem.base.obte('cataleg', 'carta')).productes).toHaveLength(327);
    /* Només la identitat: el nom, el slug i la llavor. L'IVA per defecte i les denominacions són del bar. */
    expect((await magatzem.base.obte('meta', 'establiment')).valor).toEqual({
      ...PROPI, nom: 'La Parròquia · Menjar i Beure', slug: 'la-parroquia', llavor: 'la-parroquia'
    });

    await ves('/app/bar/torn');
    const torn = columna('app-grid-main');
    fireEvent.change(await torn.findByLabelText(/Qui obri el torn/), { target: { value: 'Cambrer 1' } });
    fireEvent.click(torn.getByRole('button', { name: 'Obri el torn' }));
    expect(await torn.findByRole('heading', { name: /Torn de Cambrer 1/ })).toBeTruthy();
    await ves('/app/bar/caixa');
    await screen.findByRole('region', { name: 'Productes' });
    fireEvent.click(columna('app-grid-main').getByRole('button', { name: /^Bombó 1,50/ }));
    await waitFor(() => expect(columna('app-grid-list').getByText('Bombó')).toBeTruthy());
    fireEvent.click(columna('app-grid-main').getByRole('button', { name: /^Barril Estrella Damm 6 variants/ }));
    await waitFor(() => expect(columna('app-grid-list').getByText('Barril Estrella Damm')).toBeTruthy());
    const [nova] = await comandesDe(magatzem);
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/caixa/${nova.id}`));

    /* El Malibú és de preu obert i té quatre variants: el diàleg menut tria la
       copa (que en fixa el nom i el cost) i després es tecleja el preu. */
    fireEvent.click(producte('Malibú'));
    fireEvent.click(within(await screen.findByRole('dialog', { name: 'Malibú' })).getByRole('button', { name: /^Copa/ }));
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/caixa/${nova.id}?preu=b5-malibu&variant=copa`));
    expect(await screen.findByRole('dialog', { name: 'Malibú · Copa' })).toBeTruthy();
    const preu = await screen.findByRole('group', { name: 'Preu' });
    tecleja(preu, ['3', '5', '0']);
    fireEvent.click(within(preu).getByRole('button', { name: 'Afig' }));
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/caixa/${nova.id}`));
    await waitFor(async () => expect((await comandesDe(magatzem))[0].linies).toHaveLength(3));
    const [comanda] = await comandesDe(magatzem);
    expect(comanda.linies.map((l) => [l.producteId, l.varianteNomCongelat ?? null, l.preuUnitariCents, l.ivaPercent, l.costUnitariCents ?? null])).toEqual([
      ['bombo', null, 150, 10, null], ['tanque-estrella-damm', 'Penalti', 100, 21, null], ['b5-malibu', 'Copa', 350, 21, 200]
    ]);
    /* Recorregut sencer amb la carta de 327 productes: els 5 s per defecte no
       donen ni per a l'espera de 10 s de dalt quan la màquina va carregada. */
  }, 30000);

  test('amb el torn obert no la canvia: l’avís OCUPAT i la carta d’exemple continua', async () => {
    const magatzem = await magatzemDeProva();
    const ajust = await carrega(magatzem);
    expect(await ajust.findByText('Tanca el torn i les comandes obertes abans de canviar la carta.')).toBeTruthy();
    expect((await magatzem.base.obte('cataleg', 'carta')).productes.map((p) => p.id)).toContain('cafe-sol');
    expect((await magatzem.base.obte('meta', 'establiment')).valor).toMatchObject({ nom: 'El meu bar' });
    expect(ajust.getByRole('heading', { level: 3 }).textContent).toBe(`Carta ${llavorCarta().productes.length} productes`);
  });

  test('amb el torn tancat però una comanda oberta amb línies tampoc: l’avís OCUPAT', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(ambUnCafe('c-oberta'));
    await tancaElTorn(magatzem);
    const ajust = await carrega(magatzem);
    expect(await ajust.findByText('Tanca el torn i les comandes obertes abans de canviar la carta.')).toBeTruthy();
    expect((await magatzem.base.obte('cataleg', 'carta')).productes.map((p) => p.id)).toContain('cafe-sol');
    expect((await magatzem.base.obte('meta', 'establiment')).valor).toEqual({ ...ESTABLIMENT_EXEMPLE });
    expect((await comandesDe(magatzem)).map((c) => [c.id, c.linies.length])).toEqual([['c-oberta', 1]]);
  });

  test('la d’exemple conserva el nom, l’IVA i la caixa del bar i no toca la sala, els torns ni els tiquets; «Cancel·la» no fa res', async () => {
    const magatzem = await magatzemDeProva();
    const venuda = ambUnCafe('c-venuda');
    await magatzem.tancaComanda(tanca(afegeixPagament(venuda, { metode: 'efectiu', importCents: totals(venuda).totalCents }, { id: 'p-venuda', ara: ARA }), { numero: 1, ara: ARA }));
    await tancaElTorn(magatzem);
    await magatzem.desaMeta('establiment', { ...PROPI, slug: 'la-parroquia', llavor: 'la-parroquia' });
    const abans = await intactes(magatzem);
    expect(abans.torns.map((t) => [t.id, t.estat])).toEqual([['torn-prova', 'tancat']]);
    expect(abans.tiquets.map((t) => [t.id, t.numero])).toEqual([['c-venuda', 1]]);

    const { dialeg } = await obri(magatzem, EXEMPLE);
    expect(within(dialeg).getByText('El nom del bar, l’IVA per defecte i les monedes de la caixa no canvien.')).toBeTruthy();
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·la' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/bar/ajustos/carta'));
    expect((await magatzem.base.obte('meta', 'establiment')).valor.llavor).toBe('la-parroquia');

    const ajust = columna('app-grid-main');
    fireEvent.click(ajust.getByRole('button', { name: EXEMPLE.accio }));
    fireEvent.click(within(await dialegDe(EXEMPLE)).getByRole('button', { name: 'Substituïx la carta' }));
    expect(await ajust.findByText('Fet: torna a ser la «Carta d’exemple».')).toBeTruthy();
    expect((await magatzem.base.obte('meta', 'establiment')).valor).toEqual({ ...PROPI, slug: 'el-meu-bar', llavor: 'exemple' });
    expect(await intactes(magatzem)).toEqual(abans);
  });
});

describe('el tancament (§A.6, flux 6)', () => {
  test('arqueig amb diferència, nota de traspàs, torn congelat i lectura obligatòria en obrir el següent', async () => {
    const magatzem = await magatzemDeProva({ fons: 0 });
    munta('/app/bar/caixa', magatzem);
    await screen.findByRole('region', { name: 'Productes' });
    fireEvent.click(producte('Cafè sol'));
    await waitFor(() => expect(columna('app-grid-list').getByText('Cafè sol')).toBeTruthy());
    fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Cobra' }));
    fireEvent.click(await columna('app-grid-main').findByRole('button', { name: /^Exacte en efectiu/ }));
    await screen.findByRole('dialog', { name: 'Nota de consum · no és factura' });

    await ves('/app/bar/tancament/arqueig');
    const arqueig = columna('app-grid-main');
    fireEvent.click(await arqueig.findByRole('button', { name: /^Suma una unitat: 1,00/ }));
    await waitFor(() => expect(arqueig.getByRole('heading', { level: 3 }).textContent).toBe('Comptat 1 peces'));
    fireEvent.click(arqueig.getByRole('button', { name: 'Continua al resum' }));
    expect(ubicacio()).toBe('/app/bar/tancament/resum');
    expect(await columna('app-grid-main').findByText('Falten diners')).toBeTruthy();
    fireEvent.click(columna('app-grid-main').getByRole('button', { name: 'Continua al traspàs' }));
    const traspas = columna('app-grid-main');
    fireEvent.change(await traspas.findByLabelText(/Un avís curt/), { target: { value: 'Falta gel' } });
    fireEvent.click(traspas.getByRole('button', { name: 'Afig l’avís' }));
    await waitFor(() => expect(traspas.getByText('Falta gel')).toBeTruthy());
    fireEvent.click(traspas.getByRole('button', { name: 'Continua' }));
    fireEvent.click(await columna('app-grid-main').findByRole('button', { name: 'Tanca el torn' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/bar/torns/torn-prova'));
    expect(await columna('app-grid-main').findByRole('button', { name: 'Desa el tancament (XLSX)' })).toBeTruthy();
    const [tancat] = await magatzem.base.totes('torns');
    expect(tancat).toMatchObject({ estat: 'tancat', diferenciaCaixaCents: -20, arqueig: { totalCents: 100 } });
    expect(tancat.traspas).toMatchObject({ schema: 'sdp.bar.traspas.v1', avisos: ['Falta gel'], llegidaA: null });

    /* El torn següent: la caixa no ven i el torn demana llegir la nota primer. */
    await ves('/app/bar/caixa');
    expect((await screen.findAllByText('El torn està tancat')).length).toBeGreaterThanOrEqual(1);
    await ves('/app/bar/torn');
    const torn = columna('app-grid-main');
    expect(await torn.findByText('Falta gel')).toBeTruthy();
    expect(torn.getByText('Falten 0,20 € al calaix')).toBeTruthy();
    expect(torn.queryByLabelText(/Qui obri el torn/)).toBeNull();
    fireEvent.change(torn.getByLabelText(/Qui la llig/), { target: { value: 'Cambrera 2' } });
    fireEvent.click(torn.getByRole('button', { name: 'L’he llegida' }));
    expect(await torn.findByLabelText(/Qui obri el torn/)).toBeTruthy();
    expect((await magatzem.base.obte('meta', 'traspas')).valor).toMatchObject({ llegidaPer: 'Cambrera 2' });
  });
});

/* Ordre del Mestre, 261006: el permís «escriure: 'sessio'» és de TOT el Bar.
   Sense sessió en mode remot es mira i no s'escriu; en mode de proves i sense
   xarxa amb la sessió desada, es ven, i l'avís de la sessió ho diu. */
describe('el permís de sessió (tot el Bar)', () => {
  const ENTRA = 'Entra per a vendre.';
  const PROVES = 'Mode de proves: les vendes no estan lligades a cap compte.';
  const FORA_AMB_DESADA = 'Sense connexió: cada venda es desa en este dispositiu. La sessió es comprovarà quan torne la xarxa.';
  const SENSE_CONNEXIO = 'Sense connexió: cada venda es desa en este dispositiu.';
  const SENSE_PERMIS = 'No tens permís per a fer-ho: no s’ha desat res.';
  const ARA = '2026-10-02T07:30:00.000Z';
  const CAFE = llavorCarta().productes.find((p) => p.id === 'cafe-sol');
  const ambUnCafe = (id) => afegeixProducte(creaComanda({ id, tornId: 'torn-prova', origen: { tipus: 'barra' }, ara: ARA, per: 'Cambrer 1' }),
    { producte: CAFE, ivaPerDefecte: 10 }, { ara: ARA, idLinia: `l-${id}` });
  const tpv = () => screen.findByRole('region', { name: 'TPV del meu bar' });
  const rajolesDelTpv = () => within(screen.getByRole('list', { name: /^Productes/ })).getAllByRole('button');

  test('amb sessió i en línia no hi ha cap avís: la pantalla és la de sempre', async () => {
    const magatzem = await magatzemDeProva();
    munta('/app/bar/caixa', magatzem);
    await screen.findByRole('region', { name: 'Productes' });
    /* L'única alerta és la de la base de sempre (este magatzem de proves no persistix). */
    expect([...document.querySelectorAll('.sdp-alerta')].map((alerta) => alerta.textContent)).toEqual([
      'Les dades no es guardenEste navegador no deixa guardar res: el que faces durarà fins que tanques la pestanya.'
    ]);
    for (const text of [ENTRA, PROVES, FORA_AMB_DESADA, SENSE_CONNEXIO, 'Comprovant la sessió…', 'Esta sessió no pot vendre.']) {
      expect(screen.queryByText(text)).toBeNull();
    }
    expect(producte('Cafè sol').disabled).toBe(false);
  });

  test('sense sessió en mode remot: el torn no s’obri, l’avís ho diu una vegada i «Entra» porta a entrar', async () => {
    const magatzem = await magatzemDeProva({ ambTorn: false });
    munta('/app/bar/caixa', magatzem, SENSE_SESSIO);
    expect((await screen.findAllByText('El torn està tancat')).length).toBeGreaterThanOrEqual(2);
    /* Una sola vegada per pantalla: la columna del detall el pinta; les laterals, només en estret. */
    expect(screen.getByText(ENTRA)).toBeTruthy();
    expect(columna('app-grid-main').getByRole('button', { name: 'Obri el torn' }).disabled).toBe(true);
    await ves('/app/bar/torn');
    const detall = columna('app-grid-main');
    fireEvent.change(await detall.findByLabelText(/Qui obri el torn/), { target: { value: 'Cambrer 1' } });
    const obri = detall.getByRole('button', { name: 'Obri el torn' });
    expect(obri.disabled).toBe(true);
    fireEvent.click(obri);
    await act(async () => {});
    expect(await magatzem.base.totes('torns')).toEqual([]);
    expect(screen.getByText(ENTRA)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Entra' }));
    expect(ubicacio()).toBe('/registre?mode=entrar&tornar=%2Fapp%2Fbar%2Ftorn');
  });

  test('sense sessió en mode remot: la Caixa, el cobrament i el TPV es miren però no venen', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(ambUnCafe('c-oberta'));
    munta('/app/bar/caixa/c-oberta', magatzem, SENSE_SESSIO);
    await screen.findByRole('region', { name: 'Productes' });
    expect(screen.getByText(ENTRA)).toBeTruthy();
    /* Les rajoles desactivades (el lector diu per què) i la comanda, de només lectura. */
    const tallat = producte('Tallat');
    expect(tallat.disabled).toBe(true);
    expect(document.getElementById(tallat.getAttribute('aria-describedby').split(' ')[0]).textContent).toBe('Ara no es pot vendre');
    fireEvent.click(tallat);
    const llista = columna('app-grid-list');
    expect(llista.getByText('Cafè sol')).toBeTruthy();
    expect(llista.queryByRole('button', { name: 'Suma una unitat: Cafè sol' })).toBeNull();
    expect(llista.getByRole('button', { name: 'Marxa' }).disabled).toBe(true);
    expect(llista.getByRole('button', { name: 'Cobra' }).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Nou tiquet de barra' })).toBeNull();
    /* Ni per la consulta: l'editor de la línia no s'obri. */
    await ves('/app/bar/caixa/c-oberta?linia=l-c-oberta');
    expect(screen.queryByRole('dialog', { name: '1 × Cafè sol' })).toBeNull();

    await ves('/app/bar/caixa/c-oberta/cobrar');
    const cobrament = columna('app-grid-main');
    expect((await cobrament.findByRole('button', { name: /^Exacte en efectiu/ })).disabled).toBe(true);
    expect(cobrament.getByRole('button', { name: /^1,20/ }).disabled).toBe(true);
    expect(screen.getByText(ENTRA)).toBeTruthy();

    await ves('/app/bar/tpv');
    const regio = await tpv();
    expect(within(regio).getByText(ENTRA)).toBeTruthy();
    expect(rajolesDelTpv().every((boto) => boto.disabled)).toBe(true);
    fireEvent.click(within(regio).getByRole('button', { name: /^Tallat,/ }));
    await act(async () => {});
    expect((await magatzem.base.totes('comandes')).map((c) => [c.id, c.linies.length])).toEqual([['c-oberta', 1]]);
    expect(await magatzem.tiquetsDelTorn('torn-prova')).toEqual([]);
  });

  /* Correcció de la revisió (261006): en una Columna (comu.jsx), l'avís va dins
     del cos, davall de la capçalera, i la capçalera queda alineada amb les del
     costat. Correcció F3 (261006): en les columnes de l'esquelet comú, també
     (la prop `avis`, que MarcColumna pinta al principi del cos). */
  test('l’avís de la sessió va dins del cos, davall de la capçalera, en la Columna i en la columna de l’esquelet', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(ambUnCafe('c-oberta'));
    munta('/app/bar/caixa/c-oberta/cobrar', magatzem, SENSE_SESSIO);
    await screen.findByRole('button', { name: /^Exacte en efectiu/ });
    const detall = document.getElementById('app-grid-main');
    const alerta = columna('app-grid-main').getByText(ENTRA).closest('.sdp-alerta');
    /* La mateixa ranura que l'esquelet (el primer fill del cos, fora de la Pila): el mateix espai davall. */
    expect(alerta.parentElement.className).toBe('sdp-marc-columna__cos');
    expect(alerta.parentElement.firstElementChild).toBe(alerta);
    expect(detall.querySelector(':scope > .sdp-alerta')).toBeNull();
    expect(detall.firstElementChild.className).toContain('sdp-marc-columna');
    expect(screen.getAllByText(ENTRA)).toHaveLength(1);
    /* El catàleg de la Caixa és ColumnaCataleg: l'avís, una sola vegada, primer fill del cos. */
    await ves('/app/bar/caixa/c-oberta');
    const cataleg = await columna('app-grid-main').findByRole('region', { name: 'Productes' });
    expect(document.getElementById('app-grid-main').querySelector(':scope > .sdp-alerta')).toBeNull();
    expect(document.getElementById('app-grid-main').firstElementChild.firstElementChild.className).toBe('sdp-marc-columna__cap');
    expect(cataleg.firstElementChild.textContent).toContain(ENTRA);
    expect(screen.getAllByText(ENTRA)).toHaveLength(1);
    /* I de tornada a la Columna del cobrament, continua dins del cos. */
    await ves('/app/bar/caixa/c-oberta/cobrar');
    await columna('app-grid-main').findByRole('button', { name: /^Exacte en efectiu/ });
    expect(document.getElementById('app-grid-main').querySelector(':scope > .sdp-alerta')).toBeNull();
    expect(screen.getAllByText(ENTRA)).toHaveLength(1);
  });

  test('en pantalla estreta, la comanda (la llista del mig) també porta l’avís: és l’única columna que es veu', async () => {
    ambAmplada(375);
    const magatzem = await magatzemDeProva();
    munta('/app/bar/caixa/colleccio', magatzem, SENSE_SESSIO);
    /* En estret el panell del mig tapa el detall (aria-hidden): es busca pel text, no per la regió. */
    await waitFor(() => expect(columna('app-grid-list').getByText(ENTRA)).toBeTruthy());
    expect(columna('app-grid-main').getByText(ENTRA)).toBeTruthy();
  });

  test('mode de proves (seed o local, on entrar és impossible): es ven i l’avís de proves hi és', async () => {
    const magatzem = await magatzemDeProva();
    munta('/app/bar/caixa', magatzem, MODE_PROVES);
    await screen.findByRole('region', { name: 'Productes' });
    expect(screen.getByText(PROVES)).toBeTruthy();
    expect(screen.queryByText(ENTRA)).toBeNull();
    fireEvent.click(producte('Cafè sol'));
    await waitFor(() => expect(columna('app-grid-list').getByText('Cafè sol')).toBeTruthy());
    fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Cobra' }));
    fireEvent.click(await columna('app-grid-main').findByRole('button', { name: /^Exacte en efectiu/ }));
    await screen.findByRole('dialog', { name: 'Nota de consum · no és factura' });
    expect(await magatzem.tiquetsDelTorn('torn-prova')).toHaveLength(1);

    await ves('/app/bar/tpv');
    const regio = await tpv();
    expect(within(regio).getByText(PROVES)).toBeTruthy();
    fireEvent.click(within(regio).getByRole('button', { name: /^Tallat,/ }));
    await waitFor(async () => expect((await magatzem.base.totes('comandes')).map((c) => c.linies.length)).toEqual([1]));
  });

  test('sense xarxa amb la sessió desada en este dispositiu: es ven i l’avís diu que es comprovarà', async () => {
    const magatzem = await magatzemDeProva();
    munta('/app/bar/caixa', magatzem, FORA_DE_LINIA);
    await screen.findByRole('region', { name: 'Productes' });
    expect(screen.getByText(FORA_AMB_DESADA)).toBeTruthy();
    fireEvent.click(producte('Cafè sol'));
    await waitFor(() => expect(columna('app-grid-list').getByText('Cafè sol')).toBeTruthy());
    expect(await magatzem.base.totes('comandes')).toHaveLength(1);

    await ves('/app/bar/tpv');
    const regio = await tpv();
    expect(within(regio).getByText(FORA_AMB_DESADA)).toBeTruthy();
    expect(rajolesDelTpv().some((boto) => boto.disabled)).toBe(false);
  });

  test('sense xarxa amb sessió, ho diu i ven; sense xarxa i sense cap sessió desada, no ven', async () => {
    const magatzem = await magatzemDeProva();
    munta('/app/bar/caixa', magatzem, { ...BASE, sessio: { estat: 'dins', enLinia: false, modeProves: false } });
    await screen.findByRole('region', { name: 'Productes' });
    expect(screen.getByText(SENSE_CONNEXIO)).toBeTruthy();
    expect(producte('Cafè sol').disabled).toBe(false);
    cleanup();

    /* Un magatzem nou: desmuntar el Bar tanca la base de l'anterior. */
    munta('/app/bar/caixa', await magatzemDeProva(), { ...BASE, sessio: { estat: 'fora', enLinia: false, modeProves: false, recuperable: false } });
    await screen.findByRole('region', { name: 'Productes' });
    expect(screen.getByText(ENTRA)).toBeTruthy();
    expect(producte('Cafè sol').disabled).toBe(true);
  });

  test('la guarda de l’estat: sense permís, cada escriptura refusa amb SENSE_PERMIS i res no canvia; les lectures, no', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(ambUnCafe('c-oberta'));
    const sonda = { bar: null };
    function Sonda() {
      sonda.bar = useBar();
      return null;
    }
    muntaPlataforma('/app/bar/caixa', {
      entorn: SENSE_SESSIO,
      fills: (
        <ProveidorApp manifest={manifestBar}>
          <ProveidorBar magatzem={magatzem} rellotge={rellotgeDeProva()} atzar={atzarDeProva()}><Sonda /></ProveidorBar>
        </ProveidorApp>
      )
    });
    await waitFor(() => expect(sonda.bar?.carregat).toBe(true));
    expect(sonda.bar.permis).toEqual({
      potEscriure: false, motiu: 'sense-sessio', enLinia: true, modeProves: false, rutaEntrada: '/registre?mode=entrar&tornar=%2Fapp%2Fbar%2Fcaixa'
    });
    const abans = await magatzem.bolca();
    const { accions } = sonda.bar;
    const escriptures = {
      obriTorn: () => accions.obriTorn({ per: 'Cambrer 2', fonsInicialCents: 0 }),
      llegeixTraspas: () => accions.llegeixTraspas({ per: 'Cambrer 2' }),
      novaComanda: () => accions.novaComanda({ tipus: 'barra' }),
      afegeix: () => accions.afegeix({ comandaId: 'c-oberta' }, { producte: CAFE }),
      canviaQuantitat: () => accions.canviaQuantitat('c-oberta', 'l-c-oberta', 3),
      sumaQuantitat: () => accions.sumaQuantitat('c-oberta', 'l-c-oberta', 1),
      canviaNota: () => accions.canviaNota('c-oberta', 'l-c-oberta', 'Curt'),
      marxa: () => accions.marxa('c-oberta'),
      anulla: () => accions.anulla('c-oberta', 'l-c-oberta', { motiu: 'Prova', quantitat: 1 }),
      descompte: () => accions.descompte('c-oberta', 'l-c-oberta', { tipus: 'percent', valor: 10, motiu: 'Prova' }),
      convida: () => accions.convida('c-oberta', 'l-c-oberta', 'Prova'),
      paga: () => accions.paga('c-oberta', { metode: 'efectiu', importCents: 120, lliuratCents: 120 }),
      tanca: () => accions.tanca('c-oberta'),
      descarta: () => accions.descarta('c-oberta'),
      mou: () => accions.mou('c-oberta', { origen: { tipus: 'barra' } }, [{ liniaId: 'l-c-oberta' }]),
      divideix: () => accions.divideix('c-oberta', [{ liniaId: 'l-c-oberta', quantitat: 1 }]),
      retorna: () => accions.retorna('c-venuda', [], { motiu: 'Prova', metode: 'efectiu' }),
      moviment: () => accions.moviment({ tipus: 'entrada', importCents: 100, motiu: 'Prova' }),
      desaEsborranyTancament: () => accions.desaEsborranyTancament({ fonsDeixatCents: 500 }),
      tancaTorn: () => accions.tancaTorn(),
      desaCarta: () => accions.desaCarta(llavorCarta()),
      carregaLlavor: () => accions.carregaLlavor('exemple'),
      desaEstabliment: () => accions.desaEstabliment({ ...ESTABLIMENT_EXEMPLE, nom: 'Un altre bar' })
    };
    for (const [nom, escriptura] of Object.entries(escriptures)) {
      let resultat = null;
      await act(async () => {
        resultat = await escriptura();
      });
      expect([nom, resultat.ok, resultat.error?.codi]).toEqual([nom, false, 'SENSE_PERMIS']);
    }
    expect(sonda.bar.avis).toBe(SENSE_PERMIS);
    expect(await magatzem.bolca()).toEqual(abans);
    /* Mirar sempre es pot. */
    expect(await sonda.bar.accions.tiquetsDelTorn('torn-prova')).toEqual([]);
    expect(await sonda.bar.accions.bolca()).toEqual(abans);
    await act(async () => {
      sonda.bar.accions.oblidaAvis();
    });
    expect(sonda.bar.avis).toBeNull();
  });
});

describe('la Caixa no canvia de destí sense ?torna=tpv (Llei del Píxel)', () => {
  test('cobrar a la Caixa porta a la nota, i tancar-la deixa el tiquet amb «Torna a la caixa»', async () => {
    const magatzem = await magatzemDeProva();
    await ambUnProducte(magatzem, 'Cafè sol');
    fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Cobra' }));
    expect(await columna('app-grid-main').findByRole('button', { name: 'Torna a la comanda' })).toBeTruthy();
    fireEvent.click(await columna('app-grid-main').findByRole('button', { name: /^Exacte en efectiu/ }));
    const nota = await screen.findByRole('dialog', { name: 'Nota de consum · no és factura' });
    const [venut] = await magatzem.tiquetsDelTorn('torn-prova');
    expect(ubicacio()).toBe(`/app/bar/tiquets/${venut.id}?nota=1`);
    fireEvent.click(within(nota).getByRole('button', { name: 'Tanca la nota' }));
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/tiquets/${venut.id}`));
    fireEvent.click(columna('app-grid-main').getByRole('button', { name: 'Torna a la caixa' }));
    expect(ubicacio()).toBe('/app/bar/caixa');
  });

  test('un ?torna que no és «tpv» no es llig: la Caixa fa el de sempre', async () => {
    const magatzem = await magatzemDeProva();
    await ambUnProducte(magatzem, 'Cafè sol');
    const [comanda] = await comandesDe(magatzem);
    await ves(`/app/bar/caixa/${comanda.id}/cobrar?torna=caixa`);
    expect(await columna('app-grid-main').findByRole('button', { name: 'Torna a la comanda' })).toBeTruthy();
    fireEvent.click(await columna('app-grid-main').findByRole('button', { name: /^Exacte en efectiu/ }));
    await screen.findByRole('dialog', { name: 'Nota de consum · no és factura' });
    expect(ubicacio()).toBe(`/app/bar/tiquets/${comanda.id}?nota=1`);
  });
});

/* Correcció F3 (261006) · L'avís de la sessió DINS de les columnes de l'esquelet comú: la vista
   el passa a la prop `avis` (AvisDeLaColumna) i MarcColumna el pinta com a primer fill del cos.
   Cap avís és germà del marc: la capçalera de cada columna és el primer fill del seu marc i les
   barres de capçalera de la closca continuen alineades (jsdom no mesura: es mira el DOM). */
describe('l’avís de la sessió dins del marc de cada columna (correcció F3)', () => {
  const PROVES = 'Mode de proves: les vendes no estan lligades a cap compte.';
  const COLUMNES = ['app-grid-sidebar', 'app-grid-list', 'app-grid-main'];
  const muntada = (id) => document.getElementById(id)?.firstElementChild || null;
  const avisos = () => screen.queryAllByText(PROVES).map((text) => text.closest('.sdp-alerta'));
  /* Cada columna muntada comença pel marc, i el marc per la capçalera; cap alerta fora d'un cos. */
  const comprovaMarcs = (url) => {
    for (const id of COLUMNES) {
      const marc = muntada(id);
      if (!marc) continue;
      expect(marc.className, `${url} #${id}`).toContain('sdp-marc-columna');
      expect(marc.firstElementChild.className, `${url} #${id}`).toBe('sdp-marc-columna__cap');
      expect(document.getElementById(id).querySelector(':scope > .sdp-alerta'), `${url} #${id}`).toBeNull();
    }
    /* El primer fill del cos, directe, en les dues menes de columna (l'esquelet i la Columna del
       Bar): la mateixa ranura de MarcColumna, i per tant el mateix espai davall de l'avís. */
    for (const alerta of avisos()) {
      const cos = alerta.closest('.sdp-marc-columna__cos');
      expect(cos, url).toBeTruthy();
      expect(cos.firstElementChild, url).toBe(alerta);
    }
  };

  /* En ample, una sola vegada per pantalla: la columna del detall. També on el detall no porta
     Preparat (Tria un tiquet, un torn, un producte): la Columna hi passa <AvisSessio />. */
  const PANTALLES = [
    ['/app/bar/caixa', 'app-grid-main'],
    ['/app/bar/taules', 'app-grid-main'],
    ['/app/bar/tiquets', 'app-grid-main'],
    ['/app/bar/torn', 'app-grid-main'],
    ['/app/bar/tancament', 'app-grid-main'],
    ['/app/bar/torns', 'app-grid-main'],
    ['/app/bar/productes', 'app-grid-main'],
    ['/app/bar/modificadors', 'app-grid-main'],
    ['/app/bar/escandalls', 'app-grid-main'],
    ['/app/bar/ingredients', 'app-grid-main'],
    ['/app/bar/ajustos', 'app-grid-main']
  ];
  test.each(PANTALLES)('ample, %s: l’avís dins del marc (%s), una sola vegada, mai damunt', async (url, columnaAvis) => {
    munta(url, await magatzemDeProva(), MODE_PROVES);
    await waitFor(() => expect(screen.queryByText('Carregant el bar…')).toBeNull());
    await act(async () => {});
    comprovaMarcs(url);
    expect(avisos(), url).toHaveLength(1);
    expect(avisos()[0].closest('.app-grid-column').id, url).toBe(columnaAvis);
  });

  /* En tauleta («mitja»: la llista i el detall), igual: la llista només el porta en estret. */
  test.each([['/app/bar/tiquets'], ['/app/bar/torns'], ['/app/bar/productes'], ['/app/bar/ajustos']])('tauleta, %s: una sola vegada, al detall', async (url) => {
    ambAmplada(800);
    munta(url, await magatzemDeProva(), MODE_PROVES);
    await waitFor(() => expect(screen.queryByText('Carregant el bar…')).toBeNull());
    await act(async () => {});
    comprovaMarcs(url);
    expect(avisos().map((alerta) => alerta.closest('.app-grid-column').id), url).toEqual(['app-grid-main']);
  });

  /* Llei del Píxel: amb sessió i en línia, «Tria…» és la Columna de sempre (cap alerta, el cos comença per la Pila). */
  test.each([['/app/bar/tiquets'], ['/app/bar/torns'], ['/app/bar/productes']])('amb sessió, %s: el detall no canvia ni un node', async (url) => {
    munta(url, await magatzemDeProva());
    await waitFor(() => expect(screen.queryByText('Carregant el bar…')).toBeNull());
    await act(async () => {});
    const detall = document.getElementById('app-grid-main');
    expect(detall.querySelector('.sdp-alerta'), url).toBeNull();
    const cos = detall.querySelector('.sdp-marc-columna__cos');
    expect([...cos.children].map((fill) => [...fill.classList]), url).toEqual([['sdp-pila', 'sdp-pila--espai-4']]);
  });

  /* En estret, els apartats dels ajustos (fora de cap Preparat) el porten quan són el panell que es veu. */
  test('estret, /app/bar/ajustos: la llista dels apartats i el detall el porten dins del seu marc', async () => {
    ambAmplada(375);
    munta('/app/bar/ajustos', await magatzemDeProva(), MODE_PROVES);
    await waitFor(() => expect(columna('app-grid-list').getByText(PROVES)).toBeTruthy());
    comprovaMarcs('/app/bar/ajustos');
    expect(avisos().map((alerta) => alerta.closest('.app-grid-column').id).sort()).toEqual(['app-grid-list', 'app-grid-main']);
  });

  test('ample, la Caixa: les tres capçaleres sense cap germà damunt, i l’avís davall de les eines del catàleg', async () => {
    const magatzem = await magatzemDeProva();
    munta('/app/bar/caixa', magatzem, MODE_PROVES);
    await screen.findByRole('region', { name: 'Productes' });
    comprovaMarcs('/app/bar/caixa');
    for (const id of COLUMNES) expect(muntada(id).previousElementSibling, id).toBeNull();
    const [alerta] = avisos();
    const marc = alerta.closest('.sdp-marc-columna');
    expect([...marc.children].map((fill) => fill.className)).toEqual(['sdp-marc-columna__cap', 'sdp-marc-columna__eines', 'sdp-marc-columna__cos']);
    expect(marc.querySelector('.sdp-marc-columna__cos')).toBe(screen.getByRole('region', { name: 'Productes' }));
  });

  /* En estret es veu una sola columna (o un panell): cada una el porta, com abans, ara dins del marc. */
  test('estret: cada columna el porta dins del seu marc (els tiquets oberts, la comanda i el catàleg)', async () => {
    ambAmplada(375);
    munta('/app/bar/caixa/colleccio', await magatzemDeProva(), MODE_PROVES);
    await waitFor(() => expect(columna('app-grid-list').getByText(PROVES)).toBeTruthy());
    comprovaMarcs('/app/bar/caixa/colleccio');
    expect(avisos().map((alerta) => alerta.closest('.app-grid-column').id).sort()).toEqual(['app-grid-list', 'app-grid-main', 'app-grid-sidebar']);
  });
});
