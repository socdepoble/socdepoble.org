// @vitest-environment node
/* Gestoria · nucli · fullModel: el motor del full trimestral. La maquetació
   amb la plantilla de la gestoria (geometria, estils amb nom, ordre i totals),
   la comprovació de plantilles, el canvi de format sense tocar codi, el CSV
   fila per fila, els noms de fitxer i la lectura tolerant dels models, amb el
   viatge d'anada i tornada. Dades sintètiques: empreses fictícies i CIF calculats. */
import { describe, expect, test } from 'vitest';
import {
  comprovaPlantilla, fullACsv, lletraColumna, llegeixModelCsv, maquetaFull, nomsFitxers, slugTitular
} from './fullModel.js';
import { parseCsv } from './csv.js';
import { crearFactura, ordenaFactures } from './model.js';
import { PLANTILLA_GESTORIA, PLANTILLA_VERDA_ANTIGA } from './plantilla.js';

const BOM = String.fromCharCode(0xfeff);
const CIF_A = 'A12345674';
/* Un CIF de lletra B calculat ací (control amb xifra). */
function cifB(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  return `B${xifres}${(10 - ((parells + senars) % 10)) % 10}`;
}
const CIF_B = cifB('7654321');
const EUROS = '#,##0.00 "€"';

const factura = (canvis = {}) => crearFactura({
  tipus: 'despesa',
  data: { a: 2026, m: 4, d: 15 },
  num: 'F-1',
  contrapart: 'Exemple Energia SCCL',
  nif: CIF_A,
  descripcio: 'Subministrament',
  subtotal: 10000,
  iva: 2100,
  total: 12100,
  origen: { fitxer: 'factures/f-1.pdf', metode: 'pdf' },
  ...canvis
});

const camps = (f) => ({
  tipus: f.tipus, data: f.data, num: f.num, contrapart: f.contrapart, nif: f.nif, descripcio: f.descripcio,
  subtotal: f.subtotal, iva: f.iva, total: f.total
});
const copia = (plantilla) => JSON.parse(JSON.stringify(plantilla));
const rols = (full) => full.files.map((fila) => fila.rol);
/* Els valors de cada fila; undefined on no hi ha cel·la, null on hi ha una cel·la buida amb estil. */
const valors = (full) => full.files.map((fila) => fila.celles.map((cel) => (cel ? cel.valor : undefined)));
const linies = (csv) => csv.split('\r\n');

describe('slugTitular, nomsFitxers i lletraColumna', () => {
  test('sense diacrítics ni punts, espais com a «_»', () => {
    expect(slugTitular('Nom. Cognom Àlvarez')).toBe('Nom_Cognom_Alvarez');
    expect(slugTitular('  Exemple   Cooperativa, S.C.C.L. ')).toBe('Exemple_Cooperativa_SCCL');
    expect(slugTitular('Col·lectiu Façana')).toBe('Collectiu_Facana');
    expect(slugTitular('Camí/Àrea Nàutica')).toBe('Cami_Area_Nautica');
    expect(slugTitular('')).toBe('');
    expect(slugTitular(null)).toBe('');
  });

  test('noms dels fitxers del trimestre, amb la plantilla de la gestoria o una altra', () => {
    expect(nomsFitxers({ any: 2026, t: 2, titular: 'Nom. Cognom Àlvarez' })).toEqual({
      csv: '2026-FACTURACIO-Nom_Cognom_Alvarez_-_2T.csv',
      xlsx: '2026-FACTURACIO-Nom_Cognom_Alvarez_-_2T.xlsx'
    });
    expect(nomsFitxers({ any: 2026, t: 2, titular: 'X' }, PLANTILLA_VERDA_ANTIGA).csv).toBe('2026-FACTURACIO-X_-_2T.csv');
    const propia = { ...copia(PLANTILLA_GESTORIA), nomFitxer: '{any}_{n}T_{slug}' };
    expect(nomsFitxers({ any: 2026, t: 3, titular: 'Exemple Titular' }, propia).xlsx).toBe('2026_3T_Exemple_Titular.xlsx');
    expect(() => nomsFitxers({ any: 2026, t: 5, titular: 'X' })).toThrow(RangeError);
  });

  test('lletres de columna', () => {
    expect([0, 7, 25, 26, 701, 702].map(lletraColumna)).toEqual(['A', 'H', 'Z', 'AA', 'ZZ', 'AAA']);
    expect(() => lletraColumna(-1)).toThrow(RangeError);
  });
});

