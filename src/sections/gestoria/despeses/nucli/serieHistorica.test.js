// @vitest-environment node
/* Despeses · la sèrie històrica (Onada 6, ordre del Mestre, 261009): mes,
   trimestre i any sense duplicar els trams solapats, cap xifra on no hi ha
   extractes, la despesa en IA neta per proveïdor amb els dòlars del registre
   24, els traspassos a part i els indicadors del director financer. Lectures
   reduïdes sintètiques, com les torna el tractor. Ordre del Mestre,
   13-10-2026 (pla 261013_1405, front I; auditoria de Codex 261013_1510,
   GES-A2): dos comptes de la mateixa entitat acabats igual són dos comptes,
   també passant pel lector i el reductor de veres. */
import { describe, expect, test } from 'vitest';
import { llegeixC43 } from '../../nucli/c43.js';
import { reduixC43 } from '../../tauler/nucli/tractorTauler.js';
import {
  CODIS_SERIE, DIES_TRASPAS, MESOS_INDICADORS, SENSE_PROVEIDOR, comptesHistoric, indicadors, rangPerDefecte, serieHistorica
} from './serieHistorica.js';

const d = (iso) => ({ a: Number(iso.slice(0, 4)), m: Number(iso.slice(5, 7)), d: Number(iso.slice(8, 10)) });
let comptador = 0;
function mov(iso, centims, categoria, proveidor = null, extra = {}) {
  comptador += 1;
  return {
    dataOperacio: d(iso), dataValor: d(iso), centims, conceptComu: '99', id: `m${String(comptador).padStart(8, '0')}`,
    categoria, proveidor, confianca: 'mitjana', motiu: 'TEXT', ...extra
  };
}
function extracte({ desde, fins, moviments, saldoInicial = 1000000, divisa = 'EUR', compte4 = '4321', entitat = '9999' }) {
  const saldoFinal = moviments.reduce((t, m) => t + m.centims, saldoInicial);
  return {
    lectura: {
      comptes: [{
        capcalera: { entitat, compte4, dataInicial: d(desde), dataFinal: d(fins), saldoInicial, divisa },
        moviments, peu: { saldoFinal }
      }],
      avisos: []
    }
  };
}

const T1 = extracte({
  desde: '2025-01-01', fins: '2025-03-31', moviments: [
    mov('2025-01-05', -2000, 'ia', 'anthropic', { divisa: { moneda: 'USD', centims: -2200 } }),
    mov('2025-01-10', 300000, 'clients'),
    mov('2025-01-31', -29400, 'reta'),
    mov('2025-02-05', -2000, 'ia', 'anthropic', { divisa: { moneda: 'USD', centims: -2200 } }),
    mov('2025-02-06', -150, 'comissions', 'anthropic'),
    mov('2025-02-20', -100000, 'traspas'),
    mov('2025-03-05', -2400, 'ia', 'openai'),
    mov('2025-03-15', 500, 'ia', 'openai')
  ]
});
/* El segon extracte del mateix compte se solapa amb el primer tot el mes de març. */
const SOLAPAT = extracte({
  desde: '2025-03-01', fins: '2025-04-30', saldoInicial: 1166450, moviments: [
    { ...T1.lectura.comptes[0].moviments[6] },
    { ...T1.lectura.comptes[0].moviments[7] },
    mov('2025-04-02', -2000, 'ia', 'anthropic'),
    mov('2025-04-03', -1200, 'revisa', 'google', { confianca: 'baixa' }),
    mov('2025-04-20', 250000, 'clients')
  ]
});
const LECTURA = { extractes: [T1, SOLAPAT], csv: [] };
const RANG = { inici: d('2025-01-01'), fi: d('2025-06-30') };

describe('el rang per defecte', () => {
  test('de l’1 de gener de l’any passat al final del trimestre passat', () => {
    expect(rangPerDefecte(d('2026-10-09'))).toEqual({ inici: d('2025-01-01'), fi: d('2026-09-30') });
    expect(rangPerDefecte(d('2026-02-10'))).toEqual({ inici: d('2025-01-01'), fi: d('2025-12-31') });
    expect(rangPerDefecte(d('2026-04-01'))).toEqual({ inici: d('2025-01-01'), fi: d('2026-03-31') });
    expect(rangPerDefecte(null)).toBeNull();
  });
});

