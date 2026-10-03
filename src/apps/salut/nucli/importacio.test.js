// @vitest-environment node
/* Salut · importar un diari fet en un full de càlcul. Tot amb la plantilla
   SINTÈTICA (__fixtures__/plantillaSintetica.js), que imita l'estructura de
   la real: valors inventats i un àlies inventat al pacient. */
import { describe, expect, test } from 'vitest';
import { creaXlsx, llegixLlibre } from '../../../utils/fulls/index.js';
import { fusionaCopia } from './copia.js';
import { validaApunt, validaPersona } from './diccionari.js';
import { exporta } from './exportacio.js';
import { fullDiari } from './full.js';
import { assignaJornades } from './hores.js';
import {
  FORMATS_FULL, NOTA_FRANJA, PERFIL_GRAELLA_HORARIA, detectaFormat, diesDe, idDeterminista, llegixFitxer, llibreDeCsv,
  normalitzaEtiqueta, proposaApunts
} from './importacio.js';
import { ALIES_SINTETIC, plantillaSintetica, plantillaSinteticaCsv } from './__fixtures__/plantillaSintetica.js';

const DIA = '2026-03-10';
const PERSONA = validaPersona({}).persona;
const OFSET = () => 60;
const codis = (proposta) => proposta.avisos.map((a) => a.codi).sort();
const llibre = (opcions) => llegixLlibre(plantillaSintetica(opcions));
const proposa = (opcions, extra = {}) => proposaApunts({ llibre: llibre(opcions), persona: PERSONA, ofsetDe: OFSET, fitxer: 'diari.xlsx', ...extra });
/* Una forma curta i ordenada dels apunts, per a comparar-los. */
const essencial = (apunts) => apunts.map((a) => [a.moment, a.tipus, a.volumMl ?? '', a.beguda ?? '', a.urgencia ?? '', a.quantitat ?? '', a.event ?? ''].join(' ')).sort();

/* Un dia de diari inventat: nit, matí, migdia, una urgència sense micció i els dos grups que no s'importen. */
const FRANGES = Object.freeze({
  '01': { miccio: 300, urgencia: 3 },
  '07': { aigua: 200, cafe: 150, miccio: 250, urgencia: 2, perdua: 1 },
  10: { alcohol: 100, menjar: 120 },
  13: { aigua: 250, miccio: 300, urgencia: 0, perdua: 0 },
  18: { urgencia: 4 },
  21: { miccio: 200, muda: 2, queFeia: 3 }
});
const RESUM = Object.freeze({ data: DIA, alcar: '07:00', dormir: '22:30' });
const ESPERATS = essencial([
  { moment: '2026-03-10T01:00', tipus: 'miccio', volumMl: 300, urgencia: 3 },
  { moment: '2026-03-10T07:00', tipus: 'escapament', quantitat: 'gotes' },
  { moment: '2026-03-10T07:00', tipus: 'ingesta', volumMl: 150, beguda: 'cafe' },
  { moment: '2026-03-10T07:00', tipus: 'ingesta', volumMl: 200, beguda: 'aigua' },
  { moment: '2026-03-10T07:00', tipus: 'miccio', volumMl: 250, urgencia: 2 },
  { moment: '2026-03-10T07:00', tipus: 'son', event: 'alcar-se' },
  { moment: '2026-03-10T10:00', tipus: 'ingesta', volumMl: 100, beguda: 'alcohol' },
  { moment: '2026-03-10T10:00', tipus: 'ingesta', volumMl: 120, beguda: 'altra' },
  { moment: '2026-03-10T13:00', tipus: 'ingesta', volumMl: 250, beguda: 'aigua' },
  { moment: '2026-03-10T13:00', tipus: 'miccio', volumMl: 300, urgencia: 0 },
  { moment: '2026-03-10T21:00', tipus: 'miccio', volumMl: 200 },
  { moment: '2026-03-10T22:30', tipus: 'son', event: 'gitar-se' }
]);
const SENSE_SON = ESPERATS.filter((linia) => !linia.includes(' son '));

