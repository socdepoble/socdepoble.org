/* El Bar · les correccions de l'auditoria de l'Onada 12 (261011; ordres
   261011_0130, punt 6: «tanca les arquitectures pertinents d'estes aplicacions
   de Mas»), dins de la plataforma de veres i amb el magatzem en memòria, com
   AppBar.test.jsx. Cada prova reproduïx la troballa:
     BAR-R9   «Mou» una comanda sencera fallava sempre (NO_DESCARTABLE) i
              deixava les línies duplicades al disc.
     BAR-R10  dividir TOTES les línies deixava la comanda mare buida i oberta.
     BAR-R11  el «Resum parcial» comptava les comandes buides i el del
              tancament no. */
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { muntaPlataforma, ENTORN_OBERT } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import manifestBar from './manifest.js';
import AppBar from './AppBar.jsx';
import { creaMagatzemBar } from './magatzem.js';
import { validaRegistreVendes } from '../../utils/vendes/registreVendes.js';
import { afegeixPagament, tanca } from './nucli/cobrament.js';
import { afegeixProducte, creaComanda, totals } from './nucli/comanda.js';
import { creaDevolucio } from './nucli/tiquet.js';
import { obriTorn, resumTorn, tancaTorn } from './nucli/torn.js';
import { notaDeTraspas } from './nucli/traspas.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false, sessio: { estat: 'dins', enLinia: true, modeProves: false } });

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

function munta(url, magatzem) {
  const rellotge = rellotgeDeProva();
  const atzar = atzarDeProva();
  const App = () => <AppBar magatzem={magatzem} rellotge={rellotge} atzar={atzar} />;
  const registre = creaRegistre({ internes: [{ ...manifestBar, carrega: () => Promise.resolve({ default: App }) }] });
  return muntaPlataforma(url, { registre, entorn: ENTORN });
}

const columna = (id) => within(document.getElementById(id));
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const producte = (nom) => columna('app-grid-main').getByRole('button', { name: new RegExp(`^${nom} `) });
const comandesDe = (magatzem) => magatzem.base.totes('comandes');
const ambUnProducte = async (magatzem, nom, url = '/app/bar/caixa') => {
  munta(url, magatzem);
  await screen.findByRole('region', { name: 'Productes' });
  /* La regió ja hi és mentre el bar es carrega: s'espera el producte. */
  await waitFor(() => expect(producte(nom)).toBeTruthy());
  fireEvent.click(producte(nom));
  await waitFor(() => expect(columna('app-grid-list').getByText(nom)).toBeTruthy());
};
const resumDeLinies = (comanda) => comanda.linies.map((l) => [l.nomCongelat, l.quantitat]);

async function mouA(desti) {
  fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Mou' }));
  const dialeg = await screen.findByRole('dialog', { name: 'Mou o ajunta la comanda' });
  fireEvent.change(within(dialeg).getByLabelText('On va'), { target: { value: desti } });
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Mou' }));
}

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

describe('BAR-R9 · «Mou» una comanda sencera', () => {
  test('de la barra a una taula lliure: la taula es queda la línia i la comanda de la barra desapareix del disc', async () => {
    const magatzem = await magatzemDeProva();
    await ambUnProducte(magatzem, 'Cafè sol');
    const [barra] = await comandesDe(magatzem);
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/caixa/${barra.id}`));
    await mouA('taula:t1');
    await waitFor(async () => {
      const comandes = await comandesDe(magatzem);
      expect(comandes.map((c) => [c.origen.tipus, c.origen.taulaId ?? null, resumDeLinies(c)])).toEqual([['taula', 't1', [['Cafè sol', 1]]]]);
    });
    const [taula] = await comandesDe(magatzem);
    expect(taula.id).not.toBe(barra.id);
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/caixa/${taula.id}`));
    /* Cap avís d'operació fallida, i la comanda es veu on ha anat. */
    expect(screen.queryByRole('dialog', { name: 'Mou o ajunta la comanda' })).toBeNull();
    await waitFor(() => expect(columna('app-grid-list').getByText('Cafè sol')).toBeTruthy());
  });

  test('ajuntar amb una comanda que ja hi ha: una sola comanda amb les dues línies, i després encara s’hi pot vendre (cap CONFLICTE)', async () => {
    const magatzem = await magatzemDeProva();
    /* La taula 2 ja té una comanda (buida al disc; s'omplirà en ajuntar). */
    const taula = await magatzem.desaComanda(creaComanda({ id: 'c-taula-2', tornId: 'torn-prova', origen: { tipus: 'taula', taulaId: 't2' }, ara: '2026-10-02T07:30:00.000Z', per: 'Cambrer 1' }));
    await ambUnProducte(magatzem, 'Olives');
    const barra = (await comandesDe(magatzem)).find((c) => c.origen.tipus === 'barra');
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/caixa/${barra.id}`));
    await mouA('taula:t2');
    await waitFor(async () => {
      const comandes = await comandesDe(magatzem);
      expect(comandes.map((c) => [c.id, resumDeLinies(c)])).toEqual([[taula.id, [['Olives', 1]]]]);
    });
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/caixa/${taula.id}`));
    /* El rev en memòria és el del disc: una venda més s'hi desa. */
    fireEvent.click(producte('Cafè sol'));
    await waitFor(async () => expect(resumDeLinies((await comandesDe(magatzem))[0])).toEqual([['Olives', 1], ['Cafè sol', 1]]));
  });
});

