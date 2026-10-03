// @vitest-environment node
/* utils/fulls · lector: llibres XLSX sintètics fets amb XML a mà (com els
   d'Excel, LibreOffice o Numbers) i amb creaXlsx d'este mateix mòdul, en
   STORE i en DEFLATE. Els tipus de relació porten un prefix inventat: el
   lector només en mira el final. Totes les dades són inventades. */
import { describe, expect, test } from 'vitest';
import { zipAmbDeflate } from './__fixtures__/zipAmbDeflate.js';
import { llegixLlibre } from './lector.js';
import { creaXlsx } from './xlsx.js';
import { creaZip, llegeixZip } from './zip.js';

const REL = 'urn:sdp-prova:relacions';
const relacio = (id, tipus, desti) => `<Relationship Id="${id}" Type="${REL}/${tipus}" Target="${desti}"/>`;
const rels = (...relacions) => `<Relationships>${relacions.join('')}</Relationships>`;
const fulla = (files, extra = '') => `<worksheet><sheetData>${files}</sheetData>${extra}</worksheet>`;
/* Estils: els formats propis i, per a cada estil de cel·la, el numFmtId. Els
   cellStyleXfs van davant perquè el lector no els confonga amb els cellXfs. */
const escapaAtribut = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const estils = (formats, ids) => `<numFmts count="${formats.length}">${formats.map(([id, codi]) => `<numFmt numFmtId="${id}" formatCode="${escapaAtribut(codi)}"/>`).join('')}</numFmts>`
  + '<cellStyleXfs count="1"><xf numFmtId="14" fontId="0"/></cellStyleXfs>'
  + `<cellXfs count="${ids.length}">${ids.map((id) => `<xf numFmtId="${id}" fontId="0" applyNumberFormat="1"/>`).join('')}</cellXfs>`;
/* Brossa en lloc de DEFLATE: si el lector la descomprimira, llançaria. */
const BROSSA = new Uint8Array([0xff, 0xff, 0xff]);

/* Un llibre fet a mà: les fulles ({ nom, xml, tipus?, crues? }) van a xl/worksheets/sheetN.xml. */
function llibreFet({ fulles, cadenes = [], estil = '', date1904 = false, extres = [], metode = 8 }) {
  const entrades = [
    { nom: '[Content_Types].xml', dades: '<Types/>' },
    { nom: '_rels/.rels', dades: rels(relacio('rId1', 'officeDocument', 'xl/workbook.xml'), relacio('rId2', 'metadata/core-properties', 'docProps/core.xml')) },
    {
      nom: 'xl/workbook.xml',
      dades: `<workbook>${date1904 ? '<workbookPr date1904="1"/>' : '<workbookPr/>'}<sheets>`
        + `${fulles.map((f, i) => `<sheet name="${f.nom}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`
    },
    {
      nom: 'xl/_rels/workbook.xml.rels',
      dades: rels(...fulles.map((f, i) => relacio(`rId${i + 1}`, f.tipus ?? 'worksheet', `worksheets/sheet${i + 1}.xml`)),
        relacio('rIdE', 'styles', 'styles.xml'), relacio('rIdC', 'sharedStrings', 'sharedStrings.xml'), relacio('rIdT', 'theme', 'theme/theme1.xml'))
    },
    { nom: 'xl/styles.xml', dades: `<styleSheet>${estil}</styleSheet>` },
    { nom: 'xl/sharedStrings.xml', dades: `<sst count="${cadenes.length}">${cadenes.join('')}</sst>` },
    ...fulles.map((f, i) => ({ nom: `xl/worksheets/sheet${i + 1}.xml`, dades: f.xml, crues: f.crues })),
    ...extres
  ];
  return zipAmbDeflate(entrades.map((e) => ({ metode, ...e })));
}

const cella = (full, ref) => full.celles.find((c) => c.ref === ref);
const resum = (full) => full.celles.map((c) => [c.ref, c.tipus, c.valor, c.format]);