describe('el format', () => {
  test('la plantilla (xlsx i csv), l’exportació pròpia i la resta', () => {
    expect(FORMATS_FULL).toEqual(['graella-horaria', 'diari-salut', 'desconegut']);
    expect(detectaFormat(llibre({ franges: FRANGES }))).toBe('graella-horaria');
    const csv = llegixFitxer(new TextEncoder().encode(plantillaSinteticaCsv({ franges: FRANGES })), 'graella.csv');
    expect(csv.ok).toBe(true);
    expect(detectaFormat(csv.llibre)).toBe('graella-horaria');
    const { model } = fullDiari({ des: DIA, dies: 1, apunts: [], persona: PERSONA, ofsetDe: OFSET });
    expect(detectaFormat(llegixLlibre(exporta({ model, format: 'xlsx', des: DIA, dies: 1 }).dades))).toBe('diari-salut');
    const altre = creaXlsx({ fulles: [{ nom: 'Compres', columnes: [{ titol: 'Hora', tipus: 'hora' }, { titol: 'Preu', tipus: 'nombre' }], files: [['09:00', 3], ['10:00', 4], ['11:00', 5], ['12:00', 6]] }] });
    expect(detectaFormat(llegixLlibre(altre))).toBe('desconegut');
    expect(detectaFormat(null)).toBe('desconegut');
  });

  test('les etiquetes es comparen sense accents, majúscules ni signes', () => {
    expect(normalitzaEtiqueta(' QUÈ  FEIA? ')).toBe('que feia');
    expect(normalitzaEtiqueta('Alçar-se del llit')).toBe('alcar-se del llit');
    expect(PERFIL_GRAELLA_HORARIA.grups.map((g) => g.id)).toEqual(['ingesta', 'miccio', 'perdua', 'urgencia']);
  });

  test('els dies del llibre: el nom de la taula i la data del resum', () => {
    expect(diesDe(llibre({ franges: FRANGES, resum: RESUM }))).toEqual([{ nom: 'Diari Miccional', data: DIA }]);
    expect(diesDe(llibre({ franges: FRANGES }))).toEqual([{ nom: 'Diari Miccional', data: null }]);
    const dos = llibre({ dies: [{ prefix: 'Dia 1', resum: { data: DIA } }, { prefix: 'Dia 2', resum: { data: '2026-03-11' } }] });
    expect(diesDe(dos)).toEqual([{ nom: 'Dia 1', data: DIA }, { nom: 'Dia 2', data: '2026-03-11' }]);
  });
});