describe('BAR-R10 · dividir totes les línies', () => {
  test('la comanda nova s’ho emporta tot i la mare, buida, no es queda oberta', async () => {
    const magatzem = await magatzemDeProva();
    await ambUnProducte(magatzem, 'Olives');
    const [mare] = await comandesDe(magatzem);
    fireEvent.click(columna('app-grid-list').getByRole('button', { name: 'Dividix' }));
    const detall = columna('app-grid-main');
    fireEvent.click(await detall.findByRole('button', { name: 'Suma una unitat: Olives' }));
    fireEvent.click(detall.getByRole('button', { name: 'Separa i cobra' }));
    await waitFor(async () => {
      const comandes = await comandesDe(magatzem);
      expect(comandes.map((c) => resumDeLinies(c))).toEqual([[['Olives', 1]]]);
      expect(comandes[0].id).not.toBe(mare.id);
    });
    const [filla] = await comandesDe(magatzem);
    await waitFor(() => expect(ubicacio()).toBe(`/app/bar/caixa/${filla.id}/cobrar`));
  });
});

/* El lligam TPV → Gestoria (ordres 261011_0130, punt 6): el contracte neutre sdp.vendes.v1
   (utils/vendes, nucli/vendes.js) ja existia, però cap pantalla el cridava. */
