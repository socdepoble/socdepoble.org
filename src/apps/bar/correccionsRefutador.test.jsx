/* El Bar · les correccions del refutador adversari (261011) sobre la feina de
   l'Onada 12, dins de la plataforma de veres i amb el magatzem en memòria:
     T1  «Mou» escrivia la comanda de destí ABANS de validar: amb un pagament
         parcial quedava una comanda fantasma al disc.
     T2  «Mou» i «Dividix» no són atòmics. Decisió del 261011: «detecta i
         avisa». Si la segona escriptura falla, RES no acaba el moviment: la
         memòria queda igual que el disc (cap `rev` vell), l'error diu que no
         es repetisca i la pantalla avisa de les línies duplicades fins que
         algú ho arregla. (El tall de veres, a migMoviment.test.js.)
     T3  el full del tancament no pot faltar perquè falle el càlcul del consum.
     T5  l'error de les vendes diu què ha passat.
     T7  l'historial de la comanda descartada passa al destí. */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { muntaPlataforma, ENTORN_OBERT } from '../plataforma/__fixtures__/munta.jsx';
import { ProveidorApp } from '../plataforma/PlataformaContext.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import manifestBar from './manifest.js';
import AppBar from './AppBar.jsx';
import { ProveidorBar, useBar } from './estat/ProveidorBar.jsx';
import { creaMagatzemBar } from './magatzem.js';
import { afegeixPagament, tanca } from './nucli/cobrament.js';
import { afegeixProducte, aplicaDescompte, creaComanda, mouLinies, totals } from './nucli/comanda.js';
import { llavorCarta } from './nucli/llavor.js';
import { obriTorn, resumTorn, tancaTorn } from './nucli/torn.js';
import { notaDeTraspas } from './nucli/traspas.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false, sessio: { estat: 'dins', enLinia: true, modeProves: false } });
const ARA = '2026-10-02T07:30:00.000Z';
const CARTA = llavorCarta();
const P = (id) => CARTA.productes.find((p) => p.id === id);

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