describe('la proposta de la plantilla', () => {
  const proposta = proposa({ franges: FRANGES, resum: RESUM });

  test('un apunt per cel·la plena, a la data triada i a l’hora de la franja (mai la data de la plantilla)', () => {
    expect(proposta.format).toBe('graella-horaria');
    expect(essencial(proposta.apunts)).toEqual(ESPERATS);
    expect(proposta.apunts.every((a) => a.moment.startsWith(DIA))).toBe(true);
    expect(JSON.stringify(proposta)).not.toContain('2017');
  });

  test('cada apunt és vàlid per al diccionari, amb id, ofset i jornada', () => {
    for (const apunt of proposta.apunts) {
      const { ok, errors } = validaApunt(apunt, { ambId: true });
      expect(errors, apunt.moment).toEqual({});
      expect(ok).toBe(true);
      expect(apunt.ofsetMin).toBe(60);
    }
    expect(new Set(proposta.apunts.map((a) => a.id)).size).toBe(12);
    /* La micció de la 01:00 és de la nit d'abans. */
    expect(proposta.apunts.find((a) => a.moment.endsWith('T01:00')).jornada).toBe('2026-03-09');
    expect(proposta.apunts.filter((a) => a.jornada === DIA)).toHaveLength(11);
  });

  test('les notes: hora aproximada a les franges, i el líquid del menjar', () => {
    expect(proposta.apunts.filter((a) => a.tipus !== 'son').every((a) => a.nota.endsWith(NOTA_FRANJA))).toBe(true);
    expect(proposta.apunts.find((a) => a.beguda === 'altra').nota).toBe(`Líquid del menjar · ${NOTA_FRANJA}`);
    expect(proposta.apunts.filter((a) => a.tipus === 'son').every((a) => a.nota === undefined)).toBe(true);
    expect(proposta.apunts.filter((a) => a.tipus === 'miccio').every((a) => a.mesura === 'mesurat' && a.lloc === 'vater')).toBe(true);
    expect(proposta.apunts.find((a) => a.tipus === 'escapament').circumstancia).toBe('no-se-sap');
  });

  test('el pacient no entra mai a la proposta', () => {
    expect(JSON.stringify(proposta)).not.toContain(ALIES_SINTETIC);
    expect(JSON.stringify(diesDe(llibre({ franges: FRANGES, resum: RESUM })))).not.toContain(ALIES_SINTETIC);
  });

  test('els avisos: urgència sense micció, grups que no s’importen, la nit i el matí següent', () => {
    expect(codis(proposta)).toEqual(['falta-mati-seguent', 'grup-no-importat', 'grup-no-importat', 'nit-jornada-anterior', 'urgencia-sense-miccio']);
    const text = (codi) => proposta.avisos.filter((a) => a.codi === codi).map((a) => a.text).join(' | ');
    expect(text('urgencia-sense-miccio')).toContain('18:00');
    expect(text('grup-no-importat')).toContain('«MUDA»');
    expect(text('grup-no-importat')).toContain('«QUÈ FEIA?»');
    expect(text('nit-jornada-anterior')).toMatch(/^1 apunt de la matinada \(abans de les 07:00\)/);
    expect(text('falta-mati-seguent')).toContain('10/03/2026');
    /* MUDA 2 a les 21:00 (T24), QUÈ FEIA? 3 a les 21:00 (Y24) i la urgència 4 de les 18:00 (Q21). */
    expect(proposta.descartats.map((d) => d.lloc)).toEqual([
      'Diari Miccional - DIARI MICCION!T24', 'Diari Miccional - DIARI MICCION!Y24', 'Diari Miccional - DIARI MICCION!Q21'
    ]);
  });

  test('les fórmules i la fila TOTALS no s’importen: els totals només es contrasten', () => {
    expect(proposta.contrast.length).toBeGreaterThan(0);
    expect(proposta.contrast.every((x) => x.quadra)).toBe(true);
    expect(proposta.contrast.find((x) => x.columna === 'Aigua')).toMatchObject({ total: 450, suma: 450 });
    expect(proposta.contrast.find((x) => x.columna === 'MICCIÓ')).toMatchObject({ total: 1050, suma: 1050 });
    /* Cap apunt amb la suma d'una fila (la columna F) ni amb un total. */
    expect(proposta.apunts.some((a) => [350, 450, 1050, 820].includes(a.volumMl))).toBe(false);
    /* Una fórmula escrita a mà en una franja tampoc entra: es diu on és, el total la compta i l'avís ho diu. */
    const ambFormula = proposa({ franges: { ...FRANGES, '09': { aigua: { formula: '100+50', valor: 150 } } }, resum: RESUM });
    expect(essencial(ambFormula.apunts)).toEqual(ESPERATS);
    expect(ambFormula.descartats.filter((d) => d.lloc.endsWith('!B12'))).toEqual([
      { lloc: 'Diari Miccional - DIARI MICCION!B12', motiu: 'És una fórmula: el full la calcula i no s’importa (escriu-hi el valor).' }
    ]);
    expect(ambFormula.contrast.find((x) => x.columna === 'Aigua')).toMatchObject({ total: 600, suma: 450, quadra: false });
    expect(codis(ambFormula)).toContain('totals-no-quadren');
    /* La fórmula a una escala també es diu (COUNTA la compta, i el total quadra). */
    const escalaFormula = proposa({ franges: { '09': { miccio: 200, urgencia: { nivell: 2, escrit: { formula: '1+0', valor: 1 } } } }, resum: RESUM });
    expect(escalaFormula.descartats.map((d) => d.lloc)).toEqual(['Diari Miccional - DIARI MICCION!O12']);
    expect(escalaFormula.apunts.find((a) => a.tipus === 'miccio').urgencia).toBeUndefined();
  });

  test('un total que no quadra amb les franges ho diu, i no canvia cap apunt', () => {
    const forcada = proposa({ franges: FRANGES, resum: RESUM, totals: { G27: 999 } });
    expect(essencial(forcada.apunts)).toEqual(ESPERATS);
    expect(forcada.avisos.find((a) => a.codi === 'totals-no-quadren').text).toContain('«MICCIÓ» (total 999, franges 1050)');
  });
});

