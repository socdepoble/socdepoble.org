// @vitest-environment node
/* Salut · el fitxer exportat: el CSV protegix = + - @, l'XLSX és un ZIP
   vàlid amb els noms interns esperats i sense autor, i el nom del fitxer és
   neutre: ni l'àlies ni el nom escrit en el moment. */
import { describe, expect, test } from 'vitest';
import { llegeixZip } from '../../../utils/fulls/index.js';
import { assignaJornades } from './hores.js';
import { fullDiari } from './full.js';
import { FULLA_CSV, exporta, nomFitxer } from './exportacio.js';

let n = 0;
const uuid = () => { n += 1; return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`; };
const a = (tipus, moment, camps = {}) => ({ id: uuid(), tipus, moment, ofsetMin: 120, ...camps });
const PERSONA = { alias: 'el iaio Pep', horaAlcarHabitual: '07:00', horaGitarHabitual: '22:00' };
const D = '2026-10-05';
const APUNTS = assignaJornades([
  a('miccio', `${D}T08:00`, { volumMl: 250, mesura: 'mesurat', lloc: 'vater', nota: '=HYPERLINK(1)' }),
  a('miccio', `${D}T10:00`, { mesura: 'no-mesurat', lloc: 'vater', nota: '+34 cosa' }),
  a('medicacio', `${D}T09:00`, { nom: '@la blanca', pauta: 'fixa', estat: 'presa' }),
  a('observacio', `${D}T11:00`, { que: 'altra', nota: '-1 punt, diu' })
], PERSONA);
const { model } = fullDiari({ des: D, dies: 3, apunts: APUNTS, persona: PERSONA, nomPersona: 'Josep Martí', ofsetDe: () => 120 });

describe('nom del fitxer', () => {
  test('neutre: diari_AAAA-MM-DD_Nd', () => {
    expect(nomFitxer(D, 3, 'xlsx')).toBe('diari_2026-10-05_3d.xlsx');
    expect(nomFitxer(D, 3, 'csv')).toBe('diari_2026-10-05_3d.csv');
    expect(() => nomFitxer(D, 3, 'pdf')).toThrow(RangeError);
    for (const format of ['xlsx', 'csv']) {
      const { nom } = exporta({ model, format, des: D, dies: 3 });
      expect(nom).toMatch(/^diari_\d{4}-\d{2}-\d{2}_\d+d\.(?:xlsx|csv)$/);
      expect(nom.toLowerCase()).not.toMatch(/iaio|pep|josep|mart|pare|salut|orina/);
    }
  });
});

describe('CSV', () => {
  const { dades, tipus } = exporta({ model, format: 'csv', des: D, dies: 3 });

  test('només la fulla Diari, amb BOM, punt i coma i CRLF', () => {
    expect(FULLA_CSV).toBe('Diari');
    expect(tipus).toBe('text/csv;charset=utf-8');
    expect(dades.charCodeAt(0)).toBe(0xfeff);
    const linies = dades.slice(1).split('\r\n');
    expect(linies[0]).toBe('Data;Hora;Dia o nit;Beguda;Begut (ml);Orina (ml);Mesura;Urgència (0–4);Escapament;Absorbent;Deposició (Bristol);Conducta;Medicació;Notes');
    expect(linies).toHaveLength(APUNTS.length + 2);
    expect(dades).not.toMatch(/Resum|Diccionari/);
  });

  test('protegix = + - @ dels textos lliures contra la injecció de fórmules', () => {
    expect(dades).toContain("'=HYPERLINK(1)");
    expect(dades).toContain("'+34 cosa");
    expect(dades).toContain("'@la blanca");
    /* Un text amb coma va entre cometes; este no comença per cap signe, i no cal la cometa simple. */
    expect(dades).toContain('"Altres · una altra cosa · -1 punt, diu"');
    expect(dades).not.toMatch(/;=|;\+|;@|;-1/);
  });
});

describe('XLSX', () => {
  const { dades, tipus } = exporta({ model, format: 'xlsx', des: D, dies: 3 });
  const fitxers = llegeixZip(dades);
  const text = (nom) => new TextDecoder().decode(fitxers.find((f) => f.nom === nom).dades);

  test('un ZIP vàlid amb els noms interns esperats', () => {
    expect(tipus).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(fitxers.map((f) => f.nom)).toEqual([
      '[Content_Types].xml', '_rels/.rels', 'docProps/app.xml', 'docProps/core.xml', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels',
      'xl/styles.xml', 'xl/sharedStrings.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml', 'xl/worksheets/sheet3.xml',
      'xl/worksheets/sheet4.xml', 'xl/worksheets/sheet5.xml'
    ]);
    expect(text('xl/workbook.xml')).toMatch(/name="Resum".*name="Diari".*name="Conducta".*name="Medicació".*name="Diccionari"/);
  });

  test('les propietats no tenen autor, títol ni dates', () => {
    const core = text('docProps/core.xml');
    expect(core).not.toMatch(/creator|lastModifiedBy|title|created|modified/i);
    expect(text('docProps/app.xml')).not.toMatch(/Josep|iaio/);
  });

  test('el nom escrit en el moment és a la capçalera del full, no a les propietats', () => {
    expect(text('xl/sharedStrings.xml')).toContain('Persona: Josep Martí');
  });

  test('la mateixa entrada dona els mateixos bytes', () => {
    expect(exporta({ model, format: 'xlsx', des: D, dies: 3 }).dades).toEqual(dades);
  });
});