async function magatzemDeProva({ ambTorn = true } = {}) {
  const magatzem = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
  await magatzem.carrega();
  if (ambTorn) {
    const torn = obriTorn({ id: 'torn-prova', per: 'Cambrer 1', fonsInicialCents: 0, ara: '2026-10-02T07:00:00.000Z' });
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

/* L'estat del Bar sense pantalles, per a cridar les accions de veres. */
async function sondaDe(magatzem) {
  const sonda = { bar: null };
  function Sonda() {
    sonda.bar = useBar();
    return null;
  }
  muntaPlataforma('/app/bar/caixa', {
    entorn: ENTORN,
    fills: (
      <ProveidorApp manifest={manifestBar}>
        <ProveidorBar magatzem={magatzem} rellotge={rellotgeDeProva()} atzar={atzarDeProva()}><Sonda /></ProveidorBar>
      </ProveidorApp>
    )
  });
  await waitFor(() => expect(sonda.bar?.carregat).toBe(true));
  return sonda;
}
const fes = async (accio) => {
  let resultat = null;
  await act(async () => {
    resultat = await accio();
  });
  return resultat;
};

const comandesDe = (magatzem) => magatzem.base.totes('comandes');
const nova = (id, origen = { tipus: 'barra' }) => creaComanda({ id, tornId: 'torn-prova', origen, ara: ARA, per: 'Cambrer 1' });
const amb = (comanda, producteId, quantitat, idLinia) => afegeixProducte(comanda, { producte: P(producteId), ivaPerDefecte: 10, quantitat }, { ara: ARA, idLinia });
const resumDeLinies = (comanda) => comanda.linies.map((l) => [l.nomCongelat, l.quantitat]);

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

describe('T1 · «Mou» valida abans d’escriure res', () => {
  const ambPagamentParcial = async (magatzem) => {
    const comanda = afegeixPagament(amb(nova('c-pagada'), 'plat-del-dia', 1, 'l-1'), { metode: 'targeta', importCents: 300 }, { id: 'p-1', ara: ARA });
    return magatzem.desaComanda(comanda);
  };

  test('una comanda amb un pagament parcial no es mou, i al disc no queda cap comanda fantasma (ni a una taula ni a la barra, ni al segon intent)', async () => {
    const magatzem = await magatzemDeProva();
    await ambPagamentParcial(magatzem);
    const abans = await comandesDe(magatzem);
    const sonda = await sondaDe(magatzem);
    for (const desti of [{ origen: { tipus: 'taula', taulaId: 't1' } }, { origen: { tipus: 'barra' } }, { origen: { tipus: 'taula', taulaId: 't1' } }]) {
      const r = await fes(() => sonda.bar.accions.mou('c-pagada', desti, [{ liniaId: 'l-1' }]));
      expect([r.ok, r.error?.codi]).toEqual([false, 'PAGAT_SUPERA']);
    }
    expect(await comandesDe(magatzem)).toEqual(abans);
    expect(sonda.bar.comandes.map((c) => c.id)).toEqual(['c-pagada']);
    /* I recarregar no fa aparéixer cap taula «ocupada». */
    expect((await magatzem.carrega()).comandes.map((c) => c.id)).toEqual(['c-pagada']);
  });

  test('la pantalla ho diu abans, com «Dividix»: amb pagaments, «Mou» queda desactivat i explica per què', async () => {
    const magatzem = await magatzemDeProva();
    await ambPagamentParcial(magatzem);
    munta('/app/bar/caixa/c-pagada?mou=1', magatzem);
    const dialeg = await screen.findByRole('dialog', { name: 'Mou o ajunta la comanda' });
    expect(within(dialeg).getByText('Esta comanda ja té pagaments: acaba de cobrar-la abans de moure-la.')).toBeTruthy();
    fireEvent.change(within(dialeg).getByLabelText('On va'), { target: { value: 'taula:t1' } });
    expect(within(dialeg).getByRole('button', { name: 'Mou' }).disabled).toBe(true);
  });

  test('sense pagaments, el destí nou s’escriu una sola vegada, ja amb les línies (rev 1)', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(amb(nova('c-o'), 'olives', 1, 'l-1'));
    const desa = vi.spyOn(magatzem, 'traspassaComandes');
    const sonda = await sondaDe(magatzem);
    const r = await fes(() => sonda.bar.accions.mou('c-o', { origen: { tipus: 'taula', taulaId: 't1' } }, [{ liniaId: 'l-1' }]));
    expect(r.ok).toBe(true);
    expect(desa).toHaveBeenCalledTimes(1);
    expect(r.valor).toMatchObject({ rev: 1, origen: { tipus: 'taula', taulaId: 't1' } });
    expect((await comandesDe(magatzem)).map((c) => [c.id, resumDeLinies(c)])).toEqual([[r.valor.id, [['Olives', 1]]]]);
  });
});

/* Les versions antigues podien deixar moviments a mitges. El Bar encara els detecta. */
describe('T2 · moviments nous atòmics i avisos dels moviments antics', () => {
  const TALL = () => Object.assign(new Error('tall'), { codi: 'NO_DISPONIBLE' });
  const resumDeMigs = (migs) => migs.map((m) => [m.motiu, m.origenId, m.destiId, m.linies.map((l) => `${l.quantitat} × ${l.nom}`)]);
  const perIdIRev = (comandes) => comandes.map((c) => [c.id, c.rev, resumDeLinies(c)]).sort((a, b) => (a[0] < b[0] ? -1 : 1));

  test('B · muntar el Bar fa UNA sola lectura del disc, i la memòria queda igual que el disc', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(amb(nova('c-o'), 'olives', 1, 'l-1'));
    const carrega = vi.spyOn(magatzem, 'carrega');
    const sonda = await sondaDe(magatzem);
    await act(async () => { await new Promise((resolve) => { setTimeout(resolve, 30); }); });
    expect(carrega).toHaveBeenCalledTimes(1);
    expect(perIdIRev(sonda.bar.comandes)).toEqual(perIdIRev(await comandesDe(magatzem)));
    expect(sonda.bar.migsMoviments).toEqual([]);
  });

  test('un conflicte a l’origen de «Mou» conserva el destí i recarrega la caixa', async () => {
    const magatzem = await magatzemDeProva();
    const origen = await magatzem.desaComanda(amb(nova('c-o'), 'olives', 1, 'l-1'));
    const desti = await magatzem.desaComanda(amb(nova('c-d', { tipus: 'taula', taulaId: 't2' }), 'cafe-sol', 1, 'l-2'));
    const sonda = await sondaDe(magatzem);
    const actual = await magatzem.desaComanda(amb(origen, 'tallat', 1, 'l-3'));
    const r = await fes(() => sonda.bar.accions.mou('c-o', { comandaId: 'c-d' }, [{ liniaId: 'l-1' }]));
    expect([r.ok, r.error?.codi]).toEqual([false, 'CONFLICTE']);
    expect(perIdIRev(await comandesDe(magatzem))).toEqual(perIdIRev([actual, desti]));
    expect(perIdIRev(sonda.bar.comandes)).toEqual(perIdIRev([actual, desti]));
    expect(resumDeMigs(sonda.bar.migsMoviments)).toEqual([]);
  });

  test('si la transacció de «Dividix» falla, la mare continua al disc sense cap filla', async () => {
    const magatzem = await magatzemDeProva();
    const origen = await magatzem.desaComanda(amb(amb(nova('c-o'), 'olives', 1, 'l-1'), 'cafe-sol', 1, 'l-2'));
    const sonda = await sondaDe(magatzem);
    vi.spyOn(magatzem, 'traspassaComandes').mockRejectedValueOnce(TALL());
    const r = await fes(() => sonda.bar.accions.divideix('c-o', [{ liniaId: 'l-1', quantitat: 1 }]));
    expect([r.ok, r.error?.codi]).toEqual([false, 'NO_DISPONIBLE']);
    expect(await comandesDe(magatzem)).toEqual([origen]);
    expect(perIdIRev(sonda.bar.comandes)).toEqual(perIdIRev([origen]));
    expect(resumDeMigs(sonda.bar.migsMoviments)).toEqual([]);
  });

  /* E · L'avís servix a una persona: quines línies, a quines comandes i què fer. */
  test('E · la pantalla diu quines línies són a quines dues comandes i què fer; l’avís no es pot tancar ni se’n va en vendre, i desapareix en arreglar-ho', async () => {
    const magatzem = await magatzemDeProva();
    const origen = await magatzem.desaComanda(amb(nova('c-o'), 'olives', 2, 'l-1'));
    const r = mouLinies(origen, nova('c-d', { tipus: 'taula', taulaId: 't1' }), [{ liniaId: 'l-1' }], { ara: ARA, nouIdLinia: () => 'l-nova', op: 'm-1' });
    await magatzem.desaComanda(r.desti);
    munta('/app/bar/caixa/c-o', magatzem);
    const hora = new Date(ARA);
    const barra = `Barra · ${String(hora.getHours()).padStart(2, '0')}:${String(hora.getMinutes()).padStart(2, '0')}`;
    const text = `Les línies 2 × Olives: són a «${barra}» i també a «Taula 1». Revisa-les abans de cobrar: estes línies poden estar dues vegades. Lleva-les de la comanda on sobren; no tornes a fer el moviment.`;
    const avis = (await screen.findByText(text)).closest('.sdp-alerta');
    expect(within(avis).getByText('Un moviment s’ha quedat a mitges')).toBeTruthy();
    expect(within(avis).queryByRole('button')).toBeNull();
    /* Una venda bona no l'esborra. */
    fireEvent.click(within(document.getElementById('app-grid-main')).getByRole('button', { name: /^Cafè sol / }));
    await waitFor(() => expect(within(document.getElementById('app-grid-list')).getByText('Cafè sol')).toBeTruthy());
    expect(screen.getByText(text)).toBeTruthy();
    /* Lleva les olives de la barra (on sobren): l'avís se'n va sol. */
    fireEvent.click(within(document.getElementById('app-grid-list')).getByRole('button', { name: 'Lleva Olives' }));
    await waitFor(() => expect(screen.queryByText(text)).toBeNull());
    expect((await comandesDe(magatzem)).map((c) => [c.id, resumDeLinies(c)]).sort()).toEqual([['c-d', [['Olives', 2]]], ['c-o', [['Cafè sol', 1]]]]);
  });

  test('E · l’origen ja cobrat i el destí ja cobrat es diuen amb la seua nota', async () => {
    const magatzem = await magatzemDeProva();
    const origen = await magatzem.desaComanda(amb(nova('c-o'), 'olives', 1, 'l-1'));
    const r = mouLinies(origen, nova('c-d', { tipus: 'taula', taulaId: 't1' }), [{ liniaId: 'l-1' }], { ara: ARA, nouIdLinia: () => 'l-nova', op: 'm-1' });
    await magatzem.desaComanda(r.desti);
    await magatzem.tancaComanda(tanca(afegeixPagament(origen, { metode: 'targeta', importCents: totals(origen).pendentCents }, { id: 'p-9', ara: ARA }), { numero: 1, ara: ARA }));
    munta('/app/bar/caixa/c-d', magatzem);
    expect(await screen.findByText('La línia 1 × Olives: ja s’han cobrat a «Nota 0001» i encara són a «Taula 1». Revisa-la abans de cobrar: estes línies poden estar dues vegades. Si sobren, lleva-les de «Taula 1».')).toBeTruthy();
  });

  test('F · després d’un error de «Separa i cobra», el reintent crea una sola filla', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(amb(amb(nova('c-o'), 'olives', 2, 'l-1'), 'cafe-sol', 1, 'l-2'));
    munta('/app/bar/caixa/c-o/dividir', magatzem);
    const detall = () => within(document.getElementById('app-grid-main'));
    await screen.findByRole('button', { name: 'Separa i cobra' });
    fireEvent.click(detall().getByRole('button', { name: 'Suma una unitat: Olives' }));
    const desa = vi.spyOn(magatzem, 'traspassaComandes').mockRejectedValueOnce(TALL());
    const separa = detall().getByRole('button', { name: 'Separa i cobra' });
    expect(separa.disabled).toBe(false);
    fireEvent.click(separa);
    expect(await detall().findByText('Les dades del dispositiu han deixat de respondre: recarrega la pàgina abans de continuar.')).toBeTruthy();
    expect((await comandesDe(magatzem)).map(resumDeLinies)).toEqual([[['Olives', 2], ['Cafè sol', 1]]]);
    await waitFor(() => expect(separa.disabled).toBe(false));
    fireEvent.click(separa);
    await waitFor(async () => expect((await comandesDe(magatzem)).map(resumDeLinies).sort())
      .toEqual([[['Olives', 1]], [['Olives', 1], ['Cafè sol', 1]]]));
    expect(desa).toHaveBeenCalledTimes(2);
  });
});