describe('anada i tornada amb creaXlsx', () => {
  const MODEL = {
    fulles: [
      {
        nom: 'Diari',
        columnes: [
          { titol: 'Data', tipus: 'data' }, { titol: 'Hora', tipus: 'hora' }, { titol: 'Begut (ml)', tipus: 'nombre' },
          { titol: 'Ràtio', tipus: 'decimal' }, { titol: 'Import', tipus: 'import' }, { titol: 'Notes', tipus: 'text' }
        ],
        files: [
          ['2026-10-02', '07:30', 250, 1.5, 123456, 'Aigua & "infusió" <tèbia>'],
          ['2026-10-03', '23:05:10', null, null, -250, 'codi _x0041_ literal\namb salt']
        ]
      },
      { nom: 'Resum', columnes: [{ titol: 'Total', tipus: 'nombre' }], files: [[3]] }
    ]
  };

  test('cada tipus torna com era (STORE, com el fa creaXlsx)', () => {
    const llibre = llegixLlibre(creaXlsx(MODEL));
    expect(llibre.date1904).toBe(false);
    expect(llibre.fulles.map((f) => f.nom)).toEqual(['Diari', 'Resum']);
    const [diari, total] = llibre.fulles;
    expect(diari.combinacions).toEqual([]);
    expect(resum(diari)).toEqual([
      ['A1', 'text', 'Data', 'General'], ['B1', 'text', 'Hora', 'General'], ['C1', 'text', 'Begut (ml)', 'General'],
      ['D1', 'text', 'Ràtio', 'General'], ['E1', 'text', 'Import', 'General'], ['F1', 'text', 'Notes', 'General'],
      ['A2', 'data', '2026-10-02', 'dd/mm/yyyy'], ['B2', 'hora', '07:30', 'hh:mm'], ['C2', 'nombre', 250, '0'],
      ['D2', 'nombre', 1.5, '0.00'], ['E2', 'nombre', 1234.56, '#,##0.00\\ "€"'], ['F2', 'text', 'Aigua & "infusió" <tèbia>', 'General'],
      ['A3', 'data', '2026-10-03', 'dd/mm/yyyy'], ['B3', 'hora', '23:05:10', 'hh:mm'], ['E3', 'nombre', -2.5, '#,##0.00\\ "€"'],
      ['F3', 'text', 'codi _x0041_ literal\namb salt', 'General']
    ]);
    expect(cella(diari, 'C2')).toEqual({ fila: 2, col: 2, ref: 'C2', tipus: 'nombre', valor: 250, formula: null, format: '0' });
    expect(resum(total)).toEqual([['A1', 'text', 'Total', 'General'], ['A2', 'nombre', 3, '0']]);
  });

  test('el mateix llibre en DEFLATE (com el desa Excel) dona exactament el mateix', () => {
    const store = creaXlsx(MODEL);
    const deflate = zipAmbDeflate(llegeixZip(store).map(({ nom, dades }) => ({ nom, dades })));
    expect(deflate.length).toBeLessThan(store.length);
    expect(llegixLlibre(deflate)).toEqual(llegixLlibre(store));
    expect(llegixLlibre(deflate.slice().buffer)).toEqual(llegixLlibre(store));
  });
});