describe('la sèrie', () => {
  const serie = serieHistorica({ lectura: LECTURA, rang: RANG });

  test('els trams solapats no dupliquen res, i ho diu un avís', () => {
    expect(serie.moviments).toHaveLength(11);
    expect(serie.avisos.map((a) => a.codi)).toEqual(['EXTRACTES_SOLAPATS']);
    expect(CODIS_SERIE).toContain('EXTRACTES_SOLAPATS');
  });

  test('per mes: les xifres, i cap xifra on no hi ha extractes (mai 0,00 €)', () => {
    expect(serie.mesos.map((m) => [m.clau, m.cobertura, m.entrades, m.eixides])).toEqual([
      ['2025-01', 'completa', 300000, 31400],
      ['2025-02', 'completa', 0, 2150],
      ['2025-03', 'completa', 500, 2400],
      ['2025-04', 'completa', 250000, 3200],
      ['2025-05', 'cap', null, null],
      ['2025-06', 'cap', null, null]
    ]);
    expect(serie.mesos[4]).toMatchObject({ net: null, ia: null, moviments: 0 });
    expect(serie.mesos[1].traspassos).toEqual({ entrades: 0, eixides: 100000 });
  });

  test('per trimestre i any: un trimestre cobert en part diu «parcial»', () => {
    expect(serie.trimestres.map((t) => [t.clau, t.cobertura, t.entrades, t.eixides, t.net])).toEqual([
      ['2025-T1', 'completa', 300500, 35950, 264550],
      ['2025-T2', 'parcial', 250000, 3200, 246800]
    ]);
    expect(serie.anys.map((a) => [a.clau, a.cobertura, a.net])).toEqual([['2025', 'parcial', 511350]]);
    expect(serie.trimestres[0]).toMatchObject({ any: 2025, t: 1, inici: d('2025-01-01'), fi: d('2025-03-31') });
  });

  test('la despesa en IA: neta, per proveïdor, amb els dòlars del registre 24 i les comissions de divisa a part', () => {
    expect(serie.ia).toMatchObject({ net: 7900, usd: 4400, comissionsDivisa: 150 });
    expect(serie.ia.perProveidor.map((p) => [p.clau, p.net, p.usd, p.moviments, p.tractament])).toEqual([
      ['anthropic', 6000, 4400, 3, 'isp-intracomunitari'],
      ['openai', 1900, 0, 2, 'isp-intracomunitari']
    ]);
    expect(serie.totals.eixides).toBe(31400 + 2150 + 2400 + 3200);
    expect(serie.ia.percentatge).toBe(Math.round((7900 / 39150) * 1000) / 10);
    expect(serie.mesos[2].ia.perProveidor.openai).toEqual({ entrades: 500, eixides: 2400, usd: 0, moviments: 2, net: 1900 });
    expect(serie.totals.perCategoria.ia).toEqual({ entrades: 500, eixides: 8400, moviments: 5 });
  });

  test('la caixa: el saldo final del compte, a la darrera data dels extractes', () => {
    expect(serie.caixa).toEqual({ saldo: 1166450 - 2400 + 500 - 2000 - 1200 + 250000, fins: d('2025-04-30'), completa: true });
    expect(serie.comptes).toEqual([{ n: 1, entitat: '9999', compte4: '4321', desde: d('2025-01-01'), fins: d('2025-04-30'), saldo: 1411350 }]);
  });

  test('l’eixida només porta els camps de la llista blanca, congelats', () => {
    for (const m of serie.moviments) {
      expect(Object.keys(m).sort()).toEqual(['categoria', 'centims', 'compte', 'confianca', 'data', 'dataValor', 'divisa', 'id', 'motiu', 'proveidor']);
      expect(Object.isFrozen(m)).toBe(true);
    }
    expect(serie.perRevisar).toBe(1);
  });

  test('una reclassificació per id canvia la categoria, i la IA la compta', () => {
    const google = serie.moviments.find((m) => m.proveidor === 'google');
    const canviada = serieHistorica({ lectura: LECTURA, rang: RANG, reclassificacions: { [google.id]: { categoria: 'ia', proveidor: 'google-gemini' } } });
    expect(canviada.moviments.find((m) => m.id === google.id)).toMatchObject({ categoria: 'ia', proveidor: 'google-gemini', confianca: 'alta', motiu: 'RECLASSIFICAT' });
    expect(canviada.ia.net).toBe(7900 + 1200);
    expect(canviada.perRevisar).toBe(0);
    const senseProveidor = serieHistorica({ lectura: LECTURA, rang: RANG, reclassificacions: { [google.id]: { categoria: 'ia', proveidor: null } } });
    expect(senseProveidor.ia.perProveidor.map((p) => p.clau)).toContain(SENSE_PROVEIDOR);
  });
});

