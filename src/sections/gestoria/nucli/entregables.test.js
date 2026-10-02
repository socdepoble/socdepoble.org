// @vitest-environment node
/* Gestoria · nucli · entregables: el CSV i l'XLSX del trimestre ixen d'un
   sol full maquetat, amb l'empremta dels bytes reals, i l'empremta de la
   proposta lliga l'aprovació a les dades exactes. Dades sintètiques:
   empreses fictícies i CIF calculats. */
import { createHash, webcrypto } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import { generaEntregables, empremtaProposta, SCHEMA_PROPOSTA, TIPUS_CSV, TIPUS_XLSX } from './entregables.js';
import { fullACsv, llegeixModelCsv, maquetaFull } from './fullModel.js';
import { crearFactura } from './model.js';
import { PLANTILLA_GESTORIA, PLANTILLA_VERDA_ANTIGA } from './plantilla.js';
import { fullAXlsx } from './xlsx.js';

const subtle = webcrypto.subtle;

function controlCif(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  return (10 - ((parells + senars) % 10)) % 10;
}
const cif = (lletra, xifres) => `${lletra}${xifres}${controlCif(xifres)}`;

const TITULAR = 'Cooperativa Exemple del Poble';
const CIF_CLIENT = cif('B', '7100008');
const CIF_LLUM = cif('B', '7100001');

const ingres = (extra = {}) => crearFactura({
  tipus: 'ingres', data: '10/08/2026', num: 'F26-0003', contrapart: 'Exemple Distribucions SL', nif: CIF_CLIENT,
  descripcio: 'Taller de pedra seca', subtotal: 20000, iva: 4200, total: 24200, origen: { fitxer: '2026_3T/F26-0003.pdf', metode: 'pdf' }, ...extra
});
const despesa = (m, extra = {}) => crearFactura({
  tipus: 'despesa', data: { a: 2026, m, d: 28 }, num: `EL-2026-0${m}`, contrapart: 'Exemple Llum SL', nif: CIF_LLUM,
  descripcio: 'Subministrament elèctric', subtotal: 10000, iva: 2100, total: 12100, origen: { fitxer: `2026_3T/llum_${m}.pdf`, metode: 'pdf' }, ...extra
});
const proposta = (extra = {}) => ({ titular: TITULAR, any: 2026, t: 3, ingressos: [ingres()], despeses: [despesa(7), despesa(8)], ...extra });

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
/* ignoreBOM: el BOM és part dels bytes que es lliuren i es compara amb ells. */
const text = (bytes) => new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);

