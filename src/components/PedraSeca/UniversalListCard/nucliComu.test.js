// @vitest-environment node
/* Fase E (261020, tasca 2; pla 261020_2045 «El Comú») · el nucli pur de la
   llista viva: les regles de cada mode, qui pot fer què, els comptes i la
   guarda anti-eco. Les persones són de mostra. */
import { describe, expect, test } from 'vitest';
import {
  IDS_MODES_COMU, MODES_COMU, aplicaAccio, elementsFiltrats, estatDElement, potVeure, resumDe, triaInstantania, validaLlista
} from './nucliComu.js';
import { LIMITS_COMU } from './basesComu.js';
import { comptesDe, preusDe } from './modes/loteriaDiposit.js';
import { souDe } from './modes/bandaEixida.js';
import { seguimentDe } from './modes/escolaEducand.js';

const ARA = '2026-10-20T19:00:00.000Z';
const ANNA = { id: 'u-anna', nom: 'Anna' };
const PAU = { id: 'u-pau', nom: 'Pau' };
const ROSA = { id: 'u-rosa', nom: 'Rosa' };

let comptador = 0;
function context(actor) {
  return { actor, ara: ARA, nouId: () => `id-${(comptador += 1)}` };
}
const llista = (mode, extra = {}) => ({ id: `l-${mode}`, mode, titol: 'Mostra', propietariId: ANNA.id, revisio: 0, elementsComu: [], ...extra });

/** Aplica una sèrie d'accions i torna la llista final; cada pas ha d'anar bé. */
function passos(inicial, ...accions) {
  return accions.reduce((l, [actor, accio]) => {
    const r = aplicaAccio(l, accio, context(actor));
    expect(r, JSON.stringify(accio)).toMatchObject({ ok: true });
    return r.llista;
  }, inicial);
}
const codiDe = (l, actor, accio) => aplicaAccio(l, accio, context(actor)).error?.codi ?? null;

describe('els sis modes canònics', () => {
  test('en l’ordre del pla i amb el contracte complet', () => {
    expect(IDS_MODES_COMU).toEqual(['rebost', 'bar_tpv', 'colla_cens', 'banda_eixida', 'loteria_diposit', 'escola_educand']);
    for (const [id, mode] of Object.entries(MODES_COMU)) {
      expect(mode.id).toBe(id);
      expect(['rajoles', 'files']).toContain(mode.forma);
      for (const f of ['potAfegir', 'potEliminar', 'estatDe', 'resum']) expect(typeof mode[f], `${id}.${f}`).toBe('function');
      expect(mode.columnes.length).toBeGreaterThan(3);
      expect(Object.isFrozen(mode)).toBe(true);
    }
  });
});

describe('validaLlista i aplicaAccio · cap entrada dolenta llança', () => {
  test('la forma neutra', () => {
    expect(validaLlista(llista('rebost'))).toEqual({ ok: true, errors: [] });
    expect(validaLlista(null).ok).toBe(false);
    expect(validaLlista({ ...llista('rebost'), mode: 'inventat' }).errors).toContain('mode');
    expect(validaLlista({ ...llista('rebost'), elementsComu: [{ id: 'a', nom: 'x', capaMode: {} }, { id: 'a', nom: 'y', capaMode: {} }] }).errors).toContain('element.id');
  });

  test('errors estables: llista, actor, acció i element', () => {
    expect(codiDe(null, ANNA, { tipus: 'afegeix' })).toBe('llista-invalida');
    expect(aplicaAccio(llista('rebost'), { tipus: 'afegeix', entrada: { text: 'Pa' } }, { ara: ARA, nouId: () => 'x' }).error.codi).toBe('no-autoritzat');
    expect(codiDe(llista('rebost'), ANNA, { tipus: 'vola' })).toBe('accio-desconeguda');
    expect(codiDe(llista('rebost'), ANNA, { tipus: 'commuta', elementId: 'no-hi-és' })).toBe('element-absent');
    expect(codiDe(llista('rebost'), ANNA, { tipus: 'afegeix', entrada: { text: '   ' } })).toBe('nom-buit');
    expect(codiDe(llista('rebost'), ANNA, { tipus: 'elimina', elementId: 'no-hi-és' })).toBe('element-absent');
  });

  test('cada acció bona puja la revisió i no muta l’entrada', () => {
    const inicial = Object.freeze(llista('rebost', { revisio: 7 }));
    const r = aplicaAccio(inicial, { tipus: 'afegeix', entrada: { text: 'Pa' } }, context(ANNA));
    expect(r.llista.revisio).toBe(8);
    expect(inicial.elementsComu).toEqual([]);
  });

  test('el límit d’elements', () => {
    const plena = llista('rebost', { elementsComu: Array.from({ length: LIMITS_COMU.elements }, (_, i) => ({ id: `e${i}`, nom: `Article ${i}`, capaMode: { estat: 'falta', especificacio: '', demanatPer: [] } })) });
    expect(codiDe(plena, ANNA, { tipus: 'afegeix', entrada: { text: 'Un més' } })).toBe('massa-elements');
  });
});