describe('un llibre com el que exporta Numbers', () => {
  const CADENES = [
    '<si><r><rPr><b/></rPr><t>LÍQUID</t></r><r><t xml:space="preserve"> INGERIT</t></r><rPh sb="0" eb="6"><t>fonètica</t></rPh><phoneticPr fontId="1"/></si>',
    '<si><t>Aigua &amp; cafè</t></si>',
    '<si><t>a_x005F_x0041_b_x000A_c</t></si>',
    '<si><t/></si>',
    '<si><t><![CDATA[<dins> & fora]]></t></si>'
  ];
  /* Estils: 0 General (Numbers el declara com a propi), 1 h:mm, 2 dd/mm/yy (propi, el 59),
     3 m/d/yy h:mm (22), 4 [h]:mm:ss (46), 5 un import propi i 6 text (@). */
  const ESTIL = estils([[0, 'General'], [59, 'dd/mm/yy'], [164, '#,##0.00\\ "€"']], [0, 20, 59, 22, 46, 164, 49]);
  const GRAELLA = fulla([
    '<row r="1" spans="1:15"><c r="A1" t="s"><v>0</v></c><c r="O1" s="2"><v>43538</v></c></row>',
    '<row r="2"><c r="C2" t="inlineStr"><is><t>Cafè</t></is></c><c r="D2" t="str"><f>"x"&amp;"y"</f><v>xy</v></c>'
      + '<c r="E2" t="b"><v>1</v></c><c r="G2" t="e"><v>#DIV/0!</v></c><c r="H2" s="1"/></row>',
    '<row r="3"><c r="A3" s="1"><v>41000.291666666664</v></c><c r="B3"><v>250</v></c><c r="F3"><f>SUM(B3:E3)</f><v>250</v></c>'
      + '<c r="G3"><f t="shared" ref="G3:G5" si="0">SUM($B$1,B3:C3)*2</f><v>500</v></c>'
      + '<c r="H3" t="str"><f t="shared" ref="H3:I3" si="1">IF(B3&gt;0,"B3",A$3)</f><v>B3</v></c>'
      + '<c r="I3" t="str"><f t="shared" si="1"/><v>B3</v></c></row>',
    '<row r="4"><c r="F4"><f t="shared" si="9"/><v>0</v></c><c r="G4"><f t="shared" si="0"/><v>0</v></c></row>',
    '<row r="5"><c r="G5"><f t="shared" si="0"/><v>0</v></c></row>',
    '<row r="6"><c><v>1</v></c><c s="3"><v>43538.5</v></c><c s="4"><v>1.5</v></c><c s="5"><v>1234.5</v></c><c s="6"><v>7</v></c></row>',
    '<row><c t="s"><v>1</v></c><c t="s"><v>3</v></c></row>',
    '<row r="8"><c r="A8" t="s"><v>2</v></c><c r="B8" t="s"><v>4</v></c></row>'
  ].join(''), '<mergeCells count="2"><mergeCell ref="B1:E1"/><mergeCell ref="H3:G3"/></mergeCells>');
  /* Les parts que el lector no ha de tocar porten brossa: si les llegira, llançaria. */
  const EXTRES = ['xl/media/image1.png', 'xl/charts/chart1.xml', 'xl/drawings/drawing1.xml', 'xl/theme/theme1.xml', 'docProps/core.xml']
    .map((nom) => ({ nom, dades: 'no es llig', crues: BROSSA }));
  const LLIBRE = llibreFet({
    date1904: true,
    cadenes: CADENES,
    estil: ESTIL,
    fulles: [
      { nom: 'Resum d&apos;exportació', xml: fulla('<row r="3"><c r="A3" t="s"><v>1</v></c></row>') },
      { nom: 'Diari - Taula 1', xml: GRAELLA },
      { nom: 'Diari - Dibuixos', xml: '<worksheet><sheetData/><drawing r:id="rId1"/></worksheet>' },
      { nom: 'Gràfic', tipus: 'chartsheet', xml: '<chartsheet/>', crues: BROSSA }
    ],
    extres: EXTRES
  });
  const llibre = llegixLlibre(LLIBRE);
  const graella = llibre.fulles[1];

  test('sistema de 1904, fulles «<Full> - <Taula>» i cap fulla de gràfic', () => {
    expect(llibre.date1904).toBe(true);
    expect(llibre.fulles.map((f) => f.nom)).toEqual(['Resum d\'exportació', 'Diari - Taula 1', 'Diari - Dibuixos']);
    expect(llibre.fulles[2]).toEqual({ nom: 'Diari - Dibuixos', combinacions: [], celles: [] });
    expect(resum(llibre.fulles[0])).toEqual([['A3', 'text', 'Aigua & cafè', 'General']]);
  });

  test('les imatges, els gràfics, els dibuixos, el tema i les propietats del document no es lligen', () => {
    expect(() => llegeixZip(LLIBRE)).toThrow(/Dades comprimides malmeses/);
    expect(llibre.fulles).toHaveLength(3);
  });

  test('hora amb part de data: només l’hora; dates del sistema de 1904', () => {
    expect(cella(graella, 'A3')).toEqual({ fila: 3, col: 0, ref: 'A3', tipus: 'hora', valor: '07:00', formula: null, format: 'h:mm' });
    expect(cella(graella, 'O1')).toMatchObject({ tipus: 'data', valor: '2023-03-15', format: 'dd/mm/yy' });
    expect(cella(graella, 'B6')).toMatchObject({ tipus: 'data-hora', valor: '2023-03-15T12:00', format: 'm/d/yy h:mm' });
    expect(cella(graella, 'C6')).toMatchObject({ tipus: 'hora', valor: '36:00', format: '[h]:mm:ss' });
  });

  test('text enriquit sense fonètica, inlineStr, str, booleà, error, buit amb format i escapaments', () => {
    expect(cella(graella, 'A1')).toMatchObject({ tipus: 'text', valor: 'LÍQUID INGERIT' });
    expect(cella(graella, 'C2')).toMatchObject({ tipus: 'text', valor: 'Cafè' });
    expect(cella(graella, 'D2')).toMatchObject({ tipus: 'text', valor: 'xy', formula: '"x"&"y"' });
    expect(cella(graella, 'E2')).toMatchObject({ tipus: 'boolea', valor: true });
    expect(cella(graella, 'G2')).toMatchObject({ tipus: 'error', valor: '#DIV/0!' });
    expect(cella(graella, 'H2')).toEqual({ fila: 2, col: 7, ref: 'H2', tipus: 'buit', valor: null, formula: null, format: 'h:mm' });
    expect(cella(graella, 'A8')).toMatchObject({ tipus: 'text', valor: 'a_x0041_b\nc' });
    expect(cella(graella, 'B8')).toMatchObject({ tipus: 'text', valor: '<dins> & fora' });
  });

  test('fórmules amb el valor guardat; les compartides es reconstruïxen des de la mestra', () => {
    expect(cella(graella, 'F3')).toMatchObject({ tipus: 'nombre', valor: 250, formula: 'SUM(B3:E3)' });
    expect(cella(graella, 'G3')).toMatchObject({ valor: 500, formula: 'SUM($B$1,B3:C3)*2' });
    expect(cella(graella, 'G4')).toMatchObject({ valor: 0, formula: 'SUM($B$1,B4:C4)*2' });
    expect(cella(graella, 'G5')).toMatchObject({ formula: 'SUM($B$1,B5:C5)*2' });
    expect(cella(graella, 'H3')).toMatchObject({ tipus: 'text', valor: 'B3', formula: 'IF(B3>0,"B3",A$3)' });
    expect(cella(graella, 'I3')).toMatchObject({ tipus: 'text', valor: 'B3', formula: 'IF(C3>0,"B3",B$3)' });
    /* Una compartida sense mestra: se sap que és fórmula, però no el text. */
    expect(cella(graella, 'F4')).toMatchObject({ valor: 0, formula: '' });
  });

  test('cel·les i files sense referència, formats propis i combinacions', () => {
    expect(resum(graella).filter(([ref]) => /^[A-E][67]$/.test(ref))).toEqual([
      ['A6', 'nombre', 1, 'General'], ['B6', 'data-hora', '2023-03-15T12:00', 'm/d/yy h:mm'], ['C6', 'hora', '36:00', '[h]:mm:ss'],
      ['D6', 'nombre', 1234.5, '#,##0.00\\ "€"'], ['E6', 'nombre', 7, '@'],
      ['A7', 'text', 'Aigua & cafè', 'General'], ['B7', 'buit', null, 'General']
    ]);
    expect(graella.combinacions).toEqual([
      { ref: 'B1:E1', fila: 1, col: 1, filaFi: 1, colFi: 4 },
      { ref: 'G3:H3', fila: 3, col: 6, filaFi: 3, colFi: 7 }
    ]);
    expect(graella.celles).toHaveLength(25);
  });
});