describe('la cobertura, extracte a extracte i compte a compte', () => {
  test('un forat entre dos extractes del mateix compte: els seus mesos no tenen xifra (mai 0,00 €) i un avís diu les dates', () => {
    const t1 = extracte({ desde: '2025-01-01', fins: '2025-03-31', moviments: [mov('2025-02-10', -1000, 'altres')] });
    const t3 = extracte({ desde: '2025-07-01', fins: '2025-09-30', moviments: [mov('2025-08-10', -2000, 'altres')] });
    const serie = serieHistorica({ lectura: { extractes: [t3, t1] }, rang: { inici: d('2025-01-01'), fi: d('2025-09-30') } });
    expect(serie.mesos.map((m) => [m.clau, m.cobertura, m.eixides])).toEqual([
      ['2025-01', 'completa', 0], ['2025-02', 'completa', 1000], ['2025-03', 'completa', 0],
      ['2025-04', 'cap', null], ['2025-05', 'cap', null], ['2025-06', 'cap', null],
      ['2025-07', 'completa', 0], ['2025-08', 'completa', 2000], ['2025-09', 'completa', 0]
    ]);
    expect(serie.trimestres.map((t) => [t.clau, t.cobertura, t.eixides])).toEqual([['2025-T1', 'completa', 1000], ['2025-T2', 'cap', null], ['2025-T3', 'completa', 2000]]);
    expect(serie.anys[0].cobertura).toBe('parcial');
    expect(serie.avisos).toEqual([{ codi: 'FORAT_ENTRE_EXTRACTES', missatge: 'Falten els extractes del compte acabat en 4321 del 01/04/2025 al 30/06/2025: eixos dies no tenen xifra i els seus períodes ixen «parcials».' }]);
    expect(CODIS_SERIE).toEqual(expect.arrayContaining(['FORAT_ENTRE_EXTRACTES', 'COMPTE_INCOMPLET', 'LECTURA_AMB_AVISOS', 'TRASPASSOS_PROBABLES']));
    /* Els mesos del forat no entren a la mitjana del director financer. */
    expect(indicadors({ serie }).mesosBase).toBe(6);
  });

  test('un forat d’un sol mes dins d’un trimestre: el trimestre és «parcial», no «complet»', () => {
    const gener = extracte({ desde: '2025-01-01', fins: '2025-01-31', moviments: [mov('2025-01-10', -100, 'altres')] });
    const marc = extracte({ desde: '2025-03-01', fins: '2025-03-31', moviments: [mov('2025-03-10', -100, 'altres')] });
    const serie = serieHistorica({ lectura: { extractes: [gener, marc] }, rang: { inici: d('2025-01-01'), fi: d('2025-03-31') } });
    expect(serie.mesos.map((m) => m.cobertura)).toEqual(['completa', 'cap', 'completa']);
    expect(serie.trimestres[0]).toMatchObject({ cobertura: 'parcial', eixides: 200 });
  });

  test('dos comptes: un període és complet només si els cobrixen tots dos; l’altre compte, amb avís', () => {
    const a = extracte({ desde: '2025-01-01', fins: '2025-06-30', compte4: '1111', moviments: [mov('2025-02-01', -100, 'altres'), mov('2025-05-01', -100, 'altres')] });
    const b = extracte({ desde: '2025-04-01', fins: '2025-06-30', compte4: '2222', moviments: [mov('2025-05-02', -300, 'altres')] });
    const serie = serieHistorica({ lectura: { extractes: [a, b] }, rang: { inici: d('2025-01-01'), fi: d('2025-06-30') } });
    expect(serie.comptes.map((c) => c.compte4)).toEqual(['1111', '2222']);
    expect(serie.trimestres.map((t) => [t.clau, t.cobertura, t.eixides])).toEqual([['2025-T1', 'parcial', 100], ['2025-T2', 'completa', 400]]);
    expect(serie.mesos.map((m) => m.cobertura)).toEqual(['parcial', 'parcial', 'parcial', 'completa', 'completa', 'completa']);
    expect(serie.avisos.map((x) => x.codi)).toEqual(['COMPTE_INCOMPLET']);
    expect(serie.avisos[0].missatge).toMatch(/^Els extractes del compte acabat en 2222 només van del 01\/04\/2025 al 30\/06\/2025/);
    expect(indicadors({ serie }).mesosBase).toBe(3);
  });

  test('un extracte anual i un de trimestral del mateix compte, en qualsevol ordre: cap moviment perdut ni repetit', () => {
    const delAny = [mov('2025-02-10', -1000, 'altres'), mov('2025-05-10', -2000, 'altres'), mov('2025-08-10', -3000, 'altres'), mov('2025-11-10', -4000, 'altres')];
    const anual = extracte({ desde: '2025-01-01', fins: '2025-12-31', moviments: delAny });
    const trimestral = extracte({ desde: '2025-07-01', fins: '2025-09-30', moviments: [{ ...delAny[2] }] });
    for (const extractes of [[trimestral, anual], [anual, trimestral]]) {
      const serie = serieHistorica({ lectura: { extractes }, rang: { inici: d('2025-01-01'), fi: d('2025-12-31') } });
      expect(serie.moviments.map((m) => m.centims)).toEqual([-1000, -2000, -3000, -4000]);
      expect(serie.anys[0]).toMatchObject({ cobertura: 'completa', eixides: 10000 });
      expect(serie.avisos.map((x) => x.codi)).toEqual(['EXTRACTES_SOLAPATS']);
    }
  });

  test('la caixa d’uns comptes que acaben en dies diferents no és completa', () => {
    const a = extracte({ desde: '2025-01-01', fins: '2025-03-31', compte4: '1111', moviments: [] });
    const b = extracte({ desde: '2025-01-01', fins: '2025-03-15', compte4: '2222', moviments: [] });
    const serie = serieHistorica({ lectura: { extractes: [a, b] } });
    expect(serie.caixa).toMatchObject({ saldo: 2000000, fins: d('2025-03-31'), completa: false });
  });

  test('un extracte amb avisos de lectura (fitxer tallat, sumes que no quadren) ho diu', () => {
    const tallat = extracte({ desde: '2025-01-01', fins: '2025-01-31', moviments: [mov('2025-01-10', -100, 'altres')] });
    tallat.lectura.avisos = [{ codi: 'FITXER_TALLAT', severitat: 'alta' }];
    const serie = serieHistorica({ lectura: { extractes: [tallat] } });
    expect(serie.avisos.map((x) => x.codi)).toEqual(['LECTURA_AMB_AVISOS']);
  });

  test('només CSV: cada fitxer és un tram; dos CSV solapats no dupliquen res', () => {
    const fila = (iso, centims, saldo) => ({ dataOperacio: d(iso), dataValor: d(iso), centims, saldo, ...mov(iso, centims, 'altres') });
    const gener = { lectura: { moviments: [fila('2025-01-05', -100, 900), fila('2025-01-20', -200, 700)], avisos: [] } };
    const solapat = { lectura: { moviments: [fila('2025-01-20', -200, 700), fila('2025-02-03', -300, 400)], avisos: [] } };
    const serie = serieHistorica({ lectura: { csv: [solapat, gener] } });
    expect(serie.moviments.map((m) => m.centims)).toEqual([-100, -200, -300]);
    expect(serie.caixa.saldo).toBe(400);
    expect(serie.avisos.map((x) => x.codi)).toEqual(['EXTRACTES_SOLAPATS']);
  });
});

