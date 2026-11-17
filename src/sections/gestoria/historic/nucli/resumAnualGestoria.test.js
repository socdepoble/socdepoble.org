// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { parseCsv } from '../../nucli/csv.js';
import { operacionsDelBanc } from './operacions.js';
import { AVIS_RESUM_ANUAL_GESTORIA, CAMPS_RESUM_ANUAL_GESTORIA, exportaResumAnualGestoria, resumAnualGestoria } from './resumAnualGestoria.js';

const operacio = (extra = {}) => ({
  data: { a: 2026, m: 1, d: 1 }, tipus: 'ingres', base: 10000, iva: 2100, retencio: 1500,
  tractament: 'interior', deduibleIva: false, deduibleIrpf: true, origen: 'factura', ...extra
});
const despesa = (extra = {}) => operacio({ tipus: 'despesa', retencio: 0, deduibleIva: true, ...extra });
const resum = (operacions) => resumAnualGestoria({ any: 2026, operacions });

describe('resum anual exacte per a gestoria humana', () => {
  test('quatre trimestres naturals, anual reconciliat i retencions separades', () => {
    const r = resum([
      operacio(), despesa({ base: 2000, iva: 420, retencio: 100 }),
      operacio({ data: { a: 2026, m: 4, d: 1 }, base: 3000, iva: 630, retencio: 450 }),
      despesa({ data: { a: 2026, m: 9, d: 30 }, base: 1000, iva: 210, deduibleIva: false }),
      despesa({ data: { a: 2026, m: 12, d: 31 }, base: 500, iva: 105, deduibleIrpf: false })
    ]);
    expect(r.trimestres.map((t) => t.periode)).toEqual(['T1', 'T2', 'T3', 'T4']);
    expect(r.trimestres.map((t) => t.operacions)).toEqual([2, 1, 1, 1]);
    expect(r.anual.totals).toEqual({
      ingressos: '13000', despesesDeduibles: '3210', despesesNoDeduibles: '500',
      baseIvaRepercutit: '13000', ivaRepercutit: '2730', baseIvaSuportat: '3500', ivaSuportat: '735',
      baseIvaSuportatDeduible: '2500', ivaSuportatDeduible: '525', baseIvaAutoliquidat: '0', ivaAutoliquidat: '0',
      retencionsIrpfSuportades: '1950', retencionsIrpfPracticades: '100'
    });
    for (const camp of CAMPS_RESUM_ANUAL_GESTORIA) {
      expect(r.trimestres.reduce((t, fila) => t + BigInt(fila.totals[camp]), 0n)).toBe(BigInt(r.anual.totals[camp]));
    }
  });

  test('sumes i serialització exactes per damunt de MAX_SAFE_INTEGER', () => {
    const gran = BigInt(Number.MAX_SAFE_INTEGER);
    const e = exportaResumAnualGestoria({ any: 2026, operacions: [
      operacio({ base: gran, iva: 0n, retencio: 0n }),
      operacio({ base: String(gran), iva: '0', retencio: '0' }), operacio({ base: 1, iva: 0, retencio: 0 })
    ] });
    expect(e.resum.anual.totals.ingressos).toBe('18014398509481983');
    expect(JSON.parse(e.json).anual.totals.ingressos).toBe('18014398509481983');
    expect(e.csv).toContain(';18014398509481983;');
  });

  test('una rectificació enorme no es menja el cèntim intermedi', () => {
    const gran = 10n ** 40n;
    const ops = [gran, 1n, -gran].map((base) => operacio({ base, iva: 0n, retencio: 0n }));
    expect(resum(ops).anual.totals.ingressos).toBe('1');
    expect(resum([...ops].reverse()).anual.totals.ingressos).toBe('1');
  });

  test('rectificatives amb signe resten de bases, quotes i retencions sense pèrdua de cèntims', () => {
    const r = resum([operacio(), operacio({ base: -5000, iva: -1050, retencio: -750 }), despesa(), despesa({ base: -100, iva: -21 })]);
    expect(r.anual.totals).toMatchObject({ ingressos: '5000', ivaRepercutit: '1050', retencionsIrpfSuportades: '750', despesesDeduibles: '9900', ivaSuportatDeduible: '2079' });
  });

  test.each(['isp-intracomunitari', 'isp-extracomunitari'])('ISP %s repercutix i suporta una única quota, també quan no és deduïble', (tractament) => {
    const r = resum([despesa({ tractament, base: 1000, iva: 210, deduibleIva: false })]);
    expect(r.anual.totals).toMatchObject({ ingressos: '0', despesesDeduibles: '1210', baseIvaRepercutit: '1000', ivaRepercutit: '210', baseIvaSuportat: '1000', ivaSuportat: '210', ivaSuportatDeduible: '0', baseIvaAutoliquidat: '1000', ivaAutoliquidat: '210' });
  });

  test('compatibilitat real amb operacionsDelBanc sense generar una factura ni inferir dades noves', () => {
    const { operacions } = operacionsDelBanc({ moviments: [
      { data: { a: 2026, m: 1, d: 3 }, centims: 12100, categoria: 'clients' },
      { data: { a: 2026, m: 2, d: 4 }, centims: -29400, categoria: 'reta' }
    ] });
    expect(resum(operacions).anual.totals).toMatchObject({ ingressos: '10000', despesesDeduibles: '29400', ivaRepercutit: '2100', ivaSuportat: '0' });
    expect(resum(operacions).detall.every((op) => op.origen === 'banc')).toBe(true);
  });

  test('exempcions i operacions sense IVA no inflen bases d’IVA, però mantenen ingressos/despeses', () => {
    const r = resum([operacio({ tractament: 'exempt', iva: 0 }), despesa({ tractament: 'sense-iva', iva: 0, deduibleIva: false })]);
    expect(r.anual.totals).toMatchObject({ ingressos: '10000', despesesDeduibles: '10000', baseIvaRepercutit: '0', baseIvaSuportat: '0' });
  });

  test('CSV i JSON són deterministes davant ordre d’entrada, privats i amb avís literal', () => {
    const ops = [operacio({ id: '=formula', nom: 'Dada privada fora del contracte' }), despesa({ id: 'b', data: { a: 2026, m: 8, d: 4 } })];
    const abans = structuredClone(ops);
    const a = exportaResumAnualGestoria({ any: 2026, operacions: ops });
    const b = exportaResumAnualGestoria({ any: 2026, operacions: [...ops].reverse() });
    expect(a.json).toBe(b.json);
    expect(a.csv).toBe(b.csv);
    expect(ops).toEqual(abans);
    expect(a.json).not.toContain('Dada privada');
    expect(a.csv).not.toContain('=formula');
    expect(a.resum.avis).toBe("Esborrany d'autoorganització per a revisió per gestoria humana — No Verifactu");
    const files = parseCsv(a.csv, { delimitador: ';' });
    expect(files).toHaveLength(6);
    expect(files.slice(1).map((fila) => fila[1])).toEqual(['T1', 'T2', 'T3', 'T4', 'ANUAL']);
    expect(files.slice(1).every((fila) => fila.at(-1) === AVIS_RESUM_ANUAL_GESTORIA)).toBe(true);
    expect(a.csv.charCodeAt(0)).toBe(0xfeff);
    expect(a.csv.endsWith('\r\n')).toBe(true);
    expect(Object.isFrozen(a.resum.detall[0])).toBe(true);
    expect(Object.isFrozen(a.resum.trimestres[0].totals)).toBe(true);
  });

  test('buit no acredita cobertura; altres anys s’exclouen explícitament', () => {
    const r = resum([operacio({ data: { a: 2024, m: 2, d: 29 } })]);
    expect(r.exclososAltresAnys).toBe(1);
    expect(r.detall).toEqual([]);
    expect(r.anual.operacions).toBe(0);
    expect(Object.values(r.anual.totals).every((valor) => valor === '0')).toBe(true);
    expect(r.cobertura).toContain('completitud pendents');
  });

  test('límits trimestrals i dia bixest no depenen de zona horària', () => {
    const dates = [[3, 31], [4, 1], [6, 30], [7, 1], [9, 30], [10, 1], [12, 31]];
    expect(resum(dates.map(([m, d]) => operacio({ data: { a: 2026, m, d } }))).trimestres.map((t) => t.operacions)).toEqual([1, 2, 2, 2]);
    expect(resumAnualGestoria({ any: 2024, operacions: [operacio({ data: { a: 2024, m: 2, d: 29 } })] }).trimestres[0].operacions).toBe(1);
    expect(() => resum([operacio({ data: { a: 2026, m: 2, d: 29 } })])).toThrow(/data/);
  });

  test.each([1.2, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '1.00', '01', '', null, undefined])('rebutja import inexacte o ambigu %s', (base) => {
    expect(() => resum([operacio({ base })])).toThrow(/cèntims enters exactes/);
  });

  test.each([
    { iva: undefined }, { retencio: undefined }, { deduibleIrpf: undefined }, { deduibleIva: 'true' },
    { tractament: 'desconegut' }, { tipus: 'altre' }, { origen: 'inventat' }, { id: ' ' },
    { base: -100, iva: 21 }, { base: 100, retencio: -1 }, { tractament: 'exempt' },
    { tractament: 'sense-iva', iva: 0, deduibleIva: true }, { tractament: 'isp-intracomunitari' }
  ])('rebutja una operació incompleta/incoherent %j', (extra) => {
    expect(() => resum([operacio(extra)])).toThrow();
  });

  test('no deduplica silenciosament; id repetit falla i files iguals sense id compten', () => {
    expect(() => resum([operacio({ id: 'unic' }), despesa({ id: 'unic' })])).toThrow(/duplicat/);
    expect(resum([operacio(), operacio()]).anual.totals.ingressos).toBe('20000');
  });

  test('entrada sencera validada encara que una fila caiga fora de l’any; contenidors invàlids fallen', () => {
    expect(() => resum([operacio({ data: { a: 2025, m: 1, d: 1 }, base: 1.1 })])).toThrow();
    expect(() => resumAnualGestoria({ any: 26 })).toThrow(/any/);
    expect(() => resumAnualGestoria({ any: 2026, operacions: null })).toThrow(/llista/);
    expect(() => resumAnualGestoria({ any: 2026, operacions: new Array(1) })).toThrow(/data/);
  });
});