describe('el que no es pot llegir', () => {
  test('sense data no es proposa res i es demana; amb la data triada, sí', () => {
    const sense = proposa({ franges: FRANGES });
    expect(sense.apunts).toEqual([]);
    expect(codis(sense)).toEqual(['falta-data']);
    expect(sense.dies).toEqual([{ nom: 'Diari Miccional', data: null }]);
    const triada = proposa({ franges: FRANGES }, { dates: [DIA] });
    expect(triada.apunts).toHaveLength(10);
    expect(triada.apunts.some((a) => a.tipus === 'son')).toBe(false);
    /* La data triada mana sobre la del resum. */
    const altra = proposa({ franges: FRANGES, resum: RESUM }, { dates: ['2026-03-12'] });
    expect(altra.apunts.every((a) => a.moment.startsWith('2026-03-12'))).toBe(true);
  });

  test('textos, marques dobles, volums fora de rang i el canvi d’hora', () => {
    const franges = {
      '08': { miccio: '250 ml', aigua: 'x', perdua: [1, 2] },
      '09': { miccio: 2000 },
      11: { cafe: '200' }
    };
    const proposta = proposa({ franges }, { dates: ['2026-03-29'], ofsetDe: (moment) => (moment >= '2026-03-29T02:00' ? 120 : 60) });
    expect(essencial(proposta.apunts)).toEqual(essencial([
      { moment: '2026-03-29T08:00', tipus: 'miccio', volumMl: 250 }, { moment: '2026-03-29T11:00', tipus: 'ingesta', volumMl: 200, beguda: 'cafe' }
    ]));
    expect(proposta.descartats.map((d) => d.motiu)).toEqual([
      'No és un volum en ml (un nombre sencer).',
      'Més d’una marca a «PÈRDUA» en la mateixa franja: no se sap quina val.',
      '«Quant (ml)» ha d’estar entre 0 i 1500.'
    ]);
    expect(codis(proposta)).toContain('canvi-hora');
    expect(proposta.avisos.find((a) => a.codi === 'canvi-hora').text).toContain('29/03/2026');
    /* Els volums en text s'importen, però SUM no els compta: el contrast tampoc, i els totals quadren. */
    expect(codis(proposta)).not.toContain('totals-no-quadren');
    expect(proposta.contrast.find((x) => x.columna === 'MICCIÓ')).toMatchObject({ total: 2000, suma: 2000, quadra: true });
    expect(proposta.contrast.find((x) => x.columna === 'Cafè')).toMatchObject({ total: 0, suma: 0, quadra: true });
  });

  test('una urgència a una franja amb la micció il·legible ho diu així, i no com a urgència sense micció', () => {
    const proposta = proposa({ franges: { '08': { miccio: 'x', urgencia: 2 } } }, { dates: [DIA] });
    expect(proposta.apunts).toEqual([]);
    expect(proposta.descartats).toEqual([
      { lloc: 'Diari Miccional - DIARI MICCION!G11', motiu: 'No és un volum en ml (un nombre sencer).' },
      { lloc: 'Diari Miccional - DIARI MICCION!O11', motiu: 'La micció d’esta franja no té un volum que es puga llegir: la urgència no es pot desar.' }
    ]);
    expect(codis(proposta)).not.toContain('urgencia-sense-miccio');
  });

  test('a una escala, la marca és una «x», un 1 o el nivell de la columna; un altre nombre es descarta', () => {
    const proposta = proposa({
      franges: {
        '09': { miccio: 200, urgencia: { nivell: 0, escrit: 3 } },
        10: { miccio: 210, urgencia: { nivell: 2, escrit: 1 } },
        11: { miccio: 220, urgencia: { nivell: 3, escrit: 3 } },
        12: { perdua: { nivell: 1, escrit: 2 } }
      }
    }, { dates: [DIA] });
    expect(essencial(proposta.apunts)).toEqual(essencial([
      { moment: '2026-03-10T09:00', tipus: 'miccio', volumMl: 200 },
      { moment: '2026-03-10T10:00', tipus: 'miccio', volumMl: 210, urgencia: 2 },
      { moment: '2026-03-10T11:00', tipus: 'miccio', volumMl: 220, urgencia: 3 }
    ]));
    expect(proposta.descartats.map((d) => d.lloc)).toEqual(['Diari Miccional - DIARI MICCION!J15', 'Diari Miccional - DIARI MICCION!M12']);
    expect(proposta.descartats.every((d) => d.motiu.includes('porta un nombre que no és el nivell de la seua columna'))).toBe(true);
    expect(proposta.contrast.every((x) => x.quadra)).toBe(true);
  });

  test('una columna que el perfil no coneix: avís i cel·les descartades', () => {
    const proposta = proposa({ franges: { 10: { aigua: 100, menjar: 150 } }, subcapcaleres: { E: 'Orxata' }, resum: RESUM });
    expect(proposta.avisos.filter((a) => a.codi === 'columna-no-reconeguda').map((a) => a.text)).toEqual([
      'La columna «Orxata» de «LÍQUID INGERIT» no es reconeix: no s’importa.'
    ]);
    expect(proposta.descartats).toEqual([{ lloc: 'Diari Miccional - DIARI MICCION!E13', motiu: 'La columna «Orxata» no s’importa.' }]);
    expect(proposta.apunts.filter((a) => a.tipus === 'ingesta').map((a) => a.beguda)).toEqual(['aigua']);
  });

  test('una plantilla que comença a les 07:00: les franges de després de mitjanit són de l’endemà', () => {
    const proposta = proposa({ inici: 7, franges: { '07': { miccio: 200 }, '03': { miccio: 300 } } }, { dates: [DIA] });
    expect(essencial(proposta.apunts)).toEqual(essencial([
      { moment: '2026-03-10T07:00', tipus: 'miccio', volumMl: 200 }, { moment: '2026-03-11T03:00', tipus: 'miccio', volumMl: 300 }
    ]));
    expect(proposta.apunts.map((a) => a.jornada)).toEqual([DIA, DIA]);
  });

  test('un fitxer que no és un full ho diu, sense llançar', () => {
    expect(llegixFitxer(new Uint8Array(0), 'diari.xlsx')).toEqual({ ok: false, error: 'El fitxer és buit.' });
    const res = llegixFitxer(new TextEncoder().encode('no és un zip'), 'diari.xlsx');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/ZIP/);
    const buit = proposaApunts({ llibre: llibreDeCsv([['a', 'b'], ['1', '2']]) });
    expect(buit.format).toBe('desconegut');
    expect(codis(buit)).toEqual(['format-desconegut']);
  });
});