describe('T7 · l’historial de la comanda descartada passa al destí', () => {
  test('en moure-la sencera, el destí guarda qui va fer el descompte i quan es va obrir l’origen', async () => {
    const magatzem = await magatzemDeProva();
    const origen = aplicaDescompte(amb(nova('c-o'), 'olives', 1, 'l-1'), 'l-1', { tipus: 'percent', valor: 10, motiu: 'Client' }, { ara: ARA, per: 'Encarregada' });
    await magatzem.desaComanda(origen);
    const sonda = await sondaDe(magatzem);
    const r = await fes(() => sonda.bar.accions.mou('c-o', { origen: { tipus: 'taula', taulaId: 't1' } }, [{ liniaId: 'l-1' }]));
    expect(r.ok).toBe(true);
    const [desti] = await comandesDe(magatzem);
    expect(desti.historial.find((e) => e.tipus === 'absorbix')).toMatchObject({ altra: 'c-o', obertaA: ARA, per: 'Cambrer 1' });
    expect(desti.historial.find((e) => e.tipus === 'descompte')).toMatchObject({ de: 'c-o', per: 'Encarregada', motiu: 'Client' });
    expect(desti.linies[0].descompte).toEqual({ tipus: 'percent', valor: 10, motiu: 'Client' });
  });

  test('en dividir-ho tot, la filla guarda l’historial de la mare; si la mare no es buida, res d’heretat', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(amb(amb(nova('c-o'), 'olives', 1, 'l-1'), 'cafe-sol', 1, 'l-2'));
    const sonda = await sondaDe(magatzem);
    const part = await fes(() => sonda.bar.accions.divideix('c-o', [{ liniaId: 'l-1', quantitat: 1 }]));
    expect(part.valor.historial.some((e) => e.de || e.tipus === 'absorbix')).toBe(false);
    const tot = await fes(() => sonda.bar.accions.divideix('c-o', [{ liniaId: 'l-2', quantitat: 1 }]));
    expect(tot.valor.historial.filter((e) => e.de === 'c-o').length).toBeGreaterThan(0);
    expect((await comandesDe(magatzem)).map((c) => c.id).sort()).toEqual([part.valor.id, tot.valor.id].sort());
  });
});

