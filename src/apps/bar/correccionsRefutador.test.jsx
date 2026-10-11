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
    const desa = vi.spyOn(magatzem, 'desaComanda');
    const sonda = await sondaDe(magatzem);
    const r = await fes(() => sonda.bar.accions.mou('c-o', { origen: { tipus: 'taula', taulaId: 't1' } }, [{ liniaId: 'l-1' }]));
    expect(r.ok).toBe(true);
    expect(desa).toHaveBeenCalledTimes(1);
    expect(r.valor).toMatchObject({ rev: 1, origen: { tipus: 'taula', taulaId: 't1' } });
    expect((await comandesDe(magatzem)).map((c) => [c.id, resumDeLinies(c)])).toEqual([[r.valor.id, [['Olives', 1]]]]);
  });
});

/* Decisió del 261011: «detecta i avisa». Res no acaba el moviment sol: el duplicat es queda al
   disc, la memòria diu el mateix que el disc, i la pantalla ho avisa fins que algú ho arregla. */
describe('T2 · si la segona escriptura falla, el moviment es queda a mitges, a la vista i sense tocar res més', () => {
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

  test('«Mou» (fusió): falla el descart de l’origen → MIG_MOVIMENT (no «torna-ho a provar»); el duplicat es queda al disc, la memòria diu el mateix (cap rev vell) i l’avís no se’n va amb una operació bona, sinó quan s’arregla', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(amb(nova('c-o'), 'olives', 1, 'l-1'));
    await magatzem.desaComanda(amb(nova('c-d', { tipus: 'taula', taulaId: 't2' }), 'cafe-sol', 1, 'l-2'));
    const descarta = vi.spyOn(magatzem, 'descartaComanda').mockRejectedValueOnce(TALL());
    const sonda = await sondaDe(magatzem);
    const r = await fes(() => sonda.bar.accions.mou('c-o', { comandaId: 'c-d' }, [{ liniaId: 'l-1' }]));
    expect(descarta).toHaveBeenCalledTimes(1);
    expect([r.ok, r.error?.codi]).toEqual([false, 'MIG_MOVIMENT']);
    expect(sonda.bar.avis).toBe('El moviment s’ha quedat a mitges: les línies són ara a les DUES comandes. No el repetisques: mira l’avís de davall i lleva-les de la comanda on sobren abans de cobrar.');
    /* Res no l'ha acabat: les olives són a les dues comandes, al disc i a la memòria. */
    const alDisc = await comandesDe(magatzem);
    expect(perIdIRev(alDisc)).toEqual([['c-d', 2, [['Cafè sol', 1], ['Olives', 1]]], ['c-o', 1, [['Olives', 1]]]]);
    expect(perIdIRev(sonda.bar.comandes)).toEqual(perIdIRev(alDisc));
    expect(resumDeMigs(sonda.bar.migsMoviments)).toEqual([['A_MITGES', 'c-o', 'c-d', ['1 × Olives']]]);
    /* S'hi pot continuar venent (el rev del destí és el del disc), i l'avís continua. */
    const despres = await fes(() => sonda.bar.accions.afegeix({ comandaId: 'c-d' }, { producte: P('tallat') }));
    expect(despres.ok).toBe(true);
    expect(sonda.bar.avis).toBeNull();
    expect(resumDeMigs(sonda.bar.migsMoviments)).toEqual([['A_MITGES', 'c-o', 'c-d', ['1 × Olives']]]);
    /* La persona lleva les olives de la comanda on sobren: l'avís se'n va sol. */
    const arreglat = await fes(() => sonda.bar.accions.canviaQuantitat('c-o', 'l-1', 0));
    expect(arreglat.ok).toBe(true);
    expect(sonda.bar.migsMoviments).toEqual([]);
  });

  test('si a més la relectura falla, la memòria es queda amb el destí que SÍ que s’ha escrit (el seu rev) i l’origen d’abans: igual que el disc', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(amb(nova('c-o'), 'olives', 1, 'l-1'));
    await magatzem.desaComanda(amb(nova('c-d', { tipus: 'taula', taulaId: 't2' }), 'cafe-sol', 1, 'l-2'));
    const sonda = await sondaDe(magatzem);
    vi.spyOn(magatzem, 'descartaComanda').mockRejectedValueOnce(TALL());
    vi.spyOn(magatzem, 'carrega').mockRejectedValueOnce(TALL());
    const r = await fes(() => sonda.bar.accions.mou('c-o', { comandaId: 'c-d' }, [{ liniaId: 'l-1' }]));
    expect(r.error?.codi).toBe('MIG_MOVIMENT');
    expect(perIdIRev(sonda.bar.comandes)).toEqual(perIdIRev(await comandesDe(magatzem)));
    expect(resumDeMigs(sonda.bar.migsMoviments)).toEqual([['A_MITGES', 'c-o', 'c-d', ['1 × Olives']]]);
    expect((await fes(() => sonda.bar.accions.afegeix({ comandaId: 'c-d' }, { producte: P('tallat') }))).ok).toBe(true);
  });

  test('«Mou» parcial: falla desar l’origen → l’origen es queda sencer al disc (ningú el retalla) i s’avisa de les unitats que hi sobren', async () => {
    const magatzem = await magatzemDeProva();
    const origen = await magatzem.desaComanda(amb(nova('c-o'), 'olives', 3, 'l-1'));
    const sonda = await sondaDe(magatzem);
    const real = magatzem.desaComanda.bind(magatzem);
    let crides = 0;
    vi.spyOn(magatzem, 'desaComanda').mockImplementation((comanda) => {
      crides += 1;
      return crides === 2 ? Promise.reject(Object.assign(new Error('tall'), { codi: 'NO_DISPONIBLE' })) : real(comanda);
    });
    const r = await fes(() => sonda.bar.accions.mou('c-o', { origen: { tipus: 'taula', taulaId: 't1' } }, [{ liniaId: 'l-1', quantitat: 2 }]));
    expect([r.ok, r.error?.codi]).toEqual([false, 'MIG_MOVIMENT']);
    const comandes = await comandesDe(magatzem);
    expect(comandes.find((c) => c.id === 'c-o')).toEqual(origen);
    expect(comandes.map((c) => resumDeLinies(c)).sort()).toEqual([[['Olives', 2]], [['Olives', 3]]]);
    expect(perIdIRev(sonda.bar.comandes)).toEqual(perIdIRev(comandes));
    expect(resumDeMigs(sonda.bar.migsMoviments).map(([motiu, origenId, , linies]) => [motiu, origenId, linies])).toEqual([['A_MITGES', 'c-o', ['2 × Olives']]]);
  });

  test('«Dividix»: falla desar la mare → la mare es queda sencera al disc i s’avisa', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(amb(amb(nova('c-o'), 'olives', 1, 'l-1'), 'cafe-sol', 1, 'l-2'));
    const sonda = await sondaDe(magatzem);
    const real = magatzem.desaComanda.bind(magatzem);
    let crides = 0;
    vi.spyOn(magatzem, 'desaComanda').mockImplementation((comanda) => {
      crides += 1;
      return crides === 2 ? Promise.reject(Object.assign(new Error('tall'), { codi: 'NO_DISPONIBLE' })) : real(comanda);
    });
    const r = await fes(() => sonda.bar.accions.divideix('c-o', [{ liniaId: 'l-1', quantitat: 1 }]));
    expect([r.ok, r.error?.codi]).toEqual([false, 'MIG_MOVIMENT']);
    const perId = Object.fromEntries((await comandesDe(magatzem)).map((c) => [c.id, resumDeLinies(c)]));
    expect(perId['c-o']).toEqual([['Olives', 1], ['Cafè sol', 1]]);
    expect(Object.values(perId).sort()).toEqual([[['Olives', 1]], [['Olives', 1], ['Cafè sol', 1]]]);
    expect(resumDeMigs(sonda.bar.migsMoviments).map(([motiu, origenId, , linies]) => [motiu, origenId, linies])).toEqual([['A_MITGES', 'c-o', ['1 × Olives']]]);
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

  /* F · Un segon toc a «Separa i cobra» no en separa una unitat més. */
  test('F · «Dividix» a mitges: la pantalla diu que no es repetisca i la selecció es buida', async () => {
    const magatzem = await magatzemDeProva();
    await magatzem.desaComanda(amb(amb(nova('c-o'), 'olives', 2, 'l-1'), 'cafe-sol', 1, 'l-2'));
    munta('/app/bar/caixa/c-o/dividir', magatzem);
    const detall = () => within(document.getElementById('app-grid-main'));
    /* «Separa i cobra» només és a la columna de dividir: quan hi és, la columna ja està pintada. */
    await screen.findByRole('button', { name: 'Separa i cobra' });
    fireEvent.click(detall().getByRole('button', { name: 'Suma una unitat: Olives' }));
    const real = magatzem.desaComanda.bind(magatzem);
    let crides = 0;
    vi.spyOn(magatzem, 'desaComanda').mockImplementation((comanda) => {
      crides += 1;
      return crides === 2 ? Promise.reject(TALL()) : real(comanda);
    });
    const separa = detall().getByRole('button', { name: 'Separa i cobra' });
    expect(separa.disabled).toBe(false);
    fireEvent.click(separa);
    expect(await detall().findByText(/^El moviment s’ha quedat a mitges: les línies són ara a les DUES comandes\. No el repetisques/)).toBeTruthy();
    await waitFor(() => expect(detall().getByRole('button', { name: 'Separa i cobra' }).disabled).toBe(true));
    expect(crides).toBe(2);
    expect((await comandesDe(magatzem)).map((c) => resumDeLinies(c)).sort()).toEqual([[['Olives', 1]], [['Olives', 2], ['Cafè sol', 1]]]);
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
