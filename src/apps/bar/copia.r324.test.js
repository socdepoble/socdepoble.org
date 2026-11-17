// @vitest-environment node
import { afterEach, describe, expect, test } from 'vitest';
import { creaMagatzemBar } from './magatzem.js';
import { afegeixProducte, aplicaDescompte, creaComanda, totals } from './nucli/comanda.js';
import { afegeixPagament, tanca } from './nucli/cobrament.js';
import { creaDevolucio, desglossaIva } from './nucli/tiquet.js';
import { llegixCopiaBar } from './nucli/copia.js';
import { obriTorn } from './nucli/torn.js';
import { llavorCarta } from './nucli/llavor.js';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';

const ARA = '2026-11-16T00:00:00.000Z';
const oberts = [];
function magatzem(idbFals = creaIdbFals()) {
  const m = creaMagatzemBar({ idb: idbFals.idb, navegador: { locks: creaLocksFals() }, Canal: creaCanalFals().Canal });
  oberts.push(m);
  return m;
}
afterEach(() => { for (const m of oberts.splice(0)) m.base.tanca(); });

async function copiaOberta() {
  const m = magatzem();
  await m.carrega();
  await m.obriTorn(obriTorn({ id: 't-r324', fonsInicialCents: 0, ara: ARA }), [], null);
  const producte = llavorCarta().productes.find((p) => p.id === 'tallat');
  const c = afegeixProducte(creaComanda({ id: 'c-r324', tornId: 't-r324', origen: { tipus: 'barra' }, ara: ARA }), {
    producte, ivaPerDefecte: 10
  }, { idLinia: 'l-r324', ara: ARA });
  await m.desaComanda(c);
  return JSON.parse(await m.exportaCopia(new Date(ARA)));
}

describe('R32.4: la recuperació refusa nombres JSON coaccionats abans de tocar el disc', () => {
  test.each([
    ['import cadena', (c) => { c.comandes[0].linies[0].descompte = { tipus: 'import', valor: '100', motiu: 'Prova' }; }],
    ['import negatiu', (c) => { c.comandes[0].linies[0].descompte = { tipus: 'import', valor: -100, motiu: 'Prova' }; }],
    ['percent cadena', (c) => { c.comandes[0].linies[0].descompte = { tipus: 'percent', valor: '50', motiu: 'Prova' }; }],
    ['percent booleà', (c) => { c.comandes[0].linies[0].descompte = { tipus: 'percent', valor: true, motiu: 'Prova' }; }],
    ['total fora de marge', (c) => { c.comandes[0].linies[0].preuUnitariCents = Number.MAX_SAFE_INTEGER; c.comandes[0].linies[0].quantitat = 2; }],
    ['pagament excedit', (c) => { c.comandes[0].pagaments = [{ id: 'p-1', metode: 'targeta', importCents: 999, moment: ARA }]; }],
    ['moviment cadena', (c) => { c.torns[0].moviments = [{ id: 'm-1', tipus: 'entrada', importCents: '100', motiu: 'Prova', moment: ARA }]; }],
    ['fons negatiu', (c) => { c.torns[0].fonsInicialCents = -1; }]
  ])('%s', async (_nom, corromp) => {
    const copia = await copiaOberta();
    corromp(copia);
    const desti = magatzem();
    await desti.carrega();
    const abans = await desti.exportaCopia(new Date(ARA));
    await expect(desti.restauraCopia(JSON.stringify(copia))).rejects.toMatchObject({ codi: 'COPIA_INVALIDA' });
    expect(await desti.exportaCopia(new Date(ARA))).toBe(abans);
  });
});