describe('dates del sistema de 1900 i formats', () => {
  const ESTIL = estils([
    [164, 'dd/mm/yyyy hh:mm'], [165, 'mmm yyyy'], [166, '[Red]0.00'], [167, '"h" 0'], [168, 'mm:ss'], [169, 'mmmm'], [170, '[$-403]d mmmm']
  ], [0, 14, 164, 165, 166, 167, 168, 169, 170, 20]);
  const serials = [1, 59, 60, 61, 45000, 0, -1, 2958465, 2958466];
  const FULLA = fulla([
    `<row r="1">${serials.map((n, i) => `<c r="${String.fromCharCode(65 + i)}1" s="1"><v>${n}</v></c>`).join('')}</row>`,
    '<row r="2">'
      + [[2, 45000.75], [3, 45000.75], [4, 45000.75], [5, 3], [6, 0.5], [7, 45000], [8, 45000], [1, 45000.9999], [1, 44999.99999999997]]
        .map(([s, n], i) => `<c r="${String.fromCharCode(65 + i)}2" s="${s}"><v>${n}</v></c>`).join('')
      + '</row>',
    '<row r="3"><c r="A3" t="d"><v>2023-03-15T00:00:00</v></c><c r="B3" t="d" s="9"><v>2023-03-15T07:30:00</v></c>'
      + '<c r="C3" t="d"><v>2023-03-15T07:30:15</v></c><c r="D3" t="d"><v>2023-02-30T00:00:00</v></c><c r="E3" s="9"><v>-0.5</v></c>'
      + '<c r="F3" t="d" s="2"><v>2023-03-15T00:00:00</v></c><c r="G3" s="2"><v>45000</v></c></row>'
  ].join(''));
  const llibre = llegixLlibre(llibreFet({ estil: ESTIL, fulles: [{ nom: 'Dates', xml: FULLA }] }));
  const full = llibre.fulles[0];

  test('el dia 1 és l’1-1-1900; el 60 (29-2-1900) i el 0 no són cap data; fins al 31-12-9999', () => {
    expect(llibre.date1904).toBe(false);
    expect(full.celles.filter((c) => c.fila === 1).map((c) => [c.tipus, c.valor])).toEqual([
      ['data', '1900-01-01'], ['data', '1900-02-28'], ['nombre', 60], ['data', '1900-03-01'], ['data', '2023-03-15'],
      ['nombre', 0], ['nombre', -1], ['data', '9999-12-31'], ['nombre', 2958466]
    ]);
  });

  test('la classe dels formats propis: data-hora, data, nombre, hora; una data pren el dia, sense el soroll de coma flotant', () => {
    expect(full.celles.filter((c) => c.fila === 2).map((c) => [c.tipus, c.valor, c.format])).toEqual([
      ['data-hora', '2023-03-15T18:00', 'dd/mm/yyyy hh:mm'],
      ['data', '2023-03-15', 'mmm yyyy'],
      ['nombre', 45000.75, '[Red]0.00'],
      ['nombre', 3, '"h" 0'],
      ['hora', '12:00', 'mm:ss'],
      ['data', '2023-03-15', 'mmmm'],
      ['data', '2023-03-15', '[$-403]d mmmm'],
      ['data', '2023-03-15', 'mm-dd-yy'],
      ['data', '2023-03-15', 'mm-dd-yy']
    ]);
  });

  test('cel·les t="d" (ISO 8601) segons el format; una hora negativa es queda com a nombre', () => {
    expect(full.celles.filter((c) => c.fila === 3).map((c) => [c.tipus, c.valor])).toEqual([
      ['data', '2023-03-15'], ['hora', '07:30'], ['data-hora', '2023-03-15T07:30:15'], ['text', '2023-02-30T00:00:00'], ['nombre', -0.5],
      ['data-hora', '2023-03-15T00:00'], ['data-hora', '2023-03-15T00:00']
    ]);
  });

  test('a mitjanit, amb un format de data-hora: el mateix tipus si és t="d" o un número de sèrie', () => {
    const [iso, serial] = ['F3', 'G3'].map((ref) => cella(full, ref));
    expect(iso).toMatchObject({ tipus: 'data-hora', valor: '2023-03-15T00:00', format: 'dd/mm/yyyy hh:mm' });
    expect(serial).toMatchObject({ tipus: iso.tipus, valor: iso.valor, format: iso.format });
  });

  test('els formats condicionals (<dxfs>) no canvien el format d’una cel·la, encara que repetisquen el numFmtId', () => {
    const ambDxf = estils([[164, 'dd/mm/yy']], [0, 164])
      + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
      + '<dxfs count="1"><dxf><numFmt numFmtId="164" formatCode="0.0"/></dxf></dxfs>';
    const xml = fulla('<row r="1"><c r="A1" s="1"><v>45000</v></c></row>');
    const [unica] = llegixLlibre(llibreFet({ estil: ambDxf, fulles: [{ nom: 'Dxf', xml }] })).fulles[0].celles;
    expect(unica).toMatchObject({ ref: 'A1', tipus: 'data', valor: '2023-03-15', format: 'dd/mm/yy' });
  });
});