describe('els traspassos probables entre comptes propis', () => {
  const baixa = { confianca: 'baixa', motiu: 'CATEGORIA_GENERICA' };
  const dosComptes = (movA, movB) => ({
    extractes: [
      extracte({ desde: '2025-01-01', fins: '2025-01-31', compte4: '1111', moviments: movA }),
      extracte({ desde: '2025-01-01', fins: '2025-01-31', compte4: '2222', moviments: movB })
    ]
  });

  test('una eixida d’un compte i una entrada d’un altre, mateix import i dos dies: traspàs, per revisar, i ni ingrés ni despesa', () => {
    const serie = serieHistorica({ lectura: dosComptes([mov('2025-01-10', -50000, 'nomines', null, baixa)], [mov('2025-01-12', 50000, 'clients', null, baixa)]) });
    expect(serie.moviments.map((m) => [m.categoria, m.confianca, m.motiu])).toEqual([['traspas', 'baixa', 'TRASPAS_PROBABLE'], ['traspas', 'baixa', 'TRASPAS_PROBABLE']]);
    expect(serie.totals).toMatchObject({ entrades: 0, eixides: 0, traspassos: { entrades: 50000, eixides: 50000 } });
    expect(serie.perRevisar).toBe(2);
    expect(serie.avisos.map((x) => x.codi)).toEqual(['TRASPASSOS_PROBABLES']);
    expect(DIES_TRASPAS).toBe(3);
  });

  test('no és parella: el mateix compte, massa dies, un import diferent, un proveïdor o una tria de la persona', () => {
    const mateixCompte = serieHistorica({ lectura: { extractes: [extracte({ desde: '2025-01-01', fins: '2025-01-31', moviments: [mov('2025-01-10', -500, 'nomines', null, baixa), mov('2025-01-11', 500, 'clients', null, baixa)] })] } });
    expect(mateixCompte.moviments.map((m) => m.categoria)).toEqual(['nomines', 'clients']);
    const lluny = serieHistorica({ lectura: dosComptes([mov('2025-01-10', -500, 'nomines', null, baixa)], [mov('2025-01-14', 500, 'clients', null, baixa)]) });
    expect(lluny.moviments.map((m) => m.categoria)).toEqual(['nomines', 'clients']);
    const ambProveidor = serieHistorica({ lectura: dosComptes([mov('2025-01-10', -500, 'ia', 'anthropic')], [mov('2025-01-10', 500, 'clients', null, baixa)]) });
    expect(ambProveidor.moviments.map((m) => m.categoria)).toEqual(['ia', 'clients']);
    const entrada = mov('2025-01-11', 500, 'clients', null, baixa);
    const triat = serieHistorica({
      lectura: dosComptes([mov('2025-01-10', -500, 'nomines', null, baixa)], [entrada]),
      reclassificacions: { [entrada.id]: { categoria: 'clients' } }
    });
    expect(triat.moviments.map((m) => [m.categoria, m.motiu])).toEqual([['nomines', 'CATEGORIA_GENERICA'], ['clients', 'RECLASSIFICAT']]);
    expect(triat.avisos.map((x) => x.codi)).not.toContain('TRASPASSOS_PROBABLES');
  });

  test('una entrada sense origen (compta com a client) també és per revisar', () => {
    const serie = serieHistorica({ lectura: { extractes: [extracte({ desde: '2025-01-01', fins: '2025-01-31', moviments: [mov('2025-01-10', 1000, 'clients', null, { confianca: 'baixa', motiu: 'ENTRADA_SENSE_PATRO' })] })] } });
    expect(serie.perRevisar).toBe(1);
  });
});

