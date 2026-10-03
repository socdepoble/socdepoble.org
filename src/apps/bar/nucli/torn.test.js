// @vitest-environment node
/* El Bar · nucli/torn.js i traspas.js — invariants 7 i 8 de §A.4, resum i arqueig. */
import { describe, expect, test } from 'vitest';
import { afegeixMoviment, arqueig, obriTorn, potVendre, resumTorn, tancaTorn } from './torn.js';
import { aSentinella, marcaLlegida, notaDeTraspas, validaTraspas } from './traspas.js';
import { afegeixPagament, tanca } from './cobrament.js';
import { adoptaComanda, afegeixProducte, anullaLinia, aplicaDescompte, convida, creaComanda, marxa, totals } from './comanda.js';
import { fullTancament } from './fullTancament.js';
import { creaDevolucio } from './tiquet.js';
import { llistaReposicio } from './reposicio.js';
import { llavorCarta } from './llavor.js';

const OBERT = '2026-10-02T06:00:00.000Z';
const ARA = '2026-10-02T10:00:00.000Z';
const TANCAT = '2026-10-02T14:00:00.000Z';
const CARTA = llavorCarta();
const P = (id) => CARTA.productes.find((p) => p.id === id);
let n = 0;
const nouId = (prefix = 'l') => { n += 1; return `${prefix}-${n}`; };
const afig = (c, producteId, opcions = {}) => afegeixProducte(c, { producte: P(producteId), ivaPerDefecte: 10, ...opcions }, { ara: ARA, idLinia: nouId() });
const comanda = (torn, origen = { tipus: 'barra' }) => creaComanda({ id: nouId('c'), tornId: torn.id, origen, ara: ARA, per: 'Cambrer 1' });
const paga = (c, metode, extra = {}) => afegeixPagament(c, { metode, importCents: totals(c).pendentCents, ...extra }, { id: nouId('p'), ara: ARA });

/* Un torn amb: 2 vendes en efectiu (4,90 i 9,00), 1 amb targeta (descompte i convidada),
   1 anul·lació, 1 devolució en efectiu, una entrada i una eixida de caixa i una comanda oberta. */
function tornDeProva() {
  let torn = obriTorn({ id: 'torn-a', per: 'Cambrer 1', fonsInicialCents: 10000, ara: OBERT });
  torn = afegeixMoviment(torn, { tipus: 'entrada', importCents: 2000, motiu: 'Canvi del banc' }, { id: 'm-1', ara: ARA });
  torn = afegeixMoviment(torn, { tipus: 'eixida', importCents: 1500, motiu: 'Pa del forn' }, { id: 'm-2', ara: ARA });
  const t1 = tanca(paga(afig(afig(comanda(torn), 'cafe-sol', { quantitat: 2 }), 'torrada-tomaca'), 'efectiu', { lliuratCents: 1000 }), { numero: 1, ara: ARA });
  let c2 = marxa(afig(afig(comanda(torn), 'calamars'), 'refresc-cola', { quantitat: 3 }), { ara: ARA });
  c2 = anullaLinia(c2, c2.linies[1].id, { motiu: 'Equivocada', ara: ARA, quantitat: 1, idLinia: 'l-anul' });
  const t2 = tanca(paga(afig(c2, 'aigua'), 'efectiu'), { numero: 2, ara: ARA });
  let c3 = afig(afig(comanda(torn), 'cervesa-barril', { varianteId: 'gerra', quantitat: 2 }), 'olives');
  c3 = aplicaDescompte(c3, c3.linies[0].id, { tipus: 'import', valor: 100, motiu: 'Promoció' }, { ara: ARA });
  c3 = convida(c3, c3.linies[1].id, { motiu: 'Casa', ara: ARA });
  const t3 = tanca(paga(c3, 'targeta'), { numero: 3, ara: ARA });
  const dev = creaDevolucio(t2, [{ liniaId: t2.linies[1].id, quantitat: 1 }], { motiu: 'Calenta', metode: 'efectiu', id: 'k-dev', ara: ARA, numero: 4, tornId: torn.id });
  const oberta = afig(comanda(torn, { tipus: 'taula', taulaId: 't2' }), 'tallat');
  return { torn, tiquets: [t1, t2, t3, dev], obertes: [oberta], t2 };
}