describe('generaEntregables', () => {
  test('un sol full, els dos formats i l’empremta dels bytes reals', async () => {
    const r = await generaEntregables({ proposta: proposta(), subtle });
    expect(r.full).toEqual(maquetaFull(PLANTILLA_GESTORIA, proposta()));
    expect(r.csv).toMatchObject({ nom: '2026-FACTURACIO-Cooperativa_Exemple_del_Poble_-_3T.csv', tipus: TIPUS_CSV });
    expect(r.xlsx).toMatchObject({ nom: '2026-FACTURACIO-Cooperativa_Exemple_del_Poble_-_3T.xlsx', tipus: TIPUS_XLSX });
    expect(TIPUS_CSV).toBe('text/csv;charset=utf-8');
    expect(TIPUS_XLSX).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    // Els dos fitxers són l'escriptura del mateix full.
    expect(text(r.csv.dades)).toBe(fullACsv(r.full));
    expect(r.xlsx.dades).toEqual(fullAXlsx(r.full));
    expect(r.empremtes).toEqual({ csv: sha(r.csv.dades), xlsx: sha(r.xlsx.dades) });
    expect(r.empremtes.csv).toMatch(/^[0-9a-f]{64}$/);
    // El CSV porta el BOM d'UTF-8 i l'XLSX és un ZIP.
    expect([...r.csv.dades.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(text(r.xlsx.dades.slice(0, 2))).toBe('PK');
  });

  test('el CSV es torna a llegir com a full de la gestoria, amb les mateixes factures', async () => {
    const r = await generaEntregables({ proposta: proposta(), subtle });
    const llegit = llegeixModelCsv(r.csv.dades, { fitxer: r.csv.nom });
    expect(llegit).toMatchObject({ any: 2026, t: 3, titular: TITULAR });
    expect(llegit.ingressos.map((f) => [f.num, f.total])).toEqual([['F26-0003', 24200]]);
    expect(llegit.despeses.map((f) => [f.num, f.total])).toEqual([['EL-2026-07', 12100], ['EL-2026-08', 12100]]);
    expect(llegit.avisos).toEqual([]);
  });

  test('immutables: el full congelat i els bytes només en còpia', async () => {
    const r = await generaEntregables({ proposta: proposta(), subtle });
    expect(Object.isFrozen(r)).toBe(true);
    expect(Object.isFrozen(r.full)).toBe(true);
    expect(Object.isFrozen(r.full.files[0].celles)).toBe(true);
    expect(Object.isFrozen(r.csv)).toBe(true);
    expect(Object.isFrozen(r.empremtes)).toBe(true);
    const copia = r.xlsx.dades;
    copia.fill(0);
    expect(r.xlsx.dades).not.toBe(copia);
    expect(sha(r.xlsx.dades)).toBe(r.empremtes.xlsx);
    expect(() => { r.csv.dades = new Uint8Array(1); }).toThrow(TypeError);
    expect({ ...r.csv }.dades).toEqual(r.csv.dades);
  });

  test('la mateixa proposta dona els mateixos bytes', async () => {
    const [a, b] = await Promise.all([generaEntregables({ proposta: proposta(), subtle }), generaEntregables({ proposta: proposta(), subtle })]);
    expect(a.empremtes).toEqual(b.empremtes);
  });

  test('subtle és injectable i resumix exactament els dos fitxers', async () => {
    const digest = vi.fn((algorisme, dades) => subtle.digest(algorisme, dades));
    const r = await generaEntregables({ proposta: proposta(), subtle: { digest } });
    expect(digest).toHaveBeenCalledTimes(2);
    expect(digest.mock.calls.map(([algorisme]) => algorisme)).toEqual(['SHA-256', 'SHA-256']);
    expect(digest.mock.calls.map(([, dades]) => sha(dades)).sort()).toEqual([r.empremtes.csv, r.empremtes.xlsx].sort());
  });

  test('una altra plantilla canvia el full, no el motor', async () => {
    const gestoria = await generaEntregables({ proposta: proposta(), subtle });
    const verda = await generaEntregables({ proposta: proposta(), plantilla: PLANTILLA_VERDA_ANTIGA, subtle });
    expect(verda.full).toEqual(maquetaFull(PLANTILLA_VERDA_ANTIGA, proposta()));
    expect(verda.empremtes.xlsx).not.toBe(gestoria.empremtes.xlsx);
    expect(verda.csv.nom).toBe(gestoria.csv.nom);
  });

  test('un trimestre sense factures també té full: barres, capçaleres i totals a zero', async () => {
    const r = await generaEntregables({ proposta: proposta({ ingressos: [], despeses: undefined }), subtle });
    expect(r.full.files.filter((f) => f.rol === 'dada')).toEqual([]);
    expect(r.full.files.filter((f) => f.rol === 'totals')).toHaveLength(2);
  });

  test('dades que no valen: TypeError o RangeError, mai un fitxer a mitges', async () => {
    await expect(generaEntregables({ subtle })).rejects.toThrow(TypeError);
    await expect(generaEntregables({ proposta: proposta({ despeses: 'no' }), subtle })).rejects.toThrow(TypeError);
    await expect(generaEntregables({ proposta: proposta({ t: 5 }), subtle })).rejects.toThrow(RangeError);
    await expect(generaEntregables({ proposta: proposta(), plantilla: { id: 'buida' }, subtle })).rejects.toThrow(TypeError);
  });
});

describe('empremtaProposta', () => {
  test('SHA-256 hex del JSON canònic, amb el seu esquema', async () => {
    const empremta = await empremtaProposta(proposta(), subtle);
    expect(empremta).toMatch(/^[0-9a-f]{64}$/);
    expect(SCHEMA_PROPOSTA).toBe('sdp.gestoria.proposta.v1');
  });

  test('l’ordre de les files no hi compta; l’identificador, l’origen ni la confiança tampoc', async () => {
    const base = await empremtaProposta(proposta(), subtle);
    const girada = proposta({ despeses: [despesa(8), despesa(7)] });
    expect(await empremtaProposta(girada, subtle)).toBe(base);
    const altres = proposta({
      ingressos: [ingres({ id: 'manual_1', origen: { metode: 'manual' }, confianca: { total: 'baixa' }, estat: 'pendent' })]
    });
    expect(await empremtaProposta(altres, subtle)).toBe(base);
  });

  test('qualsevol dada del full la canvia: un cèntim, el titular, el període, la retenció o el bloc', async () => {
    const base = await empremtaProposta(proposta(), subtle);
    const variants = [
      proposta({ despeses: [despesa(7), despesa(8, { total: 12101 })] }),
      proposta({ despeses: [despesa(7), despesa(8, { descripcio: 'Subministrament elèctric agost' })] }),
      proposta({ titular: `${TITULAR} SCCL` }),
      proposta({ t: 2 }),
      proposta({ ingressos: [ingres({ retencio: 3000, total: 21200 })] }),
      proposta({ ingressos: [], despeses: [despesa(7), despesa(8), ingres()] }),
      proposta({ despeses: [despesa(7)] })
    ];
    const empremtes = await Promise.all(variants.map((p) => empremtaProposta(p, subtle)));
    for (const e of empremtes) expect(e).not.toBe(base);
    expect(new Set(empremtes).size).toBe(variants.length);
  });

  test('sense proposta, TypeError', async () => {
    await expect(empremtaProposta(null, subtle)).rejects.toThrow(TypeError);
  });
});