describe('Rebost · fusió, commutació, recents i comparador', () => {
  test('dues peticions del mateix article es fusionen i queden les dues persones', () => {
    const l = passos(llista('rebost'),
      [ANNA, { tipus: 'afegeix', entrada: { text: '2 kg de tomaca' } }],
      [PAU, { tipus: 'afegeix', entrada: { text: 'tomaca 1 kg' } }]);
    expect(l.elementsComu).toHaveLength(1);
    expect(l.elementsComu[0].capaMode).toMatchObject({ estat: 'falta', especificacio: '2 kg + 1 kg' });
    expect(l.elementsComu[0].capaMode.demanatPer.map((p) => [p.nom, p.especificacio])).toEqual([['Anna', '2 kg'], ['Pau', '1 kg']]);
  });

  test('un toc: al cistell (amb qui ho ha comprat i als recents), i un altre: torna a faltar sense quantitat', () => {
    let l = passos(llista('rebost'), [ANNA, { tipus: 'afegeix', entrada: { text: 'Ous 1 dotzena' } }]);
    const id = l.elementsComu[0].id;
    l = passos(l, [PAU, { tipus: 'commuta', elementId: id }]);
    expect(l.elementsComu[0].capaMode).toMatchObject({ estat: 'comprat', compratPer: { usuariId: PAU.id, nom: 'Pau' } });
    expect(l.recentsComu).toEqual([{ nom: 'Ous', especificacio: '1 dotzena', at: ARA }]);
    l = passos(l, [ANNA, { tipus: 'commuta', elementId: id }]);
    expect(l.elementsComu[0].capaMode).toMatchObject({ estat: 'falta', especificacio: '', compratPer: null });
  });

  test('tornar a demanar un article comprat és una compra neta; els recents no passen de 12 ni es repetixen', () => {
    let l = llista('rebost');
    for (let i = 0; i < 14; i += 1) {
      l = passos(l, [ANNA, { tipus: 'afegeix', entrada: { nom: `Article ${i}` } }]);
      l = passos(l, [ANNA, { tipus: 'commuta', elementId: l.elementsComu[i].id }]);
    }
    expect(l.recentsComu).toHaveLength(LIMITS_COMU.recents);
    expect(l.recentsComu[0].nom).toBe('Article 13');
    l = passos(l, [PAU, { tipus: 'afegeix', entrada: { text: '3 article 13' } }]);
    const e13 = l.elementsComu.find((e) => e.nom === 'Article 13');
    expect(e13.capaMode).toMatchObject({ estat: 'falta', especificacio: '3' });
    expect(e13.capaMode.demanatPer).toHaveLength(1);
  });

  test('buidar el cistell lleva els comprats; eliminar és de qui ho va demanar o de qui governa', () => {
    let l = passos(llista('rebost'),
      [PAU, { tipus: 'afegeix', entrada: { text: 'Pa' } }],
      [ROSA, { tipus: 'afegeix', entrada: { text: 'Llet' } }]);
    const [pa, llet] = l.elementsComu;
    expect(codiDe(l, ROSA, { tipus: 'elimina', elementId: pa.id })).toBe('no-autoritzat');
    l = passos(l, [ANNA, { tipus: 'elimina', elementId: pa.id }], [ROSA, { tipus: 'commuta', elementId: llet.id }], [PAU, { tipus: 'buidaCistell' }]);
    expect(l.elementsComu).toEqual([]);
    expect(l.recentsComu.map((r) => r.nom)).toEqual(['Llet']);
  });

  test('l’especificació escrita a mà, només mentre falta', () => {
    let l = passos(llista('rebost'), [ANNA, { tipus: 'afegeix', entrada: { text: 'Creïlles' } }]);
    const id = l.elementsComu[0].id;
    l = passos(l, [PAU, { tipus: 'especifica', elementId: id, especificacio: '  3   kg ' }]);
    expect(l.elementsComu[0].capaMode.especificacio).toBe('3 kg');
    l = passos(l, [PAU, { tipus: 'commuta', elementId: id }]);
    expect(codiDe(l, PAU, { tipus: 'especifica', elementId: id, especificacio: '1 kg' })).toBe('valor-invalid');
  });

  test('el comparador Poble · Gran superfície, amb el desplaçament', () => {
    let l = llista('rebost', { configMode: { costDesplacamentCents: 760 } });
    l = passos(l,
      [ANNA, { tipus: 'afegeix', entrada: { nom: 'Tomaca', especificacio: '3 kg', preuPobleCents: 250, preuGranSuperficieCents: 295, unitatPreu: 'kg' } }],
      [ANNA, { tipus: 'afegeix', entrada: { nom: 'Ous', especificacio: '1 dotzena', preuPobleCents: 30, preuGranSuperficieCents: 25, unitatPreu: 'u' } }],
      [ANNA, { tipus: 'afegeix', entrada: { nom: 'Oli', especificacio: '1 l', preuPobleCents: 800, preuGranSuperficieCents: 700, unitatPreu: 'kg' } }]);
    expect(resumDe(l).comparador).toEqual({
      articles: 2, sensePreu: 1, pobleCents: 750 + 360, granCents: 885 + 300, desplacamentCents: 760,
      totalGranCents: 885 + 300 + 760, estalviCents: 885 + 300 + 760 - (750 + 360)
    });
    expect(resumDe(llista('rebost')).comparador).toBeNull();
  });
});