async function copiaAmbRetorns({ quantitat = 1, total = 130, parts = [1] } = {}) {
  const m = magatzem();
  await m.carrega();
  await m.obriTorn(obriTorn({ id: 't-retorns', fonsInicialCents: 0, ara: ARA }), [], null);
  const original = llavorCarta().productes.find((p) => p.id === 'tallat');
  const producte = { ...original, variants: [{ ...original.variants[0], preuCents: total }] };
  let c = afegeixProducte(creaComanda({ id: 'c-retorns', tornId: 't-retorns', origen: { tipus: 'barra' }, ara: ARA }), {
    producte, quantitat, ivaPerDefecte: 10
  }, { idLinia: 'l-retorns', ara: ARA });
  if (quantitat > 1) c = aplicaDescompte(c, 'l-retorns', { tipus: 'import', valor: total * (quantitat - 1), motiu: 'Prova' }, { ara: ARA });
  c = await m.desaComanda(c);
  const venda = tanca(afegeixPagament(c, { metode: 'targeta', importCents: totals(c).totalCents }, { id: 'p-retorns', ara: ARA }), { numero: 1, ara: ARA });
  await m.tancaComanda(venda);
  const devolucions = [];
  for (const [i, q] of parts.entries()) {
    const d = creaDevolucio(venda, [{ liniaId: 'l-retorns', quantitat: q }], {
      id: `k-retorn-${i}`, tornId: 't-retorns', numero: i + 2, motiu: 'Prova', metode: 'targeta', ara: ARA, devolucionsPrevies: devolucions
    });
    await m.desaDevolucio(d);
    devolucions.push(d);
  }
  return JSON.parse(await m.exportaCopia(new Date(ARA)));
}

function quadraRetorn(retorn) {
  const total = -retorn.linies.reduce((suma, linia) => suma + linia.importCents, 0) || 0;
  retorn.totals.brutCents = total;
  retorn.totals.totalCents = total;
  retorn.totals.perIva = desglossaIva(retorn.linies, (linia) => -linia.importCents);
  retorn.pagaments[0].importCents = total;
}

describe('R32.4: les devolucions restaurades conserven el límit de la venda original', () => {
  test.each([
    ['línia absent', (c) => { c.tiquets[1].linies[0].liniaOrigenId = 'absent'; }],
    ['id booleà', (c) => { c.tiquets[1].linies[0].liniaOrigenId = true; }],
    ['quantitat i import excedits amb totals coherents', (c) => { c.tiquets[1].linies[0].quantitat = 2; c.tiquets[1].linies[0].importCents = 260; quadraRetorn(c.tiquets[1]); }],
    ['quantitat cadena', (c) => { c.tiquets[1].linies[0].quantitat = '1'; }],
    ['import cadena', (c) => { c.tiquets[1].linies[0].importCents = '130'; }],
    ['IVA canviat amb totals coherents', (c) => { c.tiquets[1].linies[0].ivaPercent = 21; quadraRetorn(c.tiquets[1]); }],
    ['import fals amb totals coherents', (c) => { c.tiquets[1].linies[0].importCents = 1; quadraRetorn(c.tiquets[1]); }],
    ['línia anul·lada de devolució', (c) => { c.tiquets[1].linies[0].estat = 'anullada'; }],
    ['dos retorns que junts passen la venda', (c) => {
      const segon = structuredClone(c.tiquets[1]);
      segon.id = 'k-extra'; segon.numero = 3; segon.linies[0].id = 'k-extra-1'; segon.pagaments[0].id = 'k-extra-p';
      c.tiquets.push(segon);
    }]
  ])('%s: la restauració es refusa sense cap escriptura', async (_nom, corromp) => {
    const copia = await copiaAmbRetorns();
    corromp(copia);
    const desti = magatzem();
    await desti.carrega();
    const abans = await desti.exportaCopia(new Date(ARA));
    await expect(desti.restauraCopia(JSON.stringify(copia))).rejects.toMatchObject({ codi: 'COPIA_INVALIDA' });
    expect(await desti.exportaCopia(new Date(ARA))).toBe(abans);
  });

  const particions = (n) => Array.from({ length: n }, (_, i) => i + 1)
    .flatMap((q) => q === n ? [[q]] : particions(n - q).map((resta) => [q, ...resta]));
  test.each([3, 5])('totes les particions de %i unitats conserven el repartiment i el darrer cèntim, amb qualsevol ordre del bolcat', async (quantitat) => {
    for (const total of [1, 2, 4, 7]) {
      for (const parts of particions(quantitat)) {
        const copia = await copiaAmbRetorns({ quantitat, total, parts });
        for (const tria of [copia, { ...copia, tiquets: [...copia.tiquets].reverse() }]) {
          expect(() => llegixCopiaBar(JSON.stringify(tria))).not.toThrow();
        }
        /* També les còpies PARCIALS produïdes abans de cada retorn següent. */
        for (let n = 1; n < parts.length; n += 1) {
          expect(() => llegixCopiaBar(JSON.stringify({ ...copia, tiquets: copia.tiquets.slice(0, n + 1).reverse() }))).not.toThrow();
        }
      }
    }
  });
});