describe('maquetaFull · plantilla de la gestoria', () => {
  const v2 = factura({
    tipus: 'ingres', num: 'V-2', data: { a: 2026, m: 5, d: 2 }, contrapart: 'Exemple Clients SL', descripcio: 'Taller', subtotal: 50000, iva: 10500, total: 60500
  });
  const v1 = factura({
    tipus: 'ingres', num: 'V-1', data: { a: 2026, m: 4, d: 15 }, contrapart: 'Exemple Formació SCCL', nif: CIF_B, descripcio: 'Curs',
    subtotal: 123456, iva: 25926, total: 149382
  });
  const f1 = factura();
  const f2 = factura({ num: 'F-2', data: { a: 2026, m: 6, d: 30 }, iva: null });
  const full = maquetaFull(PLANTILLA_GESTORIA, { titular: ' Exemple   Titular ', any: 2026, t: 2, ingressos: [v2, v1], despeses: [f2, f1] });

  test('fulla, font, columnes, files i combinacions', () => {
    expect(full.nomFulla).toBe('2T');
    expect(full.font).toEqual({ nom: 'Arial', mida: 10 });
    expect(full.altFila).toBe(12.75);
    expect(full.formats).toEqual({ data: 'dd/mm/yy', dataText: 'dd/mm/aa', import: EUROS });
    expect(full.columnes.map((c) => c.amplada)).toEqual([10, 17, 32, 13, 46, 12, 10, 12]);
    expect(rols(full)).toEqual([
      'titol', 'buida', 'buida',
      'barra', 'capcalera', 'dada', 'dada', 'totals',
      'buida', 'buida',
      'barra', 'capcalera', 'dada', 'dada', 'totals'
    ]);
    expect(full.files.every((fila) => fila.celles.length === 8)).toBe(true);
    expect(full.combinacions).toEqual(['A1:H1', 'A4:H4', 'A11:H11']);
  });

  test('els estils amb nom, només els usats i en ordre d\'aparició', () => {
    expect(full.estils).toEqual({
      titol: { negreta: true, alineacio: 'centre' },
      barra: { negreta: true, colorLletra: 'FFFFFFFF', fons: 'FF000000', alineacio: 'centre' },
      capcalera: { negreta: true, colorLletra: 'FFFFFFFF', fons: 'FF666666', alineacio: 'centre' },
      'dada+data': { alineacio: 'esquerra', vertical: 'dalt', numFmt: 'dd/mm/yy' },
      dada: { alineacio: 'esquerra', vertical: 'dalt' },
      'dada+ajust': { alineacio: 'esquerra', vertical: 'dalt', ajust: true },
      'dadaImport+import': { alineacio: 'dreta', vertical: 'dalt', numFmt: EUROS },
      etiquetaTotal: { negreta: true, alineacio: 'dreta', vertical: 'dalt' },
      'total+import': { negreta: true, alineacio: 'dreta', vertical: 'dalt', numFmt: EUROS }
    });
    expect(Object.keys(full.estils)).toEqual([
      'titol', 'barra', 'capcalera', 'dada+data', 'dada', 'dada+ajust', 'dadaImport+import', 'etiquetaTotal', 'total+import'
    ]);
  });

  test('títol en una línia i barres combinades per tota la fila', () => {
    const buidaTitol = { tipus: 'text', valor: null, estil: 'titol' };
    expect(full.files[0].celles).toEqual([
      { tipus: 'text', valor: 'Exemple Titular - 01/04/2026 - 30/06/2026 - 2T', estil: 'titol' }, ...Array(7).fill(buidaTitol)
    ]);
    expect(full.files[3]).toEqual({
      rol: 'barra', bloc: 'ingressos',
      celles: [{ tipus: 'text', valor: 'INGRESSOS', estil: 'barra' }, ...Array(7).fill({ tipus: 'text', valor: null, estil: 'barra' })]
    });
    expect(valors(full)[10][0]).toBe('GASTOS');
    expect(valors(full)[1]).toEqual(Array(8).fill(undefined));
  });

  test('capçaleres amb «Client» o «Proveïdor» segons el bloc', () => {
    expect(valors(full)[4]).toEqual(['Data', 'Núm', 'Client', 'NIF - CIF', 'Descripció', 'Subtotal', 'IVA', 'Total']);
    expect(valors(full)[11]).toEqual(['Data', 'Núm', 'Proveïdor', 'NIF - CIF', 'Descripció', 'Subtotal', 'IVA', 'Total']);
    expect(full.files[4].celles.every((cel) => cel.estil === 'capcalera')).toBe(true);
  });

  test('files de factura: tipus, estil de cada columna, ordre per data i id de la factura', () => {
    expect(full.files[5]).toEqual({
      rol: 'dada', bloc: 'ingressos', facturaId: v1.id,
      celles: [
        { tipus: 'data', valor: { a: 2026, m: 4, d: 15 }, estil: 'dada+data' },
        { tipus: 'text', valor: 'V-1', estil: 'dada' },
        { tipus: 'text', valor: 'Exemple Formació SCCL', estil: 'dada+ajust' },
        { tipus: 'text', valor: CIF_B, estil: 'dada' },
        { tipus: 'text', valor: 'Curs', estil: 'dada+ajust' },
        { tipus: 'import', valor: 123456, estil: 'dadaImport+import' },
        { tipus: 'import', valor: 25926, estil: 'dadaImport+import' },
        { tipus: 'import', valor: 149382, estil: 'dadaImport+import' }
      ]
    });
    expect(full.files[6].facturaId).toBe(v2.id);
    expect([full.files[12].facturaId, full.files[13].facturaId]).toEqual([f1.id, f2.id]);
    /* Import desconegut: cel·la buida que conserva l'estil. */
    expect(full.files[13].celles[6]).toEqual({ tipus: 'import', valor: null, estil: 'dadaImport+import' });
  });

  test('totals just després de l\'última factura: etiqueta, SUM del rang i valor calculat', () => {
    expect(full.files[7].celles).toEqual([
      null, null, null, null,
      { tipus: 'text', valor: 'Totals', estil: 'etiquetaTotal' },
      { tipus: 'import', valor: 173456, formula: 'SUM(F6:F7)', estil: 'total+import' },
      { tipus: 'import', valor: 36426, formula: 'SUM(G6:G7)', estil: 'total+import' },
      { tipus: 'import', valor: 209882, formula: 'SUM(H6:H7)', estil: 'total+import' }
    ]);
    expect(full.files[14].celles.slice(5).map((cel) => [cel.formula, cel.valor])).toEqual([
      ['SUM(F13:F14)', 20000], ['SUM(G13:G14)', 2100], ['SUM(H13:H14)', 24200]
    ]);
  });

  test('bloc buit: totals just després de la capçalera, a zero i sense fórmula ni fila de zeros', () => {
    const buit = maquetaFull(PLANTILLA_GESTORIA, { titular: 'X', any: 2026, t: 1, despeses: [factura({ data: { a: 2026, m: 2, d: 3 } })] });
    expect(rols(buit)).toEqual(['titol', 'buida', 'buida', 'barra', 'capcalera', 'totals', 'buida', 'buida', 'barra', 'capcalera', 'dada', 'totals']);
    const zero = { tipus: 'import', valor: 0, estil: 'total+import' };
    expect(buit.files[5].celles).toEqual([null, null, null, null, { tipus: 'text', valor: 'Totals', estil: 'etiquetaTotal' }, zero, zero, zero]);
    expect(buit.combinacions).toEqual(['A1:H1', 'A4:H4', 'A9:H9']);
    expect(buit.files[11].celles[5].formula).toBe('SUM(F11:F11)');
    expect(buit.files[0].celles[0].valor).toBe('X - 01/01/2026 - 31/03/2026 - 1T');
  });

  test('cap filtre amagat: el full conté el que rep, també fora del trimestre o d\'un altre tipus', () => {
    const fora = factura({ num: 'F-9', data: { a: 2026, m: 9, d: 1 } });
    const ingres = factura({ tipus: 'ingres', num: 'V-9' });
    const m = maquetaFull(PLANTILLA_GESTORIA, { titular: 'X', any: 2026, t: 2, despeses: [fora, ingres] });
    const dades = m.files.filter((fila) => fila.rol === 'dada');
    expect(dades.map((fila) => [fila.bloc, fila.facturaId])).toEqual([['despeses', ingres.id], ['despeses', fora.id]]);
    expect(dades[1].celles[0].valor).toEqual({ a: 2026, m: 9, d: 1 });
  });

  test('ordre: data ascendent i, el mateix dia, número amb les xifres com a números; sense data al final', () => {
    const llista = [
      factura({ num: 'F-3', data: { a: 2026, m: 6, d: 1 } }),
      factura({ num: 'F-0', data: null }),
      factura({ num: 'F-10', data: { a: 2026, m: 4, d: 2 } }),
      factura({ num: 'F-1', data: { a: 2026, m: 4, d: 2 } }),
      factura({ num: 'F-2', data: { a: 2026, m: 5, d: 9 } })
    ];
    const nums = (plantilla) => maquetaFull(plantilla, { titular: 'X', any: 2026, t: 2, despeses: llista })
      .files.filter((fila) => fila.rol === 'dada').map((fila) => fila.celles[1].valor);
    expect(nums(PLANTILLA_GESTORIA)).toEqual(['F-1', 'F-10', 'F-2', 'F-3', 'F-0']);
    expect(nums({ ...copia(PLANTILLA_GESTORIA), ordre: 'desc' })).toEqual(['F-3', 'F-2', 'F-10', 'F-1', 'F-0']);
  });

  test('any o trimestre no vàlids', () => {
    expect(() => maquetaFull(PLANTILLA_GESTORIA, { titular: 'X', any: 2026, t: 0 })).toThrow(RangeError);
    expect(() => maquetaFull(PLANTILLA_GESTORIA, { titular: 'X', any: 26, t: 1 })).toThrow(RangeError);
  });
});