describe('Bar · TPV · cada qui és amo del que demana', () => {
  const bar = () => llista('bar_tpv', { configMode: { carta: [{ nom: 'Cafè sol', preuCents: 110 }, { nom: 'Torrada', preuCents: 250, desti: 'cuina' }] } });

  test('la carta posa el preu i el destí; la mateixa persona suma, una altra fa línia pròpia', () => {
    const l = passos(bar(),
      [PAU, { tipus: 'afegeix', entrada: { text: '2 cafè sol' } }],
      [PAU, { tipus: 'afegeix', entrada: { text: 'Cafè sol' } }],
      [ROSA, { tipus: 'afegeix', entrada: { text: 'Cafè sol' } }],
      [ROSA, { tipus: 'afegeix', entrada: { text: 'Torrada' } }]);
    expect(l.elementsComu.map((e) => [e.nom, e.capaMode.quantitat, e.capaMode.demanatPer.nom, e.capaMode.desti])).toEqual([
      ['Cafè sol', 3, 'Pau', 'barra'], ['Cafè sol', 1, 'Rosa', 'barra'], ['Torrada', 1, 'Rosa', 'cuina']
    ]);
    expect(resumDe(l)).toMatchObject({ linies: 3, unitats: 5, totalCents: 4 * 110 + 250, perServir: 3, perServirCuina: 1, sensePreu: 0 });
  });

  test('servir i cobrar és de qui governa; menys d’una unitat anul·la la línia', () => {
    let l = passos(bar(), [PAU, { tipus: 'afegeix', entrada: { text: 'Cafè sol' } }]);
    const id = l.elementsComu[0].id;
    expect(codiDe(l, PAU, { tipus: 'avanca', elementId: id })).toBe('no-autoritzat');
    expect(codiDe(l, ROSA, { tipus: 'quantitat', elementId: id, delta: 1 })).toBe('no-autoritzat');
    expect(codiDe(l, PAU, { tipus: 'quantitat', elementId: id, delta: 5 })).toBe('valor-invalid');
    const anullada = passos(l, [PAU, { tipus: 'quantitat', elementId: id, delta: -1 }]);
    expect(anullada.elementsComu[0].capaMode.estat).toBe('anullat');
    expect(elementsFiltrats(anullada, 'tots')).toEqual([]);
    l = passos(l, [ANNA, { tipus: 'avanca', elementId: id }]);
    expect(codiDe(l, PAU, { tipus: 'anula', elementId: id })).toBe('valor-invalid');
    l = passos(l, [ANNA, { tipus: 'avanca', elementId: id }]);
    expect(l.elementsComu[0].capaMode.estat).toBe('cobrat');
    expect(codiDe(l, ANNA, { tipus: 'avanca', elementId: id })).toBe('valor-invalid');
    expect(resumDe(l)).toMatchObject({ progres: { fets: 1, total: 1 }, pendentCobrarCents: 0 });
  });
});

