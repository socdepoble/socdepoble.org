// @vitest-environment node
/* Gauntlet 261025_0545 (RX-M4) · Els atributs d'una etiqueta es llegien amb
   /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g, la mateixa expressió de RX-01:
   dins d'una etiqueta tancada amb una tira llarga de caràcters de nom i cap
   «=», cada posició tornava a recórrer la tira fins al final (quadràtic). Un
   full d'un tercer (un proveïdor, una plantilla) congelava la pestanya de qui
   l'importava. Ara és un recorregut lineal que torna exactament el mateix. */
import { describe, expect, test } from 'vitest';
import { atributs, llegixLlibre } from './lector.js';
import { creaZip } from './zip.js';

/* L'expressió d'abans, només com a oracle de la prova (sense desescapar: els valors crus). */
function atributsDAbans(text) {
  const resultat = Object.create(null);
  for (const m of text.matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    const valor = m[2] ?? m[3];
    resultat[m[1]] = valor;
    const local = m[1].slice(m[1].indexOf(':') + 1);
    if (!(local in resultat)) resultat[local] = valor;
  }
  return resultat;
}

const REL = 'urn:sdp-prova:relacions';
const llibre = ({ full, llibreXml = '<workbook><sheets><sheet name="A" sheetId="1" r:id="rId1"/></sheets></workbook>' }) => creaZip([
  { nom: '_rels/.rels', dades: `<Relationships><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
  { nom: 'xl/workbook.xml', dades: llibreXml },
  { nom: 'xl/_rels/workbook.xml.rels', dades: `<Relationships><Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>` },
  { nom: 'xl/worksheets/sheet1.xml', dades: `<worksheet><sheetData>${full}</sheetData></worksheet>` }
]);
const A1 = Object.freeze({ fila: 1, col: 0, ref: 'A1', tipus: 'nombre', valor: 7, formula: null, format: 'General' });

/* Un generador determinista (LCG): la mateixa sèrie en cada execució. */
function generador(llavor) {
  let estat = llavor >>> 0;
  return (maxim) => {
    estat = (Math.imul(estat, 1664525) + 1013904223) >>> 0;
    return estat % maxim;
  };
}

/* Tots els textos fets d'entre 0 i `maxim` trossos, i `quantitat` d'aleatoris més llargs. */
function textos(trossos, maxim, quantitat, llargariaMaxima, llavor) {
  let nivell = [''];
  const tots = [''];
  for (let n = 1; n <= maxim; n += 1) {
    nivell = nivell.flatMap((text) => trossos.map((tros) => text + tros));
    for (const text of nivell) tots.push(text);
  }
  const atzar = generador(llavor);
  for (let k = 0; k < quantitat; k += 1) {
    let text = '';
    for (let i = atzar(llargariaMaxima + 1); i > 0; i -= 1) text += trossos[atzar(trossos.length)];
    tots.push(text);
  }
  return tots;
}

describe('RX-M4 · els atributs d’una etiqueta es lligen en temps lineal', () => {
  test('una cel·la amb una tira de 150.000 caràcters de nom sense «=»: el mateix llibre, en menys d’1 s', () => {
    const zip = llibre({ full: `<row r="1"><c r="A1" ${'x'.repeat(150000)}><v>7</v></c></row>` });
    const inici = performance.now();
    const { fulles } = llegixLlibre(zip);
    expect(performance.now() - inici).toBeLessThan(1000);
    expect(fulles[0].celles).toEqual([A1]);
  });

  test('una fulla del llibre amb la tira: menys d’1 s', () => {
    const zip = llibre({ full: '<row r="1"><c r="A1"><v>7</v></c></row>', llibreXml: `<workbook><sheets><sheet name="A" ${'y.'.repeat(50000)} sheetId="1" r:id="rId1"/></sheets></workbook>` });
    const inici = performance.now();
    const { fulles } = llegixLlibre(zip);
    expect(performance.now() - inici).toBeLessThan(1000);
    expect(fulles).toEqual([{ nom: 'A', combinacions: [], celles: [A1] }]);
  });

  test('el predicat sol: tires de noms, blancs i cometes sense tancar', () => {
    const inici = performance.now();
    expect({ ...atributs(`${'a '.repeat(50000)}b="1"`) }).toEqual({ b: '1' });
    expect({ ...atributs(`r="A1" ${'x:y'.repeat(20000)}`) }).toEqual({ r: 'A1' });
    expect({ ...atributs(`a="1 ${'z='.repeat(50000)}`) }).toEqual({});
    expect(performance.now() - inici).toBeLessThan(1000);
  });

  test('torna el mateix que l’expressió d’abans en tots els cossos curts i en milers d’aleatoris', () => {
    const trossos = [' ', 'a', 'r', 'x:y', '.', '-', '_', '=', '"', '\'', 'b="1"', 'c=\'2\'', '\t', '\n', '/', '9', 'é', '&amp;'];
    const valors = textos(trossos, 4, 20000, 16, 20261025);
    expect(valors.length).toBeGreaterThan(100000);
    const json = (objecte) => JSON.stringify(Object.entries(objecte));
    /* Amb les entitats desescapades a les dues bandes: atributs() les desfà. */
    const desfa = (objecte) => Object.fromEntries(Object.entries(objecte).map(([clau, valor]) => [clau, valor.replace(/&amp;/g, '&')]));
    expect(valors.filter((text) => json(atributs(text)) !== json(desfa(atributsDAbans(text))))).toEqual([]);
  });

  test('com sempre: sense prototip, el nom local no trepitja un sencer i el primer local es queda', () => {
    const a = atributs('r:id="rId1" id = \'x\' xml:space="preserve" w:space="no" t="a &amp; b"');
    expect(Object.getPrototypeOf(a)).toBeNull();
    expect(Object.entries(a)).toEqual([['r:id', 'rId1'], ['id', 'x'], ['xml:space', 'preserve'], ['space', 'preserve'], ['w:space', 'no'], ['t', 'a & b']]);
  });
});