describe('paquets que no són d’Excel però hi caben', () => {
  test('prefixos d’espai de noms, llibre amb un altre nom, destins absoluts i relatius, noms de part en altra caixa', () => {
    const zip = zipAmbDeflate([
      { nom: '_rels/.rels', dades: rels(relacio('rId1', 'officeDocument', '/xl/llibre.xml')) },
      {
        nom: 'xl/llibre.xml',
        dades: '<x:workbook xmlns:x="urn:x"><x:workbookPr date1904="true"/><x:sheets><x:sheet name="Full" sheetId="1" r:id="rId7"/></x:sheets></x:workbook>'
      },
      { nom: 'xl/_rels/llibre.xml.rels', dades: rels(relacio('rId7', 'worksheet', '../xl/Fulls/Full1.xml')) },
      {
        nom: 'xl/fulls/full1.xml',
        dades: '<x:worksheet><x:sheetData><x:row r="2"><x:c r="b2" t="inlineStr"><x:is><x:r><x:t>Hola</x:t></x:r>'
          + '<x:r><x:t xml:space="preserve"> món</x:t></x:r></x:is></x:c></x:row></x:sheetData>'
          + '<x:mergeCells><x:mergeCell ref="B2:C2"/></x:mergeCells></x:worksheet>'
      }
    ]);
    expect(llegixLlibre(zip)).toEqual({
      date1904: true,
      fulles: [{
        nom: 'Full',
        combinacions: [{ ref: 'B2:C2', fila: 2, col: 1, filaFi: 2, colFi: 2 }],
        celles: [{ fila: 2, col: 1, ref: 'B2', tipus: 'text', valor: 'Hola món', formula: null, format: 'General' }]
      }]
    });
  });
});