describe('T3 i T5 · la còpia del dia no pot faltar, i els errors diuen què ha passat', () => {
  const TANCAT = '2026-10-02T14:00:00.000Z';

  async function ambTornTancat(prepara = async () => {}) {
    const magatzem = await magatzemDeProva({ ambTorn: false });
    const torn = obriTorn({ id: 'torn-x', per: 'Cambrer 1', fonsInicialCents: 0, ara: ARA });
    let c = amb(creaComanda({ id: 'c-1', tornId: torn.id, origen: { tipus: 'barra' }, ara: ARA }), 'olives', 1, 'l-1');
    c = afegeixPagament(c, { metode: 'targeta', importCents: totals(c).pendentCents }, { id: 'p-1', ara: ARA });
    const tiquet = tanca(c, { numero: 1, ara: ARA });
    await magatzem.tancaComanda(tiquet);
    const resum = resumTorn(torn, [tiquet], [], { categories: CARTA.categories });
    const traspas = notaDeTraspas({ torn, resum, diferenciaCaixaCents: 0 - resum.efectiuEsperatCents, ara: TANCAT });
    await magatzem.desaTorn(tancaTorn(torn, { arqueig: { perDenominacio: {} }, resum, traspas, ara: TANCAT }));
    await prepara(magatzem);
    return magatzem;
  }
  const escolta = () => {
    const baixats = [];
    vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL: (blob) => { baixats.push({ blob }); return 'blob:prova'; }, revokeObjectURL: () => {} }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function enregistra() { baixats.at(-1).nom = this.download; });
    return baixats;
  };
  /* Una carta que passa la validació (no mira els escandalls) i fa petar el càlcul del consum. */
  const cartaTrencada = async (magatzem) => {
    const { carta } = await magatzem.carrega();
    await magatzem.desaCarta({ ...carta, escandalls: [null] });
  };

  test('T3 · amb una carta que fa petar el consum, l’XLSX ix amb les quatre fulles de sempre i un avís; els CSV, com sempre', async () => {
    const baixats = escolta();
    munta('/app/bar/torns/torn-x', await ambTornTancat(cartaTrencada));
    fireEvent.click(await screen.findByRole('button', { name: 'Desa el tancament (XLSX)' }));
    await waitFor(() => expect(baixats.map((b) => b.nom)).toEqual(['tancament-2026-10-02-torn-x.xlsx']));
    expect(await screen.findByText('Fitxer preparat sense la fulla «Consum d’ingredients»: no s’ha pogut calcular amb la carta d’ara. El navegador et deixa triar on desar-lo.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'CSV del resum' }));
    fireEvent.click(screen.getByRole('button', { name: 'CSV per producte' }));
    await waitFor(() => expect(baixats.map((b) => b.nom)).toEqual([
      'tancament-2026-10-02-torn-x.xlsx', 'tancament-resum-2026-10-02-torn-x.csv', 'tancament-producte-2026-10-02-torn-x.csv'
    ]));
    expect(await screen.findByText('Fitxer preparat: el navegador et deixa triar on desar-lo.')).toBeTruthy();
  });

  test('T3 · si el full no es pot fer de cap manera, la pantalla ho diu (cap botó mut)', async () => {
    const baixats = escolta();
    const magatzem = await ambTornTancat();
    vi.spyOn(magatzem, 'tiquetsDelTorn').mockRejectedValue(new Error('tall'));
    munta('/app/bar/torns/torn-x', magatzem);
    fireEvent.click(await screen.findByRole('button', { name: 'CSV del resum' }));
    expect(await screen.findByText('No s’ha pogut preparar el fitxer: les dades d’este torn no s’han pogut llegir. Torna-ho a provar.')).toBeTruthy();
    expect(baixats).toEqual([]);
  });

  /* H · El que falla no és llegir: és fer el fitxer. El text no culpa la lectura. */
  test('H · si les dades es lligen però el fitxer no es pot fer, ho diu així (no «no s’han pogut llegir»)', async () => {
    const baixats = escolta();
    const magatzem = await ambTornTancat();
    /* Un torn tancat amb el resum malmés: fullTancament llança en fer el full. */
    const [torn] = await magatzem.base.totes('torns');
    await magatzem.base.desa('torns', { ...torn, resum: { ...torn.resum, perProducte: null } });
    munta('/app/bar/torns/torn-x', magatzem);
    fireEvent.click(await screen.findByRole('button', { name: 'CSV per producte' }));
    expect(await screen.findByText('No s’ha pogut fer el fitxer: les dades del torn s’han llegit, però ha fallat en preparar-lo. Prova un altre format i desa una còpia des d’Ajustos › Dispositiu.')).toBeTruthy();
    expect(baixats).toEqual([]);
  });

  test('T5 · les vendes: un registre que no valida diu que no valida; un error de lectura diu que no s’ha pogut llegir', async () => {
    escolta();
    const slugDolent = async (magatzem) => {
      const { establiment } = await magatzem.carrega();
      await magatzem.desaMeta('establiment', { ...establiment, slug: 'Bar Amb Espais' });
    };
    munta('/app/bar/torns/torn-x', await ambTornTancat(slugDolent));
    fireEvent.click(await screen.findByRole('button', { name: 'Vendes per a la Gestoria (JSON)' }));
    expect(await screen.findByText(/^El registre de vendes d’este torn no passa la validació del contracte \(1 problema\): /)).toBeTruthy();
    cleanup();

    const magatzem = await ambTornTancat();
    vi.spyOn(magatzem, 'tiquetsDelTorn').mockRejectedValue(new Error('tall'));
    munta('/app/bar/torns/torn-x', magatzem);
    fireEvent.click(await screen.findByRole('button', { name: 'Vendes per a la Gestoria (JSON)' }));
    expect(await screen.findByText('No s’han pogut llegir els tiquets d’este torn: no s’ha fet cap fitxer. Torna-ho a provar.')).toBeTruthy();
  });

  test('T6 · l’avís de les vendes diu de qui és la zona: la d’esta caixa, perquè el bar encara no en té de pròpia', async () => {
    escolta();
    munta('/app/bar/torns/torn-x', await ambTornTancat());
    fireEvent.click(await screen.findByRole('button', { name: 'Vendes per a la Gestoria (JSON)' }));
    const zona = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(await screen.findByText(`Fitxer preparat: 1 venda, amb el dia i l’hora de la zona d’ESTA CAIXA (${zona}), perquè el bar encara no té zona pròpia: si la caixa no és a l’hora del bar, les dates poden ballar. El navegador et deixa triar on desar-lo.`)).toBeTruthy();
  });
});