describe('l’hora d’alçar-se i la d’anar a dormir', () => {
  const RESUM_0730 = Object.freeze({ data: DIA, alcar: '07:30', dormir: '22:30' });

  test('la franja on cau l’hora d’alçar-se es posa a l’hora d’alçar-se: és el primer del dia, no la nit', () => {
    const proposta = proposa({
      franges: { '03': { miccio: 150 }, '06': { aigua: 100 }, '07': { aigua: 200, miccio: 250, urgencia: 2 }, '08': { miccio: 100 } },
      resum: RESUM_0730
    });
    expect(essencial(proposta.apunts)).toEqual(essencial([
      { moment: '2026-03-10T03:00', tipus: 'miccio', volumMl: 150 },
      { moment: '2026-03-10T06:00', tipus: 'ingesta', volumMl: 100, beguda: 'aigua' },
      { moment: '2026-03-10T07:30', tipus: 'ingesta', volumMl: 200, beguda: 'aigua' },
      { moment: '2026-03-10T07:30', tipus: 'miccio', volumMl: 250, urgencia: 2 },
      { moment: '2026-03-10T07:30', tipus: 'son', event: 'alcar-se' },
      { moment: '2026-03-10T08:00', tipus: 'miccio', volumMl: 100 },
      { moment: '2026-03-10T22:30', tipus: 'son', event: 'gitar-se' }
    ]));
    const jornada = (moment, tipus) => proposta.apunts.find((a) => a.moment === moment && a.tipus === tipus).jornada;
    /* La micció de la franja de les 07 és la primera de la jornada; la de les 03 i la beguda de les 06, de la nit d'abans. */
    expect(jornada('2026-03-10T07:30', 'miccio')).toBe(DIA);
    expect(jornada('2026-03-10T07:30', 'ingesta')).toBe(DIA);
    expect(jornada('2026-03-10T03:00', 'miccio')).toBe('2026-03-09');
    expect(jornada('2026-03-10T06:00', 'ingesta')).toBe('2026-03-09');
    expect(codis(proposta)).toEqual(['falta-mati-seguent', 'franja-alcar', 'nit-jornada-anterior']);
    const text = (codi) => proposta.avisos.find((a) => a.codi === codi).text;
    expect(text('franja-alcar')).toBe('2 apunts de la franja de les 07:00 es posen a les 07:30, l’hora d’alçar-se: compten com a primers del dia, no de la nit d’abans.');
    expect(text('nit-jornada-anterior')).toMatch(/^2 apunts de la matinada \(abans de les 07:30\) van a la jornada del dia d’abans/);
  });

  test('sense hora al resum, mana l’hora d’alçar-se habitual de la persona', () => {
    const persona = { ...PERSONA, horaAlcarHabitual: '07:30' };
    const proposta = proposa({ franges: { '07': { miccio: 250 } } }, { dates: [DIA], persona });
    expect(proposta.apunts.map((a) => [a.moment, a.jornada])).toEqual([['2026-03-10T07:30', DIA]]);
    expect(proposta.avisos.find((a) => a.codi === 'franja-alcar').text)
      .toBe('1 apunt de la franja de les 07:00 es posa a les 07:30, l’hora d’alçar-se habitual: compta com a primer del dia, no de la nit d’abans.');
  });

  test('anar a dormir passada la mitjanit és de l’endemà', () => {
    const proposta = proposa({ franges: {}, resum: { data: DIA, alcar: '07:00', dormir: '00:30' } });
    expect(essencial(proposta.apunts)).toEqual(essencial([
      { moment: '2026-03-10T07:00', tipus: 'son', event: 'alcar-se' },
      { moment: '2026-03-11T00:30', tipus: 'son', event: 'gitar-se' }
    ]));
    expect(proposta.apunts.find((a) => a.event === 'gitar-se').jornada).toBe(DIA);
  });

  test('l’hora d’alçar-se en text («7h30», «7.30») es llig; un nombre sense format d’hora es descarta', () => {
    for (const alcar of ['7h30', '7.30']) {
      const proposta = proposa({ franges: { '07': { miccio: 200 } }, resum: { data: DIA, alcar } });
      expect(essencial(proposta.apunts)).toEqual(essencial([
        { moment: '2026-03-10T07:30', tipus: 'miccio', volumMl: 200 }, { moment: '2026-03-10T07:30', tipus: 'son', event: 'alcar-se' }
      ]));
    }
    const numeric = proposa({ franges: { '07': { miccio: 200 } }, resum: { data: DIA, alcar: 7.3 } });
    expect(essencial(numeric.apunts)).toEqual(essencial([{ moment: '2026-03-10T07:00', tipus: 'miccio', volumMl: 200 }]));
    expect(numeric.descartats).toEqual([{ lloc: 'Diari Miccional - Tabla 1!C2', motiu: 'No s’entén l’hora de «Alçar-se del llit».' }]);
    expect(codis(numeric)).not.toContain('franja-alcar');
  });
});