describe('Colla · Cens · l’intercanvi atòmic i l’alliberament amb autoria', () => {
  const cens = (extra) => passos(llista('colla_cens', extra),
    [ANNA, { tipus: 'afegeix', entrada: { nom: 'Druida', faccio: 'Poblat' } }],
    [ANNA, { tipus: 'afegeix', entrada: { text: 'Soldat x3' } }]);

  test('afegir rols és de qui governa; «x3» fa tres places', () => {
    expect(codiDe(llista('colla_cens'), PAU, { tipus: 'afegeix', entrada: { nom: 'Ferrer' } })).toBe('no-autoritzat');
    const l = cens();
    expect(l.elementsComu.map((e) => [e.nom, e.capaMode.quota])).toEqual([['Druida', 1], ['Soldat', 3]]);
  });

  test('un lloc, una persona: el segon que arriba troba «ple»; ningú no reclama dues vegades ni dos rols', () => {
    let l = cens();
    const [druida, soldat] = l.elementsComu;
    l = passos(l, [PAU, { tipus: 'reclama', elementId: druida.id }]);
    expect(codiDe(l, ROSA, { tipus: 'reclama', elementId: druida.id })).toBe('ple');
    expect(codiDe(l, PAU, { tipus: 'reclama', elementId: druida.id })).toBe('ja-reclamat');
    expect(codiDe(l, PAU, { tipus: 'reclama', elementId: soldat.id })).toBe('ja-en-tens');
    expect(estatDElement(l, l.elementsComu[0])).toBe('agafat');
    expect(resumDe(l, PAU)).toMatchObject({ places: 4, ocupades: 1, lliures: 3, meus: [druida.id] });
  });

  test('amb permetMultiReclam, una persona en pot tindre més d’un', () => {
    let l = cens({ configMode: { permetMultiReclam: true } });
    l = passos(l, [PAU, { tipus: 'reclama', elementId: l.elementsComu[0].id }], [PAU, { tipus: 'reclama', elementId: l.elementsComu[1].id }]);
    expect(resumDe(l, PAU).meus).toHaveLength(2);
  });

  test('alliberar el lloc d’una altra persona: mai, si no governes la llista (la vulnerabilitat de la Vila Gal·la)', () => {
    let l = cens();
    const druida = l.elementsComu[0];
    l = passos(l, [PAU, { tipus: 'reclama', elementId: druida.id }]);
    expect(codiDe(l, ROSA, { tipus: 'allibera', elementId: druida.id, usuariId: PAU.id })).toBe('no-autoritzat');
    expect(codiDe(l, ROSA, { tipus: 'allibera', elementId: druida.id })).toBe('valor-invalid');
    const perAnna = passos(l, [ANNA, { tipus: 'allibera', elementId: druida.id, usuariId: PAU.id }]);
    expect(perAnna.elementsComu[0].capaMode.adjudicacions).toEqual([]);
    const perPau = passos(l, [PAU, { tipus: 'allibera', elementId: druida.id }]);
    expect(perPau.elementsComu[0].capaMode.adjudicacions).toEqual([]);
  });
});