describe('maquetaFull · el format canvia amb la plantilla, no amb el codi', () => {
  test('la plantilla verda antiga dona un altre full', () => {
    const contrapart = 'Exemple Clients amb un nom molt llarg de cooperativa SCCL';
    const full = maquetaFull(PLANTILLA_VERDA_ANTIGA, {
      titular: 'Exemple Titular', any: 2026, t: 2, ingressos: [factura({ tipus: 'ingres', num: 'V-1', contrapart })]
    });
    expect(rols(full)).toEqual([
      'fila', 'buida', 'titol', 'buida', 'barra', 'capcalera', 'dada', 'totals', 'buida', 'barra', 'capcalera', 'totals'
    ]);
    expect(valors(full)[0]).toEqual(['2026-FACTURACIO-Exemple_Titular', undefined, undefined, undefined, undefined, undefined, undefined, '2T']);
    expect(valors(full)[2][0]).toBe('Exemple Titular - 01/04/2026 - 30/06/2026');
    expect(valors(full)[4]).toEqual(['INGRESSOS', undefined, undefined, undefined, undefined, undefined, undefined, undefined]);
    expect(full.combinacions).toEqual(['A3:H3']);
    expect(full.font).toEqual({ nom: 'Calibri', mida: 11 });
    expect(full.estils.capcalera).toEqual({ negreta: true, colorLletra: 'FFFFFFFF', fons: 'FF0B6B2E', vora: 'fina' });
    /* Les columnes de text creixen amb el text més llarg, fins a 60 caràcters. */
    expect(full.columnes.map((c) => c.amplada)).toEqual([10, 12, contrapart.length + 2, 13, 36, 14, 12, 14]);
  });

  test('una plantilla feta a mà: columnes en un altre ordre, sense NIF, barra pròpia i fórmules que hi segueixen', () => {
    const p = copia(PLANTILLA_GESTORIA);
    const per = (clau) => p.columnes.find((columna) => columna.clau === clau);
    p.columnes = ['num', 'data', 'contrapart', 'descripcio', 'total', 'subtotal', 'iva'].map(per);
    p.estils.barra.fons = 'FF1F4E79';
    p.disposicio[3].barra = 'VENDES {n}T';
    const full = maquetaFull(p, { titular: 'X', any: 2026, t: 2, ingressos: [factura({ tipus: 'ingres' })] });
    expect(full.combinacions).toEqual(['A1:G1', 'A4:G4', 'A10:G10']);
    expect(valors(full)[3][0]).toBe('VENDES 2T');
    expect(full.estils.barra.fons).toBe('FF1F4E79');
    expect(valors(full)[4]).toEqual(['Núm', 'Data', 'Client', 'Descripció', 'Total', 'Subtotal', 'IVA']);
    expect(valors(full)[5]).toEqual(['F-1', { a: 2026, m: 4, d: 15 }, 'Exemple Energia SCCL', 'Subministrament', 12100, 10000, 2100]);
    expect(full.files[6].celles.map((cel) => cel?.formula ?? cel?.valor ?? null)).toEqual([
      null, null, null, 'Totals', 'SUM(E6:E6)', 'SUM(F6:F6)', 'SUM(G6:G6)'
    ]);
  });
});