describe('els límits', () => {
  test('sense lectura: cap xifra', () => {
    const buida = serieHistorica({});
    expect(buida).toMatchObject({ rang: null, moviments: [], mesos: [], trimestres: [], anys: [], totals: null, ia: null, caixa: null, perRevisar: 0 });
  });

  test('un compte en una altra moneda queda fora, amb avís; un moviment fora del rang, també', () => {
    const dolars = extracte({ desde: '2025-01-01', fins: '2025-01-31', divisa: 'USD', compte4: '9876', moviments: [mov('2025-01-03', -100, 'ia', 'openai')] });
    const serie = serieHistorica({ lectura: { extractes: [T1, dolars] }, rang: { inici: d('2025-02-01'), fi: d('2025-03-31') } });
    expect(serie.avisos.map((a) => a.codi)).toEqual(['ALTRA_MONEDA', 'FORA_DEL_RANG']);
    expect(serie.comptes).toHaveLength(1);
    expect(serie.moviments.every((m) => m.data.m >= 2)).toBe(true);
    expect(serie.caixa.completa).toBe(false);
  });

  test('sense rang, el que cobrixen els extractes', () => {
    const serie = serieHistorica({ lectura: { extractes: [T1] } });
    expect(serie.rang).toEqual({ inici: d('2025-01-01'), fi: d('2025-03-31') });
    expect(serie.mesos.map((m) => m.clau)).toEqual(['2025-01', '2025-02', '2025-03']);
  });

  test('un rang invertit no compta: s’usa el dels extractes', () => {
    const serie = serieHistorica({ lectura: { extractes: [T1] }, rang: { inici: d('2025-03-31'), fi: d('2025-01-01') } });
    expect(serie.rang).toEqual({ inici: d('2025-01-01'), fi: d('2025-03-31') });
  });
});