describe('Banda · Eixida · cadascú respon per ell; la junta paga i veu els comptes', () => {
  const config = {
    volen: 3, codiActe: 3, necessitats: { trompa: 2 }, suplementCotxeCents: 1000, pressupostatCents: 20000,
    tarifesCents: { plantilla_nivell_1: { 3: 5000 }, contractat: { 3: 6000 } }
  };
  const banda = () => passos(llista('banda_eixida', { configMode: config }),
    [ANNA, { tipus: 'afegeix', entrada: { nom: 'Pau', corda: 'trompa', usuariId: PAU.id } }],
    [ANNA, { tipus: 'afegeix', entrada: { text: 'Reforç, bombardino' } }],
    [ANNA, { tipus: 'afegeix', entrada: { nom: 'Rosa', corda: 'trompa', usuariId: ROSA.id, vinculacio: 'contractat' } }]);

  test('el músic confirma, es dona de baixa i posa cotxe; un altre no ho pot fer per ell', () => {
    let l = banda();
    const [pau] = l.elementsComu;
    expect(codiDe(l, ROSA, { tipus: 'confirma', elementId: pau.id })).toBe('no-autoritzat');
    l = passos(l, [PAU, { tipus: 'confirma', elementId: pau.id }], [PAU, { tipus: 'cotxe', elementId: pau.id }]);
    expect(l.elementsComu[0].capaMode).toMatchObject({ assistencia: 'confirmat', posaCotxe: true, places: 4 });
    expect(codiDe(l, PAU, { tipus: 'paga', elementId: pau.id })).toBe('no-autoritzat');
    expect(codiDe(l, PAU, { tipus: 'cotxe', elementId: pau.id, posaCotxe: true, places: 12 })).toBe('valor-invalid');
  });

  test('Volen · Anem · Cotxes, el que falta per corda i la capa econòmica', () => {
    let l = banda();
    const [pau, reforc, rosa] = l.elementsComu;
    l = passos(l, [PAU, { tipus: 'confirma', elementId: pau.id }], [PAU, { tipus: 'cotxe', elementId: pau.id }],
      [ANNA, { tipus: 'confirma', elementId: reforc.id }], [ROSA, { tipus: 'baixa', elementId: rosa.id }],
      [ANNA, { tipus: 'paga', elementId: pau.id }]);
    expect(souDe(l.elementsComu[0], config)).toBe(5000);
    expect(souDe(l.elementsComu[2], config)).toBe(6000);
    expect(resumDe(l)).toMatchObject({
      volen: 3, anem: 2, baixes: 1, cotxes: 1, places: 4, falten: [{ corda: 'trompa', falten: 1 }],
      economia: { subtotalMusicsCents: 10000, totalCotxesCents: 1000, totalActeCents: 11000, pressupostatCents: 20000, fonsCents: 9000, pagats: 1 }
    });
  });
});