describe('comprovaPlantilla', () => {
  test('les plantilles del repositori són vàlides i estan congelades', () => {
    expect(comprovaPlantilla(PLANTILLA_GESTORIA)).toBe(PLANTILLA_GESTORIA);
    expect(comprovaPlantilla(PLANTILLA_VERDA_ANTIGA)).toBe(PLANTILLA_VERDA_ANTIGA);
    expect(Object.isFrozen(PLANTILLA_GESTORIA.columnes[2].titol)).toBe(true);
    expect(Object.isFrozen(PLANTILLA_VERDA_ANTIGA.estils.capcalera)).toBe(true);
  });

  test('una plantilla mal feta es rebutja amb errors que diuen on', () => {
    const amb = (canvi) => {
      const p = copia(PLANTILLA_GESTORIA);
      canvi(p);
      return () => maquetaFull(p, { titular: 'X', any: 2026, t: 2 });
    };
    expect(amb((p) => { p.estils.barra.fons = 'negre'; })).toThrow(/estils\.barra\.fons: cal un color ARGB/);
    expect(amb((p) => { p.estils.titol.colorLletra = 'fff'; })).toThrow(TypeError);
    expect(amb((p) => { p.estils.dada.color = 'FF000000'; })).toThrow(/propietat desconeguda «color»/);
    expect(amb((p) => { p.estils.dada.alineacio = 'left'; })).toThrow(/estils\.dada\.alineacio/);
    expect(amb((p) => { p.disposicio[0].text = '{titular} {trimestre}'; })).toThrow(/marcador desconegut \{trimestre\}/);
    expect(amb((p) => { p.disposicio = p.disposicio.filter((peca) => peca.bloc !== 'despeses'); })).toThrow(/bloc despeses .*n'hi ha 0/);
    expect(amb((p) => { p.disposicio.push({ tipus: 'bloc', bloc: 'ingressos' }); })).toThrow(/bloc ingressos .*n'hi ha 2/);
    expect(amb((p) => { p.disposicio[3].estilBarra = 'inexistent'; })).toThrow(/disposicio\[3\]\.estilBarra: l'estil «inexistent» no existix/);
    expect(amb((p) => { p.disposicio.push({ tipus: 'grafic' }); })).toThrow(/tipus de peça desconegut «grafic»/);
    expect(amb((p) => { p.columnes[5].tipus = 'text'; })).toThrow(/columnes\[5\]: subtotal és de tipus 'import'/);
    expect(amb((p) => { p.columnes[1].clau = 'data'; })).toThrow(/clau «data» està repetida/);
    expect(amb((p) => { p.totals.columna = 'total'; })).toThrow(/totals\.columna/);
    expect(amb((p) => { p.formats.dataText = 'mm/dd/yy'; })).toThrow(/formats\.dataText/);
    expect(() => comprovaPlantilla(null)).toThrow(TypeError);
  });

  test('tots els errors alhora', () => {
    const p = copia(PLANTILLA_GESTORIA);
    p.estils.barra.fons = 'negre';
    p.nomFulla = '{x}';
    expect(() => comprovaPlantilla(p)).toThrow(/nomFulla: marcador desconegut \{x\}.*estils\.barra\.fons/);
  });
});

describe('fullACsv', () => {
  const unIngres = factura({
    tipus: 'ingres', num: 'F-1', contrapart: 'Exemple Energia, SCCL', descripcio: 'Servei', subtotal: 123456, iva: 25926, total: 149382
  });

  test('replica fila a fila el full de la gestoria, amb un bloc buit', () => {
    const full = maquetaFull(PLANTILLA_GESTORIA, { titular: 'Exemple Titular', any: 2026, t: 2, ingressos: [unIngres] });
    expect(linies(fullACsv(full))).toEqual([
      `${BOM}Exemple Titular - 01/04/2026 - 30/06/2026 - 2T,,,,,,,`,
      ',,,,,,,',
      ',,,,,,,',
      'INGRESSOS,,,,,,,',
      'Data,Núm,Client,NIF - CIF,Descripció,Subtotal,IVA,Total',
      `15/04/26,F-1,"Exemple Energia, SCCL",${CIF_A},Servei,"1.234,56 €","259,26 €","1.493,82 €"`,
      ',,,,Totals,"1.234,56 €","259,26 €","1.493,82 €"',
      ',,,,,,,',
      ',,,,,,,',
      'GASTOS,,,,,,,',
      'Data,Núm,Proveïdor,NIF - CIF,Descripció,Subtotal,IVA,Total',
      ',,,,Totals,"0,00 €","0,00 €","0,00 €"',
      ''
    ]);
  });

  test('mateixa estructura que el full maquetat: una fila per fila i un camp per columna', () => {
    const full = maquetaFull(PLANTILLA_GESTORIA, {
      titular: 'X', any: 2026, t: 2, ingressos: [unIngres], despeses: [factura(), factura({ num: 'F-2', descripcio: 'Dues\nlínies' })]
    });
    const files = parseCsv(fullACsv(full));
    expect(files).toHaveLength(full.files.length);
    expect(files.every((fila) => fila.length === 8)).toBe(true);
  });

  test('la plantilla verda antiga, fila a fila', () => {
    const full = maquetaFull(PLANTILLA_VERDA_ANTIGA, { titular: 'Exemple Titular', any: 2026, t: 2, ingressos: [unIngres] });
    expect(linies(fullACsv(full, { bom: false }))).toEqual([
      '2026-FACTURACIO-Exemple_Titular,,,,,,,2T',
      ',,,,,,,',
      'Exemple Titular - 01/04/2026 - 30/06/2026,,,,,,,',
      ',,,,,,,',
      'INGRESSOS,,,,,,,',
      'Data,Núm,Client,NIF - CIF,Descripció,Subtotal,IVA,Total',
      `15/04/26,F-1,"Exemple Energia, SCCL",${CIF_A},Servei,"1.234,56 €","259,26 €","1.493,82 €"`,
      ',,,,Totals,"1.234,56 €","259,26 €","1.493,82 €"',
      ',,,,,,,',
      'GASTOS,,,,,,,',
      'Data,Núm,Proveïdor,NIF - CIF,Descripció,Subtotal,IVA,Total',
      ',,,,Totals,"0,00 €","0,00 €","0,00 €"',
      ''
    ]);
  });

  test('opcions: sense BOM i amb LF', () => {
    const csv = fullACsv(maquetaFull(PLANTILLA_GESTORIA, { titular: 'X', any: 2026, t: 4 }), { bom: false, salt: '\n' });
    expect(csv.startsWith('X - 01/10/2026 - 31/12/2026 - 4T,,,,,,,\n,,,,,,,\n')).toBe(true);
    expect(csv.includes('\r')).toBe(false);
  });

  test('imports desconeguts buits, negatius i cometes dins del text', () => {
    const full = maquetaFull(PLANTILLA_GESTORIA, {
      titular: 'X', any: 2026, t: 2,
      despeses: [factura({ descripcio: 'Diu "hola"', subtotal: -1200, iva: -252, total: -1452 }), factura({ num: 'F-2', iva: null })]
    });
    const csv = linies(fullACsv(full, { bom: false }));
    expect(csv[10]).toBe(`15/04/26,F-1,Exemple Energia SCCL,${CIF_A},"Diu ""hola""","-12,00 €","-2,52 €","-14,52 €"`);
    expect(csv[11]).toBe(`15/04/26,F-2,Exemple Energia SCCL,${CIF_A},Subministrament,"100,00 €",,"121,00 €"`);
  });

  test('protecció contra fórmules als camps de text, també al títol', () => {
    const full = maquetaFull(PLANTILLA_GESTORIA, {
      titular: '=Exemple', any: 2026, t: 2,
      despeses: [factura({ num: '=1+1', contrapart: '@Exemple', nif: '+34', descripcio: '-descompte' })]
    });
    const csv = linies(fullACsv(full, { bom: false }));
    expect(csv[0]).toBe("'=Exemple - 01/04/2026 - 30/06/2026 - 2T,,,,,,,");
    expect(csv[10]).toBe(`15/04/26,'=1+1,'@Exemple,'+34,'-descompte,"100,00 €","21,00 €","121,00 €"`);
  });

  test('només accepta un full maquetat', () => {
    expect(() => fullACsv({ titol: 'vell', blocs: [] })).toThrow(TypeError);
  });
});

describe('llegeixModelCsv', () => {
  const ingressos = [
    factura({ tipus: 'ingres', num: '000123', contrapart: 'Exemple Clients, SL', nif: CIF_B, descripcio: 'Taller\nde dos dies', subtotal: 123456, iva: 25926, total: 149382 }),
    factura({ tipus: 'ingres', num: 'V-2', data: { a: 2026, m: 5, d: 2 }, descripcio: 'Diu "hola"; i adéu', subtotal: 50, iva: 11, total: 61 })
  ];
  const despeses = [
    factura({ num: '=SUMA(A1)', descripcio: '-descompte', subtotal: -1200, iva: -252, total: -1452 }),
    factura({ num: 'F-9', data: null, contrapart: 'Exemple Energia SCCL', subtotal: null }),
    factura({ num: "'=ja protegit", descripcio: "'text amb cometa", data: { a: 2026, m: 6, d: 30 } })
  ];

  for (const [nom, plantilla] of [['de la gestoria', PLANTILLA_GESTORIA], ['verda antiga', PLANTILLA_VERDA_ANTIGA]]) {
    test(`viatge d'anada i tornada amb la plantilla ${nom}: maqueta → CSV → llig → les mateixes factures`, () => {
      const full = maquetaFull(plantilla, { titular: 'Exemple Titular', any: 2026, t: 2, ingressos, despeses });
      const llegit = llegeixModelCsv(fullACsv(full), { fitxer: 'model.csv' });
      expect(llegit.avisos).toEqual([]);
      expect([llegit.any, llegit.t, llegit.titular]).toEqual([2026, 2, 'Exemple Titular']);
      expect(llegit.inici).toEqual({ a: 2026, m: 4, d: 1 });
      expect(llegit.fi).toEqual({ a: 2026, m: 6, d: 30 });
      expect(llegit.ingressos.map(camps)).toEqual(ordenaFactures(ingressos).map(camps));
      expect(llegit.despeses.map(camps)).toEqual(ordenaFactures(despeses).map(camps));
      expect(llegit.despeses[0].origen).toEqual({ fitxer: 'model.csv', metode: 'model' });
      expect(llegit.ingressos[0].confianca).toEqual({
        data: 'alta', num: 'alta', contrapart: 'alta', nif: 'alta', descripcio: 'alta', subtotal: 'alta', iva: 'alta', total: 'alta'
      });
    });
  }

  test('també torna des dels bytes (UTF-8 amb BOM) i amb un titular protegit', () => {
    const full = maquetaFull(PLANTILLA_GESTORIA, { titular: 'Àgora Exemple', any: 2026, t: 3, despeses: [factura({ data: { a: 2026, m: 8, d: 1 } })] });
    const llegit = llegeixModelCsv(new TextEncoder().encode(fullACsv(full)));
    expect([llegit.titular, llegit.any, llegit.t]).toEqual(['Àgora Exemple', 2026, 3]);
    expect(llegit.despeses).toHaveLength(1);
    expect(llegit.despeses[0].origen).toEqual({ fitxer: null, metode: 'model' });
    const protegit = llegeixModelCsv(fullACsv(maquetaFull(PLANTILLA_GESTORIA, { titular: '=Exemple', any: 2026, t: 2 })));
    expect(protegit.titular).toBe('=Exemple');
  });

  test('títol nou amb un trimestre que no és el de les dates', () => {
    const text = ['X - 01/04/2026 - 30/06/2026 - 3T,,,,,,,', 'GASTOS,,,,,,,', 'Data,Núm,Proveïdor'].join('\r\n');
    const llegit = llegeixModelCsv(text);
    expect([llegit.any, llegit.t]).toEqual([2026, 3]);
    expect(llegit.avisos.map((a) => a.codi)).toEqual(['PERIODE_INCOHERENT']);
  });

  test('format antic: punt i coma, DESPESES en minúscules i totals de 9 camps', () => {
    const text = [
      '2025-FACTURACIO-Exemple_Titular;;;;;;;4T',
      '',
      ';;;Exemple Titular - 01/10/2025 - 31/12/2025;;;;',
      '',
      'ingressos;;;;;;;',
      'Data;Núm;Client;NIF - CIF;Descripció;Subtotal;IVA;Total',
      ';;;;;Totals;0,00 €;0,00 €;0,00 €',
      '',
      'Despeses;;;;;;;',
      'Data;Núm;Proveïdor;NIF - CIF;Descripció;Subtotal;IVA;Total',
      `01/11/25;A-7;Exemple Serveis SL;${CIF_A};Quota;100,00 €;21,00 €;121,00 €`,
      `15/12/2025;A-8;Exemple Serveis SL;${CIF_A};Quota;1.000,00 €;210,00 €;1.210,00 €`,
      ';;;;;Totals;1.100,00 €;231,00 €;1.331,00 €'
    ].join('\n');
    const llegit = llegeixModelCsv(text);
    expect(llegit.avisos).toEqual([]);
    expect([llegit.any, llegit.t, llegit.titular]).toEqual([2025, 4, 'Exemple Titular']);
    expect(llegit.ingressos).toEqual([]);
    expect(llegit.despeses.map((f) => [f.num, f.data, f.total, f.tipus])).toEqual([
      ['A-7', { a: 2025, m: 11, d: 1 }, 12100, 'despesa'],
      ['A-8', { a: 2025, m: 12, d: 15 }, 121000, 'despesa']
    ]);
  });

  test('totals de 8 i 9 camps, també GASTOS en minúscules', () => {
    for (const totals of [',,,,Totals,"10,00 €","2,10 €","12,10 €"', ',,,,,Totals,"10,00 €","2,10 €","12,10 €"']) {
      const text = ['gastos,,,,,,,', 'Data,Núm,Proveïdor,NIF - CIF,Descripció,Subtotal,IVA,Total', `02/04/26,F-1,Exemple SL,${CIF_A},x,"10,00 €","2,10 €","12,10 €"`, totals].join('\r\n');
      const llegit = llegeixModelCsv(text);
      expect(llegit.avisos).toEqual([]);
      expect(llegit.despeses).toHaveLength(1);
    }
  });

  test('sense línies de secció: el tipus ix de la columna Client o Proveïdor', () => {
    const text = [
      'Data;Núm;Client;NIF - CIF;Descripció;Subtotal;IVA;Total',
      `01/02/26;V-1;Exemple Clients SL;${CIF_A};Servei;100,00 €;21,00 €;121,00 €`,
      'Data;Núm;Proveïdor;NIF - CIF;Descripció;Subtotal;IVA;Total',
      `03/02/26;A-7;Exemple Serveis SL;${CIF_A};Quota;10,00 €;2,10 €;12,10 €`
    ].join('\n');
    const llegit = llegeixModelCsv(text);
    expect(llegit.ingressos.map((f) => f.num)).toEqual(['V-1']);
    expect(llegit.despeses.map((f) => f.num)).toEqual(['A-7']);
    expect([llegit.any, llegit.t, llegit.titular, llegit.inici]).toEqual([null, null, '', null]);
  });

  test('columnes en un altre ordre es lligen pel nom', () => {
    const text = [
      'GASTOS',
      'Data,Total,Proveïdor,Núm',
      '05/04/26,"12,10 €",Exemple SL,F-1'
    ].join('\n');
    const [f] = llegeixModelCsv(text).despeses;
    expect([f.num, f.contrapart, f.total, f.subtotal]).toEqual(['F-1', 'Exemple SL', 1210, null]);
  });

  test('avisos: totals que no quadren, data i import il·legibles, files fora de bloc', () => {
    const text = [
      'una nota solta',
      'GASTOS,,,,,,,',
      'Data,Núm,Proveïdor,NIF - CIF,Descripció,Subtotal,IVA,Total',
      `32/13/26,F-1,Exemple SL,${CIF_A},x,"10,00 €","2,10 €","12,10 €"`,
      `02/04/26,F-2,Exemple SL,${CIF_A},x,"10,00 €","2,10 €","dotze"`,
      ',,,només una nota,,,,',
      ',,,,Totals,"999,00 €","4,20 €","24,20 €"'
    ].join('\r\n');
    const llegit = llegeixModelCsv(text, { fitxer: 'vell.csv' });
    expect(llegit.avisos.map((a) => a.codi)).toEqual(['FILA_FORA_DE_BLOC', 'DATA_ILLEGIBLE', 'IMPORT_ILLEGIBLE', 'FILA_SENSE_DADES']);
    expect(llegit.avisos.every((a) => a.fitxer === 'vell.csv' && typeof a.missatge === 'string')).toBe(true);
    expect(llegit.despeses.map((f) => [f.num, f.data, f.total])).toEqual([['F-1', null, 1210], ['F-2', { a: 2026, m: 4, d: 2 }, null]]);

    const quadra = llegeixModelCsv([
      'GASTOS',
      'Data,Núm,Proveïdor,NIF - CIF,Descripció,Subtotal,IVA,Total',
      `02/04/26,F-2,Exemple SL,${CIF_A},x,"10,00 €","2,10 €","12,10 €"`,
      ',,,,Totals,"999,00 €","2,10 €","12,10 €"'
    ].join('\n'));
    expect(quadra.avisos).toEqual([expect.objectContaining({ codi: 'TOTALS_NO_QUADREN', severitat: 'mitjana' })]);
    expect(quadra.avisos[0].missatge).toContain('999,00 €');
  });

  test('un fitxer que no és un full de la gestoria', () => {
    const llegit = llegeixModelCsv('nom,correu\nExemple,info@example.org\n');
    expect(llegit.avisos.map((a) => a.codi)).toEqual(['FILA_FORA_DE_BLOC', 'FILA_FORA_DE_BLOC', 'MODEL_SENSE_CAPCALERA']);
    expect(llegit.ingressos).toEqual([]);
    expect(llegit.despeses).toEqual([]);
    expect(llegeixModelCsv('').avisos.map((a) => a.codi)).toEqual(['MODEL_SENSE_CAPCALERA']);
  });

  test('període de la capçalera que no és el del trimestre del títol', () => {
    const text = ['2026-FACTURACIO-X,,,,,,,2T', ',,,X - 01/01/2026 - 31/03/2026,,,,', 'GASTOS', 'Data,Núm,Proveïdor'].join('\n');
    expect(llegeixModelCsv(text).avisos.map((a) => a.codi)).toEqual(['PERIODE_INCOHERENT']);
  });
});