describe('dos dies en una mateixa fulla de Numbers', () => {
  test('les graelles i els resums del mateix prefix s’aparellen per ordre, amb noms distints', () => {
    const dos = llibre({
      dies: [
        { prefix: 'Diari Miccional', resum: { data: DIA, alcar: '07:00' }, franges: { '09': { miccio: 200 } } },
        { prefix: 'Diari Miccional', taulaResum: 'Tabla 2', taulaGraella: 'GRAELLA 2', resum: { data: '2026-03-11', alcar: '08:00' }, franges: { '09': { miccio: 300 } } }
      ]
    });
    expect(diesDe(dos)).toEqual([{ nom: 'Diari Miccional (1)', data: DIA }, { nom: 'Diari Miccional (2)', data: '2026-03-11' }]);
    const proposta = proposaApunts({ llibre: dos, persona: PERSONA, ofsetDe: OFSET, fitxer: 'dos.xlsx' });
    expect(essencial(proposta.apunts)).toEqual(essencial([
      { moment: '2026-03-10T07:00', tipus: 'son', event: 'alcar-se' }, { moment: '2026-03-10T09:00', tipus: 'miccio', volumMl: 200 },
      { moment: '2026-03-11T08:00', tipus: 'son', event: 'alcar-se' }, { moment: '2026-03-11T09:00', tipus: 'miccio', volumMl: 300 }
    ]));
    /* Si no n'hi ha el mateix nombre (dos graelles i un resum), cap graella no pren un resum que potser no és seu: es demana la data. */
    const unResum = { ...dos, fulles: dos.fulles.filter((f) => f.nom !== 'Diari Miccional - Tabla 2') };
    expect(diesDe(unResum)).toEqual([{ nom: 'Diari Miccional (1)', data: null }, { nom: 'Diari Miccional (2)', data: null }]);
    expect(codis(proposaApunts({ llibre: unResum, persona: PERSONA, ofsetDe: OFSET }))).toEqual(['falta-data', 'falta-data']);
  });
});