describe('Loteria · Dipòsit · les quatre signatures i els comptes en cèntims', () => {
  const loteria = () => passos(llista('loteria_diposit'),
    [ANNA, { tipus: 'afegeix', entrada: { text: 'Bar de la Plaça 20' } }],
    [ANNA, { tipus: 'afegeix', entrada: { nom: 'Forn', format: 'paperetes', entregats: 50, depositariUsuariId: PAU.id } }]);

  test('els preus de venda: 20 € + 15 % i 2,40 € + 25 %', () => {
    expect(preusDe('decims', {})).toEqual({ facialCents: 2000, vendaCents: 2300 });
    expect(preusDe('paperetes', {})).toEqual({ facialCents: 240, vendaCents: 300 });
    const l = loteria();
    expect(comptesDe({ capaMode: { format: 'decims', entregats: 20, retornats: 3 } }, l.configMode))
      .toEqual({ venuts: 17, facialVenutCents: 34000, totalLiquidarCents: 39100, beneficiCents: 5100 });
  });

  test('primer l’entrega i després la liquidació; i amb la liquidació començada, ni retorns ni desfer l’entrega', () => {
    let l = loteria();
    const bar = l.elementsComu[0];
    expect(codiDe(l, ANNA, { tipus: 'signa', elementId: bar.id, signatura: 'liquidacioSocietat' })).toBe('ordre-signatures');
    l = passos(l, [ANNA, { tipus: 'retorna', elementId: bar.id, retornats: 3 }],
      [ANNA, { tipus: 'signa', elementId: bar.id, signatura: 'entregaDepositari' }],
      [ANNA, { tipus: 'signa', elementId: bar.id, signatura: 'entregaSocietat' }],
      [ANNA, { tipus: 'signa', elementId: bar.id, signatura: 'liquidacioDepositari' }]);
    expect(codiDe(l, ANNA, { tipus: 'retorna', elementId: bar.id, retornats: 0 })).toBe('ordre-signatures');
    expect(codiDe(l, ANNA, { tipus: 'signa', elementId: bar.id, signatura: 'entregaSocietat' })).toBe('ordre-signatures');
    l = passos(l, [ANNA, { tipus: 'signa', elementId: bar.id, signatura: 'liquidacioSocietat' }]);
    expect(estatDElement(l, l.elementsComu[0])).toBe('liquidat');
    expect(codiDe(l, ANNA, { tipus: 'elimina', elementId: bar.id })).toBe('no-autoritzat');
  });

  test('la signatura del depositari amb compte és seua; la de la societat, de la junta', () => {
    const l = loteria();
    const forn = l.elementsComu[1];
    expect(codiDe(l, ANNA, { tipus: 'signa', elementId: forn.id, signatura: 'entregaDepositari' })).toBe('no-autoritzat');
    expect(codiDe(l, PAU, { tipus: 'signa', elementId: forn.id, signatura: 'entregaSocietat' })).toBe('no-autoritzat');
    expect(codiDe(l, ROSA, { tipus: 'retorna', elementId: forn.id, retornats: 2 })).toBe('no-autoritzat');
    expect(codiDe(l, PAU, { tipus: 'retorna', elementId: forn.id, retornats: 51 })).toBe('valor-invalid');
    const signada = passos(l, [PAU, { tipus: 'signa', elementId: forn.id, signatura: 'entregaDepositari' }], [PAU, { tipus: 'retorna', elementId: forn.id, retornats: 2 }]);
    expect(resumDe(signada)).toMatchObject({ diposits: 2, entregats: 70, venuts: 20 + 48, decimsAReservar: Math.ceil((48 * 240) / 2000) });
  });
});

