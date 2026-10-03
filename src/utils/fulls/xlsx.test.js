// @vitest-environment jsdom
/* L'XLSX es llig com el llegiria un full: el ZIP amb llegeixZip, cada part
   amb el DOMParser (XML ben format) i les cel·les per referència. Dades
   sintètiques. */
import { describe, expect, test } from 'vitest';
import { creaXlsx, TIPUS_MIME_XLSX } from './xlsx.js';
import { llegeixZip } from './zip.js';

const MODEL = {
  fulles: [
    {
      nom: 'Resum & dades',
      columnes: [
        { titol: 'Data', tipus: 'data' },
        { titol: 'Hora', tipus: 'hora' },
        { titol: 'Unitats', tipus: 'nombre' },
        { titol: 'Mitjana', tipus: 'decimal', decimals: 1 },
        { titol: 'Import', tipus: 'import' },
        { titol: 'Nota', tipus: 'text', amplada: 30 }
      ],
      files: [
        ['2024-01-01', '07:30', 12, 2.5, 123456, '=SUMA(A1:A9)'],
        ['1899-12-31', '23:59:59', null, null, -5, '007'],
        [],
        ['2026-10-02', '', 0, -0, 0, 'Text amb _x0041_ i un control\u0001']
      ]
    },
    { nom: 'Buida', columnes: [{ titol: 'Res', tipus: 'text' }], files: [] }
  ]
};

const BYTES = creaXlsx(MODEL);
const PARTS = new Map(llegeixZip(BYTES).map(({ nom, dades }) => [nom, new TextDecoder('utf-8', { fatal: true }).decode(dades)]));

function xml(nom) {
  const doc = new DOMParser().parseFromString(PARTS.get(nom), 'application/xml');
  expect(doc.getElementsByTagName('parsererror'), nom).toHaveLength(0);
  return doc;
}

const cadenes = [...xml('xl/sharedStrings.xml').getElementsByTagName('si')].map((si) => si.textContent);

function cella(fullaXml, ref) {
  const c = [...fullaXml.getElementsByTagName('c')].find((el) => el.getAttribute('r') === ref);
  if (!c) return null;
  const v = c.getElementsByTagName('v')[0]?.textContent ?? null;
  return {
    t: c.getAttribute('t'),
    s: c.getAttribute('s'),
    valor: c.getAttribute('t') === 's' ? cadenes[Number(v)] : v,
    formula: c.getElementsByTagName('f').length > 0
  };
}