describe('obrir el torn (invariant 8)', () => {
  test('sense nota anterior s’obri i pot vendre', () => {
    const torn = obriTorn({ id: 'torn-1', per: 'Cambrer 1', fonsInicialCents: 5000, ara: OBERT });
    expect(torn).toMatchObject({ estat: 'obert', obertPer: 'Cambrer 1', fonsInicialCents: 5000, moviments: [], traspasAnteriorLlegit: true });
    expect(potVendre(torn)).toBe(true);
  });

  test('amb una nota anterior sense llegir no s’obri; marcar-la llegida és un toc', () => {
    const { torn } = tornDeProva();
    const nota = notaDeTraspas({ torn, resum: resumTorn(torn), ara: TANCAT });
    expect(() => obriTorn({ id: 'torn-b', per: 'Cambrera 2', fonsInicialCents: 0, ara: TANCAT, traspasAnterior: nota }))
      .toThrow(expect.objectContaining({ codi: 'TRASPAS_NO_LLEGIT' }));
    const llegida = marcaLlegida(nota, { per: 'Cambrera 2', ara: TANCAT });
    expect(llegida).toMatchObject({ llegidaPer: 'Cambrera 2', llegidaA: TANCAT });
    expect(marcaLlegida(llegida, { per: 'Altra', ara: OBERT })).toBe(llegida);
    const seguent = obriTorn({ id: 'torn-b', per: 'Cambrera 2', fonsInicialCents: 0, ara: TANCAT, traspasAnterior: llegida });
    expect(seguent).toMatchObject({ traspasAnteriorDe: 'torn-a' });
    expect(potVendre(seguent)).toBe(true);
    expect(potVendre({ ...seguent, traspasAnteriorLlegit: false })).toBe(false);
  });

  test('moviments de caixa amb motiu i import positiu', () => {
    const torn = obriTorn({ id: 'torn-1', per: 'x', fonsInicialCents: 0, ara: OBERT });
    expect(() => afegeixMoviment(torn, { tipus: 'eixida', importCents: 100, motiu: '' }, { id: 'm', ara: ARA })).toThrow(expect.objectContaining({ codi: 'SENSE_MOTIU' }));
    expect(() => afegeixMoviment(torn, { tipus: 'eixida', importCents: 0, motiu: 'x' }, { id: 'm', ara: ARA })).toThrow(expect.objectContaining({ codi: 'IMPORT' }));
  });
});

describe('arqueig', () => {
  test('suma per denominacions en cèntims', () => {
    expect(arqueig({ 5000: 1, 2000: 2, 500: 3, 100: 4, 50: 1, 1: 7 })).toBe(5000 + 4000 + 1500 + 400 + 50 + 7);
    expect(arqueig({})).toBe(0);
  });

  test('rebutja el que no és cap denominació d’euro ni unitats enteres', () => {
    expect(() => arqueig({ 300: 1 })).toThrow(expect.objectContaining({ codi: 'ARQUEIG' }));
    expect(() => arqueig({ 100: -1 })).toThrow(expect.objectContaining({ codi: 'ARQUEIG' }));
    expect(() => arqueig({ 100: 1.5 })).toThrow(expect.objectContaining({ codi: 'ARQUEIG' }));
  });
});

describe('resumTorn', () => {
  test('vendes per mètode, devolucions, anul·lacions, descomptes, convidades i efectiu esperat', () => {
    const { torn, tiquets, obertes } = tornDeProva();
    const r = resumTorn(torn, tiquets, obertes, { categories: CARTA.categories });
    /* t1 = 2 × 120 + 250 = 490 · t2 = 900 + 2 × 200 + 100 = 1400 · t3 = 2 × 300 − 100 + 0 = 500 */
    expect(r.vendesPerMetode).toEqual({ efectiu: 1890, targeta: 500, altre: 0 });
    expect(r).toMatchObject({
      totalVendesCents: 2390, tiquets: 3, tiquetMitjaCents: 797, devolucions: 1, devolucionsCents: 200,
      anullacions: { nombre: 1, importCents: 200 }, descomptesCents: 100, convidadesCents: 200,
      entradesCents: 2000, eixidesCents: 1500, comandesObertes: 1, obertesCents: 130
    });
    /* 10000 + 1890 − 200 + 2000 − 1500 */
    expect(r.efectiuEsperatCents).toBe(12190);
    const cola = r.perProducte.find((p) => p.producteId === 'refresc-cola');
    expect(cola).toEqual({ producteId: 'refresc-cola', nom: 'Refresc de cola', categoriaId: 'refrescs', unitats: 1, importCents: 200, costCents: 60 });
    expect(r.perProducte.find((p) => p.producteId === 'calamars').costCents).toBeNull();
    expect(r.perCategoria.find((c) => c.categoriaId === 'refrescs')).toEqual({ categoriaId: 'refrescs', nom: 'Refrescs', unitats: 2, importCents: 300 });
  });

  test('la reposició de la nevera és neta de devolucions i només dels productes de nevera', () => {
    const { tiquets } = tornDeProva();
    expect(llistaReposicio(tiquets, CARTA)).toEqual([
      { producteId: 'aigua', nom: 'Aigua', unitats: 1 },
      { producteId: 'refresc-cola', nom: 'Refresc de cola', unitats: 1 }
    ]);
  });
});

