// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { fullaACsv, modelACsv, protegeixFormula, serialitzaCsv, SEPARADOR_CSV, TIPUS_MIME_CSV } from './csv.js';

const BOM = String.fromCharCode(0xfeff);

const FULLA = {
  nom: 'Diari',
  columnes: [
    { titol: 'Data', tipus: 'data' },
    { titol: 'Hora', tipus: 'hora' },
    { titol: 'Begut (ml)', tipus: 'nombre' },
    { titol: 'Ràtio', tipus: 'decimal' },
    { titol: 'Import', tipus: 'import' },
    { titol: 'Notes', tipus: 'text' }
  ],
  files: [
    ['2026-10-02', '07:30', 250, 1.5, 123456, 'Aigua; després "infusió"'],
    ['2026-10-02', '23:05', null, null, -250, '=HYPERLINK("x")'],
    ['2026-10-03', '', 0, 0, 0, 'línia 1\nlínia 2']
  ]
};

describe('protegeixFormula', () => {
  test('anteposa una cometa simple a = + - @, tabulador i retorn', () => {
    for (const perillos of ['=1+1', '+34 600', '-2', '@SUMA(A1)', '\tx', '\rx']) expect(protegeixFormula(perillos)).toBe(`'${perillos}`);
  });

  test('la resta, tal qual; null és buit', () => {
    expect(protegeixFormula('Aigua')).toBe('Aigua');
    expect(protegeixFormula(' =no comença per =')).toBe(' =no comença per =');
    expect(protegeixFormula(null)).toBe('');
    expect(protegeixFormula(12)).toBe('12');
  });
});

describe('fullaACsv', () => {
  const csv = fullaACsv(FULLA);
  const linies = csv.slice(1).split('\r\n');

  test('BOM, punt i coma, CRLF al final de cada fila, també de l’última', () => {
    expect(csv.startsWith(BOM)).toBe(true);
    expect(csv.endsWith('\r\n')).toBe(true);
    expect(SEPARADOR_CSV).toBe(';');
    expect(TIPUS_MIME_CSV).toBe('text/csv;charset=utf-8');
    expect(linies[0]).toBe('Data;Hora;Begut (ml);Ràtio;Import;Notes');
  });

  test('cada tipus com l’entén un full en valencià', () => {
    expect(linies[1]).toBe('02/10/2026;07:30;250;1,50;1234,56;"Aigua; després ""infusió"""');
  });

  test('protegix el text que pareix una fórmula i deixa els imports negatius com a nombre', () => {
    expect(linies[2]).toBe('02/10/2026;23:05;;;-2,50;"\'=HYPERLINK(""x"")"');
  });

  test('un salt de línia dins d’un text va entre cometes', () => {
    expect(csv).toContain('03/10/2026;;0;0,00;0,00;"línia 1\nlínia 2"\r\n');
  });

  test('sense BOM ni capçalera, per a concatenar', () => {
    const sol = fullaACsv(FULLA, { bom: false, capcalera: false });
    expect(sol.startsWith('02/10/2026')).toBe(true);
  });

  test('els títols també es protegixen', () => {
    const titol = fullaACsv({ nom: 'X', columnes: [{ titol: '-Total', tipus: 'nombre' }], files: [] });
    expect(titol).toBe(`${BOM}'-Total\r\n`);
  });

  test('un valor d’un altre tipus diu on és', () => {
    expect(() => fullaACsv({ ...FULLA, files: [['2026-10-02', '7:30']] })).toThrow(/fulla «Diari», fila 1: la columna «Hora»/);
  });
});

describe('modelACsv i serialitzaCsv', () => {
  test('modelACsv tria la fulla pel nom', () => {
    const model = { fulles: [{ nom: 'Resum', columnes: [{ titol: 'A', tipus: 'text' }], files: [['x']] }, FULLA] };
    expect(modelACsv(model, 'Diari')).toBe(fullaACsv(FULLA));
    expect(() => modelACsv(model, 'No')).toThrow(RangeError);
  });

  test('un text amb coma o tabulador va entre cometes: un lector que separe per comes no hi troba cap fórmula', () => {
    expect(serialitzaCsv([['x,=1+1', 'a\t=b', 'x,@SUMA(A1)', 'sense']], { bom: false })).toBe('"x,=1+1";"a\t=b";"x,@SUMA(A1)";sense\r\n');
    const fulla = { nom: 'X', columnes: [{ titol: 'Nota, lliure', tipus: 'text' }, { titol: 'Import', tipus: 'import' }, { titol: 'Ràtio', tipus: 'decimal' }], files: [['x,=1+1', 150, 1.5]] };
    /* Els nombres que escriu el mòdul porten coma decimal i no van entre cometes. */
    expect(fullaACsv(fulla, { bom: false })).toBe('"Nota, lliure";Import;Ràtio\r\n"x,=1+1";1,50;1,50\r\n');
  });

  test('serialitzaCsv protegix els textos i escriu els nombres amb coma', () => {
    expect(serialitzaCsv([['a', '=b', 1.5, -2, null, undefined], ['x;y']])).toBe(`${BOM}a;'=b;1,5;-2;;\r\n"x;y"\r\n`);
    expect(serialitzaCsv([], { bom: false })).toBe('');
    expect(() => serialitzaCsv('a')).toThrow(TypeError);
  });
});
