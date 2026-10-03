/* El Bar dins de la plataforma de veres (RutaApps → ClosaAplicacio →
   esquelet comú), amb un magatzem en memòria i un rellotge fix (disseny del
   Bar §A.13, vistes): obrir el torn, la comanda ràpida de punta a punta
   (tocar, cobrar exacte i veure el tiquet a l'historial), les taules,
   dividir a parts, una devolució i el tancament amb diferència de caixa i
   la lectura obligatòria del traspàs en obrir el torn següent. */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { muntaPlataforma, ENTORN_OBERT } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import manifestBar from './manifest.js';
import AppBar from './AppBar.jsx';
import { creaMagatzemBar } from './magatzem.js';
import { obriTorn } from './nucli/torn.js';
import { costEscandall } from './nucli/escandall.js';
import { llavorCarta } from './nucli/llavor.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });

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

function munta(url, magatzem) {
  const rellotge = rellotgeDeProva();
  const atzar = atzarDeProva();
  const App = () => <AppBar magatzem={magatzem} rellotge={rellotge} atzar={atzar} />;
  const registre = creaRegistre({ internes: [{ ...manifestBar, carrega: () => Promise.resolve({ default: App }) }] });
  return muntaPlataforma(url, { registre, entorn: ENTORN });
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
