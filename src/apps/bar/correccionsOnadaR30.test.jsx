/* El Bar · les correccions de l'auditoria funcional de l'Onada R30 (front T3, micro-apps), dins
   de la plataforma de veres i amb el magatzem en memòria, com AppBar.test.jsx. Cada prova
   reproduïx la troballa amb dos tocs seguits al mateix botó (el doble toc d'una pantalla tàctil,
   la classe de BAR-R5), que abans anotaven l'operació DUES vegades:
     R30-BAR-01  «Fes la devolució»: dues devolucions del mateix tiquet, i el calaix en tornava el doble.
     R30-BAR-02  «Afig el moviment»: dues entrades (o eixides) de caixa, i l'efectiu esperat de
                 l'arqueig n'eixia mal.
     R30-BAR-03  «Anul·la» unes quantes unitats d'una línia marxada: se n'anul·laven el doble. */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { muntaPlataforma, ENTORN_OBERT } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import manifestBar from './manifest.js';
import AppBar from './AppBar.jsx';
import { creaMagatzemBar } from './magatzem.js';
import { afegeixPagament, tanca } from './nucli/cobrament.js';
import { afegeixProducte, creaComanda, marxa, totals } from './nucli/comanda.js';
import { obriTorn } from './nucli/torn.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false, sessio: { estat: 'dins', enLinia: true, modeProves: false } });
const ARA = '2026-10-02T07:30:00.000Z';

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

/* Un torn obert i, si de cas, una comanda de barra amb 3 olives marxades. */
async function magatzemDeProva() {
  const magatzem = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
  const { carta } = await magatzem.carrega();
  const torn = obriTorn({ id: 'torn-prova', per: 'Cambrer 1', fonsInicialCents: 0, ara: '2026-10-02T07:00:00.000Z' });
  await magatzem.desaTorn(torn);
  await magatzem.desaMeta('tornActual', torn.id);
  const olives = carta.productes.find((p) => p.id === 'olives');
  const comanda = marxa(afegeixProducte(
    creaComanda({ id: 'c-olives', tornId: torn.id, origen: { tipus: 'barra' }, ara: ARA, per: 'Cambrer 1' }),
    { producte: olives, quantitat: 3, ivaPerDefecte: 10 }, { ara: ARA, idLinia: 'l-olives' }
  ), { ara: ARA });
  return { magatzem, comanda };
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
const tecleja = (teclat, xifres) => {
  for (const xifra of xifres) fireEvent.click(within(teclat).getByRole('button', { name: xifra }));
};
/* La cua de l'estat acaba les operacions que encara hi esperen (el segon toc). */
const buidaLaCua = () => act(async () => {
  await new Promise((resol) => { setTimeout(resol, 30); });
});

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('R30-BAR-01 · dos tocs seguits a «Fes la devolució»', () => {
  test('fan UNA devolució: el tiquet en torna una unitat i el calaix, 2,00 €', async () => {
    const { magatzem, comanda } = await magatzemDeProva();
    const cobrada = afegeixPagament(comanda, { metode: 'efectiu', importCents: totals(comanda).pendentCents }, { id: 'p-olives', ara: ARA });
    await magatzem.tancaComanda(tanca(cobrada, { numero: 1, ara: ARA }));
    munta('/app/bar/tiquets/c-olives/retorn', magatzem);
    const suma = await screen.findByRole('button', { name: 'Suma una unitat: Olives' });
    const detall = columna('app-grid-main');
    fireEvent.click(suma);
    fireEvent.change(detall.getByLabelText(/Motiu/), { target: { value: 'Estaven salades' } });
    const boto = detall.getByRole('button', { name: 'Fes la devolució' });
    fireEvent.click(boto);
    fireEvent.click(boto);
    await waitFor(() => expect(ubicacio()).toMatch(/^\/app\/bar\/tiquets\/k-/));
    await buidaLaCua();
    const tiquets = await magatzem.tiquetsDelTorn('torn-prova');
    expect(tiquets.map((t) => [t.tipus, t.totals.totalCents])).toEqual([['venda', 600], ['devolucio', -200]]);
  });
});

describe('R30-BAR-02 · dos tocs seguits a «Afig el moviment»', () => {
  test('anoten UN moviment de caixa', async () => {
    const { magatzem } = await magatzemDeProva();
    munta('/app/bar/torn', magatzem);
    const teclat = await screen.findByRole('group', { name: 'Import' });
    const moviments = columna('app-grid-list');
    tecleja(teclat, ['5', '0', '0']);
    fireEvent.change(moviments.getByLabelText(/Motiu/), { target: { value: 'Canvi per al calaix' } });
    const boto = moviments.getByRole('button', { name: 'Afig el moviment' });
    fireEvent.click(boto);
    fireEvent.click(boto);
    await waitFor(async () => expect((await magatzem.base.obte('torns', 'torn-prova')).moviments.length).toBeGreaterThan(0));
    await buidaLaCua();
    const torn = await magatzem.base.obte('torns', 'torn-prova');
    expect(torn.moviments.map((m) => [m.tipus, m.importCents, m.motiu])).toEqual([['entrada', 500, 'Canvi per al calaix']]);
  });
});

describe('R30-BAR-03 · dos tocs seguits a «Anul·la» una part d’una línia marxada', () => {
  test('anul·len les unitats triades UNA vegada: 1 de 3 olives, i en queden 2 per cobrar', async () => {
    const { magatzem, comanda } = await magatzemDeProva();
    await magatzem.desaComanda(comanda);
    munta('/app/bar/caixa/c-olives?linia=l-olives', magatzem);
    const editor = await screen.findByRole('dialog', { name: '3 × Olives' });
    fireEvent.click(within(editor).getByRole('button', { name: 'Anul·la' }));
    const teclat = within(editor).getByRole('group', { name: 'Unitats a anul·lar' });
    fireEvent.click(within(teclat).getByRole('button', { name: 'C, posa a zero' }));
    tecleja(teclat, ['1']);
    fireEvent.change(within(editor).getByLabelText(/Motiu/), { target: { value: 'Se n’ha anat' } });
    const boto = within(editor).getAllByRole('button', { name: 'Anul·la' }).at(-1);
    fireEvent.click(boto);
    fireEvent.click(boto);
    await waitFor(async () => expect((await magatzem.base.obte('comandes', 'c-olives')).linies.length).toBeGreaterThan(1));
    await buidaLaCua();
    const desada = await magatzem.base.obte('comandes', 'c-olives');
    expect(desada.linies.map((l) => [l.estat, l.quantitat])).toEqual([['marxada', 2], ['anullada', 1]]);
    expect(totals(desada).totalCents).toBe(400);
  });
});
