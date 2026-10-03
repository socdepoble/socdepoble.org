// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { fullaACsv, llegixCsv, modelACsv, protegeixFormula, serialitzaCsv, SEPARADOR_CSV, TIPUS_MIME_CSV } from './csv.js';

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

describe('llegixCsv', () => {
  test('RFC 4180: cometes doblades, delimitadors i salts de línia dins de cometes', () => {
    const text = 'Handle,Nom,Preu\nfixa,"Producte ""fix"", gran","1.50"\nmulti,"línia 1\r\nlínia 2",2.00\n';
    expect(llegixCsv(text)).toEqual([
      ['Handle', 'Nom', 'Preu'],
      ['fixa', 'Producte "fix", gran', '1.50'],
      ['multi', 'línia 1\r\nlínia 2', '2.00']
    ]);
  });

  test('BOM fora; CRLF, LF i CR; el salt final no afig cap fila i una línia buida és [\'\']', () => {
    expect(llegixCsv(`${BOM}a;b\r\nc;d\r\n`)).toEqual([['a', 'b'], ['c', 'd']]);
    expect(llegixCsv('a,b\rc,d')).toEqual([['a', 'b'], ['c', 'd']]);
    expect(llegixCsv('a\n\nb\n')).toEqual([['a'], [''], ['b']]);
    expect(llegixCsv('a,\n')).toEqual([['a', '']]);
    expect(llegixCsv('')).toEqual([]);
  });

  test('detecta el delimitador (coma, punt i coma o tabulador) sense comptar el que hi ha entre cometes', () => {
    expect(llegixCsv('Data;Import;Nota\n02/10/2026;1,50;"a, b, c, d"\n')).toEqual([['Data', 'Import', 'Nota'], ['02/10/2026', '1,50', 'a, b, c, d']]);
    expect(llegixCsv('a\tb\tc\n1\t2\t3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
    expect(llegixCsv('"x;y;z",1\n"p;q",2')).toEqual([['x;y;z', '1'], ['p;q', '2']]);
    expect(llegixCsv('sense delimitador')).toEqual([['sense delimitador']]);
  });

  test('la coma decimal no és el delimitador: el CSV d’un full en valencià i el que escriu este mòdul', () => {
    /* Més comes (decimals i dins d'un text sense cometes) que punts i coma. */
    expect(llegixCsv('Producte;Preu\nPa de motle, integral;1,20\nOli, verge extra;5,40\n')).toEqual([
      ['Producte', 'Preu'], ['Pa de motle, integral', '1,20'], ['Oli, verge extra', '5,40']
    ]);
    /* Tantes comes com punts i coma: guanya el punt i coma, perquè les comes van entre xifres. */
    expect(llegixCsv(serialitzaCsv([[1.5, 2.5], [3.5, 4.5]]))).toEqual([['1,5', '2,5'], ['3,5', '4,5']]);
    const decimals = { nom: 'X', columnes: [{ titol: 'Ràtio', tipus: 'decimal' }, { titol: 'Pes', tipus: 'decimal' }], files: [[1.5, 0.25]] };
    expect(llegixCsv(fullaACsv(decimals))).toEqual([['Ràtio', 'Pes'], ['1,50', '0,25']]);
    const imports = { nom: 'X', columnes: [{ titol: 'Import', tipus: 'import' }, { titol: 'Ràtio', tipus: 'decimal' }], files: [[150, 1.5], [250, 2.5]] };
    expect(llegixCsv(fullaACsv(imports))).toEqual([['Import', 'Ràtio'], ['1,50', '1,50'], ['2,50', '2,50']]);
    /* Una sola columna de nombres amb coma decimal: no es partix. */
    expect(llegixCsv('Import\n1,50\n')).toEqual([['Import'], ['1,50']]);
    expect(llegixCsv('Import\n1,50\n2,50\n')).toEqual([['Import'], ['1,50'], ['2,50']]);
  });

  test('la coma continua guanyant on és el delimitador', () => {
    /* Empat sense comes entre xifres: la coma. */
    expect(llegixCsv('a,b;c')).toEqual([['a', 'b;c']]);
    /* Com un CSV de Loyverse: punt decimal, i comes entre xifres que sí que separen. */
    expect(llegixCsv('Handle,Preu,Cost\ncafe,1.50,0.40\naigua,1,0\n')).toEqual([['Handle', 'Preu', 'Cost'], ['cafe', '1.50', '0.40'], ['aigua', '1', '0']]);
    /* Una fila amb menys camps no canvia el delimitador de la capçalera. */
    expect(llegixCsv('a,b,c\n1,2\n3,4,5\n')).toEqual([['a', 'b', 'c'], ['1', '2'], ['3', '4', '5']]);
    /* Una primera línia sense delimitador (un títol): el que més es repetix després, sense les comes entre xifres. */
    expect(llegixCsv('Informe\nData,Nota\n02/10/2026,x\n')).toEqual([['Informe'], ['Data', 'Nota'], ['02/10/2026', 'x']]);
    expect(llegixCsv('Informe\nData;Import\n02/10/2026;1,50\n03/10/2026;2,50\n')).toEqual([
      ['Informe'], ['Data', 'Import'], ['02/10/2026', '1,50'], ['03/10/2026', '2,50']
    ]);
  });

  test('un delimitador triat a mà mana; un de no vàlid llança', () => {
    expect(llegixCsv('a;b,c', { delimitador: ',' })).toEqual([['a;b', 'c']]);
    expect(llegixCsv('a;b,c', { delimitador: ';' })).toEqual([['a', 'b,c']]);
    expect(() => llegixCsv('a', { delimitador: '|' })).toThrow(RangeError);
  });

  test('tolerància: una cometa a mitjan camp és un caràcter més; una sense tancar s’emporta la resta', () => {
    expect(llegixCsv('a"b,c\n')).toEqual([['a"b', 'c']]);
    expect(llegixCsv('a,"b\nc,d')).toEqual([['a', 'b\nc,d']]);
  });

  test('anada i tornada amb serialitzaCsv i fullaACsv d’este mateix mòdul', () => {
    const files = [['Nota, lliure', 'línia 1\nlínia 2', '"cometes"', '']];
    expect(llegixCsv(serialitzaCsv(files))).toEqual(files);
    expect(llegixCsv(fullaACsv(FULLA))[1]).toEqual(['02/10/2026', '07:30', '250', '1,50', '1234,56', 'Aigua; després "infusió"']);
  });

  test('accepta els bytes del fitxer: UTF-8, UTF-16LE amb BOM i, si no és UTF-8, windows-1252', () => {
    const utf8 = new TextEncoder().encode('Cafè;Aigua;Te\n1,20;0,80;1,10\n');
    const esperat = [['Cafè', 'Aigua', 'Te'], ['1,20', '0,80', '1,10']];
    expect(llegixCsv(utf8)).toEqual(esperat);
    expect(llegixCsv(utf8.slice().buffer)).toEqual(esperat);
    const utf16 = new Uint8Array(Buffer.from(`${BOM}Cafè;Te`, 'utf16le'));
    expect(utf16[0]).toBe(0xff);
    expect(llegixCsv(utf16)).toEqual([['Cafè', 'Te']]);
    /* «Cafè;3 €» en windows-1252: è és 0xE8 i € és 0x80. */
    const ansi = new Uint8Array([0x43, 0x61, 0x66, 0xe8, 0x3b, 0x33, 0x20, 0x80]);
    expect(llegixCsv(ansi)).toEqual([['Cafè', '3 €']]);
    expect(() => llegixCsv(12)).toThrow(TypeError);
    expect(() => llegixCsv(null)).toThrow(TypeError);
  });
});