describe('importar dos vegades no duplica', () => {
  test('ids deterministes en forma d’UUID, i fusionaCopia no afig res la segona vegada', () => {
    const id = idDeterminista('diari.xlsx|Full!G9|2026-03-10T07:00|miccio');
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(idDeterminista('diari.xlsx|Full!G9|2026-03-10T07:00|miccio')).toBe(id);
    expect(idDeterminista('diari.xlsx|Full!G10|2026-03-10T07:00|miccio')).not.toBe(id);

    const primera = proposa({ franges: FRANGES, resum: RESUM });
    const entrant = (apunts) => ({ persona: PERSONA, apunts, jornades: [], periodes: [], valoracions: [] });
    const buit = { persona: PERSONA, apunts: [], jornades: [], periodes: [], valoracions: [] };
    const fet = fusionaCopia(buit, entrant(primera.apunts), 'afegir');
    expect(fet.informe).toEqual({ afegits: 12, duplicats: 0, substituits: false });
    /* El mateix fitxer, llegit de nou: els mateixos ids. */
    const segona = proposa({ franges: FRANGES, resum: RESUM });
    expect(segona.apunts.map((a) => a.id)).toEqual(primera.apunts.map((a) => a.id));
    expect(fusionaCopia(fet.dades, entrant(segona.apunts), 'afegir').informe).toEqual({ afegits: 0, duplicats: 12, substituits: false });
    /* Amb el que ja hi ha, la proposta ja no porta res. */
    const ambExistents = proposa({ franges: FRANGES, resum: RESUM }, { existents: fet.dades.apunts });
    expect(ambExistents.apunts).toEqual([]);
    expect(ambExistents.jaHiSon).toBe(12);
  });

  test('les quatre paraules de l’id no depenen linealment de la clau (una CRC amb sal sí: col·lidiria amb totes)', () => {
    /* Amb quatre CRC-32 amb sal, per a dos claus de la mateixa llargada la diferència (XOR) de cada paraula és la mateixa:
       una col·lisió a la primera ho és a totes. Ací, la primera paraula i l'última (les dos que no toca la versió). */
    const paraules = (id) => {
      const hex = id.split('-').join('');
      return [parseInt(hex.slice(0, 8), 16), parseInt(hex.slice(24), 16)];
    };
    const parells = [
      ['diari.xlsx|Full!G9|2026-03-10T07:00|miccio', 'diari.xlsx|Full!G8|2026-03-10T07:00|miccio'],
      ['a.xlsx|Dia 1!B3|2026-01-01T00:00|ingesta', 'b.xlsx|Dia 2!B4|2026-01-02T01:00|ingesta'],
      ['graella.csv|CSV!M12|2026-03-29T02:00|escapament', 'graella.csv|CSV!N12|2026-03-29T03:00|escapament']
    ];
    for (const [a, b] of parells) {
      expect(a.length).toBe(b.length);
      const [a0, a3] = paraules(idDeterminista(a));
      const [b0, b3] = paraules(idDeterminista(b));
      expect((a0 ^ b0) >>> 0).not.toBe((a3 ^ b3) >>> 0);
    }
  });

  test('20.160 claus d’un mes de diari donen 20.160 ids distints', () => {
    const ids = new Set();
    for (let dia = 1; dia <= 28; dia += 1) {
      for (let fila = 3; fila <= 26; fila += 1) {
        for (const col of ['B', 'C', 'D', 'E', 'G', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG']) {
          ids.add(idDeterminista(`diari.xlsx|Diari Miccional - DIARI MICCION!${col}${fila}|2026-02-${String(dia).padStart(2, '0')}T${String(fila - 3).padStart(2, '0')}:00|miccio`));
        }
      }
    }
    expect(ids.size).toBe(28 * 24 * 30);
  });
});

describe('l’exportació pròpia, d’anada i tornada', () => {
  const crus = [
    { tipus: 'son', moment: '2026-03-10T07:10', event: 'alcar-se' },
    { tipus: 'miccio', moment: '2026-03-10T07:20', volumMl: 320, mesura: 'mesurat', lloc: 'vater', urgencia: 2 },
    { tipus: 'ingesta', moment: '2026-03-10T08:05', volumMl: 200, beguda: 'cafe', estimat: true, rebutjada: false, nota: 'Amb llet' },
    { tipus: 'escapament', moment: '2026-03-10T11:40', quantitat: 'gotes', circumstancia: 'no-se-sap' },
    { tipus: 'miccio', moment: '2026-03-10T15:00', mesura: 'no-mesurat', lloc: 'vater' },
    { tipus: 'son', moment: '2026-03-10T22:15', event: 'gitar-se', nota: 'Tranquil' },
    { tipus: 'conducta', moment: '2026-03-10T18:00', conductes: ['cridar'], intensitat: 1, resultat: 'es-calma-prompte' }
  ];
  const originals = assignaJornades(crus.map((cru, i) => validaApunt({ ...cru, id: `00000000-0000-4000-8000-00000000000${i}`, ofsetMin: 60 }, { ambId: true }).apunt), PERSONA);
  const { model } = fullDiari({ des: DIA, dies: 1, apunts: originals, persona: PERSONA, ofsetDe: OFSET });
  const camps = (a) => ({ ...a, id: undefined, jornada: undefined });
  const sensConducta = originals.filter((a) => a.tipus !== 'conducta');

  test.each(['xlsx', 'csv'])('%s: els apunts del diari miccional tornen iguals; la conducta no, i es diu', (format) => {
    const { dades } = exporta({ model, format, des: DIA, dies: 1 });
    const llegit = llegixFitxer(typeof dades === 'string' ? new TextEncoder().encode(dades) : dades, `diari_${DIA}_1d.${format}`);
    expect(llegit.ok).toBe(true);
    const proposta = proposaApunts({ llibre: llegit.llibre, persona: PERSONA, ofsetDe: OFSET, fitxer: `diari.${format}` });
    expect(proposta.format).toBe('diari-salut');
    const perMoment = (llista) => [...llista].sort((a, b) => (a.moment < b.moment ? -1 : 1)).map(camps);
    expect(perMoment(proposta.apunts)).toEqual(perMoment(sensConducta));
    expect(proposta.descartats).toEqual([{ lloc: expect.stringMatching(/!A\d+$/), motiu: expect.stringContaining('importa la còpia (.json)') }]);
    /* Sobre les dades d'on ix, no proposa res: ja hi són. */
    expect(proposaApunts({ llibre: llegit.llibre, persona: PERSONA, ofsetDe: OFSET, existents: originals }).apunts).toEqual([]);
    /* L'exportació porta la data a cada fila: no hi ha dies per triar. */
    expect(diesDe(llegit.llibre)).toEqual([]);
  });

  test('el full no porta on ha orinat ni quan ha passat un escapament: tornen per defecte, i la proposta ho diu', () => {
    const ambDetall = assignaJornades([
      { tipus: 'miccio', moment: '2026-03-10T19:00', volumMl: 200, mesura: 'mesurat', lloc: 'cunya' },
      { tipus: 'escapament', moment: '2026-03-10T19:30', quantitat: 'humit', circumstancia: 'amb-urgencia' }
    ].map((cru, i) => validaApunt({ ...cru, id: `00000000-0000-4000-8000-00000000001${i}`, ofsetMin: 60 }, { ambId: true }).apunt), PERSONA);
    const { model: ambModel } = fullDiari({ des: DIA, dies: 1, apunts: ambDetall, persona: PERSONA, ofsetDe: OFSET });
    const { dades } = exporta({ model: ambModel, format: 'xlsx', des: DIA, dies: 1 });
    const proposta = proposaApunts({ llibre: llegixLlibre(dades), persona: PERSONA, ofsetDe: OFSET, fitxer: 'diari.xlsx' });
    /* La pèrdua documentada: la cunya torna com a vàter i «amb ganes urgents», com a «no se sap». */
    expect(proposta.apunts.find((a) => a.tipus === 'miccio').lloc).toBe('vater');
    expect(proposta.apunts.find((a) => a.tipus === 'escapament').circumstancia).toBe('no-se-sap');
    expect(codis(proposta)).toEqual(['camps-per-defecte']);
    expect(proposta.avisos[0].text).toBe('Este full no porta tots els camps: de les miccions, on ha orinat, l’ajuda, les molèsties i com era l’orina; '
      + 'dels escapaments, quan han passat. Queden com els proposa el formulari (una micció, al vàter); per a recuperar-ho tot, importa la còpia (.json).');
  });
});

describe('el CSV de la graella', () => {
  test('dona els mateixos apunts que l’xlsx (sense el resum, que va en una altra taula)', () => {
    const csv = llegixFitxer(new TextEncoder().encode(plantillaSinteticaCsv({ franges: FRANGES })), 'Diari Miccional-DIARI MICCIONAL.csv');
    const proposta = proposaApunts({ llibre: csv.llibre, dates: [DIA], persona: PERSONA, ofsetDe: OFSET, fitxer: 'graella.csv' });
    expect(essencial(proposta.apunts)).toEqual(SENSE_SON);
    expect(proposta.contrast.every((x) => x.quadra)).toBe(true);
    expect(codis(proposta)).toEqual(['falta-mati-seguent', 'grup-no-importat', 'grup-no-importat', 'nit-jornada-anterior', 'urgencia-sense-miccio']);
  });
});