describe('errors i límits', () => {
  const PETIT = llibreFet({ fulles: [{ nom: 'A', xml: fulla('<row r="1"><c r="A1"><v>1</v></c><c r="B1"><v>2</v></c><c r="C1"><v>3</v></c></row>') }] });

  test('el que no és un XLSX: TypeError amb el motiu en valencià', () => {
    expect(() => llegixLlibre(new TextEncoder().encode('Data;Import\n02/10/2026;1,50\n'))).toThrow(/No és un ZIP/);
    expect(() => llegixLlibre(creaZip([{ nom: 'a.txt', dades: 'x' }]))).toThrow(/No és un llibre XLSX/);
    expect(() => llegixLlibre('PK')).toThrow(TypeError);
    expect(() => llegixLlibre(null)).toThrow(TypeError);
  });

  test('paquets malmesos o xifrats, i cadenes compartides que no existixen', () => {
    const xifrat = llibreFet({ fulles: [{ nom: 'A', xml: fulla('') }], extres: [] });
    const entrades = llegeixZip(xifrat).map(({ nom, dades }) => ({ nom, dades, xifrat: nom.includes('worksheets/') }));
    expect(() => llegixLlibre(zipAmbDeflate(entrades))).toThrow(/xifrat/);
    const senseCadena = llibreFet({ fulles: [{ nom: 'A', xml: fulla('<row r="1"><c r="A1" t="s"><v>7</v></c></row>') }] });
    expect(() => llegixLlibre(senseCadena)).toThrow(/Cadena compartida que no existix a A!A1/);
    const malaReferencia = llibreFet({ fulles: [{ nom: 'A', xml: fulla('<row r="1"><c r="ZZZZ1"><v>1</v></c></row>') }] });
    expect(() => llegixLlibre(malaReferencia)).toThrow(TypeError);
  });

  test('límits: mida del fitxer, XML descomprimit i cel·les', () => {
    expect(llegixLlibre(PETIT).fulles[0].celles).toHaveLength(3);
    expect(() => llegixLlibre(PETIT, { maxBytes: 100 })).toThrow('El fitxer passa de 100 bytes: és massa gran per a llegir-lo ací.');
    expect(() => llegixLlibre(new Uint8Array(20 * 1024 * 1024 + 1))).toThrow('El fitxer passa de 20 MB: és massa gran per a llegir-lo ací.');
    expect(() => llegixLlibre(PETIT, { maxCelles: 2 })).toThrow(/passa de 2 cel·les/);
    expect(llegixLlibre(PETIT, { maxCelles: 3 }).fulles[0].celles).toHaveLength(3);
    expect(() => llegixLlibre(PETIT, { maxEixida: 200 })).toThrow(RangeError);
    for (const dolent of [0, -1, '10', Number.NaN]) expect(() => llegixLlibre(PETIT, { maxCelles: dolent })).toThrow(RangeError);
  });

  test('el pressupost d’XML: el missatge diu el límit del llibre, no el que en quedava ni la part', () => {
    const parts = ['_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/sharedStrings.xml', 'xl/styles.xml', 'xl/worksheets/sheet1.xml'];
    const total = llegeixZip(PETIT, { nomes: (nom) => parts.includes(nom) }).reduce((n, { dades }) => n + dades.length, 0);
    expect(llegixLlibre(PETIT, { maxEixida: total }).fulles[0].celles).toHaveLength(3);
    /* Hi falta un byte a l'última part que es llig (la fulla): el missatge porta el límit sencer. */
    const limit = total - 1;
    let error = null;
    try {
      llegixLlibre(PETIT, { maxEixida: limit });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(RangeError);
    const ambPunts = String(limit).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    expect(error.message).toBe(`El llibre descomprimit passa de ${ambPunts} bytes: és massa gran per a llegir-lo ací.`);
    expect(error.cause).toBeInstanceOf(RangeError);
    expect(() => llegixLlibre(PETIT, { maxEixida: 200 })).toThrow('El llibre descomprimit passa de 200 bytes: és massa gran per a llegir-lo ací.');
  });

  test('per defecte, fins a 200.000 cel·les: les llig totes; amb una més, RangeError', () => {
    const fila = (r) => `<row r="${r}">${Array.from({ length: 10 }, (_, c) => `<c r="${String.fromCharCode(65 + c)}${r}"><v>${c}</v></c>`).join('')}</row>`;
    const files = Array.from({ length: 20000 }, (_, i) => fila(i + 1)).join('');
    const just = llegixLlibre(llibreFet({ fulles: [{ nom: 'Gran', xml: fulla(files) }] }));
    expect(just.fulles[0].celles).toHaveLength(200000);
    expect(just.fulles[0].celles[199999]).toMatchObject({ ref: 'J20000', tipus: 'nombre', valor: 9 });
    const unaMes = llibreFet({ fulles: [{ nom: 'Gran', xml: fulla(`${files}<row r="20001"><c r="A20001"><v>1</v></c></row>`) }] });
    expect(() => llegixLlibre(unaMes)).toThrow('El llibre passa de 200.000 cel·les: és massa gran per a llegir-lo ací.');
  });
});