describe('el paquet', () => {
  test('les parts esperades, en ordre, i totes ben formades', () => {
    expect([...PARTS.keys()]).toEqual([
      '[Content_Types].xml', '_rels/.rels', 'docProps/app.xml', 'docProps/core.xml', 'xl/workbook.xml',
      'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/sharedStrings.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml'
    ]);
    for (const nom of PARTS.keys()) xml(nom);
    expect(TIPUS_MIME_XLSX).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });

  test('determinista: el mateix model dona els mateixos bytes', () => {
    expect(creaXlsx(MODEL)).toEqual(BYTES);
  });

  test('les propietats no tenen autor, títol ni dates: només l’aplicació', () => {
    const totes = PARTS.get('docProps/core.xml') + PARTS.get('docProps/app.xml');
    expect(totes).not.toMatch(/creator|lastModifiedBy|created|modified|title|dcterms|dc:/i);
    expect(xml('docProps/app.xml').getElementsByTagName('Application')[0].textContent).toBe('Sóc de Poble');
  });

  test('cap adreça fora dels espais de noms d’OOXML', () => {
    const hosts = new Set();
    for (const text of PARTS.values()) for (const m of text.matchAll(/https?:\/\/([^/\s"'<>]+)/g)) hosts.add(m[1]);
    expect([...hosts]).toEqual(['schemas.openxmlformats.org']);
  });

  test('el llibre: dues fulles amb el nom escapat i les relacions que els corresponen', () => {
    const fulles = [...xml('xl/workbook.xml').getElementsByTagName('sheet')];
    expect(fulles.map((f) => [f.getAttribute('name'), f.getAttribute('sheetId'), f.getAttribute('r:id')]))
      .toEqual([['Resum & dades', '1', 'rId1'], ['Buida', '2', 'rId2']]);
    const rels = [...xml('xl/_rels/workbook.xml.rels').getElementsByTagName('Relationship')].map((r) => [r.getAttribute('Id'), r.getAttribute('Target')]);
    expect(rels).toEqual([['rId1', 'worksheets/sheet1.xml'], ['rId2', 'worksheets/sheet2.xml'], ['rId3', 'styles.xml'], ['rId4', 'sharedStrings.xml']]);
    const overrides = [...xml('[Content_Types].xml').getElementsByTagName('Override')].map((o) => o.getAttribute('PartName'));
    expect(overrides).toContain('/xl/worksheets/sheet2.xml');
  });
});

describe('les cel·les', () => {
  const fulla = xml('xl/worksheets/sheet1.xml');
  const estils = xml('xl/styles.xml');
  const formats = new Map([...estils.getElementsByTagName('numFmt')].map((n) => [n.getAttribute('numFmtId'), n.getAttribute('formatCode')]));
  const xfs = [...estils.getElementsByTagName('cellXfs')[0].getElementsByTagName('xf')];
  const formatDe = (s) => {
    const id = xfs[Number(s)].getAttribute('numFmtId');
    return formats.get(id) ?? { 1: '0', 2: '0.00' }[id] ?? 'General';
  };

  test('la capçalera en negreta, fixada a dalt', () => {
    expect(['A1', 'B1', 'F1'].map((ref) => cella(fulla, ref).valor)).toEqual(['Data', 'Hora', 'Nota']);
    expect(cella(fulla, 'A1').s).toBe('1');
    expect(xfs[1].getAttribute('fontId')).toBe('1');
    expect(estils.getElementsByTagName('font')[1].getElementsByTagName('b')).toHaveLength(1);
    expect(fulla.getElementsByTagName('pane')[0].getAttribute('state')).toBe('frozen');
  });

  test('cada tipus amb el seu valor i el seu format', () => {
    expect(cella(fulla, 'A2')).toMatchObject({ t: null, valor: '45292' });
    expect(formatDe(cella(fulla, 'A2').s)).toBe('dd/mm/yyyy');
    expect(cella(fulla, 'B2').valor).toBe('0.3125');
    expect(formatDe(cella(fulla, 'B2').s)).toBe('hh:mm');
    expect(cella(fulla, 'C2').valor).toBe('12');
    expect(formatDe(cella(fulla, 'C2').s)).toBe('0');
    expect(cella(fulla, 'D2').valor).toBe('2.5');
    expect(formatDe(cella(fulla, 'D2').s)).toBe('0.0');
    expect(cella(fulla, 'E2').valor).toBe('1234.56');
    expect(formatDe(cella(fulla, 'E2').s)).toBe('#,##0.00\\ "€"');
  });

  test('un text que pareix una fórmula és text: mai una fórmula', () => {
    expect(cella(fulla, 'F2')).toMatchObject({ t: 's', valor: '=SUMA(A1:A9)', formula: false });
    expect(fulla.getElementsByTagName('f')).toHaveLength(0);
    expect(cella(fulla, 'F3').valor).toBe('007');
  });

  test('una data d’abans de 1900 va com a text; els buits no s’escriuen', () => {
    expect(cella(fulla, 'A3')).toMatchObject({ t: 's', valor: '31/12/1899' });
    expect(cella(fulla, 'C3')).toBeNull();
    expect(cella(fulla, 'E3').valor).toBe('-0.05');
    expect(cella(fulla, 'B5')).toBeNull();
    expect([...fulla.getElementsByTagName('row')].map((r) => r.getAttribute('r'))).toEqual(['1', '2', '3', '5']);
    expect(fulla.getElementsByTagName('dimension')[0].getAttribute('ref')).toBe('A1:F5');
  });

  test('zeros i -0 són zeros; el text perd els caràcters prohibits i escapa _xHHHH_', () => {
    expect(cella(fulla, 'C5').valor).toBe('0');
    expect(cella(fulla, 'D5').valor).toBe('0');
    expect(cella(fulla, 'E5').valor).toBe('0.00');
    expect(cella(fulla, 'F5').valor).toBe('Text amb _x005F_x0041_ i un control');
  });

  test('l’amplada declarada es respecta', () => {
    const cols = [...fulla.getElementsByTagName('col')];
    expect(cols).toHaveLength(6);
    expect(Number(cols[5].getAttribute('width'))).toBeCloseTo(30.71, 1);
  });

  test('la fulla buida només porta la capçalera', () => {
    const buida = xml('xl/worksheets/sheet2.xml');
    expect(buida.getElementsByTagName('row')).toHaveLength(1);
    expect(cella(buida, 'A1').valor).toBe('Res');
  });
});

describe('errors', () => {
  test('un model mal fet no s’escriu', () => {
    expect(() => creaXlsx({ fulles: [] })).toThrow(TypeError);
    expect(() => creaXlsx(null)).toThrow(TypeError);
  });

  test('dues fulles que només es distingixen per un caràcter de control no ixen totes dues com «A»', () => {
    const fulla = (nom) => ({ nom, columnes: [{ titol: 'X', tipus: 'text' }], files: [] });
    expect(() => creaXlsx({ fulles: [fulla('A'), fulla('A\u0001')] })).toThrow(/caràcters de control/);
    expect(() => creaXlsx({ fulles: [fulla('\u0001')] })).toThrow(TypeError);
  });

  test('un valor d’un altre tipus diu la fulla, la fila i la columna', () => {
    const dolent = { fulles: [{ nom: 'Diari', columnes: [{ titol: 'Import', tipus: 'import' }], files: [[100], [1.5]] }] };
    expect(() => creaXlsx(dolent)).toThrow('fulla «Diari», fila 2: la columna «Import» (import) espera cèntims enters.');
  });
});