describe('Escola · Educand · privada, formativa i amb diàleg de tutoria', () => {
  const fitxa = () => passos(llista('escola_educand', { configMode: { families: [PAU.id] } }),
    [ANNA, { tipus: 'afegeix', entrada: { text: 'Solfeig, Professorat de mostra' } }]);

  test('només la veuen el professorat i la família', () => {
    const l = fitxa();
    expect(potVeure(l, ANNA)).toBe(true);
    expect(potVeure(l, PAU)).toBe(true);
    expect(potVeure(l, ROSA)).toBe(false);
    expect(potVeure(l, null)).toBe(false);
    expect(codiDe(l, ROSA, { tipus: 'comenta', elementId: l.elementsComu[0].id, text: 'Hola' })).toBe('no-autoritzat');
    expect(potVeure(llista('rebost'), null)).toBe(true);
  });

  test('anotar i qualificar és del professorat; comentar, també de la família', () => {
    let l = fitxa();
    const id = l.elementsComu[0].id;
    expect(l.elementsComu[0].capaMode.professor).toBe('Professorat de mostra');
    expect(codiDe(l, PAU, { tipus: 'anota', elementId: id, mes: 'setembre', setmana: 0, valor: 'E' })).toBe('no-autoritzat');
    expect(codiDe(l, ANNA, { tipus: 'anota', elementId: id, mes: 'setembre', setmana: 5, valor: 'E' })).toBe('valor-invalid');
    expect(codiDe(l, ANNA, { tipus: 'anota', elementId: id, mes: 'setembre', setmana: 0, valor: 'Z' })).toBe('valor-invalid');
    expect(codiDe(l, ANNA, { tipus: 'qualifica', elementId: id, mes: 'setembre', nota: 11 })).toBe('valor-invalid');
    l = passos(l,
      [ANNA, { tipus: 'anota', elementId: id, mes: 'setembre', setmana: 0, valor: 'E' }],
      [ANNA, { tipus: 'anota', elementId: id, mes: 'setembre', setmana: 1, valor: 'B' }],
      [ANNA, { tipus: 'qualifica', elementId: id, mes: 'setembre', nota: 6 }],
      [ANNA, { tipus: 'qualifica', elementId: id, mes: 'desembre', nota: 8.25 }],
      [PAU, { tipus: 'comenta', elementId: id, text: 'Practica a casa.' }],
      [ANNA, { tipus: 'comenta', elementId: id, text: 'Bona lectura rítmica.' }]);
    const s = seguimentDe(l.elementsComu[0]);
    expect(s.recompte).toEqual({ E: 1, B: 1, R: 0, M: 0, X: 0 });
    expect(s.notes.filter((n) => n !== null)).toEqual([6, 8.3]);
    expect(s.mitjana).toBe(7.2);
    expect(l.elementsComu[0].capaMode.dialeg.map((d) => [d.rol, d.nom])).toEqual([['familia', 'Pau'], ['professor', 'Anna']]);
    expect(resumDe(l)).toEqual({ progres: null, assignatures: 1, mitjana: 7.2 });
  });
});

describe('triaInstantania · la guarda anti-eco i de revisions', () => {
  const amb = (revisio, darrerClientInstanceId) => ({ ...llista('rebost'), revisio, darrerClientInstanceId });

  test('una instantània vella no mana; el ressò del propi toc, tampoc; la d’un altre, sí', () => {
    const actual = amb(5, 'jo');
    expect(triaInstantania(actual, amb(4, 'altre'), { clientInstanceId: 'jo' })).toBe(actual);
    expect(triaInstantania(actual, amb(5, 'jo'), { clientInstanceId: 'jo' })).toBe(actual);
    expect(triaInstantania(actual, amb(5, 'altre'), { clientInstanceId: 'jo' }).darrerClientInstanceId).toBe('altre');
    expect(triaInstantania(actual, amb(6, 'jo'), { clientInstanceId: 'jo' }).revisio).toBe(6);
    expect(triaInstantania(actual, { mode: 'res' }, { clientInstanceId: 'jo' })).toBe(actual);
    expect(triaInstantania(null, amb(1, 'altre')).revisio).toBe(1);
  });
});