describe('tancar el torn (invariant 7) i la nota de traspàs', () => {
  test('un torn amb comandes obertes sense traspàs no es tanca', () => {
    const { torn, tiquets, obertes } = tornDeProva();
    const resum = resumTorn(torn, tiquets, obertes);
    const senseObertes = notaDeTraspas({ torn, resum, obertes: [], ara: TANCAT });
    expect(() => tancaTorn(torn, { arqueig: { perDenominacio: { 5000: 2 } }, resum, traspas: senseObertes, obertes, ara: TANCAT }))
      .toThrow(expect.objectContaining({ codi: 'OBERTES_SENSE_TRASPAS' }));
  });

  test('amb el traspàs complet es tanca congelat, amb la diferència de caixa i les incidències soles', () => {
    const { torn, tiquets, obertes } = tornDeProva();
    const resum = resumTorn(torn, tiquets, obertes);
    const perDenominacio = { 5000: 2, 2000: 1, 200: 1, 10: 1 };
    const comptat = arqueig(perDenominacio);
    const nota = notaDeTraspas({
      torn, resum, obertes, reposicio: llistaReposicio(tiquets, CARTA), avisos: ['  Falta gel ', '', 'Canviar el barril'],
      fonsDeixatCents: 10000, diferenciaCaixaCents: comptat - resum.efectiuEsperatCents, per: 'Cambrer 1', ara: TANCAT
    });
    expect(nota.avisos).toEqual(['Falta gel', 'Canviar el barril']);
    expect(nota.comandesObertes).toEqual([{ id: obertes[0].id, origen: { tipus: 'taula', taulaId: 't2' }, totalCents: 130 }]);
    expect(nota.incidencies.map((i) => i.tipus)).toEqual(['diferencia-caixa', 'anullacions', 'devolucions', 'convidades']);
    expect(nota.incidencies[0]).toEqual({ tipus: 'diferencia-caixa', detall: 'Sobren 0,20 € al calaix', importCents: 20 });
    const tancat = tancaTorn(torn, { arqueig: { perDenominacio }, resum, traspas: nota, obertes, per: 'Cambrer 1', ara: TANCAT });
    expect(tancat).toMatchObject({ estat: 'tancat', tancatA: TANCAT, diferenciaCaixaCents: 20, arqueig: { totalCents: 12210 } });
    expect(Object.isFrozen(tancat.resum.perProducte[0])).toBe(true);
    expect(() => tancaTorn(tancat, { arqueig: { perDenominacio }, resum, traspas: nota, obertes, ara: TANCAT })).toThrow(expect.objectContaining({ codi: 'TORN_TANCAT' }));
  });

  test('una comanda oberta amb pagaments no passa de torn', () => {
    const { torn, obertes } = tornDeProva();
    const pagada = afegeixPagament(obertes[0], { metode: 'efectiu', importCents: 100 }, { id: 'p-x', ara: ARA });
    expect(() => notaDeTraspas({ torn, resum: resumTorn(torn), obertes: [pagada], ara: TANCAT })).toThrow(expect.objectContaining({ codi: 'OBERTA_AMB_PAGAMENTS' }));
  });

  test('la nota fa el viatge d’anada i tornada per JSON i passa validaTraspas', () => {
    const { torn, tiquets, obertes } = tornDeProva();
    const nota = notaDeTraspas({ torn, resum: resumTorn(torn, tiquets, obertes), obertes, reposicio: llistaReposicio(tiquets, CARTA), avisos: ['Falta gel'], ara: TANCAT });
    const tornada = JSON.parse(JSON.stringify(nota));
    expect(tornada).toEqual(nota);
    expect(validaTraspas(tornada)).toEqual({ ok: true, errors: [] });
    expect(validaTraspas(marcaLlegida(tornada, { per: 'Cambrera 2', ara: TANCAT })).ok).toBe(true);
    expect(Object.keys(nota)).toEqual(['schema', 'tornId', 'tancatA', 'de', 'fonsDeixatCents', 'comandesObertes', 'incidencies', 'reposicio', 'avisos', 'llegidaPer', 'llegidaA']);
  });

  test('validaTraspas rebutja claus de més, imports amb decimals i lectures a mitges', () => {
    const { torn } = tornDeProva();
    const nota = notaDeTraspas({ torn, resum: resumTorn(torn), ara: TANCAT });
    expect(validaTraspas({ ...nota, extra: 1 }).ok).toBe(false);
    expect(validaTraspas({ ...nota, fonsDeixatCents: 1.5 }).ok).toBe(false);
    expect(validaTraspas({ ...nota, llegidaPer: 'x' }).ok).toBe(false);
    expect(validaTraspas({ ...nota, schema: 'sdp.bar.traspas.v2' }).ok).toBe(false);
  });

  test('BAR-R3 · una anul·lació es compta una sola vegada, al torn on es fa, encara que la comanda passe de torn', () => {
    const DESPRES = '2026-10-02T16:00:00.000Z';
    const tornA = obriTorn({ id: 'torn-r3a', per: 'Cambrer 1', fonsInicialCents: 0, ara: OBERT });
    let c = marxa(afig(afig(comanda(tornA), 'olives'), 'cafe-sol'), { ara: ARA });
    c = anullaLinia(c, c.linies[0].id, { motiu: 'Se n’ha anat', ara: ARA });
    const resumA = resumTorn(tornA, [], [c]);
    expect(resumA.anullacions).toMatchObject({ nombre: 1, importCents: 200 });
    const notaA = notaDeTraspas({ torn: tornA, resum: resumA, obertes: [c], ara: TANCAT });
    expect(notaA.incidencies.map((i) => i.tipus)).toEqual(['anullacions']);
    const tancatA = tancaTorn(tornA, { arqueig: { perDenominacio: {} }, resum: resumA, traspas: notaA, obertes: [c], ara: TANCAT });
    /* La fulla «Anul·lacions» quadra amb la fila del Resum: porta la de la comanda que passa de torn. */
    const fullA = fullTancament(tancatA, [], { hora: () => '12:00' });
    const filaA = fullA.fulles[0].files.find((f) => f[0] === 'Anul·lacions');
    expect(filaA).toEqual(['Anul·lacions', 200, 1]);
    expect(fullA.fulles[3].files).toEqual([['12:00', 'Comanda oberta', 'Anul·lació', 'Olives', 1, 200, 'Se n’ha anat']]);

    /* El torn B l'adopta i la cobra: l'anul·lació ja era del torn A. */
    const tornB = obriTorn({ id: 'torn-r3b', per: 'Cambrera 2', fonsInicialCents: 0, ara: TANCAT, traspasAnterior: marcaLlegida(notaA, { per: 'Cambrera 2', ara: TANCAT }) });
    const tiquet = tanca(paga(adoptaComanda(c, tornB.id, { ara: TANCAT }), 'efectiu'), { numero: 1, ara: DESPRES });
    const resumB = resumTorn(tornB, [tiquet], []);
    expect(resumB.anullacions).toEqual({ nombre: 0, importCents: 0, detall: [] });
    expect(resumA.anullacions.nombre + resumB.anullacions.nombre).toBe(1);
    const notaB = notaDeTraspas({ torn: tornB, resum: resumB, ara: DESPRES });
    expect(notaB.incidencies).toEqual([]);
    const tancatB = tancaTorn(tornB, { arqueig: { perDenominacio: {} }, resum: resumB, traspas: notaB, ara: DESPRES });
    expect(fullTancament(tancatB, [tiquet], { hora: () => '16:00' }).fulles[3].files).toEqual([]);
  });

  test('aSentinella no inventa cap contracte: null fins que el T6 el publique', () => {
    const { torn } = tornDeProva();
    expect(aSentinella(notaDeTraspas({ torn, resum: resumTorn(torn), ara: TANCAT }))).toBeNull();
  });
});