describe('els indicadors del director financer', () => {
  const serie = serieHistorica({ lectura: LECTURA, rang: RANG });

  test('la despesa mensual i el consum net, dels últims mesos complets; sense consum net, sense runway', () => {
    const ind = indicadors({ serie, provisio: { valor: 12345, any: 2025, t: 2 } });
    expect(ind.mesosBase).toBe(4);
    expect(ind.caixa).toEqual({ valor: 1411350, motiu: null });
    expect(ind.despesaMensual.valor).toBe(Math.round((31400 + 2150 + 2400 + 3200) / 4));
    expect(ind.consumNet.valor).toBe(Math.round((31400 + 2150 + 2400 + 3200 - 300000 - 0 - 500 - 250000) / 4));
    expect(ind.runway).toEqual({ valor: null, motiu: 'SENSE_CONSUM' });
    expect(ind.provisio).toEqual({ valor: 12345, motiu: null });
    expect(ind.pesIa.valor).toBe(serie.ia.percentatge);
    expect(MESOS_INDICADORS).toBe(6);
  });

  test('amb consum net, el runway són els mesos que paga la caixa', () => {
    const despesa = extracte({ desde: '2025-01-01', fins: '2025-02-28', saldoInicial: 600000, moviments: [
      mov('2025-01-10', -100000, 'altres'), mov('2025-02-10', -100000, 'altres')
    ] });
    const ind = indicadors({ serie: serieHistorica({ lectura: { extractes: [despesa] } }) });
    expect(ind.consumNet.valor).toBe(100000);
    expect(ind.runway).toEqual({ valor: 4, motiu: null });
  });

  test('sense cap mes complet, cap mitjana; sense res, cap xifra', () => {
    const curt = extracte({ desde: '2025-01-10', fins: '2025-01-20', moviments: [mov('2025-01-12', -100, 'altres')] });
    const ind = indicadors({ serie: serieHistorica({ lectura: { extractes: [curt] } }) });
    expect(ind.mesosBase).toBe(0);
    expect(ind.despesaMensual).toEqual({ valor: null, motiu: 'POCS_MESOS' });
    expect(ind.runway).toEqual({ valor: null, motiu: 'POCS_MESOS' });
    const res = indicadors({ serie: serieHistorica({}) });
    expect(res.caixa).toEqual({ valor: null, motiu: 'SENSE_DADES' });
    expect(res.provisio).toEqual({ valor: null, motiu: 'SENSE_DADES' });
  });
});

/* ── GES-A2 · Ordre del Mestre, 13-10-2026 (pla 261013_1405, front I; auditoria de Codex 261013_1510) ──
   Abans la sèrie agrupava per «entitat i quatre últims dígits»: el segon compte acabat igual es prenia pel
   primer, els seus dies ja eren «coberts» i se'n perdien tots els moviments i el saldo. Norma 43 sintètica,
   registre a registre (la forma de historic/nucli/n43Sintetic.test.js), llegida amb llegeixC43 i reduïda amb
   reduixC43, que és el que fa el tractor de l'Històric (historic/nucli/tractorHistoric.js). Els dos comptes
   només canvien d'oficina: mateixa entitat i mateixes quatre últimes xifres. El tractor, a més, dona els id dels
   moviments; que la QUOTA dels dos comptes no compartix id (i que reclassificar-ne una no toca l'altra) ho prova
   tractorHistoric.test.js (revisió adversarial 13-10-2026, troballes FIN-4 i TI-1). */