describe('revisió adversarial 261020 · regressions del nucli', () => {
  test('cap id intern com a nom públic: sense nom, la signatura porta el nom buit', () => {
    const anonim = { id: '6f1c2a9e-1111-4c2b-9d1e-aaaaaaaaaaaa', nom: '' };
    const l = passos(llista('rebost'), [anonim, { tipus: 'afegeix', entrada: { text: 'Pa' } }]);
    expect(l.elementsComu[0].capaMode.demanatPer[0]).toMatchObject({ usuariId: anonim.id, nom: '' });
    expect(JSON.stringify(l.elementsComu[0].capaMode.demanatPer.map((p) => p.nom))).not.toContain(anonim.id);
  });

  test('una capa amb forma estranya torna «valor-invalid», mai una excepció', () => {
    const rara = llista('rebost', { elementsComu: [{ id: 'x', nom: 'Pa', capaMode: { estat: 'falta', demanatPer: {} } }] });
    expect(codiDe(rara, ANNA, { tipus: 'afegeix', entrada: { text: 'Pa' } })).toBe('valor-invalid');
    const escola = llista('escola_educand', { elementsComu: [{ id: 'e', nom: 'Solfeig', capaMode: { mesos: [{ mes: 'setembre' }] } }] });
    expect(() => aplicaAccio(escola, { tipus: 'anota', elementId: 'e', mes: 'setembre', setmana: 0, valor: 'E' }, context(ANNA))).not.toThrow();
  });

  test('Bar: el preu és el de la carta; fora de la carta, només el posa qui governa', () => {
    const bar = llista('bar_tpv', { configMode: { carta: [{ nom: 'Cervesa', preuCents: 250 }] } });
    const l = passos(bar,
      [PAU, { tipus: 'afegeix', entrada: { nom: 'Cervesa', preuCents: 0 } }],
      [PAU, { tipus: 'afegeix', entrada: { nom: 'Pastís', preuCents: 1 } }],
      [ANNA, { tipus: 'afegeix', entrada: { nom: 'Pastís', preuCents: 300 } }]);
    expect(l.elementsComu.map((e) => [e.nom, e.capaMode.preuCents])).toEqual([['Cervesa', 250], ['Pastís', null], ['Pastís', 300]]);
  });

  test('Banda: un músic pagat no es dona de baixa fins que la junta desfà el pagament', () => {
    let l = passos(llista('banda_eixida', { configMode: { codiActe: 1, tarifesCents: { plantilla_nivell_1: { 1: 5000 } }, pressupostatCents: 20000 } }),
      [ANNA, { tipus: 'afegeix', entrada: { nom: 'Pau', corda: 'trompa', usuariId: PAU.id } }]);
    const id = l.elementsComu[0].id;
    l = passos(l, [PAU, { tipus: 'confirma', elementId: id }], [ANNA, { tipus: 'paga', elementId: id }]);
    expect(codiDe(l, PAU, { tipus: 'baixa', elementId: id })).toBe('valor-invalid');
    expect(resumDe(l).economia).toMatchObject({ subtotalMusicsCents: 5000, fonsCents: 15000, pagats: 1 });
    l = passos(l, [ANNA, { tipus: 'paga', elementId: id }], [PAU, { tipus: 'baixa', elementId: id }]);
    expect(l.elementsComu[0].capaMode).toMatchObject({ assistencia: 'baixa', pagament: 'pendent' });
  });

  test('Escola: anotar un mes que la capa encara no portava també es guarda, en l’ordre del curs', () => {
    const parcial = llista('escola_educand', { elementsComu: [{ id: 'e', nom: 'Solfeig', capaMode: { mesos: [{ mes: 'setembre', setmanes: [null, null, null, null, null], nota: 6 }], dialeg: [] } }] });
    const l = passos(parcial, [ANNA, { tipus: 'anota', elementId: 'e', mes: 'gener', setmana: 0, valor: 'B' }], [ANNA, { tipus: 'qualifica', elementId: 'e', mes: 'gener', nota: 7 }]);
    const s = seguimentDe(l.elementsComu[0]);
    expect(s.recompte.B).toBe(1);
    expect(s.notes).toEqual([6, null, null, null, 7, null, null, null, null, null, null, null]);
  });

  test('Rebost: sense cap quantitat comparable, cap comparador (ni un estalvi inventat)', () => {
    const l = passos(llista('rebost', { configMode: { costDesplacamentCents: 760 } }),
      [ANNA, { tipus: 'afegeix', entrada: { nom: 'Oli', especificacio: '1 l', preuPobleCents: 800, preuGranSuperficieCents: 700, unitatPreu: 'kg' } }]);
    expect(resumDe(l).comparador).toBeNull();
  });
});