describe('TPV → Gestoria · «Vendes per a la Gestoria (JSON)» d’un torn tancat', () => {
  const ARA = '2026-10-02T10:00:00.000Z';
  const TANCAT = '2026-10-02T14:00:00.000Z';

  /* Un torn tancat de veres, fet amb el nucli: una venda amb dos tipus d'IVA i una devolució. */
  async function ambTornTancat() {
    const magatzem = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
    const { carta } = await magatzem.carrega();
    const P = (id) => carta.productes.find((p) => p.id === id);
    const torn = obriTorn({ id: 'torn-x', per: 'Cambrer 1', fonsInicialCents: 0, ara: ARA });
    let c = creaComanda({ id: 'c-1', tornId: torn.id, origen: { tipus: 'barra' }, ara: ARA });
    c = afegeixProducte(c, { producte: P('olives'), ivaPerDefecte: 10 }, { ara: ARA, idLinia: 'l-1' });
    c = afegeixProducte(c, { producte: { ...P('cava'), ivaPercent: 21 }, ivaPerDefecte: 10 }, { ara: ARA, idLinia: 'l-2' });
    c = afegeixPagament(c, { metode: 'targeta', importCents: totals(c).pendentCents }, { id: 'p-1', ara: ARA });
    const tiquet = tanca(c, { numero: 1, ara: ARA });
    const devolucio = creaDevolucio(tiquet, [{ liniaId: 'l-2', quantitat: 1 }], { motiu: 'Copa trencada', metode: 'efectiu', id: 'k-2', ara: ARA, numero: 2, tornId: torn.id, per: 'Encarregada' });
    await magatzem.tancaComanda(tiquet);
    await magatzem.desaDevolucio(devolucio);
    const tiquets = [tiquet, devolucio];
    const resum = resumTorn(torn, tiquets, [], { categories: carta.categories });
    const traspas = notaDeTraspas({ torn, resum, diferenciaCaixaCents: 0 - resum.efectiuEsperatCents, ara: TANCAT });
    await magatzem.desaTorn(tancaTorn(torn, { arqueig: { perDenominacio: {} }, resum, traspas, ara: TANCAT }));
    return magatzem;
  }

  test('baixa el registre sdp.vendes.v1 del torn: vàlid, amb el total per tipus d’IVA (cap base ni quota) i sense cap nom ni motiu', async () => {
    const blobs = [];
    const descarregues = [];
    vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL: (blob) => { blobs.push(blob); return 'blob:prova'; }, revokeObjectURL: () => {} }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function enregistra() { descarregues.push(this.download); });
    munta('/app/bar/torns/torn-x', await ambTornTancat());
    fireEvent.click(await screen.findByRole('button', { name: 'Vendes per a la Gestoria (JSON)' }));
    await waitFor(() => expect(descarregues).toEqual(['vendes-2026-10-02-torn-x.json']));
    const text = await blobs[0].text();
    const registre = JSON.parse(text);
    expect(validaRegistreVendes(registre)).toEqual([]);
    expect(registre).toMatchObject({ esquema: 'sdp.vendes.v1', moneda: 'EUR', titular: null, origen: { app: 'bar', establiment: 'el-meu-bar' } });
    expect(registre.vendes.map((v) => [v.tipus, v.numero, v.totalCents, v.perIva, v.pagaments])).toEqual([
      ['venda', 1, 500, [{ ivaPercent: 10, totalCents: 200 }, { ivaPercent: 21, totalCents: 300 }], [{ metode: 'targeta', importCents: 500 }]],
      ['devolucio', 2, 300, [{ ivaPercent: 21, totalCents: 300 }], [{ metode: 'efectiu', importCents: 300 }]]
    ]);
    expect(registre.vendes[1].tiquetOrigenId).toBe('c-1');
    for (const vetat of ['Cambrer', 'Encarregada', 'Copa trencada', 'baseCents', 'quotaCents', 'atesPer', 'linies']) expect(text, vetat).not.toContain(vetat);
    /* La pantalla diu quantes vendes i de quina zona són el dia i l'hora. */
    const zona = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(await screen.findByText(new RegExp(`^Fitxer preparat: 2 vendes, amb el dia i l’hora de la zona d’ESTA CAIXA \\(${zona.replace('/', '\\/')}\\), perquè el bar encara no té zona pròpia`))).toBeTruthy();
  });

  test('si l’establiment guarda la seua zona, mana ella i no la del dispositiu', async () => {
    const blobs = [];
    vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL: (blob) => { blobs.push(blob); return 'blob:prova'; }, revokeObjectURL: () => {} }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const magatzem = await ambTornTancat();
    const { establiment } = await magatzem.carrega();
    await magatzem.desaMeta('establiment', { ...establiment, zona: 'Pacific/Auckland' });
    munta('/app/bar/torns/torn-x', magatzem);
    fireEvent.click(await screen.findByRole('button', { name: 'Vendes per a la Gestoria (JSON)' }));
    await waitFor(() => expect(blobs).toHaveLength(1));
    /* Les 10:00 UTC del 2 d'octubre són les 23:00 del mateix dia a Auckland (UTC+13). */
    expect(JSON.parse(await blobs[0].text()).vendes[0]).toMatchObject({ data: { a: 2026, m: 10, d: 2 }, hora: '23:00' });
    expect(await screen.findByText('Fitxer preparat: 2 vendes, amb el dia i l’hora de la zona del bar (Pacific/Auckland). El navegador et deixa triar on desar-lo.')).toBeTruthy();
  });
});

describe('BAR-R11 · el resum parcial i el del tancament conten les mateixes comandes obertes', () => {
  const comandesObertes = () => {
    const fila = [...document.querySelectorAll('#app-grid-main tbody tr')].find((tr) => tr.querySelector('th').textContent.startsWith('Comandes obertes'));
    return fila.querySelectorAll('td')[1].textContent;
  };

  test('una comanda buida (un tiquet de barra nou sense res) no és cap comanda oberta', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(creaComanda({ id: 'c-buida', tornId: 'torn-prova', origen: { tipus: 'barra' }, ara: '2026-10-02T07:30:00.000Z', per: 'Cambrer 1' }));
    munta('/app/bar/torn', magatzem);
    await screen.findByRole('heading', { name: /Torn de Cambrer 1/ });
    expect(comandesObertes()).toBe('0');
  });
});