describe('GES-A2 · dos comptes de la mateixa entitat acabats en les mateixes quatre xifres', () => {
  const xifres = (n, llargaria) => String(Math.abs(n)).padStart(llargaria, '0');
  const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
  const aammdd = (iso) => iso.slice(2, 4) + iso.slice(5, 7) + iso.slice(8, 10);
  const clauDe = (oficina) => `9999${oficina}${xifres(43, 10)}`;
  function n43({ oficina, desde, fins, saldoInicial, moviments }) {
    const clau = clauDe(oficina);
    const linies = [`11${clau}${aammdd(desde)}${aammdd(fins)}2${xifres(saldoInicial, 14)}9783${text('TITULAR SINTETIC', 26)}${text('', 3)}`];
    let deure = 0;
    let haver = 0;
    let sumaDeure = 0;
    let sumaHaver = 0;
    for (const m of moviments) {
      if (m.centims < 0) {
        deure += 1;
        sumaDeure -= m.centims;
      } else {
        haver += 1;
        sumaHaver += m.centims;
      }
      linies.push(`22${text('', 4)}0001${aammdd(m.data)}${aammdd(m.data)}99000${m.centims < 0 ? '1' : '2'}${xifres(m.centims, 14)}${xifres(0, 10)}${text('', 12)}${text('', 16)}`);
      linies.push(`2301${text(m.concepte, 38)}${text('', 38)}`);
    }
    const saldoFinal = saldoInicial + sumaHaver - sumaDeure;
    linies.push(`33${clau}${xifres(deure, 5)}${xifres(sumaDeure, 14)}${xifres(haver, 5)}${xifres(sumaHaver, 14)}2${xifres(saldoFinal, 14)}978${text('', 4)}`);
    linies.push(`88${'9'.repeat(18)}${xifres(linies.length, 6)}${text('', 54)}`);
    return linies.join('\r\n');
  }
  /* El que el tractor passa a la sèrie: la lectura reduïda (sense text de concepte). */
  const reduida = (contingut) => ({ lectura: reduixC43(llegeixC43(contingut)) });
  /* La mateixa quota, el mateix dia i pel mateix import, als dos comptes. */
  const QUOTA = { data: '2025-01-10', centims: -10000, concepte: 'QUOTA SINTETICA' };
  const A = n43({ oficina: '0001', desde: '2025-01-01', fins: '2025-03-31', saldoInicial: 500000, moviments: [
    QUOTA, { data: '2025-02-15', centims: 30000, concepte: 'TRANSFERENCIA SINTETICA' }, { data: '2025-03-20', centims: -2500, concepte: 'COMISSIO SINTETICA' }
  ] });
  const B = n43({ oficina: '0002', desde: '2025-01-01', fins: '2025-03-31', saldoInicial: 200000, moviments: [
    QUOTA, { data: '2025-03-05', centims: -4000, concepte: 'COMPRA SINTETICA' }
  ] });
  const SALDO_A = 500000 - 10000 + 30000 - 2500;
  const SALDO_B = 200000 - 10000 - 4000;

  test('la Norma 43 sintètica es llig sense avisos, i el reductor hi deixa el sufix compartit i dos id opacs diferents', () => {
    const [a, b] = [reduida(A), reduida(B)].map((x) => x.lectura);
    expect([a.avisos, b.avisos]).toEqual([[], []]);
    expect([a, b].map((l) => l.comptes[0].capcalera.compte4)).toEqual(['0043', '0043']);
    expect(a.comptes[0].capcalera.idCompte).toMatch(/^[bcdfghjklmnpqrst]{16}$/);
    expect(a.comptes[0].capcalera.idCompte).not.toBe(b.comptes[0].capcalera.idCompte);
  });

  test('són dos comptes: cap moviment perdut, la caixa suma els dos saldos i cap avís de solapament fals', () => {
    const serie = serieHistorica({ lectura: { extractes: [reduida(A), reduida(B)] } });
    expect(serie.comptes.map((c) => [c.n, c.entitat, c.compte4, c.saldo])).toEqual([[1, '9999', '0043', SALDO_A], [2, '9999', '0043', SALDO_B]]);
    expect(serie.moviments.map((m) => [m.compte, m.centims])).toEqual([[1, -10000], [2, -10000], [1, 30000], [2, -4000], [1, -2500]]);
    expect(serie.caixa).toEqual({ saldo: SALDO_A + SALDO_B, fins: d('2025-03-31'), completa: true });
    expect(serie.totals).toMatchObject({ entrades: 30000, eixides: 10000 + 10000 + 4000 + 2500, cobertura: 'completa' });
    expect(serie.avisos).toEqual([]);
  });

  test('l’id de presentació és el de sempre i només el segon du «-2»; l’ordre dels fitxers no canvia qui és qui', () => {
    const perId = (extractes) => Object.fromEntries(comptesHistoric({ extractes }).comptes.map((c) => [c.id, c.saldo]));
    const directe = perId([reduida(A), reduida(B)]);
    expect(Object.keys(directe).sort()).toEqual(['c43-9999-0043', 'c43-9999-0043-2']);
    expect(Object.values(directe).sort((x, y) => x - y)).toEqual([SALDO_B, SALDO_A]);
    expect(perId([reduida(B), reduida(A)])).toEqual(directe);
  });

  test('el mateix compte en dos extractes que se solapen continua sent un: el dia repetit compta una vegada', () => {
    const A2 = n43({ oficina: '0001', desde: '2025-03-01', fins: '2025-04-30', saldoInicial: 500000 - 10000 + 30000, moviments: [
      { data: '2025-03-20', centims: -2500, concepte: 'COMISSIO SINTETICA' }, { data: '2025-04-10', centims: -7000, concepte: 'QUOTA SINTETICA' }
    ] });
    const serie = serieHistorica({ lectura: { extractes: [reduida(A2), reduida(A)] } });
    expect(comptesHistoric({ extractes: [reduida(A), reduida(A2)] }).comptes.map((c) => c.id)).toEqual(['c43-9999-0043']);
    expect(serie.comptes.map((c) => [c.compte4, c.saldo])).toEqual([['0043', SALDO_A - 7000]]);
    expect(serie.moviments.map((m) => m.centims)).toEqual([-10000, 30000, -2500, -7000]);
    expect(serie.avisos.map((a) => a.codi)).toEqual(['EXTRACTES_SOLAPATS']);
  });

  test('ni l’id opac ni el número sencer ixen de la sèrie', () => {
    const lectures = [reduida(A), reduida(B)];
    const json = JSON.stringify([serieHistorica({ lectura: { extractes: lectures } }), comptesHistoric({ extractes: lectures }).comptes.map((c) => c.id)]);
    for (const l of lectures) expect(json).not.toContain(l.lectura.comptes[0].capcalera.idCompte);
    for (const oficina of ['0001', '0002']) expect(json).not.toContain(clauDe(oficina));
    expect(json).not.toContain(xifres(43, 10));
  });

  test('una lectura feta a mà: amb idCompte manen els id; sense (o buit, o que no és un text), la clau d’abans', () => {
    const a = extracte({ desde: '2025-01-01', fins: '2025-01-31', moviments: [mov('2025-01-10', -100, 'altres')] });
    const b = extracte({ desde: '2025-01-01', fins: '2025-01-31', saldoInicial: 2000000, moviments: [mov('2025-01-10', -100, 'altres')] });
    const ambId = (e, idCompte) => ({ lectura: { ...e.lectura, comptes: e.lectura.comptes.map((c) => ({ ...c, capcalera: { ...c.capcalera, idCompte } })) } });
    const comptes = (extractes) => comptesHistoric({ extractes }).comptes.map((c) => [c.id, c.saldo]);
    expect(comptes([ambId(a, 'bcdfghjklmnpqrst'), ambId(b, 'tsrqpnmlkjhgfdcb')])).toEqual([['c43-9999-4321', 999900], ['c43-9999-4321-2', 1999900]]);
    expect(comptes([ambId(b, 'tsrqpnmlkjhgfdcb'), ambId(a, 'bcdfghjklmnpqrst')])).toEqual([['c43-9999-4321-2', 1999900], ['c43-9999-4321', 999900]]);
    expect(comptes([ambId(a, 'bcdfghjklmnpqrst'), ambId(b, 'bcdfghjklmnpqrst')])).toHaveLength(1);
    /* Sense id opac vàlid no hi ha res millor que l'entitat i el sufix: un compte, com abans del 13-10-2026. */
    expect(comptes([a, b])).toHaveLength(1);
    expect(comptes([ambId(a, ''), ambId(b, 42)])).toEqual([['c43-9999-4321', 999900]]);
  });
});
